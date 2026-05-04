package com.atlas.backend.user;

import jakarta.validation.Valid;
import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ════════════════════════════════════════════════════════════════
    //  PROFIL PERSONNEL  —  /api/me/**
    // ════════════════════════════════════════════════════════════════

    // GET /api/me
    @GetMapping("/api/me")
    public ResponseEntity<UserDto.Response> getMyProfile(
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(userService.getProfile(currentUser.getId()));
    }

    // PUT /api/me
    @PutMapping("/api/me")
    public ResponseEntity<UserDto.Response> updateMyProfile(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody UserDto.UpdateProfileRequest dto
    ) {
        return ResponseEntity.ok(userService.updateProfile(currentUser.getId(), dto));
    }

    // PATCH /api/me/password
    @PatchMapping("/api/me/password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody UserDto.ChangePasswordRequest dto
    ) {
        userService.changePassword(currentUser.getId(), dto);
        return ResponseEntity.noContent().build();
    }

    // PATCH /api/me/email
    @PatchMapping("/api/me/email")
    public ResponseEntity<Void> requestEmailChange(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody UserDto.ChangeEmailRequest dto
    ) throws MessagingException {
        userService.requestEmailChange(currentUser.getId(), dto);
        return ResponseEntity.noContent().build();
    }

    // PATCH /api/me/email/confirm
    @PatchMapping("/api/me/email/confirm")
    public ResponseEntity<Void> confirmEmailChange(
            @AuthenticationPrincipal User currentUser,
            @RequestParam String otp
    ) {
        userService.confirmEmailChange(currentUser.getId(), otp);
        return ResponseEntity.noContent().build();
    }

    // PATCH /api/me/avatar
    @PatchMapping("/api/me/avatar")
    public ResponseEntity<UserDto.Response> updateAvatar(
            @AuthenticationPrincipal User currentUser,
            @RequestParam String avatarUrl
    ) {
        return ResponseEntity.ok(userService.updateAvatar(currentUser.getId(), avatarUrl));
    }

    // PATCH /api/me/notifications
    @PatchMapping("/api/me/notifications")
    public ResponseEntity<UserDto.Response> updateNotificationPrefs(
            @AuthenticationPrincipal User currentUser,
            @RequestBody UserDto.NotificationPrefsRequest dto
    ) {
        return ResponseEntity.ok(userService.updateNotificationPrefs(currentUser.getId(), dto));
    }

    // ════════════════════════════════════════════════════════════════
    //  MEMBRES D'AGENCE  —  /api/agencies/{agencyId}/members/**
    // ════════════════════════════════════════════════════════════════

    // GET /api/agencies/{agencyId}/members?page=0&size=20
    @GetMapping("/api/agencies/{agencyId}/members")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<Page<UserDto.Response>> getMembers(
            @PathVariable Long agencyId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(
                userService.getAgencyMembers(agencyId, PageRequest.of(page, size)));
    }

    // GET /api/agencies/{agencyId}/members/search?q=jean
    @GetMapping("/api/agencies/{agencyId}/members/search")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MEMBER')")
    public ResponseEntity<List<UserDto.Summary>> searchMembers(
            @PathVariable Long agencyId,
            @RequestParam String q
    ) {
        return ResponseEntity.ok(userService.searchMembers(agencyId, q));
    }

    // PATCH /api/agencies/{agencyId}/members/{userId}/role
    @PatchMapping("/api/agencies/{agencyId}/members/{userId}/role")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<UserDto.Response> updateMemberRole(
            @PathVariable Long agencyId,
            @PathVariable Long userId,
            @Valid @RequestBody UserDto.UpdateRoleRequest dto,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(
                userService.updateMemberRole(agencyId, userId, dto.getRole(), currentUser));
    }

    // DELETE /api/agencies/{agencyId}/members/{userId}
    @DeleteMapping("/api/agencies/{agencyId}/members/{userId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<Void> removeMember(
            @PathVariable Long agencyId,
            @PathVariable Long userId,
            @AuthenticationPrincipal User currentUser
    ) {
        userService.removeMember(agencyId, userId, currentUser);
        return ResponseEntity.noContent().build();
    }

    // ════════════════════════════════════════════════════════════════
    //  ADMIN PLATEFORME  —  /api/admin/users/**
    // ════════════════════════════════════════════════════════════════

    // PATCH /api/admin/users/{userId}/lock
    @PatchMapping("/api/admin/users/{userId}/lock")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> lockAccount(@PathVariable Long userId) {
        userService.lockAccount(userId);
        return ResponseEntity.noContent().build();
    }

    // PATCH /api/admin/users/{userId}/unlock
    @PatchMapping("/api/admin/users/{userId}/unlock")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> unlockAccount(@PathVariable Long userId) {
        userService.unlockAccount(userId);
        return ResponseEntity.noContent().build();
    }
}