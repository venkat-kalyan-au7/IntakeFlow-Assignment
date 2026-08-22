package com.intakeflow.repository;

import com.intakeflow.domain.FormDefinition;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FormDefinitionRepository extends JpaRepository<FormDefinition, Long> {
  Optional<FormDefinition> findBySlug(String slug);
}
