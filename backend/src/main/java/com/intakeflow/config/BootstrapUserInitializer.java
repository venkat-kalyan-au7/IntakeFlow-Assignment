package com.intakeflow.config;

import com.intakeflow.domain.AppUser;
import com.intakeflow.domain.Role;
import com.intakeflow.repository.AppUserRepository;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class BootstrapUserInitializer implements ApplicationRunner {
  private final AppUserRepository users;
  private final PasswordEncoder passwords;
  private final BootstrapUser admin;
  private final BootstrapUser requester;
  private final BootstrapUser reviewer;

  public BootstrapUserInitializer(
      AppUserRepository users,
      PasswordEncoder passwords,
      @Value("${app.bootstrap.admin.email:}") String adminEmail,
      @Value("${app.bootstrap.admin.password:}") String adminPassword,
      @Value("${app.bootstrap.admin.display-name:IntakeFlow Administrator}") String adminName,
      @Value("${app.bootstrap.requester.email:}") String requesterEmail,
      @Value("${app.bootstrap.requester.password:}") String requesterPassword,
      @Value("${app.bootstrap.requester.display-name:IntakeFlow Requester}") String requesterName,
      @Value("${app.bootstrap.reviewer.email:}") String reviewerEmail,
      @Value("${app.bootstrap.reviewer.password:}") String reviewerPassword,
      @Value("${app.bootstrap.reviewer.display-name:IntakeFlow Reviewer}") String reviewerName) {
    this.users = users;
    this.passwords = passwords;
    admin = new BootstrapUser(adminEmail, adminPassword, adminName, Role.ADMIN);
    requester = new BootstrapUser(requesterEmail, requesterPassword, requesterName, Role.REQUESTER);
    reviewer = new BootstrapUser(reviewerEmail, reviewerPassword, reviewerName, Role.REVIEWER);
  }

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    provision(admin);
    provision(requester);
    provision(reviewer);
  }

  private void provision(BootstrapUser bootstrap) {
    boolean emailMissing = bootstrap.email().isBlank();
    boolean passwordMissing = bootstrap.password().isBlank();
    if (emailMissing && passwordMissing) return;
    if (emailMissing || passwordMissing)
      throw new IllegalStateException(
          "Both email and password are required for the "
              + bootstrap.role().name().toLowerCase(Locale.ROOT)
              + " bootstrap account");
    if (bootstrap.password().length() < 12)
      throw new IllegalStateException(
          "Bootstrap account passwords must contain at least 12 characters");

    String email = bootstrap.email().trim().toLowerCase(Locale.ROOT);
    if (users.findByEmailIgnoreCase(email).isPresent()) return;

    var user = new AppUser();
    user.setEmail(email);
    user.setDisplayName(bootstrap.displayName().trim());
    user.setPasswordHash(passwords.encode(bootstrap.password()));
    user.setRole(bootstrap.role());
    users.save(user);
  }

  private record BootstrapUser(String email, String password, String displayName, Role role) {
    private BootstrapUser {
      email = email == null ? "" : email;
      password = password == null ? "" : password;
      displayName =
          displayName == null || displayName.isBlank() ? role.name() : displayName;
    }
  }
}
