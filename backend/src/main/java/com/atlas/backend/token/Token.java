package com.atlas.backend.token;

import com.atlas.backend.user.User;
import com.atlas.backend.utils.Listeners;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║                     Token.java                              ║
 * ║     Entité représentant un token de confirmation/reset      ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Un token est un code OTP à 6 chiffres lié à un utilisateur.
 * Il a une date d'expiration variable selon son type.
 *
 * DURÉES D'EXPIRATION :
 *  - ACTIVATION     → 15 min
 *  - PASSWORD_RESET → 15 min
 *  - INVITATION     → 72h (3 jours pour accepter l'invitation)
 *  - EMAIL_CHANGE   → 30 min
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "token")
@EntityListeners(AuditingEntityListener.class)
public class Token extends Listeners {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Code OTP à 6 chiffres — ex: "847291" */
    @Column(unique = true, nullable = false)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TokenType tokenType;

    /** Date d'expiration du token */
    @Column(nullable = false)
    private LocalDateTime expiresAt;

    /** Date de validation (null si pas encore utilisé) */
    private LocalDateTime validatedAt;

    /**
     * Données supplémentaires selon le type.
     *
     * INVITATION → JSON : {"agencyId": 5, "role": "MEMBER", "invitedEmail": "x@y.com"}
     * EMAIL_CHANGE → nouvelle adresse email à valider
     * Autres → null
     */
    @Column(length = 500)
    private String metadata;

    /** L'utilisateur auquel appartient ce token */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Vérifie si le token est encore valide (non expiré et non utilisé) */
    public boolean isValid() {
        return validatedAt == null && LocalDateTime.now().isBefore(expiresAt);
    }
}