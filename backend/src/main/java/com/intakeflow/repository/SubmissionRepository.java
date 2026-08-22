package com.intakeflow.repository;

import com.intakeflow.domain.*;
import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
  @EntityGraph(
      attributePaths = {
        "formVersion",
        "formVersion.form",
        "requester",
        "answers",
        "answers.field",
        "answers.field.options",
        "events",
        "events.actor"
      })
  @Query("select distinct s from Submission s where s.id=:id")
  Optional<Submission> findDetailedById(@Param("id") Long id);

  Page<Submission> findByRequesterId(Long requesterId, Pageable pageable);

  Page<Submission> findByRequesterIdAndStatus(
      Long requesterId, SubmissionStatus status, Pageable pageable);

  Page<Submission> findByStatus(SubmissionStatus status, Pageable pageable);

  @Query(
      """
      select s from Submission s
      where s.status in :statuses
        and (:query = ''
          or lower(s.referenceCode) like :pattern
          or lower(s.formVersion.title) like :pattern
          or lower(s.requester.displayName) like :pattern
          or lower(s.requester.email) like :pattern)
      """)
  Page<Submission> searchReviewQueue(
      @Param("statuses") Collection<SubmissionStatus> statuses,
      @Param("query") String query,
      @Param("pattern") String pattern,
      Pageable pageable);

  boolean existsByFormVersionIdAndRequesterId(Long formVersionId, Long requesterId);

  long countByStatus(SubmissionStatus status);

  long countByRequesterIdAndStatus(Long requesterId, SubmissionStatus status);

  List<Submission> findTop6ByRequesterIdOrderByUpdatedAtDesc(Long requesterId);

  List<Submission> findTop6ByOrderByUpdatedAtDesc();

  List<Submission> findTop6ByStatusInOrderByUpdatedAtDesc(
      Collection<SubmissionStatus> statuses);
}
