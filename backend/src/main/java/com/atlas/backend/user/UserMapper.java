package com.atlas.backend.user;

import com.atlas.backend.role.Role;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class UserMapper {

    public UserDto.Response toResponse(User user) {
        return UserDto.Response.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .avatarUrl(user.getAvatarUrl())
                .timezone(user.getTimezone())
                .preferredLanguage(user.getPreferredLanguage())
                .agencyId(user.getAgency() != null ? user.getAgency().getId() : null)
                .agencyName(user.getAgency() != null ? user.getAgency().getName() : null)
                .roles(user.getRoles().stream().map(Role::getRoleName).collect(Collectors.toList()))
                .emailNotificationsEnabled(user.isEmailNotificationsEnabled())
                .smsNotificationsEnabled(user.isSmsNotificationsEnabled())
                .whatsappNotificationsEnabled(user.isWhatsappNotificationsEnabled())
                .enabled(user.isEnabled())
                .accountLocked(user.isAccountLocked())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public UserDto.Summary toSummary(User user) {
        return UserDto.Summary.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .roles(user.getRoles().stream().map(Role::getRoleName).collect(Collectors.toList()))
                .build();
    }
}