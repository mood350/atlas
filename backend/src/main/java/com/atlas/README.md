# AgencyCRM — Backend Spring Boot

> Solution de gestion bout en bout du cycle client pour agences web africaines

---

## Table des matières

1. [Contexte et problématique](#1-contexte-et-problématique)
2. [Solution](#2-solution)
3. [Stack technique](#3-stack-technique)
4. [Architecture multi-tenant](#4-architecture-multi-tenant)
5. [Structure du projet](#5-structure-du-projet)
6. [Installation et démarrage](#6-installation-et-démarrage)
7. [Variables d'environnement](#7-variables-denvironnement)
8. [Phases de développement](#8-phases-de-développement)
9. [API — Endpoints disponibles](#9-api--endpoints-disponibles)
10. [Commits Git par package](#10-commits-git-par-package)
11. [Livrables attendus](#11-livrables-attendus)

---

## 1. Contexte et problématique

Plus de **12 000 agences web actives en Afrique francophone** gèrent leurs clients sur WhatsApp, leurs devis sur Google Docs et leurs finances sur Excel. Ces agences sont de petites structures de 1 à 15 personnes dont les revenus sont irréguliers, avec une clientèle composée de PME locales, d'ONG et de collectivités.

Les outils SaaS occidentaux (HubSpot, Salesforce) sont inadaptés à ce marché : trop chers, trop complexes, et sans intégration avec les systèmes de paiement locaux (Mobile Money).

### Pertes mesurables causées par la fragmentation des outils

| Problème | Impact |
|---|---|
| Absence de relances structurées | Perte de 35% du CA potentiel |
| Délai de réponse aux devis | 48 à 96h (le marché exige < 24h) |
| Aucun indicateur de conversion | Décisions commerciales à l'aveugle |
| Délai encaissement après livraison | 3 à 6 semaines |
| Données projet éparpillées | 5+ outils simultanés |
| Aucun suivi client en temps réel | Frustration et perte de confiance |
| Absence Mobile Money | Retards de paiement systématiques |

---

## 2. Solution

**AgencyCRM** est une plateforme SaaS multi-tenant conçue exclusivement pour les agences de développement web africaines. Elle centralise l'intégralité du cycle de vie commercial dans une seule application disponible sur web et mobile.

### Fonctionnalités clés

- **Pipeline CRM intelligent** — Kanban personnalisable, détection automatique des deals inactifs, relances automatisées via Redis, taux de conversion en temps réel
- **Devis et contrats** — Génération PDF professionnelle, accusé de lecture, suivi dans le portail client, numérotation OHADA
- **Signature électronique** — Horodatage SHA-256, conforme au droit OHADA
- **Facturation Mobile Money** — Intégration FedaPay et PayDunya, acomptes, réconciliation webhooks
- **Gestion de projets** — Jalons, Kanban de tâches, suivi du temps, portail client sécurisé
- **Rendez-vous** — Page de booking type Calendly, rappels SMS/email, sync Google Calendar
- **Communication multi-canal** — Email transactionnel (Resend), SMS et WhatsApp Business via Twilio

---

## 3. Stack technique

| Couche | Technologie |
|---|---|
| Backend principal | Spring Boot 3.x (Java 21) |
| Microservices IA | Python FastAPI |
| Mobile | Flutter |
| Base de données | PostgreSQL 15 |
| Cache / Files d'attente | Redis |
| Authentification | JWT (access 15min + refresh 7j) |
| Génération PDF | iText 7 |
| Email | Jakarta Mail + Thymeleaf |
| SMS / WhatsApp | Twilio |
| Paiements | FedaPay, PayDunya |
| Cryptographie | SHA-256 (OHADA) |
| Synchronisation mobile | WorkManager + REST API |
| Stockage fichiers | S3 / Cloudinary |

---

## 4. Architecture multi-tenant

Chaque agence est un **tenant isolé**. L'isolation des données est assurée à plusieurs niveaux :

```
┌─────────────────────────────────────────────────┐
│                  AgencyCRM SaaS                  │
├──────────────┬──────────────┬───────────────────┤
│  Agence A    │  Agence B    │  Agence C         │
│  (tenant 1)  │  (tenant 2)  │  (tenant 3)       │
├──────────────┴──────────────┴───────────────────┤
│  PostgreSQL — isolation par agency_id            │
│  Chaque requête filtre obligatoirement sur       │
│  agency_id (contrôlé dans les Services)          │
└─────────────────────────────────────────────────┘
```

**Règle fondamentale :** toute entité métier (Client, Deal, Devis, Facture, Projet...) porte un champ `agency_id`. Toutes les méthodes de service vérifient l'appartenance via `findByIdAndAgencyId()` avant toute opération.

### Rôles disponibles

| Rôle | Description |
|---|---|
| `SUPER_ADMIN` | Administrateur de la plateforme (éditeur SaaS) |
| `OWNER` | Propriétaire d'une agence — accès total à son tenant |
| `ADMIN` | Administrateur de l'agence — gère les membres et paramètres |
| `MEMBER` | Membre de l'agence — accès aux projets assignés |
| `CLIENT` | Accès portail client uniquement |

---

## 5. Structure du projet

```
src/main/java/com/atlas/backend/
│
├── agency/                         ✅ Terminé
│   ├── Agency.java
│   ├── AgencyDto.java
│   ├── AgencyRepository.java
│   └── AgencyService.java
│
├── auth/                           ✅ Terminé
│   ├── AuthenticationService.java
│   ├── AuthController.java
│   ├── AuthenticationRequest.java
│   ├── AuthenticationResponse.java
│   └── RegistrationRequest.java
│
├── client/                         ✅ Terminé
│   ├── Client.java
│   ├── ClientController.java
│   ├── ClientDto.java
│   ├── ClientMapper.java
│   ├── ClientRepository.java
│   └── ClientService.java
│
├── common/exception/               ✅ Terminé
│   ├── GlobalExceptionHandler.java
│   ├── ResourceNotFoundException.java
│   └── UnauthorizedAccessException.java
│
├── config/                         ✅ Terminé
│   ├── SecurityConfig.java
│   └── BeansConfig.java
│
├── crm/
│   ├── deal/                       ✅ Terminé
│   │   ├── Deal.java
│   │   ├── DealController.java
│   │   ├── DealDto.java
│   │   ├── DealInactivityScheduler.java
│   │   ├── DealRepository.java
│   │   └── DealService.java
│   │
│   └── pipeline/                   ✅ Terminé
│       ├── Pipeline.java
│       ├── PipelineRepository.java
│       ├── PipelineService.java
│       ├── PipelineStage.java
│       └── PipelineStageRepository.java
│
├── email/                          ✅ Terminé
│   └── EmailTemplateName.java
│   └── EmailService.java           ⚠️ A implementer (wrapper Resend/SMTP)
│
├── quote/                          ✅ Terminé
│   ├── Quote.java
│   ├── QuoteController.java
│   ├── QuoteDto.java
│   ├── QuoteItem.java
│   ├── QuoteItemRepository.java
│   ├── QuoteMapper.java
│   ├── QuotePdfService.java
│   ├── QuoteRepository.java
│   └── QuoteService.java
│
├── role/                           ✅ Terminé
│   ├── Role.java
│   └── RoleRepository.java
│
├── security/                       ✅ Terminé (existant)
│   ├── JwtAuthFilter.java
│   └── JwtService.java
│
├── token/                          ✅ Terminé
│   ├── Token.java
│   ├── TokenRepository.java
│   └── TokenType.java
│
├── user/                           ✅ Terminé
│   ├── User.java
│   ├── UserController.java
│   ├── UserDto.java
│   ├── UserMapper.java
│   ├── UserRepository.java
│   └── UserService.java
│
├── utils/                          ✅ Terminé (existant)
│   └── Listeners.java
│
│   ─── A CREER (phases suivantes) ───────────────
│
├── contract/                       ❌ Phase 2 — A faire
│   ├── Contract.java
│   ├── ContractController.java
│   ├── ContractDto.java
│   ├── ContractRepository.java
│   └── ContractService.java
│
├── invoice/                        ❌ Phase 3 — A faire
│   ├── Invoice.java
│   ├── InvoiceItem.java
│   ├── InvoiceController.java
│   ├── InvoiceDto.java
│   ├── InvoiceRepository.java
│   └── InvoiceService.java
│
├── payment/                        ❌ Phase 3 — A faire
│   ├── Payment.java
│   ├── PaymentController.java
│   ├── PaymentDto.java
│   ├── PaymentWebhookController.java
│   ├── fedapay/
│   │   └── FedaPayService.java
│   └── paydunya/
│       └── PaydunyaService.java
│
├── project/                        ❌ Phase 4 — A faire
│   ├── Project.java
│   ├── Milestone.java
│   ├── Task.java
│   ├── TimeEntry.java
│   ├── Deliverable.java
│   ├── ProjectController.java
│   ├── ProjectDto.java
│   ├── ProjectRepository.java
│   └── ProjectService.java
│
├── appointment/                    ❌ Phase 5 — A faire
│   ├── Appointment.java
│   ├── AvailabilitySlot.java
│   ├── AppointmentController.java
│   ├── AppointmentDto.java
│   ├── AppointmentRepository.java
│   └── AppointmentService.java
│
└── analytics/                      ❌ Phase 5 — A faire
    ├── AnalyticsController.java
    └── AnalyticsService.java
```

---

## 6. Installation et démarrage

### Prérequis

- Java 21+
- Maven 3.9+
- PostgreSQL 15+
- Redis 7+

### Etapes

```bash
# 1. Cloner le projet
git clone https://github.com/votre-org/agencycrm-backend.git
cd agencycrm-backend

# 2. Créer la base de données
psql -U postgres -c "CREATE DATABASE agencycrm;"
psql -U postgres -c "CREATE USER agencycrm WITH PASSWORD 'changeme';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE agencycrm TO agencycrm;"

# 3. Copier et configurer les variables d'environnement
cp src/main/resources/application.yml src/main/resources/application-local.yml
# Editer application-local.yml avec vos valeurs

# 4. Insérer les rôles par défaut (une seule fois)
psql -U agencycrm -d agencycrm -c "
  INSERT INTO role (role_name, description) VALUES
  ('SUPER_ADMIN', 'Administrateur plateforme'),
  ('OWNER',       'Propriétaire agence'),
  ('ADMIN',       'Administrateur agence'),
  ('MEMBER',      'Membre agence'),
  ('CLIENT',      'Accès portail client')
  ON CONFLICT DO NOTHING;
"

# 5. Lancer l'application
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

L'application démarre sur `http://localhost:8080`.
Swagger UI disponible sur `http://localhost:8080/swagger-ui.html`.

### Dépendances Maven à ajouter

```xml
<!-- iText 7 — génération PDF -->
<dependency>
    <groupId>com.itextpdf</groupId>
    <artifactId>itext7-core</artifactId>
    <version>7.2.5</version>
    <type>pom</type>
</dependency>

<!-- Redis -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>

<!-- Mail -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>

<!-- Thymeleaf pour les templates email -->
<dependency>
    <groupId>org.thymeleaf.extras</groupId>
    <artifactId>thymeleaf-extras-springsecurity6</artifactId>
</dependency>
```

---

## 7. Variables d'environnement

Toutes les variables sensibles sont externalisées. Ne jamais committer de valeurs en dur.

```properties
# Base de données
DB_USERNAME=agencycrm
DB_PASSWORD=your_password

# JWT
JWT_SECRET_KEY=your_base64_secret_key_at_least_256_bits

# CORS
CORS_ORIGINS=http://localhost:4200,https://app.agencycrm.com

# Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your@email.com
MAIL_PASSWORD=your_app_password
MAIL_FROM=noreply@agencycrm.com

# Frontend
FRONTEND_URL=https://app.agencycrm.com

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# FedaPay (Mobile Money)
FEDAPAY_API_KEY=your_fedapay_key
FEDAPAY_ENV=sandbox
FEDAPAY_WEBHOOK_SECRET=your_webhook_secret

# PayDunya (Mobile Money)
PAYDUNYA_MASTER_KEY=your_master_key
PAYDUNYA_PUBLIC_KEY=your_public_key
PAYDUNYA_PRIVATE_KEY=your_private_key
PAYDUNYA_TOKEN=your_token
PAYDUNYA_MODE=test

# Twilio (SMS + WhatsApp)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# Stockage fichiers
STORAGE_PROVIDER=s3
S3_BUCKET=agencycrm
S3_REGION=eu-west-1
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key

# Scheduler CRM
crm.inactivity-threshold-hours=48
crm.max-reminders=3
```

---

## 8. Phases de développement

### ✅ Phase 0 — Socle technique (Terminé)

Mise en place de l'infrastructure de base du projet.

**Ce qui a été fait :**
- Configuration Spring Security avec filtre JWT stateless
- Entité `User` avec champs multi-tenant (agency, phoneNumber, timezone, preferredLanguage)
- Entité `Agency` — pilier de l'isolation multi-tenant avec plans d'abonnement (FREE, STARTER, PRO, ENTERPRISE)
- Entité `Role` avec 5 rôles (SUPER_ADMIN, OWNER, ADMIN, MEMBER, CLIENT)
- Entité `Token` avec 4 types (ACTIVATION, PASSWORD_RESET, INVITATION, EMAIL_CHANGE)
- `Listeners.java` — audit automatique createdAt / lastModifiedDate
- `SecurityConfig.java` — CORS externalisé, routes publiques, protection par rôle
- `GlobalExceptionHandler` — réponses d'erreur JSON structurées
- `application.properties` — toutes les variables externalisées

**Fichiers :** `User`, `Agency`, `Role`, `Token`, `TokenType`, `Listeners`, `SecurityConfig`, `GlobalExceptionHandler`, `ResourceNotFoundException`, `UnauthorizedAccessException`

---

### ✅ Phase 0.5 — Authentification JWT (Terminé)

Système d'authentification complet avec gestion sécurisée des comptes.

**Ce qui a été fait :**
- Inscription en deux modes : création d'agence ou rejoindre via invitation
- Confirmation du compte par OTP (6 chiffres, expire en 15 min)
- Connexion avec génération access token (15 min) + refresh token (7 jours)
- Reset de mot de passe par OTP
- Détection de connexion depuis un nouvel appareil/IP avec alerte email
- Verrouillage automatique après 5 tentatives échouées, déverrouillage après 30 min
- Invitation de membres avec token INVITATION valable 72h
- Changement d'email sécurisé en 2 étapes
- `UserService` — gestion profil, préférences notifications, rôles membres

**Fichiers :** `AuthenticationService`, `RegistrationRequest`, `UserService`, `UserController`, `UserDto`, `UserMapper`, `UserRepository`

---

### ✅ Phase 1 — Module CRM (Terminé)

Pipeline commercial complet avec gestion Kanban et relances automatiques.

**Ce qui a été fait :**
- Entité `Client` avec 5 types (PME, ONG, Collectivité, Startup, Particulier), sources d'acquisition et champs fiscaux OHADA (RCCM, IFU)
- CRUD clients avec recherche textuelle multi-champs et pagination
- Entité `Pipeline` — conteneur d'étapes personnalisable par agence
- Entité `PipelineStage` — colonne Kanban avec couleur, probabilité de conversion, flags `isWon`/`isLost`
- Initialisation automatique d'un pipeline par défaut à la création de chaque agence (6 étapes standard)
- Entité `Deal` avec `lastActivityAt`, `weightedAmount` (CA pondéré), drag & drop entre étapes
- Vue Kanban complète avec totaux par colonne
- Marquage Gagné/Perdu avec mise à jour automatique du statut
- `DealInactivityScheduler` — job Redis toutes les heures, anti-doublons, escalade après 3 relances sans réponse
- Statistiques pipeline : taux de conversion, durée moyenne cycle de vente, CA prévisionnel pondéré

**Fichiers :** `Client`, `ClientService`, `ClientController`, `ClientDto`, `ClientMapper`, `ClientRepository`, `Pipeline`, `PipelineStage`, `PipelineService`, `PipelineRepository`, `PipelineStageRepository`, `Deal`, `DealService`, `DealController`, `DealDto`, `DealRepository`, `DealInactivityScheduler`

---

### ✅ Phase 2a — Devis (Terminé)

Module de devis professionnel avec génération PDF et portail client.

**Ce qui a été fait :**
- Entité `Quote` — cycle de vie DRAFT → SENT → VIEWED → ACCEPTED/REJECTED/EXPIRED → INVOICED
- Numérotation OHADA automatique : `DEV-2025-00042`
- Entité `QuoteItem` — lignes avec 8 types de prestation, remise par ligne, calcul automatique `lineTotal`
- `recalculateTotals()` — sous-total, remise globale, base imposable, TVA, total TTC
- `QuotePdfService` — PDF iText 7 avec en-tête bicolonne, tableau des lignes, bloc totaux, mentions légales OHADA
- Token d'accès UUID pour le portail client (sans authentification)
- Tracking d'ouverture : passage automatique SENT → VIEWED à la première consultation
- Acceptation/refus depuis le portail client avec notification email à l'agence
- Scheduler d'expiration automatique des devis chaque matin à 8h
- Statistiques : taux d'acceptation, CA total accepté

**Fichiers :** `Quote`, `QuoteItem`, `QuoteService`, `QuoteController`, `QuoteDto`, `QuoteMapper`, `QuotePdfService`, `QuoteRepository`, `QuoteItemRepository`

---

### ❌ Phase 2b — Contrats et Signature OHADA (A faire)

Conversion d'un devis accepté en contrat signé électroniquement.

**Ce qu'il faut faire :**

1. **Créer `Contract.java`** avec les champs :
   - Lien vers le devis source (`quote_id`)
   - Contenu du contrat (clauses, conditions)
   - Statut : DRAFT → SENT → SIGNED → CANCELLED
   - `signatureHash` — empreinte SHA-256 du document signé
   - `signedAt` — horodatage de la signature
   - `signedByName` / `signedByEmail` — identité du signataire côté client
   - `ipAddress` — IP du signataire (valeur probante OHADA)

2. **Créer `ContractService.java`** avec :
   - `convertFromQuote(quoteId)` — génère un contrat depuis un devis accepté en 1 clic
   - `generateContractPdf(contract)` — PDF avec champs de signature
   - `signContract(accessToken, signerName, signerEmail, ipAddress)` — signature électronique
   - `computeSignatureHash(contract)` — SHA-256 du contenu + metadata signataire
   - Envoi du contrat signé par email aux deux parties

3. **Créer `ContractPdfService.java`** — extension de `QuotePdfService` pour :
   - Page de signature avec bloc signataire
   - Filigrane "SIGNÉ" sur les pages après signature
   - Empreinte SHA-256 visible en bas de chaque page

4. **Créer `ContractController.java`** — endpoints :
   - `POST /api/agencies/{id}/quotes/{id}/convert` — devis → contrat
   - `GET /api/agencies/{id}/contracts/{id}`
   - `POST /api/portal/contracts/{token}/sign`
   - `GET /api/agencies/{id}/contracts/{id}/pdf`

**Commit Git prévu :**
```
feat(contract): add Contract entity with SHA-256 electronic signature compliant with OHADA law
```

---

### ❌ Phase 3 — Facturation et Paiements Mobile Money (A faire)

Facturation automatique avec intégration FedaPay et PayDunya.

**Ce qu'il faut faire :**

1. **Créer `Invoice.java`** avec les champs :
   - Numérotation OHADA : `FACT-2025-00001`
   - Lien vers le contrat ou projet source
   - Type : DEPOSIT (acompte) ou FINAL (solde)
   - Montant acompte en % configurable
   - Statut : DRAFT → SENT → PARTIALLY_PAID → PAID → OVERDUE → CANCELLED
   - `dueDate` — date d'échéance (agency.invoiceDueDays après émission)

2. **Créer `InvoiceItem.java`** — lignes de facture (similaire à QuoteItem)

3. **Créer `Payment.java`** avec les champs :
   - `provider` : FEDAPAY | PAYDUNYA | BANK_TRANSFER | CASH
   - `transactionId` — identifiant unique retourné par le prestataire
   - `amount` — montant encaissé
   - `status` : PENDING → SUCCESS | FAILED | REFUNDED
   - `paidAt` — date de paiement confirmée

4. **Créer `FedaPayService.java`** :
   - `initiatePayment(invoice)` — crée un lien de paiement Mobile Money
   - `verifyWebhookSignature(payload, signature)` — vérification HMAC
   - `handleWebhook(event)` — mise à jour statut invoice après confirmation

5. **Créer `PaydunyaService.java`** — même logique pour PayDunya

6. **Créer `PaymentWebhookController.java`** — endpoint public `/api/webhooks/payment/{provider}` sécurisé par vérification HMAC

7. **Créer `InvoiceService.java`** :
   - `generateFromContract(contractId)` — facture depuis contrat
   - `generateFromQuote(quoteId)` — facture depuis devis accepté
   - `generateDepositInvoice(invoiceId, percent)` — facture d'acompte
   - `markAsPaid(invoiceId)` — après confirmation paiement
   - Scheduler de relance des factures impayées (J+1, J+7, J+14 après échéance)

**Commit Git prévu :**
```
feat(invoice): add Invoice, InvoiceItem and Payment entities with FedaPay and PayDunya Mobile Money integration
```

---

### ❌ Phase 4 — Projets, Tâches et Portail Client (A faire)

Gestion de projets avec portail client en temps réel.

**Ce qu'il faut faire :**

1. **Créer `Project.java`** :
   - Lien vers le client et le contrat source
   - Statut : PLANNING → IN_PROGRESS → REVIEW → COMPLETED → ARCHIVED
   - `startDate` / `endDate` / `actualEndDate`
   - Budget alloué vs dépensé
   - Token d'accès portail client

2. **Créer `Milestone.java`** :
   - Jalons du projet avec date cible et statut
   - Lien vers les tâches associées
   - Déclencheur de notifications client

3. **Créer `Task.java`** :
   - Kanban de tâches par projet
   - Assignation à un membre de l'agence
   - Estimation et temps réel passé
   - Pièces jointes

4. **Créer `TimeEntry.java`** — suivi du temps par tâche et membre

5. **Créer `Deliverable.java`** :
   - Livrables à valider par le client
   - Upload de fichiers (S3)
   - Statut : PENDING_REVIEW → APPROVED | REJECTED
   - Commentaires du client

6. **Créer le portail client** — accès sécurisé par token UUID :
   - Avancement du projet en temps réel
   - Validation des livrables
   - Messagerie projet
   - Accès aux devis et factures

7. **WebSocket ou SSE** pour les mises à jour en temps réel

**Commit Git prévu :**
```
feat(project): add Project, Milestone, Task, TimeEntry and Deliverable entities with secure client portal
```

---

### ❌ Phase 5a — Rendez-vous et Booking (A faire)

Page de booking en ligne type Calendly intégrée au portail client.

**Ce qu'il faut faire :**

1. **Créer `Appointment.java`** :
   - Lien vers le client et l'agence
   - `startTime` / `endTime`
   - Type : DISCOVERY | FOLLOW_UP | DELIVERY | SUPPORT
   - Statut : SCHEDULED → CONFIRMED → CANCELLED → COMPLETED
   - `meetingUrl` — lien visioconférence généré automatiquement
   - `remindersSent` — pour éviter les doublons

2. **Créer `AvailabilitySlot.java`** :
   - Créneaux disponibles par membre de l'agence
   - Récurrence (lundi-vendredi, heures de bureau)
   - Durée par défaut configurable (30min, 1h)

3. **Créer `AppointmentService.java`** :
   - Page de booking publique par membre : `/booking/{memberSlug}`
   - Vérification des disponibilités
   - Création automatique d'un lien Google Meet ou Zoom
   - Envoi de confirmations email et SMS
   - Scheduler de rappels : J-1 et H-1 avant le rendez-vous
   - Envoi du compte rendu après la réunion

4. **Intégration Google Calendar** :
   - OAuth2 par membre de l'agence
   - Synchronisation bidirectionnelle des rendez-vous

**Commit Git prévu :**
```
feat(appointment): add Appointment booking system with Google Calendar sync and SMS/email reminders
```

---

### ❌ Phase 5b — Dashboard Analytique (A faire)

Tableau de bord avec indicateurs clés de performance.

**Ce qu'il faut faire :**

1. **Créer `AnalyticsService.java`** avec les métriques :
   - **MRR** (Monthly Recurring Revenue) — CA mensuel récurrent
   - **Taux de conversion** — devis envoyés / acceptés par période
   - **Délai moyen de paiement** — entre livraison et encaissement
   - **CA par source d'acquisition** — ROI des canaux de prospection
   - **Durée moyenne du cycle de vente** — par étape du pipeline
   - **Taux d'occupation** — ratio heures facturées / heures disponibles
   - **Top clients** — par CA généré sur N mois

2. **Créer `AnalyticsController.java`** :
   - Endpoints filtrables par période (7j, 30j, 90j, 1an)
   - Export CSV/Excel des données

**Commit Git prévu :**
```
feat(analytics): add dashboard analytics service with MRR, conversion rate and payment delay metrics
```

---

### ❌ Phase 6 — Communication Multi-canal (A faire)

Centralisation des communications client.

**Ce qu'il faut faire :**

1. **Intégration WhatsApp Business API** (via Twilio) :
   - Templates de messages approuvés Meta
   - Envoi automatique à chaque étape clé (devis envoyé, facture due, rendez-vous confirmé)
   - Réception des messages clients dans l'interface agence

2. **Messagerie interne par projet** :
   - Entité `Message.java` — messages liés à un projet ou deal
   - Mentions (@membre), pièces jointes
   - Notifications push (web et mobile)

3. **Centralisation de l'historique** — toutes les communications (email, SMS, WhatsApp, messagerie interne) visibles dans la fiche client

**Commit Git prévu :**
```
feat(communication): add WhatsApp Business API integration and project-based internal messaging
```

---

## 9. API — Endpoints disponibles

### Authentification — `/api/auth/**` (public)

| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Inscription (nouvelle agence ou invitation) |
| POST | `/api/auth/login` | Connexion — retourne access + refresh token |
| POST | `/api/auth/confirm` | Confirmation du compte par OTP |
| POST | `/api/auth/refresh` | Renouvellement du token |
| POST | `/api/auth/logout` | Déconnexion |
| POST | `/api/auth/request-password-reset` | Demande de reset mot de passe |
| POST | `/api/auth/reset-password` | Reset avec OTP |

### Profil utilisateur — `/api/me/**`

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/me` | Récupérer son profil |
| PUT | `/api/me` | Modifier son profil |
| PATCH | `/api/me/password` | Changer son mot de passe |
| PATCH | `/api/me/email` | Demander un changement d'email |
| PATCH | `/api/me/email/confirm` | Confirmer le changement d'email |
| PATCH | `/api/me/avatar` | Changer son avatar |
| PATCH | `/api/me/notifications` | Préférences de notifications |

### Membres — `/api/agencies/{agencyId}/members/**`

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/agencies/{id}/members` | Lister les membres |
| GET | `/api/agencies/{id}/members/search?q=` | Rechercher un membre |
| PATCH | `/api/agencies/{id}/members/{userId}/role` | Modifier le rôle |
| DELETE | `/api/agencies/{id}/members/{userId}` | Retirer un membre |

### Clients — `/api/agencies/{agencyId}/clients/**`

| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/api/agencies/{id}/clients` | Créer un client |
| GET | `/api/agencies/{id}/clients` | Lister les clients (paginé) |
| GET | `/api/agencies/{id}/clients/search?q=` | Recherche textuelle |
| GET | `/api/agencies/{id}/clients/{clientId}` | Détail client |
| PUT | `/api/agencies/{id}/clients/{clientId}` | Modifier un client |
| PATCH | `/api/agencies/{id}/clients/{clientId}/status` | Changer le statut |
| DELETE | `/api/agencies/{id}/clients/{clientId}` | Supprimer un client |
| GET | `/api/agencies/{id}/clients/stats` | Statistiques clients |

### Pipeline CRM — `/api/agencies/{agencyId}/deals/**`

| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/api/agencies/{id}/deals` | Créer un deal |
| GET | `/api/agencies/{id}/deals` | Lister les deals par statut |
| GET | `/api/agencies/{id}/deals/kanban?pipelineId=` | Vue Kanban complète |
| GET | `/api/agencies/{id}/deals/{dealId}` | Détail deal |
| PUT | `/api/agencies/{id}/deals/{dealId}` | Modifier un deal |
| PATCH | `/api/agencies/{id}/deals/{dealId}/move` | Déplacer (drag & drop) |
| PATCH | `/api/agencies/{id}/deals/{dealId}/lose` | Marquer comme perdu |
| DELETE | `/api/agencies/{id}/deals/{dealId}` | Supprimer un deal |
| GET | `/api/agencies/{id}/deals/stats` | Statistiques pipeline |

### Devis — `/api/agencies/{agencyId}/quotes/**`

| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/api/agencies/{id}/quotes` | Créer un devis |
| GET | `/api/agencies/{id}/quotes` | Lister les devis |
| GET | `/api/agencies/{id}/quotes/{quoteId}` | Détail devis |
| PUT | `/api/agencies/{id}/quotes/{quoteId}` | Modifier (DRAFT uniquement) |
| POST | `/api/agencies/{id}/quotes/{quoteId}/send` | Envoyer au client |
| GET | `/api/agencies/{id}/quotes/{quoteId}/pdf` | Télécharger le PDF |
| DELETE | `/api/agencies/{id}/quotes/{quoteId}` | Supprimer (DRAFT uniquement) |
| GET | `/api/agencies/{id}/quotes/stats` | Statistiques devis |

### Portail client — `/api/portal/**` (public, accès par token)

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/portal/quotes/{token}` | Consulter un devis (marque VIEWED) |
| POST | `/api/portal/quotes/{token}/accept` | Accepter un devis |
| POST | `/api/portal/quotes/{token}/reject` | Refuser un devis |

---

## 10. Commits Git par package

```bash
feat(utils): add Listeners base entity with audit fields createdAt and lastModifiedDate
feat(role): add Role entity and RoleRepository with agency roles
feat(token): add Token entity, TokenType enum and TokenRepository
feat(email): add EmailTemplateName enum with transactional and CRM alert templates
feat(agency): add Agency entity with multi-tenant plan management, AgencyRepository, AgencyService and AgencyDto
feat(user): add User entity with phone, timezone, agency binding and security fields
feat(user): add UserRepository, UserDto, UserMapper, UserService and UserController
feat(auth): add JWT authentication with registration, email confirmation, password reset and device detection
feat(config): add SecurityConfig with externalized CORS, JWT filter chain and role-based access control
feat(exception): add GlobalExceptionHandler, ResourceNotFoundException and UnauthorizedAccessException
feat(crm): add Client entity with type, status, lead source and agency isolation
feat(crm): add ClientRepository, ClientDto, ClientMapper, ClientService and ClientController
feat(crm): add Pipeline and PipelineStage entities with default 6-stage initialization
feat(crm): add PipelineRepository, PipelineStageRepository and PipelineService
feat(crm): add Deal entity with weighted amount, inactivity tracking and Kanban support
feat(crm): add DealRepository with inactivity queries and dashboard statistics
feat(crm): add DealDto, DealService with Kanban view, drag-and-drop and won/lost logic
feat(crm): add DealController with REST endpoints for pipeline management
feat(crm): add DealInactivityScheduler with Redis dedup and escalation after max reminders
feat(quote): add Quote and QuoteItem entities with PDF generation, client portal tracking and OHADA-compliant numbering
chore(config): add application properties for JWT, CORS, Redis, Mobile Money and CRM scheduler
```

---

## 11. Livrables attendus

| # | Livrable | Statut |
|---|---|---|
| 1 | Architecture complète avec diagrammes UML | ❌ A faire |
| 2 | Application backend fonctionnelle | 🔄 En cours (Phase 0-2a terminées) |
| 3 | Application web (frontend) | ❌ A faire |
| 4 | Application mobile Flutter | ❌ A faire |
| 5 | Module de facturation complet | ❌ Phase 3 à faire |
| 6 | Module rendez-vous + booking + Google Calendar | ❌ Phase 5a à faire |
| 7 | Documentation technique (README, guide d'installation) | ✅ Ce document |

---

## Templates email à créer

Les fichiers HTML Thymeleaf suivants doivent être créés dans `src/main/resources/templates/emails/` :

| Fichier | Variables | Quand |
|---|---|---|
| `activate_account.html` | username, confirmationUrl, activation_code | Inscription |
| `welcome.html` | username | Après activation |
| `reset_password.html` | username, reset_code | Reset mot de passe |
| `new_device_login.html` | username, ip, device, time | Nouvelle connexion |
| `invitation.html` | agencyName, inviteUrl, role | Invitation membre |
| `email_change_confirm.html` | username, newEmail, otp | Changement email |
| `deal_inactivity_reminder.html` | ownerName, dealTitle, clientName, stageName, amount, currency, inactiveDays, dealUrl | Deal inactif |
| `deal_escalation_alert.html` | ownerName, dealTitle, clientName, responsibleName, remindersSent, inactiveDays, dealUrl | Escalade deal |
| `quote_sent.html` | clientName, agencyName, quoteNumber, quoteTitle, totalAmount, currency, validUntil, portalUrl | Envoi devis |
| `quote_response.html` | agencyMemberName, clientName, quoteNumber, quoteTitle, totalAmount, currency, accepted, rejectionReason, quoteUrl | Réponse devis |

---

*Dernière mise à jour : 2025 — AgencyCRM Backend v0.2.0*
