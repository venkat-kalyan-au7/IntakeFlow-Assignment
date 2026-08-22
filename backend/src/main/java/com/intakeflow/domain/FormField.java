package com.intakeflow.domain;

import jakarta.persistence.*;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(
    name = "form_fields",
    uniqueConstraints = @UniqueConstraint(columnNames = {"form_version_id", "field_key"}))
public class FormField {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "form_version_id")
  private FormVersion formVersion;

  @Column(name = "field_key", nullable = false, length = 80)
  private String fieldKey;

  @Column(nullable = false, length = 140)
  private String label;

  @Column(length = 300)
  private String description;

  @Enumerated(EnumType.STRING)
  @Column(name = "field_type", nullable = false, length = 24)
  private FieldType fieldType;

  @Column(nullable = false)
  private boolean required;

  @Column(name = "position_index", nullable = false)
  private int positionIndex;

  @OneToMany(mappedBy = "field", cascade = CascadeType.ALL, orphanRemoval = true)
  @OrderBy("positionIndex ASC")
  private Set<FieldOption> options = new LinkedHashSet<>();

  public void addOption(FieldOption option) {
    option.setField(this);
    options.add(option);
  }

  public Long getId() {
    return id;
  }

  public void setId(Long v) {
    id = v;
  }

  public FormVersion getFormVersion() {
    return formVersion;
  }

  public void setFormVersion(FormVersion v) {
    formVersion = v;
  }

  public String getFieldKey() {
    return fieldKey;
  }

  public void setFieldKey(String v) {
    fieldKey = v;
  }

  public String getLabel() {
    return label;
  }

  public void setLabel(String v) {
    label = v;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String v) {
    description = v;
  }

  public FieldType getFieldType() {
    return fieldType;
  }

  public void setFieldType(FieldType v) {
    fieldType = v;
  }

  public boolean isRequired() {
    return required;
  }

  public void setRequired(boolean v) {
    required = v;
  }

  public int getPositionIndex() {
    return positionIndex;
  }

  public void setPositionIndex(int v) {
    positionIndex = v;
  }

  public Set<FieldOption> getOptions() {
    return options;
  }

  public void setOptions(Set<FieldOption> v) {
    options = v;
  }
}
