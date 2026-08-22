package com.intakeflow.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.intakeflow.api.ApiException;
import com.intakeflow.domain.*;
import com.intakeflow.repository.*;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class FormServiceTest {
  private FormDefinitionRepository forms;
  private FormVersionRepository versions;
  private SubmissionRepository submissions;
  private CurrentUserService current;
  private FormService service;
  private AppUser requester;

  @BeforeEach
  void setUp() {
    forms = mock(FormDefinitionRepository.class);
    versions = mock(FormVersionRepository.class);
    submissions = mock(SubmissionRepository.class);
    current = mock(CurrentUserService.class);
    service = new FormService(forms, versions, submissions, current);
    requester = new AppUser();
    requester.setId(42L);
    requester.setRole(Role.REQUESTER);
    when(current.get()).thenReturn(requester);
  }

  @Test
  void blocksUnpublishedVersionWithoutSubmissionOwnership() {
    var version = version(FormVersionStatus.DRAFT);
    when(versions.findDetailedById(7L)).thenReturn(Optional.of(version));
    when(submissions.existsByFormVersionIdAndRequesterId(7L, 42L)).thenReturn(false);

    assertThatThrownBy(() -> service.get(7L))
        .isInstanceOf(ApiException.class)
        .hasMessage("You cannot access this form version");
  }

  @Test
  void allowsPublishedVersionForAuthenticatedRequester() {
    var version = version(FormVersionStatus.PUBLISHED);
    when(versions.findDetailedById(7L)).thenReturn(Optional.of(version));

    assertThat(service.get(7L).versionId()).isEqualTo(7L);
  }

  @Test
  void allowsRequesterToReadVersionUsedByOwnedSubmission() {
    var version = version(FormVersionStatus.ARCHIVED);
    when(versions.findDetailedById(7L)).thenReturn(Optional.of(version));
    when(submissions.existsByFormVersionIdAndRequesterId(7L, 42L)).thenReturn(true);

    assertThat(service.get(7L).versionId()).isEqualTo(7L);
  }

  @Test
  void archivesEveryVersionWithoutDeletingHistory() {
    var draft = version(FormVersionStatus.DRAFT);
    var published = version(FormVersionStatus.PUBLISHED);
    when(forms.existsById(3L)).thenReturn(true);
    when(versions.findByFormId(3L)).thenReturn(java.util.List.of(draft, published));

    service.archive(3L);

    assertThat(draft.getStatus()).isEqualTo(FormVersionStatus.ARCHIVED);
    assertThat(published.getStatus()).isEqualTo(FormVersionStatus.ARCHIVED);
    verify(versions).saveAll(java.util.List.of(draft, published));
  }

  private FormVersion version(FormVersionStatus status) {
    var definition = new FormDefinition();
    definition.setId(3L);
    definition.setSlug("vendor-onboarding");
    var version = new FormVersion();
    version.setId(7L);
    version.setForm(definition);
    version.setVersionNumber(1);
    version.setTitle("Vendor onboarding");
    version.setStatus(status);
    return version;
  }
}
