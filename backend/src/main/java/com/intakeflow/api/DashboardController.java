package com.intakeflow.api;

import com.intakeflow.api.ApiModels.DashboardView;
import com.intakeflow.service.DashboardService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {
  private final DashboardService dashboard;

  public DashboardController(DashboardService d) {
    dashboard = d;
  }

  @GetMapping
  DashboardView get() {
    return dashboard.get();
  }
}
