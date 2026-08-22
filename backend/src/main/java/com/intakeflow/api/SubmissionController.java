package com.intakeflow.api;

import com.intakeflow.api.ApiModels.*;
import com.intakeflow.domain.SubmissionStatus;
import com.intakeflow.service.SubmissionService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class SubmissionController {
  private final SubmissionService service;

  public SubmissionController(SubmissionService s) {
    service = s;
  }

  @PostMapping("/forms/{formId}/submissions")
  @PreAuthorize("hasRole('REQUESTER')")
  SubmissionView create(@PathVariable Long formId, @Valid @RequestBody SubmissionInput input) {
    return service.create(formId, input);
  }

  @GetMapping("/submissions")
  PageView<SubmissionView> list(
      @RequestParam(required = false) SubmissionStatus status,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return service.list(status, page, size);
  }

  @GetMapping("/submissions/{id}")
  SubmissionView get(@PathVariable Long id) {
    return service.get(id);
  }

  @PutMapping("/submissions/{id}")
  @PreAuthorize("hasRole('REQUESTER')")
  SubmissionView update(@PathVariable Long id, @Valid @RequestBody SubmissionInput input) {
    return service.update(id, input);
  }

  @PostMapping("/submissions/{id}/submit")
  @PreAuthorize("hasRole('REQUESTER')")
  SubmissionView submit(@PathVariable Long id) {
    return service.submit(id);
  }

  @PostMapping("/submissions/{id}/approve")
  @PreAuthorize("hasRole('REVIEWER')")
  SubmissionView approve(@PathVariable Long id) {
    return service.approve(id);
  }

  @PostMapping("/submissions/{id}/reject")
  @PreAuthorize("hasRole('REVIEWER')")
  SubmissionView reject(@PathVariable Long id, @Valid @RequestBody RejectionInput input) {
    return service.reject(id, input);
  }
}
