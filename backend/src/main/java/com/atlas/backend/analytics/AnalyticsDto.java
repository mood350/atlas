package com.atlas.backend.analytics;

import java.math.BigDecimal;
import java.util.List;

public class AnalyticsDto {

    public record Dashboard(
            RevenueMetrics revenue,
            QuoteMetrics   quotes,
            DealMetrics    deals,
            ClientMetrics  clients,
            ProjectMetrics projects
    ) {}

    public record RevenueMetrics(
            BigDecimal           mrr,
            BigDecimal           totalPaidInPeriod,
            BigDecimal           totalPending,
            Double               avgPaymentDelayDays,
            List<MonthlyRevenue> revenueByMonth
    ) {}

    public record MonthlyRevenue(int year, int month, BigDecimal amount) {}

    public record QuoteMetrics(
            long       total,
            long       sentInPeriod,
            long       acceptedInPeriod,
            Double     conversionRate,
            BigDecimal totalAcceptedAmount
    ) {}

    public record DealMetrics(
            long       open,
            long       won,
            long       lost,
            Double     conversionRate,
            BigDecimal wonAmount,
            BigDecimal forecastAmount,
            Double     avgSalesCycleDays
    ) {}

    public record ClientMetrics(
            long              total,
            long              active,
            long              prospects,
            long              inactive,
            List<ByLeadSource> byLeadSource,
            List<TopClient>   topClients
    ) {}

    public record ByLeadSource(String source, long count) {}

    public record TopClient(Long clientId, String clientName, BigDecimal totalRevenue) {}

    public record ProjectMetrics(
            long       total,
            long       inProgress,
            long       done,
            long       overdue,
            Double     occupancyRate,
            BigDecimal totalBudget
    ) {}
}
