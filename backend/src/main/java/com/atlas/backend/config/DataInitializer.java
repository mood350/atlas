package com.atlas.backend.config;

import com.atlas.backend.agency.Agency;
import com.atlas.backend.agency.AgencyRepository;
import com.atlas.backend.role.Role;
import com.atlas.backend.role.RoleRepository;
import com.atlas.backend.user.User;
import com.atlas.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Garantit la présence des rôles requis et, en dev, d'un compte de test.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository    roleRepository;
    private final UserRepository    userRepository;
    private final AgencyRepository  agencyRepository;
    private final PasswordEncoder   passwordEncoder;

    private static final List<RoleSeed> SEEDS = List.of(
            new RoleSeed("SUPER_ADMIN", "Administrateur plateforme"),
            new RoleSeed("OWNER",       "Propriétaire d'une agence"),
            new RoleSeed("ADMIN",       "Administrateur de l'agence"),
            new RoleSeed("MEMBER",      "Membre de l'agence"),
            new RoleSeed("CLIENT",      "Accès portail client uniquement"),
            new RoleSeed("USER",        "Utilisateur authentifié (rôle de base)")
    );

    private static final String DEV_EMAIL    = "admin@atlas.local";
    private static final String DEV_PASSWORD = "Atlas2024!";

    @Override
    @Transactional
    public void run(String... args) {
        seedRoles();
        seedDevUser();
    }

    private void seedRoles() {
        int created = 0;
        for (RoleSeed seed : SEEDS) {
            if (roleRepository.findByRoleName(seed.name()).isEmpty()) {
                Role role = new Role();
                role.setRoleName(seed.name());
                role.setDescription(seed.description());
                roleRepository.save(role);
                created++;
            }
        }
        if (created > 0) {
            log.info("[DataInitializer] {} rôle(s) créé(s) au démarrage.", created);
        }
    }

    private void seedDevUser() {
        if (userRepository.findByEmail(DEV_EMAIL).isPresent()) return;

        Role ownerRole = roleRepository.findByRoleName("OWNER")
                .orElseThrow(() -> new IllegalStateException("Rôle OWNER manquant"));

        User user = User.builder()
                .firstName("Admin")
                .lastName("Dev")
                .email(DEV_EMAIL)
                .password(passwordEncoder.encode(DEV_PASSWORD))
                .timezone("Africa/Abidjan")
                .preferredLanguage("fr")
                .roles(new ArrayList<>(List.of(ownerRole)))
                .enabled(true)
                .accountLocked(false)
                .build();

        userRepository.save(user);

        Agency agency = Agency.builder()
                .name("Atlas Dev")
                .subdomain("atlas-dev")
                .owner(user)
                .active(true)
                .build();

        agencyRepository.save(agency);

        user.setAgency(agency);
        userRepository.save(user);

        log.info("[DataInitializer] Compte de test créé → email: {} / password: {}", DEV_EMAIL, DEV_PASSWORD);
    }

    private record RoleSeed(String name, String description) {}
}
