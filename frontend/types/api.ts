/**
 * AtlasCRM backend types — kept in sync with the Spring Boot DTOs.
 * When the backend changes, update here first, then propagate to API clients.
 */

export type AgencyPlan = "FREE" | "STARTER" | "PRO" | "ENTERPRISE";

/**
 * Full agency record — returned by `/api/agencies/{id}`. Most screens
 * only need the lighter `AgencyIdentity` embedded in the user profile.
 */
export interface Agency {
  id: number;
  name: string;
  subdomain: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  email?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  city?: string;
  country?: string;
  rccm?: string;
  ifu?: string;
  taxRate: number;
  currency: string;
  paymentDelayDays: number;
  plan: AgencyPlan;
  active: boolean;
}

/**
 * Minimal agency identity flattened into the user profile by the
 * backend's `UserDto.Response`. Sufficient to scope API calls and
 * render the sidebar badge.
 */
export interface AgencyIdentity {
  id: number;
  name: string;
  /** Optional — the backend may not return a plan in the user response. */
  plan?: AgencyPlan;
}

/**
 * Mirror of the backend `UserDto.Response`. Note the agency is
 * returned flat as `agencyId` + `agencyName`, not as a nested object.
 */
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  timezone?: string;
  preferredLanguage?: string;

  agencyId?: number;
  agencyName?: string;

  roles: string[];

  emailNotificationsEnabled?: boolean;
  smsNotificationsEnabled?: boolean;
  whatsappNotificationsEnabled?: boolean;

  enabled?: boolean;
  accountLocked?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}

export type ClientType = "SME" | "NGO" | "PUBLIC" | "STARTUP" | "INDIVIDUAL";
export type ClientStatus = "PROSPECT" | "ACTIVE" | "INACTIVE";

