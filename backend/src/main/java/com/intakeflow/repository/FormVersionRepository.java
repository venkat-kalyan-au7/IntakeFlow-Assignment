package com.intakeflow.repository;

import com.intakeflow.domain.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface FormVersionRepository extends JpaRepository<FormVersion, Long> {
  Optional<FormVersion> findFirstByFormIdAndStatusOrderByVersionNumberDesc(
      Long formId, FormVersionStatus status);

  Optional<FormVersion> findFirstByFormIdOrderByVersionNumberDesc(Long formId);

  @EntityGraph(attributePaths = {"form", "fields", "fields.options"})
  @Query("select v from FormVersion v where v.id=:id")
  Optional<FormVersion> findDetailedById(@Param("id") Long id);

  @EntityGraph(attributePaths = {"form", "fields", "fields.options"})
  List<FormVersion> findByStatusOrderByPublishedAtDesc(FormVersionStatus status);

  @Query(
      "select count(v) from FormVersion v where v.status=com.intakeflow.domain.FormVersionStatus.PUBLISHED")
  long countPublished();
}
