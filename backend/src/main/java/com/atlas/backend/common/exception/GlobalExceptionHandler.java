package com.atlas.backend.common.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ─── Ressource non trouvée (404) ─────────────────────────────────────────
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    // ─── Accès non autorisé (403) ────────────────────────────────────────────
    @ExceptionHandler({ UnauthorizedAccessException.class, AccessDeniedException.class })
    public ResponseEntity<ApiError> handleForbidden(Exception ex) {
        return error(HttpStatus.FORBIDDEN, "Accès non autorisé");
    }

    // ─── Mauvaises credentials (401) ─────────────────────────────────────────
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> handleBadCredentials(BadCredentialsException ex) {
        return error(HttpStatus.UNAUTHORIZED, "Email ou mot de passe incorrect");
    }

    // ─── Compte verrouillé (423) ─────────────────────────────────────────────
    @ExceptionHandler(LockedException.class)
    public ResponseEntity<ApiError> handleLocked(LockedException ex) {
        return error(HttpStatus.LOCKED, ex.getMessage());
    }

    // ─── Erreurs de validation (@Valid) (400) ────────────────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String field   = ((FieldError) error).getField();
            String message = error.getDefaultMessage();
            fieldErrors.put(field, message);
        });

        ApiError apiError = ApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Erreur de validation")
                .message("Certains champs sont invalides")
                .fieldErrors(fieldErrors)
                .build();

        return ResponseEntity.badRequest().body(apiError);
    }

    // ─── Erreur métier générale (400) ────────────────────────────────────────
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiError> handleIllegalState(IllegalStateException ex) {
        return error(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    // ─── Erreur interne serveur (500) ────────────────────────────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneral(Exception ex) {
        log.error("[ERROR] Erreur non gérée : {}", ex.getMessage(), ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "Une erreur interne est survenue");
    }

    // ─── Utilitaire ──────────────────────────────────────────────────────────

    private ResponseEntity<ApiError> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(
                ApiError.builder()
                        .timestamp(LocalDateTime.now())
                        .status(status.value())
                        .error(status.getReasonPhrase())
                        .message(message)
                        .build()
        );
    }

    // ─── Modèle d'erreur API ─────────────────────────────────────────────────

    @lombok.Value
    @lombok.Builder
    public static class ApiError {
        LocalDateTime           timestamp;
        int                     status;
        String                  error;
        String                  message;
        Map<String, String>     fieldErrors;
    }
}