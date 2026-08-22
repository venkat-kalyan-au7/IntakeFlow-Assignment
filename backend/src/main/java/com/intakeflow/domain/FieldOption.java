package com.intakeflow.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "field_options")
public class FieldOption {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "field_id")
  private FormField field;

  @Column(name = "option_value", nullable = false, length = 180)
  private String value;

  @Column(name = "position_index", nullable = false)
  private int positionIndex;

  public Long getId() {
    return id;
  }

  public void setId(Long v) {
    id = v;
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

  public int getPositionIndex() {
    return positionIndex;
  }

  public void setPositionIndex(int v) {
    positionIndex = v;
  }
}