export interface Client {
  id: number;
  agencyId: number;
  name: string;
  contactFirstName?: string;
  contactLastName?: string;
  email?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  type: ClientType;
  status: ClientStatus;
  industry?: string;
  city?: string;
  country?: string;
  address?: string;
  websiteUrl?: string;
  notes?: string;
  totalRevenue?: number;
  dealsCount?: number;
  projectsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type DealStatus = "OPEN" | "WON" | "LOST";
export type DealPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface DealStage {
  id: number;
  name: string;
  position: number;
  color: string;
  probability: number;
  pipelineId: number;
}

export interface Pipeline {
  id: number;
  name: string;
  isDefault: boolean;
  stages: DealStage[];
}

export interface Deal {
  id: number;
  agencyId: number;
  title: string;
  description?: string;
  clientId: number;
  clientName: string;
  pipelineId: number;
  stageId: number;
  stageName: string;
  stageColor: string;
  amount: number;
  currency: string;
  weightedAmount: number;
  status: DealStatus;
  priority: DealPriority;
  expectedCloseDate?: string;
  lastActivityAt: string;
  remindersSent: number;
  ownerId?: number;
  ownerName?: string;
  ownerAvatarUrl?: string;
  lostReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KanbanColumn {
  stage: DealStage;
  deals: Deal[];
  totalAmount: number;
  count: number;
}

export type QuoteStatus =
  | "DRAFT"
  | "SENT"
  | "VIEWED"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "INVOICED";

export type QuoteItemType =
  | "SERVICE"
  | "DEVELOPMENT"
  | "DESIGN"
  | "HOSTING"
  | "MAINTENANCE"
  | "TRAINING"
  | "LICENSE"
  | "OTHER";

export interface QuoteItem {
  id: number;
  position: number;
  designation: string;
  description?: string;
  type: QuoteItemType;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  lineTotal: number;
}

export interface QuoteSummary {
  id: number;
  quoteNumber: string;
  title: string;
  clientName: string;
  totalAmount: number;
  currency: string;
  status: QuoteStatus;
  validUntil?: string;
  expired: boolean;
  createdAt: string;
}

export interface Quote {
  id: number;
  quoteNumber: string;
  clientId: number;
  clientName: string;
  clientEmail?: string;
  clientCity?: string;
  dealId?: number;
  dealTitle?: string;
  createdById?: number;
  createdByName?: string;
  title: string;
  description?: string;
  items: QuoteItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  taxRate?: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  validUntil?: string;
  paymentTerms?: string;
  clientNotes?: string;
  status: QuoteStatus;
  sentAt?: string;
  viewedAt?: string;
  respondedAt?: string;
  rejectionReason?: string;
  pdfUrl?: string;
  expired: boolean;
  createdAt: string;
  lastModifiedDate?: string;
}

export interface QuoteStats {
  totalQuotes: number;
  drafts: number;
  sent: number;
  accepted: number;
  rejected: number;
  expired: number;
  totalAcceptedAmount: number;
  acceptanceRate: number;
}

export type ContractStatus = "DRAFT" | "SENT" | "SIGNED" | "EXPIRED" | "CANCELLED";

export interface ContractSummary {
  id: number;
  contractNumber: string;
  title: string;
  clientName: string;
  status: ContractStatus;
  signedAt?: string;
  createdAt: string;
}

export interface Contract {
  id: number;
  contractNumber: string;
  title: string;
  content?: string;
  status: ContractStatus;
  accessToken?: string;
  validUntil?: string;
  pdfUrl?: string;
  sentAt?: string;
  signedAt?: string;
  signatureHash?: string;
  signerName?: string;
  signerEmail?: string;
  signerIpAddress?: string;
  rejectionReason?: string;
  clientId: number;
  clientName: string;
  quoteId?: number;
  quoteName?: string;
  createdById?: number;
  createdByName?: string;
  expired: boolean;
  createdAt: string;
  lastModifiedDate?: string;
}

export interface ContractStats {
  totalContracts: number;
  drafts: number;
  sent: number;
  signed: number;
  cancelled: number;
}

export type InvoiceStatus =
  | "DRAFT"
  | "SENT"
  | "PARTIAL"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export type InvoiceType = "STANDALONE" | "FROM_CONTRACT" | "DEPOSIT";

export interface InvoiceItem {
  id: number;
  position: number;
  designation: string;
  description?: string;
  type?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  lineTotal: number;
}

export interface InvoiceSummary {
  id: number;
  invoiceNumber: string;
  clientName: string;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  status: InvoiceStatus;
  type: InvoiceType;
  dueDate?: string;
  createdAt: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  title: string;
  clientId: number;
  clientName: string;
  contractId?: number;
  contractNumber?: string;
  quoteId?: number;
  quoteNumber?: string;
  createdById?: number;
  createdByName?: string;
  type: InvoiceType;
  depositPercent?: number;
  items: InvoiceItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  taxRate?: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  dueDate?: string;
  status: InvoiceStatus;
  paidAmount: number;
  remainingAmount: number;
  paidAt?: string;
  sentAt?: string;
  pdfUrl?: string;
  createdAt: string;
  lastModifiedDate?: string;
}

export interface InvoiceStats {
  totalInvoices: number;
  drafts: number;
  sent: number;
  partiallyPaid: number;
  paid: number;
  overdue: number;
  cancelled: number;
  totalPaidAmount: number;
}

export type PaymentMethod = "FEDAPAY" | "PAYDUNYA" | "BANK_TRANSFER" | "CASH" | "OTHER";
export interface Payment {
  id: number;
  invoiceId: number;
  amount: number;
  currency: string;
  method: PaymentMethod;
  reference?: string;
  paidAt: string;
}

export type ProjectStatus =
  | "PLANNING"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "REVIEW"
  | "DONE"
  | "DELIVERED"
  | "CANCELLED";

export type ProjectPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type ProjectTaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "CANCELLED";
export type MilestoneStatus = "PENDING" | "COMPLETED" | "OVERDUE";

export interface ProjectTask {
  id: number;
  title: string;
  description?: string;
  status: ProjectTaskStatus;
  priority: ProjectPriority;
  assignedToId?: number;
  assignedToName?: string;
  dueDate?: string;
  estimatedHours?: number;
  loggedHours?: number;
  position: number;
  overdue: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface ProjectMilestone {
  id: number;
  title: string;
  description?: string;
  dueDate: string;
  status: MilestoneStatus;
  billable: boolean;
  amount?: number;
  overdue: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface ProjectSummary {
  id: number;
  projectNumber: string;
  name: string;
  clientName: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  deadline?: string;
  overdue: boolean;
  progressPercent: number;
  totalTasks: number;
  doneTasks: number;
  createdAt: string;
}

export interface Project {
  id: number;
  projectNumber: string;
  name: string;
  description?: string;
  clientId: number;
  clientName: string;
  contractId?: number;
  contractNumber?: string;
  createdById?: number;
  createdByName?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate?: string;
  deadline?: string;
  overdue: boolean;
  progressPercent: number;
  budget?: number;
  estimatedHours?: number;
  loggedHours?: number;
  tasks: ProjectTask[];
  milestones: ProjectMilestone[];
  completedAt?: string;
  createdAt: string;
  lastModifiedDate?: string;
}

export interface ProjectStats {
  totalProjects: number;
  planning: number;
  inProgress: number;
  onHold: number;
  review: number;
  done: number;
  cancelled: number;
  overdueProjects: number;
  totalTasks: number;
  doneTasks: number;
}

export type AppointmentType = "DISCOVERY" | "FOLLOW_UP" | "DEMO" | "ONBOARDING" | "REVIEW" | "OTHER";
export type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type MeetingProvider = "GOOGLE_MEET" | "ZOOM" | "TEAMS" | "PHONE" | "IN_PERSON" | "OTHER";

export interface AppointmentSummary {
  id: number;
  title: string;
  type: AppointmentType;
  status: AppointmentStatus;
  startTime: string;
  endTime: string;
  memberName: string;
  clientOrGuestName: string;
  meetingUrl?: string;
}

export interface Appointment {
  id: number;
  agencyId: number;
  memberId: number;
  memberName: string;
  clientId?: number;
  clientOrGuestName: string;
  title: string;
  description?: string;
  type: AppointmentType;
  status: AppointmentStatus;
  meetingProvider: MeetingProvider;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  timezone: string;
  location?: string;
  meetingUrl?: string;
  guestName?: string;
  guestEmail?: string;
  accessToken?: string;
  googleCalendarEventId?: string;
  meetingNotes?: string;
  createdAt: string;
}

export interface AppointmentStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  noShow: number;
  upcomingThisWeek: number;
}

export interface MonthlyRevenue {
  year: number;
  month: number;
  amount: number;
}

export interface RevenueMetrics {
  mrr: number;
  totalPaidInPeriod: number;
  totalPending: number;
  avgPaymentDelayDays?: number;
  revenueByMonth: MonthlyRevenue[];
}

export interface QuoteMetrics {
  total: number;
  sentInPeriod: number;
  acceptedInPeriod: number;
  conversionRate?: number;
  totalAcceptedAmount: number;
}

export interface DealMetrics {
  open: number;
  won: number;
  lost: number;
  conversionRate?: number;
  wonAmount: number;
  forecastAmount: number;
  avgSalesCycleDays?: number;
}

export interface TopClient {
  clientId: number;
  clientName: string;
  totalRevenue: number;
}

export interface ClientMetrics {
  total: number;
  active: number;
  prospects: number;
  inactive: number;
  byLeadSource: { source: string; count: number }[];
  topClients: TopClient[];
}

export interface AnalyticsProjectMetrics {
  total: number;
  inProgress: number;
  done: number;
  overdue: number;
  occupancyRate?: number;
  totalBudget: number;
}

export interface AnalyticsDashboard {
  revenue: RevenueMetrics;
  quotes: QuoteMetrics;
  deals: DealMetrics;
  clients: ClientMetrics;
  projects: AnalyticsProjectMetrics;
}

export interface ApiError {
  status: number;
  code?: string;
  message: string;
  details?: Record<string, string>;
  timestamp?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

/**
 * Mirrors the backend `AuthenticationResponse` — note the snake_case
 * keys (set explicitly via @JsonProperty on the DTO). The user profile
 * is NOT included; fetch `/api/me` after persisting tokens.
 */
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}
