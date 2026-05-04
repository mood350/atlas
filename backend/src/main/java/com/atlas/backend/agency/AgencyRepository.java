package com.atlas.backend.agency;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AgencyRepository extends JpaRepository<Agency, Long> {

    Optional<Agency> findBySubdomain(String subdomain);

    boolean existsBySubdomain(String subdomain);

    boolean existsByEmail(String email);
}