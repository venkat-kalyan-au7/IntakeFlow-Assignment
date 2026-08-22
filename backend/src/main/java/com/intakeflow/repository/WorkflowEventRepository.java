package com.intakeflow.repository;

import com.intakeflow.domain.WorkflowEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkflowEventRepository extends JpaRepository<WorkflowEvent, Long> {}
