package com.atlas.backend.crm.deal;

import com.atlas.backend.email.EmailService;
import com.atlas.backend.email.EmailTemplateName;
import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class DealInactivityScheduler {

    private final DealRepository dealRepository;
    private final EmailService   emailService;
    private final RedisTemplate<String, String> redisTemplate;

    @Value("${crm.inactivity-threshold-hours:48}")
    private int inactivityThresholdHours;

    @Value("${crm.max-reminders:3}")
    private int maxReminders;

    @Value("${application.mail.from}")
    private String from;

    private static final String REDIS_KEY_PREFIX = "deal:inactive:";

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void checkInactiveDeals() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(inactivityThresholdHours);
        List<Deal> inactiveDeals = dealRepository.findAllInactiveDeals(threshold, maxReminders);
        if (inactiveDeals.isEmpty()) {
            log.debug("[SCHEDULER] Aucun deal inactif detecte.");
            return;
        }
        log.info("[SCHEDULER] {} deal(s) inactif(s) (seuil={}h)", inactiveDeals.size(), inactivityThresholdHours);
        for (Deal deal : inactiveDeals) {
            processInactiveDeal(deal);
        }
    }

    private void processInactiveDeal(Deal deal) {
        String redisKey = REDIS_KEY_PREFIX + deal.getId();
        if (redisTemplate.hasKey(redisKey)) {
            log.debug("[SCHEDULER] Deal {} alerte deja envoyee, skip.", deal.getId());
            return;
        }
        try {
            if (deal.getRemindersSent() >= maxReminders - 1) {
                sendEscalationAlert(deal);
            } else {
                sendInactivityReminder(deal);
            }
            deal.setRemindersSent(deal.getRemindersSent() + 1);
            dealRepository.save(deal);
            redisTemplate.opsForValue().set(redisKey, "sent", inactivityThresholdHours, TimeUnit.HOURS);
        } catch (MessagingException e) {
            log.error("[SCHEDULER] Erreur email deal {} : {}", deal.getId(), e.getMessage());
        }
    }

    private void sendInactivityReminder(Deal deal) throws MessagingException {
        if (deal.getOwner() == null) {
            log.warn("[SCHEDULER] Deal {} sans responsable, skip.", deal.getId());
            return;
        }
        Map<String, Object> props = new HashMap<>();
        props.put("ownerName",    deal.getOwner().fullName());
        props.put("dealTitle",    deal.getTitle());
        props.put("clientName",   deal.getClient().getName());
        props.put("stageName",    deal.getStage() != null ? deal.getStage().getName() : "N/A");
        props.put("amount",       deal.getAmount().toPlainString());
        props.put("currency",     deal.getAgency().getCurrency());
        props.put("inactiveDays", inactivityThresholdHours / 24);
        props.put("dealUrl",      "/deals/" + deal.getId());
        emailService.sendEmail(
                deal.getOwner().getEmail(),
                "Relance deal inactif : " + deal.getTitle(),
                EmailTemplateName.DEAL_INACTIVITY_REMINDER,
                props,
                from
        );
        log.info("[SCHEDULER] Relance #{} deal={} owner='{}'",
                deal.getRemindersSent() + 1, deal.getId(), deal.getOwner().fullName());
    }

    private void sendEscalationAlert(Deal deal) throws MessagingException {
        if (deal.getAgency().getOwner() == null) return;
        Map<String, Object> props = new HashMap<>();
        props.put("ownerName",       deal.getAgency().getOwner().fullName());
        props.put("dealTitle",       deal.getTitle());
        props.put("clientName",      deal.getClient().getName());
        props.put("responsibleName", deal.getOwner() != null ? deal.getOwner().fullName() : "non assigne");
        props.put("remindersSent",   deal.getRemindersSent());
        props.put("inactiveDays",    inactivityThresholdHours / 24 * (deal.getRemindersSent() + 1));
        props.put("dealUrl",         "/deals/" + deal.getId());
        emailService.sendEmail(
                deal.getAgency().getOwner().getEmail(),
                "Escalade deal critique : " + deal.getTitle(),
                EmailTemplateName.DEAL_ESCALATION_ALERT,
                props,
                from
        );
        log.warn("[SCHEDULER] Escalade deal={} agence='{}'", deal.getId(), deal.getAgency().getName());
    }
}