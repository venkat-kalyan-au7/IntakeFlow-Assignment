package com.intakeflow.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "workflow_events")
public class WorkflowEvent {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "submission_id")
  private Submission submission;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "actor_id")
  private AppUser actor;

  @Column(nullable = false, length = 32)
  private String action;

  @Enumerated(EnumType.STRING)
  @Column(name = "from_status", length = 24)
  private SubmissionStatus fromStatus;

  @Enumerated(EnumType.STRING)
  @Column(name = "to_status", nullable = false, length = 24)
  private SubmissionStatus toStatus;

  @Column(length = 1000)
  private String comment;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  public Long getId() {
    return id;
  }

  public void setId(Long v) {
    id = v;
  }

  public Submission getSubmission() {
    return submission;
  }

  public void setSubmission(Submission v) {
    submission = v;
  }

  public AppUser getActor() {
    return actor;
  }

  public void setActor(AppUser v) {
    actor = v;
  }

  public String getAction() {
    return action;
  }

  public void setAction(String v) {
    action = v;
  }

  public SubmissionStatus getFromStatus() {
    return fromStatus;
  }

  public void setFromStatus(SubmissionStatus v) {
    fromStatus = v;
  }

  public SubmissionStatus getToStatus() {
    return toStatus;
  }

  public void setToStatus(SubmissionStatus v) {
    toStatus = v;
  }

  public String getComment() {
    return comment;
  }

  public void setComment(String v) {
    comment = v;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant v) {
    createdAt = v;
  }
}
