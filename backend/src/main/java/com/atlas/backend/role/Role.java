package com.atlas.backend.role;

import com.atlas.backend.user.User;
import com.atlas.backend.utils.Listeners;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.List;

/**
 * Rôles disponibles dans AgencyCRM :
 *
 *  SUPER_ADMIN  → Administrateur plateforme (Anthropic/l'éditeur SaaS)
 *  OWNER        → Propriétaire d'une agence (créateur, accès total à son tenant)
 *  ADMIN        → Administrateur de l'agence (peut gérer membres et paramètres)
 *  MEMBER       → Membre de l'agence (accès aux projets assignés)
 *  CLIENT       → Accès portail client uniquement (lecture + validation livrables)
 *
 * Ces rôles sont initialisés via un DataInitializer au démarrage de l'application.
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "role")
@EntityListeners(AuditingEntityListener.class)
public class Role extends Listeners {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = false)
    private String roleName;

    /** Description du rôle pour l'interface d'administration */
    private String description;

    @ManyToMany(mappedBy = "roles")
    @JsonIgnore
    private List<User> users;
}