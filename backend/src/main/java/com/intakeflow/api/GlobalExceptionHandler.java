package com.intakeflow.api;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(ApiException.class)
  ProblemDetail api(ApiException e) {
    var p = ProblemDetail.forStatusAndDetail(e.getStatus(), e.getMessage());
    p.setTitle(
        switch (e.getStatus()) {
          case BAD_REQUEST -> "Check the information provided";
          case FORBIDDEN -> "Action not allowed";
          case NOT_FOUND -> "Information not found";
          case CONFLICT -> "Action not available in the current state";
          default -> "Request could not be completed";
        });
    return p;
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ProblemDetail validation(MethodArgumentNotValidException e) {
    var p =
        ProblemDetail.forStatusAndDetail(
            HttpStatus.BAD_REQUEST, "Please correct the highlighted information.");
    p.setTitle("Validation failed");
    p.setProperty(
        "errors",
        e.getBindingResult().getFieldErrors().stream()
            .collect(
                java.util.stream.Collectors.toMap(
                    x -> x.getField(),
                    x -> x.getDefaultMessage() == null ? "Invalid value" : x.getDefaultMessage(),
                    (a, b) -> a)));
    return p;
  }

  @ExceptionHandler(OptimisticLockingFailureException.class)
  ProblemDetail conflict() {
    var p = ProblemDetail.forStatusAndDetail(
        HttpStatus.CONFLICT,
        "Someone saved a newer version while this page was open. Reload the latest version before making another change.");
    p.setTitle("A newer version is available");
    return p;
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  ProblemDetail integrity() {
    var p = ProblemDetail.forStatusAndDetail(
        HttpStatus.CONFLICT,
        "The change contains information that must be unique, such as a repeated field identifier. Review the form and try again.");
    p.setTitle("Duplicate form information");
    return p;
  }
}
