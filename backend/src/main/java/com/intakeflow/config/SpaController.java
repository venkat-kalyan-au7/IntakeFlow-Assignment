package com.intakeflow.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {
  @GetMapping(
      value = {
        "/",
        "/login",
        "/dashboard",
        "/forms",
        "/forms/**",
        "/requests",
        "/requests/**",
        "/review",
        "/review/**"
      })
  public String index() {
    return "forward:/index.html";
  }
}
