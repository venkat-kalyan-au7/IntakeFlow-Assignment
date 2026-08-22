package com.intakeflow.api;

import com.intakeflow.domain.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.*;

public final class ApiModels {
  private ApiModels() {}

  public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}

  public record AuthResponse(String token, UserView user) {}

  public record UserView(Long id, String email, String displayName, Role role) {}

  public record FieldInput(
      @NotBlank @Size(max = 80) String key,
      @NotBlank @Size(max = 140) String label,
      @Size(max = 300) String description,
      @NotNull FieldType type,
      boolean required,
      List<@NotBlank @Size(max = 180) String> options) {}

  public record FormInput(
      @NotBlank @Size(max = 160) String title,
      @Size(max = 600) String description,
      @NotEmpty List<@Valid FieldInput> fields) {}

  public record FieldView(
      Long id,
      String key,
      String label,
      String description,
      FieldType type,
      boolean required,
      int position,
      List<String> options) {}

  public record FormView(
      Long id,
      Long versionId,
      int version,
      String slug,
      String title,
      String description,
      FormVersionStatus status,
      Instant publishedAt,
      List<FieldView> fields) {}

  public record SubmissionInput(@NotNull Map<String, String> answers) {}

  public record RejectionInput(@NotBlank @Size(min = 3, max = 1000) String comment) {}

  public record AnswerView(String key, String label, FieldType type, String value) {}

  public record EventView(
      Long id,
      String action,
      SubmissionStatus fromStatus,
      SubmissionStatus toStatus,
      String comment,
      String actor,
      Instant createdAt) {}

  public record SubmissionView(
      Long id,
      String referenceCode,
      Long formId,
      Long formVersionId,
      String formTitle,
      int formVersion,
      String requesterName,
      String requesterEmail,
      SubmissionStatus status,
      String rejectionComment,
      Instant createdAt,
      Instant updatedAt,
      Instant submittedAt,
      Instant reviewedAt,
      List<AnswerView> answers,
      List<EventView> activity) {}

  public record PageView<T>(
      List<T> content, int page, int size, long totalElements, int totalPages) {}

  public record DashboardView(
      long drafts,
      long submitted,
      long approved,
      long rejected,
      long publishedForms,
      List<SubmissionView> recent) {}
}
