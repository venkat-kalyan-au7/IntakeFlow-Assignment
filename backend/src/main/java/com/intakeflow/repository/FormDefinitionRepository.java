package com.intakeflow.repository;
import com.intakeflow.domain.FormDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface FormDefinitionRepository extends JpaRepository<FormDefinition,Long>{Optional<FormDefinition> findBySlug(String slug);}
