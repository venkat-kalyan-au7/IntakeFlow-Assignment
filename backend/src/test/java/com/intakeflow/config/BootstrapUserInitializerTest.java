package com.intakeflow.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.intakeflow.domain.AppUser;
import com.intakeflow.domain.Role;
import com.intakeflow.repository.AppUserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;

class BootstrapUserInitializerTest {
  @Test
  void provisionsConfiguredAccountWithoutPersistingPlaintextPassword() {
    var users = mock(AppUserRepository.class);
    var passwords = mock(PasswordEncoder.class);
    when(users.findByEmailIgnoreCase("admin@intakeflow.app")).thenReturn(Optional.empty());
    when(passwords.encode("production-password")).thenReturn("encoded-password");
    var initializer =
        new BootstrapUserInitializer(
            users,
            passwords,
            " Admin@IntakeFlow.App ",
            "production-password",
            "Production Administrator",
            "",
            "",
            "",
            "",
            "",
            "");

    initializer.run(null);

    var user = ArgumentCaptor.forClass(AppUser.class);
    verify(users).save(user.capture());
    assertThat(user.getValue().getEmail()).isEqualTo("admin@intakeflow.app");
    assertThat(user.getValue().getDisplayName()).isEqualTo("Production Administrator");
    assertThat(user.getValue().getPasswordHash()).isEqualTo("encoded-password");
    assertThat(user.getValue().getRole()).isEqualTo(Role.ADMIN);
  }

  @Test
  void refusesPartiallyConfiguredAccount() {
    var initializer =
        new BootstrapUserInitializer(
            mock(AppUserRepository.class),
            mock(PasswordEncoder.class),
            "admin@intakeflow.app",
            "",
            "Administrator",
            "",
            "",
            "",
            "",
            "",
            "");

    assertThatThrownBy(() -> initializer.run(null))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("Both email and password are required");
  }
}
