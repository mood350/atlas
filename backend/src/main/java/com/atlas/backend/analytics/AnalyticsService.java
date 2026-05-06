package com.atlas.backend.analytics;

import com.atlas.backend.client.Client;
import com.atlas.backend.client.ClientRepository;
import com.atlas.backend.crm.deal.Deal;
import com.atlas.backend.crm.deal.DealRepository;
import com.atlas.backend.invoice.InvoiceRepository;
import com.atlas.backend.project.Project;
import com.atlas.backend.project.ProjectRepository;
import com.atlas.backend.quote.QuoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsService {

    private final InvoiceRepository invoiceRepository;
    private final QuoteRepository   quoteRepository;
    private final DealRepository    dealRepository;
    private final ClientRepository  clientRepository;
    private final ProjectRepository projectRepository;

    // ════════════════════════════════════════════════════════════════
    //  DASHBOARD COMPLET
    // ════════════════════════════════════════════════════════════════

    public AnalyticsDto.Dashboard getDashboard(Long agencyId, int days) {
        LocalDateTime from = LocalDateTime.now().minusDays(days);
        return new AnalyticsDto.Dashboard(
                revenueMetrics(agencyId, from),
                quoteMetrics(agencyId, from),
                dealMetrics(agencyId),
                clientMetrics(agencyId, from),
                projectMetrics(agencyId)
        );
    }

    // ════════════════════════════════════════════════════════════════
    //  REVENUS
    // ════════════════════════════════════════════════════════════════

    public AnalyticsDto.RevenueMetrics revenueMetrics(Long agencyId, LocalDateTime from) {
        LocalDateTime now = LocalDateTime.now();

        BigDecimal mrr        = invoiceRepository.sumPaidInMonth(agencyId, now.getYear(), now.getMonthValue());
        BigDecimal totalPaid  = invoiceRepository.sumPaidInPeriod(agencyId, from, now);
        BigDecimal pending    = invoiceRepository.sumPendingAmount(agencyId);
        Double     avgDelay   = invoiceRepository.avgPaymentDelayDays(agencyId);

        List<AnalyticsDto.MonthlyRevenue> byMonth = invoiceRepository
                .revenueByMonth(agencyId, from)
                .stream()
                .map(r -> new AnalyticsDto.MonthlyRevenue(
                        ((Number) r[0]).intValue(),
                        ((Number) r[1]).intValue(),
                        (BigDecimal) r[2]))
                .toList();

        return new AnalyticsDto.RevenueMetrics(mrr, totalPaid, pending, avgDelay, byMonth);
    }

    // ════════════════════════════════════════════════════════════════
    //  DEVIS
    // ════════════════════════════════════════════════════════════════

    private AnalyticsDto.QuoteMetrics quoteMetrics(Long agencyId, LocalDateTime from) {
        long       total         = quoteRepository.countByAgencyId(agencyId);
        long       sent          = quoteRepository.countSentSince(agencyId, from);
        long       accepted      = quoteRepository.countAcceptedSince(agencyId, from);
        BigDecimal totalAccepted = quoteRepository.sumAcceptedAmountByAgency(agencyId);
        Double     rate          = sent > 0 ? (double) accepted / sent * 100 : null;

        return new AnalyticsDto.QuoteMetrics(total, sent, accepted, rate, totalAccepted);
    }

    // ════════════════════════════════════════════════════════════════
    //  DEALS / PIPELINE
    // ════════════════════════════════════════════════════════════════

    private AnalyticsDto.DealMetrics dealMetrics(Long agencyId) {
        long open = dealRepository.countByAgencyIdAndStatus(agencyId, Deal.DealStatus.OPEN);
        long won  = dealRepository.countByAgencyIdAndStatus(agencyId, Deal.DealStatus.WON);
        long lost = dealRepository.countByAgencyIdAndStatus(agencyId, Deal.DealStatus.LOST);

        BigDecimal wonAmount      = dealRepository.sumWonAmountByAgency(agencyId);
        BigDecimal forecastAmount = dealRepository.sumWeightedAmountByAgency(agencyId);
        Double     convRate       = dealRepository.conversionRate(agencyId);
        Double     avgCycle       = dealRepository.avgSalesCycleDays(agencyId);

        return new AnalyticsDto.DealMetrics(open, won, lost, convRate, wonAmount, forecastAmount, avgCycle);
    }

    // ════════════════════════════════════════════════════════════════
    //  CLIENTS
    // ════════════════════════════════════════════════════════════════

    private AnalyticsDto.ClientMetrics clientMetrics(Long agencyId, LocalDateTime from) {
        long total    = clientRepository.countByAgencyId(agencyId);
        long active   = clientRepository.countByAgencyIdAndStatus(agencyId, Client.ClientStatus.ACTIVE);
        long prospect = clientRepository.countByAgencyIdAndStatus(agencyId, Client.ClientStatus.PROSPECT);
        long inactive = clientRepository.countByAgencyIdAndStatus(agencyId, Client.ClientStatus.INACTIVE);

        List<AnalyticsDto.ByLeadSource> bySource = clientRepository
                .countByLeadSourceForAgency(agencyId)
                .stream()
                .map(r -> new AnalyticsDto.ByLeadSource(
                        r[0] != null ? r[0].toString() : "UNKNOWN",
                        ((Number) r[1]).longValue()))
                .toList();

        List<AnalyticsDto.TopClient> topClients = clientRepository
                .topClientsByRevenue(agencyId, from, 10)
                .stream()
                .map(r -> new AnalyticsDto.TopClient(
                        ((Number) r[0]).longValue(),
                        (String) r[1],
                        r[2] instanceof BigDecimal bd ? bd : new BigDecimal(r[2].toString())))
                .toList();

        return new AnalyticsDto.ClientMetrics(total, active, prospect, inactive, bySource, topClients);
    }

    // ════════════════════════════════════════════════════════════════
    //  PROJETS
    // ════════════════════════════════════════════════════════════════

    private AnalyticsDto.ProjectMetrics projectMetrics(Long agencyId) {
        long       total       = projectRepository.countByAgencyId(agencyId);
        long       inProgress  = projectRepository.countByAgencyIdAndStatus(agencyId, Project.ProjectStatus.IN_PROGRESS);
        long       done        = projectRepository.countByAgencyIdAndStatus(agencyId, Project.ProjectStatus.DONE);
        long       overdue     = projectRepository.findOverdueProjects(agencyId, LocalDate.now()).size();
        BigDecimal totalBudget = projectRepository.sumBudgetByAgency(agencyId);

        BigDecimal logged    = projectRepository.sumLoggedHoursActive(agencyId);
        BigDecimal estimated = projectRepository.sumEstimatedHoursActive(agencyId);
        Double occupancy = (estimated != null && estimated.compareTo(BigDecimal.ZERO) > 0)
                ? logged.divide(estimated, 4, RoundingMode.HALF_UP).doubleValue() * 100
                : null;

        return new AnalyticsDto.ProjectMetrics(total, inProgress, done, overdue, occupancy, totalBudget);
    }

    // ════════════════════════════════════════════════════════════════
    //  EXPORT CSV
    // ════════════════════════════════════════════════════════════════

    public byte[] exportCsv(Long agencyId, int days) {
        AnalyticsDto.Dashboard d = getDashboard(agencyId, days);
        StringBuilder csv = new StringBuilder();

        csv.append("Métrique,Valeur\n");
        csv.append("MRR (mois courant),").append(d.revenue().mrr()).append("\n");
        csv.append("CA encaissé (période),").append(d.revenue().totalPaidInPeriod()).append("\n");
        csv.append("CA en attente,").append(d.revenue().totalPending()).append("\n");
        csv.append("Délai moyen paiement (jours),").append(fmt(d.revenue().avgPaymentDelayDays())).append("\n");
        csv.append("Devis envoyés (période),").append(d.quotes().sentInPeriod()).append("\n");
        csv.append("Devis acceptés (période),").append(d.quotes().acceptedInPeriod()).append("\n");
        csv.append("Taux conversion devis (%),").append(fmt(d.quotes().conversionRate())).append("\n");
        csv.append("CA total devis acceptés,").append(d.quotes().totalAcceptedAmount()).append("\n");
        csv.append("Deals ouverts,").append(d.deals().open()).append("\n");
        csv.append("Deals gagnés,").append(d.deals().won()).append("\n");
        csv.append("Deals perdus,").append(d.deals().lost()).append("\n");
        csv.append("Taux conversion deals (%),").append(fmt(d.deals().conversionRate())).append("\n");
        csv.append("CA gagné (deals),").append(d.deals().wonAmount()).append("\n");
        csv.append("CA prévisionnel pondéré,").append(d.deals().forecastAmount()).append("\n");
        csv.append("Durée moyenne cycle vente (jours),").append(fmt(d.deals().avgSalesCycleDays())).append("\n");
        csv.append("Clients total,").append(d.clients().total()).append("\n");
        csv.append("Clients actifs,").append(d.clients().active()).append("\n");
        csv.append("Prospects,").append(d.clients().prospects()).append("\n");
        csv.append("Clients inactifs,").append(d.clients().inactive()).append("\n");
        csv.append("Projets total,").append(d.projects().total()).append("\n");
        csv.append("Projets en cours,").append(d.projects().inProgress()).append("\n");
        csv.append("Projets terminés,").append(d.projects().done()).append("\n");
        csv.append("Projets en retard,").append(d.projects().overdue()).append("\n");
        csv.append("Taux occupation (%),").append(fmt(d.projects().occupancyRate())).append("\n");
        csv.append("Budget total projets,").append(d.projects().totalBudget()).append("\n");

        csv.append("\nTop 10 Clients\n");
        csv.append("Client,CA encaissé\n");
        d.clients().topClients().forEach(c ->
                csv.append(escape(c.clientName())).append(",").append(c.totalRevenue()).append("\n"));

        csv.append("\nCA mensuel\n");
        csv.append("Année,Mois,Montant\n");
        d.revenue().revenueByMonth().forEach(m ->
                csv.append(m.year()).append(",").append(m.month()).append(",").append(m.amount()).append("\n"));

        csv.append("\nAcquisition clients par source\n");
        csv.append("Source,Nombre\n");
        d.clients().byLeadSource().forEach(s ->
                csv.append(s.source()).append(",").append(s.count()).append("\n"));

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String fmt(Double val) {
        return val != null ? String.format("%.2f", val) : "";
    }

    private String escape(String val) {
        if (val == null) return "";
        return val.contains(",") ? "\"" + val + "\"" : val;
    }
}
