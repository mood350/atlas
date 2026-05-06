package com.atlas.backend.communication;

import com.atlas.backend.agency.Agency;
import com.atlas.backend.agency.AgencyRepository;
import com.atlas.backend.client.Client;
import com.atlas.backend.client.ClientRepository;
import com.atlas.backend.common.exception.ResourceNotFoundException;
import com.atlas.backend.crm.deal.Deal;
import com.atlas.backend.crm.deal.DealRepository;
import com.atlas.backend.project.Project;
import com.atlas.backend.project.ProjectRepository;
import com.atlas.backend.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MessageService {

    private final MessageRepository      messageRepository;
    private final AgencyRepository       agencyRepository;
    private final ClientRepository       clientRepository;
    private final ProjectRepository      projectRepository;
    private final DealRepository         dealRepository;
    private final SmsService             smsService;
    private final WhatsAppService        whatsAppService;
    private final SimpMessagingTemplate  messagingTemplate;

    @Value("${twilio.phone-number:}")
    private String smsFromNumber;

    @Value("${twilio.whatsapp-number:}")
    private String waFromNumber;

    // ════════════════════════════════════════════════════════════════
    //  SMS
    // ════════════════════════════════════════════════════════════════

    @Transactional
    public MessageDto.Response sendSms(Long agencyId, MessageDto.SmsRequest dto, User sender) {
        Agency agency = getAgency(agencyId);
        Client client = dto.clientId() != null
                ? clientRepository.findByIdAndAgencyId(dto.clientId(), agencyId)
                        .orElseThrow(() -> new ResourceNotFoundException("Client introuvable"))
                : null;
        Deal deal = dto.dealId() != null
                ? dealRepository.findByIdAndAgencyId(dto.dealId(), agencyId)
                        .orElseThrow(() -> new ResourceNotFoundException("Deal introuvable"))
                : null;

        Message msg = Message.builder()
                .agency(agency)
                .sentBy(sender)
                .client(client)
                .deal(deal)
                .channel(Message.MessageChannel.SMS)
                .direction(Message.MessageDirection.OUTBOUND)
                .status(Message.MessageStatus.PENDING)
                .fromAddress(smsFromNumber)
                .toAddress(dto.to())
                .body(dto.body())
                .build();

        try {
            String sid = smsService.send(dto.to(), dto.body());
            msg.setExternalId(sid);
            msg.setStatus(Message.MessageStatus.SENT);
        } catch (Exception e) {
            msg.setStatus(Message.MessageStatus.FAILED);
            msg.setErrorMessage(e.getMessage());
        }

        return toResponse(messageRepository.save(msg));
    }

    // ════════════════════════════════════════════════════════════════
    //  WHATSAPP
    // ════════════════════════════════════════════════════════════════

    @Transactional
    public MessageDto.Response sendWhatsApp(Long agencyId, MessageDto.WhatsAppRequest dto, User sender) {
        Agency agency = getAgency(agencyId);
        Client client = dto.clientId() != null
                ? clientRepository.findByIdAndAgencyId(dto.clientId(), agencyId)
                        .orElseThrow(() -> new ResourceNotFoundException("Client introuvable"))
                : null;
        Deal deal = dto.dealId() != null
                ? dealRepository.findByIdAndAgencyId(dto.dealId(), agencyId)
                        .orElseThrow(() -> new ResourceNotFoundException("Deal introuvable"))
                : null;

        Message msg = Message.builder()
                .agency(agency)
                .sentBy(sender)
                .client(client)
                .deal(deal)
                .channel(Message.MessageChannel.WHATSAPP)
                .direction(Message.MessageDirection.OUTBOUND)
                .status(Message.MessageStatus.PENDING)
                .fromAddress(waFromNumber)
                .toAddress(dto.to())
                .body(dto.body())
                .build();

        try {
            String sid = whatsAppService.send(dto.to(), dto.body());
            msg.setExternalId(sid);
            msg.setStatus(Message.MessageStatus.SENT);
        } catch (Exception e) {
            msg.setStatus(Message.MessageStatus.FAILED);
            msg.setErrorMessage(e.getMessage());
        }

        return toResponse(messageRepository.save(msg));
    }

    // ════════════════════════════════════════════════════════════════
    //  MESSAGERIE INTERNE
    // ════════════════════════════════════════════════════════════════

    @Transactional
    public MessageDto.Response sendInternal(Long agencyId, MessageDto.InternalRequest dto, User sender) {
        Agency agency = getAgency(agencyId);

        Client client = dto.clientId() != null
                ? clientRepository.findByIdAndAgencyId(dto.clientId(), agencyId)
                        .orElseThrow(() -> new ResourceNotFoundException("Client introuvable"))
                : null;
        Project project = dto.projectId() != null
                ? projectRepository.findByIdAndAgencyId(dto.projectId(), agencyId)
                        .orElseThrow(() -> new ResourceNotFoundException("Projet introuvable"))
                : null;
        Deal deal = dto.dealId() != null
                ? dealRepository.findByIdAndAgencyId(dto.dealId(), agencyId)
                        .orElseThrow(() -> new ResourceNotFoundException("Deal introuvable"))
                : null;

        Message msg = messageRepository.save(Message.builder()
                .agency(agency)
                .sentBy(sender)
                .client(client)
                .project(project)
                .deal(deal)
                .channel(Message.MessageChannel.INTERNAL)
                .direction(Message.MessageDirection.OUTBOUND)
                .status(Message.MessageStatus.SENT)
                .fromAddress(sender.getEmail())
                .body(dto.body())
                .build());

        // Diffusion temps réel via WebSocket
        MessageDto.Response response = toResponse(msg);
        messagingTemplate.convertAndSend("/topic/agencies/" + agencyId + "/messages", response);

        log.info("[INTERNAL] Message agence={} sender={} project={} deal={}",
                agencyId, sender.getEmail(), dto.projectId(), dto.dealId());

        return response;
    }

    // ════════════════════════════════════════════════════════════════
    //  WEBHOOK TWILIO — Messages entrants (SMS / WhatsApp)
    // ════════════════════════════════════════════════════════════════

    @Transactional
    public void handleInbound(String from, String to, String body, String sid) {
        // Déduplication
        if (messageRepository.findByExternalId(sid).isPresent()) {
            log.debug("[INBOUND] Message déjà reçu SID={}", sid);
            return;
        }

        boolean isWhatsApp = from.startsWith("whatsapp:");
        Message.MessageChannel channel = isWhatsApp
                ? Message.MessageChannel.WHATSAPP
                : Message.MessageChannel.SMS;

        // Tentative de résolution du client par numéro
        String normalizedFrom = from.replace("whatsapp:", "");
        Client client = clientRepository.findAll().stream()
                .filter(c -> normalizedFrom.equals(c.getPhoneNumber()) ||
                             normalizedFrom.equals(c.getWhatsappNumber()))
                .findFirst()
                .orElse(null);

        // Identification de l'agence via le numéro "to"
        // (simplifié — en production, mapper les numéros Twilio aux agences)
        Agency agency = agencyRepository.findAll().stream().findFirst().orElse(null);
        if (agency == null) {
            log.warn("[INBOUND] Aucune agence trouvée pour le numéro to={}", to);
            return;
        }

        Message msg = messageRepository.save(Message.builder()
                .agency(agency)
                .client(client)
                .channel(channel)
                .direction(Message.MessageDirection.INBOUND)
                .status(Message.MessageStatus.READ)
                .fromAddress(from)
                .toAddress(to)
                .body(body)
                .externalId(sid)
                .build());

        // Notifier l'agence en temps réel
        messagingTemplate.convertAndSend(
                "/topic/agencies/" + agency.getId() + "/messages",
                toResponse(msg));

        log.info("[INBOUND] {} entrant from={} SID={}", channel, from, sid);
    }

    // ════════════════════════════════════════════════════════════════
    //  LECTURE
    // ════════════════════════════════════════════════════════════════

    public Page<MessageDto.Response> getAll(Long agencyId, Pageable pageable) {
        return messageRepository.findByAgencyId(agencyId, pageable).map(this::toResponse);
    }

    public Page<MessageDto.Response> getClientHistory(Long agencyId, Long clientId, Pageable pageable) {
        return messageRepository.findByAgencyIdAndClientId(agencyId, clientId, pageable).map(this::toResponse);
    }

    public Page<MessageDto.Response> getProjectMessages(Long agencyId, Long projectId, Pageable pageable) {
        return messageRepository.findByAgencyIdAndProjectId(agencyId, projectId, pageable).map(this::toResponse);
    }

    public Page<MessageDto.Response> getDealMessages(Long agencyId, Long dealId, Pageable pageable) {
        return messageRepository.findByAgencyIdAndDealId(agencyId, dealId, pageable).map(this::toResponse);
    }

    // ════════════════════════════════════════════════════════════════
    //  STATISTIQUES
    // ════════════════════════════════════════════════════════════════

    public MessageDto.Stats getStats(Long agencyId) {
        long outbound = messageRepository.countByAgencyIdAndDirection(agencyId, Message.MessageDirection.OUTBOUND);
        long inbound  = messageRepository.countByAgencyIdAndDirection(agencyId, Message.MessageDirection.INBOUND);
        long failed   = messageRepository.countByAgencyIdAndStatus(agencyId, Message.MessageStatus.FAILED);

        Map<String, Long> byChannel = new LinkedHashMap<>();
        messageRepository.countByChannelForAgency(agencyId)
                .forEach(r -> byChannel.put(r[0].toString(), ((Number) r[1]).longValue()));

        return new MessageDto.Stats(outbound, inbound, byChannel, failed);
    }

    // ════════════════════════════════════════════════════════════════
    //  ENVOI AUTOMATIQUE (appelé par les autres services)
    // ════════════════════════════════════════════════════════════════

    /**
     * Envoie un SMS et/ou WhatsApp automatique depuis le système.
     * Utilisé par QuoteService, InvoiceService, AppointmentService, etc.
     */
    @Transactional
    public void sendAutoNotification(Agency agency, Client client,
                                     String phone, boolean isWhatsApp,
                                     String body, Message.MessageChannel channel) {
        if (phone == null) return;

        Message msg = Message.builder()
                .agency(agency)
                .client(client)
                .channel(channel)
                .direction(Message.MessageDirection.OUTBOUND)
                .status(Message.MessageStatus.PENDING)
                .toAddress(phone)
                .body(body)
                .build();

        try {
            String sid = isWhatsApp
                    ? whatsAppService.send(phone, body)
                    : smsService.send(phone, body);
            msg.setExternalId(sid);
            msg.setStatus(Message.MessageStatus.SENT);
        } catch (Exception e) {
            msg.setStatus(Message.MessageStatus.FAILED);
            msg.setErrorMessage(e.getMessage());
            log.warn("[AUTO-NOTIFY] Échec {} à {}: {}", channel, phone, e.getMessage());
        }

        messageRepository.save(msg);
    }

    // ════════════════════════════════════════════════════════════════
    //  PRIVÉ — MAPPER
    // ════════════════════════════════════════════════════════════════

    private Agency getAgency(Long agencyId) {
        return agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Agence introuvable"));
    }

    private MessageDto.Response toResponse(Message m) {
        return new MessageDto.Response(
                m.getId(),
                m.getChannel(),
                m.getDirection(),
                m.getStatus(),
                m.getFromAddress(),
                m.getToAddress(),
                m.getSubject(),
                m.getBody(),
                m.getClient()  != null ? m.getClient().getId()   : null,
                m.getClient()  != null ? m.getClient().getName() : null,
                m.getProject() != null ? m.getProject().getId()  : null,
                m.getDeal()    != null ? m.getDeal().getId()     : null,
                m.getSentBy()  != null ? m.getSentBy().fullName() : "Système",
                m.getExternalId(),
                m.getErrorMessage(),
                m.getCreatedAt()
        );
    }
}
