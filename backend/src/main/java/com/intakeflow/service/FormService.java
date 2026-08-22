package com.intakeflow.service;

import static com.intakeflow.api.ApiMapper.form;

import com.intakeflow.api.*;
import com.intakeflow.api.ApiModels.*;
import com.intakeflow.domain.*;
import com.intakeflow.repository.*;
import java.time.Instant;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FormService {
  private final FormDefinitionRepository forms;
  private final FormVersionRepository versions;
  private final SubmissionRepository submissions;
  private final CurrentUserService current;

  public FormService(
      FormDefinitionRepository f,
      FormVersionRepository v,
      SubmissionRepository s,
      CurrentUserService c) {
    forms = f;
    versions = v;
    submissions = s;
    current = c;
  }

  @Transactional
  public FormView create(FormInput input) {
    var def = new FormDefinition();
    def.setSlug(uniqueSlug(input.title()));
    def.setCreatedBy(current.get());
    forms.save(def);
    return form(versions.save(build(def, 1, input)));
  }

  @Transactional
  public FormView update(Long formId, FormInput input) {
    var def = forms.findById(formId).orElseThrow(() -> notFound("Form not found"));
    var draft =
        versions.findFirstByFormIdAndStatusOrderByVersionNumberDesc(
            formId, FormVersionStatus.DRAFT);
    FormVersion version;
    if (draft.isPresent()) {
      version = draft.get();
      version.getFields().clear();
      versions.flush();
    } else {
      int next =
          versions
              .findFirstByFormIdOrderByVersionNumberDesc(formId)
              .map(v -> v.getVersionNumber() + 1)
              .orElse(1);
      version = build(def, next, input);
    }
    version.setTitle(input.title().trim());
    version.setDescription(trim(input.description()));
    addFields(version, input.fields());
    return form(versions.save(version));
  }

  @Transactional
  public FormView publish(Long formId) {
    var draft =
        versions
            .findFirstByFormIdAndStatusOrderByVersionNumberDesc(formId, FormVersionStatus.DRAFT)
            .orElseThrow(
                () ->
                    new ApiException(
                        HttpStatus.CONFLICT, "No draft version is available to publish"));
    versions
        .findFirstByFormIdAndStatusOrderByVersionNumberDesc(formId, FormVersionStatus.PUBLISHED)
        .ifPresent(
            v -> {
              v.setStatus(FormVersionStatus.ARCHIVED);
              versions.save(v);
            });
    draft.setStatus(FormVersionStatus.PUBLISHED);
    draft.setPublishedAt(Instant.now());
    return form(versions.save(draft));
  }

  @Transactional
  public void archive(Long formId) {
    if (!forms.existsById(formId)) throw notFound("Form not found");
    var formVersions = versions.findByFormId(formId);
    if (formVersions.isEmpty()) throw notFound("Form version not found");
    formVersions.forEach(v -> v.setStatus(FormVersionStatus.ARCHIVED));
    versions.saveAll(formVersions);
  }

  @Transactional(readOnly = true)
  public List<FormView> published() {
    return versions.findByStatusOrderByPublishedAtDesc(FormVersionStatus.PUBLISHED).stream()
        .map(ApiMapper::form)
        .toList();
  }

  @Transactional(readOnly = true)
  public List<FormView> all() {
    return forms.findAll().stream()
        .map(
            f ->
                versions
                    .findFirstByFormIdAndStatusOrderByVersionNumberDesc(
                        f.getId(), FormVersionStatus.DRAFT)
                    .or(
                        () ->
                            versions.findFirstByFormIdAndStatusOrderByVersionNumberDesc(
                                f.getId(), FormVersionStatus.PUBLISHED))
                    .map(ApiMapper::form)
                    .orElse(null))
        .filter(Objects::nonNull)
        .toList();
  }

  @Transactional(readOnly = true)
  public FormView get(Long id) {
    var version =
        versions.findDetailedById(id).orElseThrow(() -> notFound("Form version not found"));
    var actor = current.get();
    boolean canRead =
        actor.getRole() == Role.ADMIN
            || version.getStatus() == FormVersionStatus.PUBLISHED
            || (actor.getRole() == Role.REQUESTER
                && submissions.existsByFormVersionIdAndRequesterId(id, actor.getId()));
    if (!canRead)
      throw new ApiException(HttpStatus.FORBIDDEN, "You cannot access this form version");
    return form(version);
  }

  @Transactional(readOnly = true)
  public FormVersion publishedEntity(Long formId) {
    var v =
        versions
            .findFirstByFormIdAndStatusOrderByVersionNumberDesc(formId, FormVersionStatus.PUBLISHED)
            .orElseThrow(() -> notFound("Published form not found"));
    return versions.findDetailedById(v.getId()).orElseThrow();
  }

  private FormVersion build(FormDefinition def, int number, FormInput input) {
    var v = new FormVersion();
    v.setForm(def);
    v.setVersionNumber(number);
    v.setTitle(input.title().trim());
    v.setDescription(trim(input.description()));
    addFields(v, input.fields());
    return v;
  }

  private void addFields(FormVersion version, List<FieldInput> fields) {
    Set<String> keys = new HashSet<>();
    int position = 0;
    for (var in : fields) {
      String key =
          in.key().trim().toLowerCase().replaceAll("[^a-z0-9]+", "_").replaceAll("^_|_$", "");
      if (key.isBlank() || !keys.add(key))
        throw new ApiException(
            HttpStatus.BAD_REQUEST, "Field keys must be unique and contain letters or numbers");
      var f = new FormField();
      f.setFieldKey(key);
      f.setLabel(in.label().trim());
      f.setDescription(trim(in.description()));
      f.setFieldType(in.type());
      f.setRequired(in.required());
      f.setPositionIndex(position++);
      if (in.type() == FieldType.DROPDOWN) {
        var opts =
            Optional.ofNullable(in.options()).orElse(List.of()).stream()
                .map(String::trim)
                .filter(x -> !x.isBlank())
                .distinct()
                .toList();
        if (opts.isEmpty())
          throw new ApiException(
              HttpStatus.BAD_REQUEST, "Dropdown fields need at least one option");
        for (int i = 0; i < opts.size(); i++) {
          var o = new FieldOption();
          o.setValue(opts.get(i));
          o.setPositionIndex(i);
          f.addOption(o);
        }
      }
      version.addField(f);
    }
  }

  private String uniqueSlug(String title) {
    String base = title.toLowerCase().trim().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    if (base.isBlank()) base = "form";
    String candidate = base;
    int i = 2;
    while (forms.findBySlug(candidate).isPresent()) candidate = base + "-" + i++;
    return candidate;
  }

  private String trim(String s) {
    return s == null || s.isBlank() ? null : s.trim();
  }

  private ApiException notFound(String m) {
    return new ApiException(HttpStatus.NOT_FOUND, m);
  }
}
