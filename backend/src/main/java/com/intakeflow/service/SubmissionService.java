package com.intakeflow.service;

import static com.intakeflow.api.ApiMapper.submission;

import com.intakeflow.api.*;
import com.intakeflow.api.ApiModels.*;
import com.intakeflow.domain.*;
import com.intakeflow.repository.*;
import java.math.BigDecimal;
import java.time.*;
import java.time.format.DateTimeParseException;
import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SubmissionService {
  private final SubmissionRepository submissions;
  private final FormService forms;
  private final CurrentUserService current;

  public SubmissionService(SubmissionRepository s, FormService f, CurrentUserService c) {
    submissions = s;
    forms = f;
    current = c;
  }

  @Transactional
  public SubmissionView create(Long formId, SubmissionInput input) {
    var actor = current.get();
    requireRole(actor, Role.REQUESTER);
    var s = new Submission();
    s.setReferenceCode(
        "REQ-"
            + LocalDate.now(ZoneOffset.UTC).toString().replace("-", "")
            + "-"
            + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
    s.setFormVersion(forms.publishedEntity(formId));
    s.setRequester(actor);
    writeAnswers(s, input.answers(), false);
    event(s, actor, "DRAFT_SAVED", null, SubmissionStatus.DRAFT, null);
    return submission(submissions.save(s));
  }

  @Transactional
  public SubmissionView update(Long id, SubmissionInput input) {
    var s = load(id);
    var actor = current.get();
    owner(s, actor);
    if (s.getStatus() != SubmissionStatus.DRAFT && s.getStatus() != SubmissionStatus.REJECTED)
      throw conflict("Only draft or rejected requests can be edited");
    s.getAnswers().clear();
    writeAnswers(s, input.answers(), false);
    event(s, actor, "CHANGES_SAVED", s.getStatus(), s.getStatus(), null);
    return submission(submissions.save(s));
  }

  @Transactional
  public SubmissionView submit(Long id) {
    var s = load(id);
    var actor = current.get();
    owner(s, actor);
    if (s.getStatus() != SubmissionStatus.DRAFT && s.getStatus() != SubmissionStatus.REJECTED)
      throw conflict("Only draft or rejected requests can be submitted");
    validate(s, true);
    var from = s.getStatus();
    s.setStatus(SubmissionStatus.SUBMITTED);
    s.setSubmittedAt(Instant.now());
    s.setRejectionComment(null);
    event(
        s,
        actor,
        from == SubmissionStatus.REJECTED ? "RESUBMITTED" : "SUBMITTED",
        from,
        SubmissionStatus.SUBMITTED,
        null);
    return submission(submissions.save(s));
  }

  @Transactional
  public SubmissionView approve(Long id) {
    var s = load(id);
    var actor = current.get();
    requireRole(actor, Role.REVIEWER);
    transition(s, actor, SubmissionStatus.APPROVED, "APPROVED", null);
    return submission(submissions.save(s));
  }

  @Transactional
  public SubmissionView reject(Long id, RejectionInput input) {
    var actor = current.get();
    requireRole(actor, Role.REVIEWER);
    var s = load(id);
    String comment = input.comment().trim();
    if (comment.length() < 3) throw bad("A meaningful rejection comment is required");
    transition(s, actor, SubmissionStatus.REJECTED, "REJECTED", comment);
    s.setRejectionComment(comment);
    return submission(submissions.save(s));
  }

  @Transactional(readOnly = true)
  public SubmissionView get(Long id) {
    var s = load(id);
    var actor = current.get();
    if (actor.getRole() == Role.REQUESTER) owner(s, actor);
    return submission(s);
  }

  @Transactional(readOnly = true)
  public PageView<SubmissionView> list(SubmissionStatus status, int page, int size) {
    var actor = current.get();
    var pageable =
        PageRequest.of(
            Math.max(0, page),
            Math.min(Math.max(size, 1), 50),
            Sort.by(Sort.Direction.DESC, "updatedAt"));
    Page<Submission> result;
    if (actor.getRole() == Role.REQUESTER)
      result =
          status == null
              ? submissions.findByRequesterId(actor.getId(), pageable)
              : submissions.findByRequesterIdAndStatus(actor.getId(), status, pageable);
    else
      result =
          status == null
              ? submissions.findAll(pageable)
              : submissions.findByStatus(status, pageable);
    return new PageView<>(
        result.stream().map(ApiMapper::submission).toList(),
        result.getNumber(),
        result.getSize(),
        result.getTotalElements(),
        result.getTotalPages());
  }

  private Submission load(Long id) {
    return submissions
        .findDetailedById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Request not found"));
  }

  private void writeAnswers(Submission s, Map<String, String> values, boolean strict) {
    var fields = s.getFormVersion().getFields();
    var byKey = new HashMap<String, FormField>();
    fields.forEach(f -> byKey.put(f.getFieldKey(), f));
    for (var entry : values.entrySet()) {
      var field = byKey.get(entry.getKey());
      if (field == null) throw bad("Unknown field: " + entry.getKey());
      var a = new SubmissionAnswer();
      a.setField(field);
      a.setValue(entry.getValue() == null ? null : entry.getValue().trim());
      s.addAnswer(a);
    }
    if (strict) validate(s, true);
  }

  void validate(Submission s, boolean required) {
    Map<Long, String> values = new HashMap<>();
    s.getAnswers().forEach(a -> values.put(a.getField().getId(), a.getValue()));
    for (var field : s.getFormVersion().getFields()) {
      String value = values.get(field.getId());
      if (required && field.isRequired() && (value == null || value.isBlank()))
        throw bad(field.getLabel() + " is required");
      if (value == null || value.isBlank()) continue;
      try {
        switch (field.getFieldType()) {
          case NUMBER -> new BigDecimal(value);
          case DATE -> LocalDate.parse(value);
          case DROPDOWN -> {
            if (field.getOptions().stream().noneMatch(o -> o.getValue().equals(value)))
              throw bad("Choose a valid option for " + field.getLabel());
          }
          case TEXT -> {}
        }
      } catch (NumberFormatException e) {
        throw bad(field.getLabel() + " must be a number");
      } catch (DateTimeParseException e) {
        throw bad(field.getLabel() + " must be a valid date");
      }
    }
  }

  private void transition(
      Submission s, AppUser actor, SubmissionStatus to, String action, String comment) {
    if (s.getStatus() != SubmissionStatus.SUBMITTED)
      throw conflict("Only submitted requests can be reviewed");
    var from = s.getStatus();
    s.setStatus(to);
    s.setReviewedAt(Instant.now());
    event(s, actor, action, from, to, comment);
  }

  private void event(
      Submission s,
      AppUser actor,
      String action,
      SubmissionStatus from,
      SubmissionStatus to,
      String comment) {
    var e = new WorkflowEvent();
    e.setActor(actor);
    e.setAction(action);
    e.setFromStatus(from);
    e.setToStatus(to);
    e.setComment(comment);
    s.addEvent(e);
  }

  private void owner(Submission s, AppUser actor) {
    if (!s.getRequester().getId().equals(actor.getId()))
      throw new ApiException(HttpStatus.FORBIDDEN, "You cannot access this request");
  }

  private void requireRole(AppUser u, Role role) {
    if (u.getRole() != role)
      throw new ApiException(HttpStatus.FORBIDDEN, "This action is not available for your role");
  }

  private ApiException conflict(String m) {
    return new ApiException(HttpStatus.CONFLICT, m);
  }

  private ApiException bad(String m) {
    return new ApiException(HttpStatus.BAD_REQUEST, m);
  }
}
