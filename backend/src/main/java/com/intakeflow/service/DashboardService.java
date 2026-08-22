package com.intakeflow.service;

import com.intakeflow.api.ApiMapper;
import com.intakeflow.api.ApiModels.DashboardView;
import com.intakeflow.domain.*;
import com.intakeflow.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {
  private final SubmissionRepository submissions;
  private final FormVersionRepository forms;
  private final CurrentUserService current;

  public DashboardService(SubmissionRepository s, FormVersionRepository f, CurrentUserService c) {
    submissions = s;
    forms = f;
    current = c;
  }

  @Transactional(readOnly = true)
  public DashboardView get() {
    var u = current.get();
    boolean own = u.getRole() == Role.REQUESTER;
    boolean reviewer = u.getRole() == Role.REVIEWER;
    long d =
        own
            ? submissions.countByRequesterIdAndStatus(u.getId(), SubmissionStatus.DRAFT)
            : reviewer ? 0 : submissions.countByStatus(SubmissionStatus.DRAFT);
    long s =
        own
            ? submissions.countByRequesterIdAndStatus(u.getId(), SubmissionStatus.SUBMITTED)
            : submissions.countByStatus(SubmissionStatus.SUBMITTED);
    long a =
        own
            ? submissions.countByRequesterIdAndStatus(u.getId(), SubmissionStatus.APPROVED)
            : submissions.countByStatus(SubmissionStatus.APPROVED);
    long r =
        own
            ? submissions.countByRequesterIdAndStatus(u.getId(), SubmissionStatus.REJECTED)
            : submissions.countByStatus(SubmissionStatus.REJECTED);
    var recent =
        (own
                ? submissions.findTop6ByRequesterIdOrderByUpdatedAtDesc(u.getId())
                : reviewer
                    ? submissions.findTop6ByStatusInOrderByUpdatedAtDesc(
                        java.util.List.of(
                            SubmissionStatus.SUBMITTED,
                            SubmissionStatus.APPROVED,
                            SubmissionStatus.REJECTED))
                    : submissions.findTop6ByOrderByUpdatedAtDesc())
            .stream().map(ApiMapper::submission).toList();
    return new DashboardView(d, s, a, r, forms.countPublished(), recent);
  }
}
