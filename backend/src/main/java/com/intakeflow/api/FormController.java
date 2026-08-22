package com.intakeflow.api;

import com.intakeflow.api.ApiModels.*;
import com.intakeflow.service.FormService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/forms")
public class FormController {
  private final FormService forms;

  public FormController(FormService f) {
    forms = f;
  }

  @GetMapping("/published")
  List<FormView> published() {
    return forms.published();
  }

  @GetMapping("/versions/{id}")
  FormView get(@PathVariable Long id) {
    return forms.get(id);
  }

  @GetMapping
  @PreAuthorize("hasRole('ADMIN')")
  List<FormView> all() {
    return forms.all();
  }

  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  FormView create(@Valid @RequestBody FormInput input) {
    return forms.create(input);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  FormView update(@PathVariable Long id, @Valid @RequestBody FormInput input) {
    return forms.update(id, input);
  }

  @PostMapping("/{id}/publish")
  @PreAuthorize("hasRole('ADMIN')")
  FormView publish(@PathVariable Long id) {
    return forms.publish(id);
  }
}
