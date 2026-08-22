package com.intakeflow.repository;
import com.intakeflow.domain.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface AppUserRepository extends JpaRepository<AppUser,Long>{Optional<AppUser> findByEmailIgnoreCase(String email);}
