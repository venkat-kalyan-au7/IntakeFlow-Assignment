package com.intakeflow.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "submissions")
public class Submission {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "reference_code", nullable = false, unique = true, length = 32)
  private String referenceCode;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "form_version_id")
  private FormVersion formVersion;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "requester_id")
  private AppUser requester;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 24)
  private SubmissionStatus status = SubmissionStatus.DRAFT;

  @Column(name = "rejection_comment", length = 1000)
  private String rejectionComment;

  @Column(name = "submitted_at")
  private Instant submittedAt;

  @Column(name = "reviewed_at")
  private Instant reviewedAt;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt = Instant.now();

  @Version
  @Column(name = "row_version", nullable = false)
  private long rowVersion;

  @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true)
  private Set<SubmissionAnswer> answers = new LinkedHashSet<>();

  @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true)
  @OrderBy("createdAt ASC")
  private Set<WorkflowEvent> events = new LinkedHashSet<>();

  @PreUpdate
  void touch() {
    updatedAt = Instant.now();
  }

  public void addAnswer(SubmissionAnswer a) {
    a.setSubmission(this);
    answers.add(a);
  }

  public void addEvent(WorkflowEvent e) {
    e.setSubmission(this);
    events.add(e);
  }

  public Long getId() {
    return id;
  }

  public void setId(Long v) {
    id = v;
  }

  public String getReferenceCode() {
    return referenceCode;
  }

  public void setReferenceCode(String v) {
    referenceCode = v;
  }

  public FormVersion getFormVersion() {
    return formVersion;
  }

  public void setFormVersion(FormVersion v) {
    formVersion = v;
  }

  public AppUser getRequester() {
    return requester;
  }

  public void setRequester(AppUser v) {
    requester = v;
  }

  public SubmissionStatus getStatus() {
    return status;
  }

  public void setStatus(SubmissionStatus v) {
    status = v;
  }

  public String getRejectionComment() {
    return rejectionComment;
  }

  public void setRejectionComment(String v) {
    rejectionComment = v;
  }

  public Instant getSubmittedAt() {
    return submittedAt;
  }

  public void setSubmittedAt(Instant v) {
    submittedAt = v;
  }

  public Instant getReviewedAt() {
    return reviewedAt;
  }

  public void setReviewedAt(Instant v) {
    reviewedAt = v;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant v) {
    createdAt = v;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant v) {
    updatedAt = v;
  }

  public long getRowVersion() {
    return rowVersion;
  }

  public void setRowVersion(long v) {
    rowVersion = v;
  }

  public Set<SubmissionAnswer> getAnswers() {
    return answers;
  }

  public void setAnswers(Set<SubmissionAnswer> v) {
    answers = v;
  }

  public Set<WorkflowEvent> getEvents() {
    return events;
  }

  public void setEvents(Set<WorkflowEvent> v) {
    events = v;
  }
}
