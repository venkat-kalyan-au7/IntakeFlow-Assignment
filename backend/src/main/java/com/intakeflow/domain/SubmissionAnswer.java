package com.intakeflow.domain;

import jakarta.persistence.*;

@Entity
@Table(
    name = "submission_answers",
    uniqueConstraints = @UniqueConstraint(columnNames = {"submission_id", "field_id"}))
public class SubmissionAnswer {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "submission_id")
  private Submission submission;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "field_id")
  private FormField field;

  @Lob
  @Column(name = "answer_value", columnDefinition = "TEXT")
  private String value;

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

  public FormField getField() {
    return field;
  }

  public void setField(FormField v) {
    field = v;
  }

  public String getValue() {
    return value;
  }

  public void setValue(String v) {
    value = v;
  }
}
