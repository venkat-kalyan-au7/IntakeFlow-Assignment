package com.intakeflow.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "forms")
public class FormDefinition {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 120)
  private String slug;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "created_by")
  private AppUser createdBy;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt = Instant.now();

  @PreUpdate
  void touch() {
    updatedAt = Instant.now();
  }

  public Long getId() {
    return id;
  }

  public void setId(Long v) {
    id = v;
  }

  public String getSlug() {
    return slug;
  }

  public void setSlug(String v) {
    slug = v;
  }

  public AppUser getCreatedBy() {
    return createdBy;
  }

  public void setCreatedBy(AppUser v) {
    createdBy = v;
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
}
