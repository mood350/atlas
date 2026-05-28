# Cahier des Charges — Atlas CRM

**Projet :** Atlas CRM  
**Version :** 1.0  
**Date :** Mai 2026  
**Statut :** En développement  

---

## Table des matières

1. [Présentation du projet](#1-présentation-du-projet)
2. [Contexte et problématique](#2-contexte-et-problématique)
3. [Objectifs](#3-objectifs)
4. [Périmètre fonctionnel](#4-périmètre-fonctionnel)
5. [Acteurs et rôles](#5-acteurs-et-rôles)
6. [Exigences fonctionnelles](#6-exigences-fonctionnelles)
7. [Exigences non fonctionnelles](#7-exigences-non-fonctionnelles)
8. [Architecture technique](#8-architecture-technique)
9. [Modèle de données](#9-modèle-de-données)
10. [Intégrations externes](#10-intégrations-externes)
11. [Sécurité et conformité](#11-sécurité-et-conformité)
12. [Contraintes et hypothèses](#12-contraintes-et-hypothèses)
13. [Livrables](#13-livrables)

---

## 1. Présentation du projet

**Atlas CRM** est une plateforme SaaS multi-tenant dédiée aux agences web africaines. Elle centralise l'intégralité du cycle de vie client : de la prospection initiale jusqu'à la livraison finale du projet, en passant par la gestion commerciale, contractuelle et financière.

### 1.1 Nom du projet

**Atlas** — AgencyCRM for African Agencies

### 1.2 Parties prenantes

| Partie prenante | Rôle |
|---|---|
| Équipe de développement | Conception, développement et maintenance |
| Agences web (clients SaaS) | Utilisateurs finaux de la plateforme |
| Clients des agences | Accès portail client (consultation, signature, paiement) |
| Super Administrateur | Gestion de la plateforme SaaS |

---

## 2. Contexte et problématique

Les agences web en Afrique de l'Ouest gèrent leurs activités avec des outils fragmentés : feuilles de calcul Excel pour les devis, e-mails pour les contrats, systèmes tiers pour la facturation, et aucune solution intégrée pour le suivi de projet. Ce manque de centralisation engendre :

- **Perte de données** et de traçabilité clients
- **Lenteur administrative** dans la production des documents commerciaux
- **Difficulté de suivi** de l'état d'avancement des projets
- **Absence de pilotage financier** en temps réel
- **Communication dispersée** entre e-mail, SMS et WhatsApp

Atlas répond à ces problèmes en proposant une solution unifiée, adaptée aux réalités du marché africain (Mobile Money, normes OHADA, langues locales).

---

## 3. Objectifs

### 3.1 Objectifs principaux

- **Centraliser** l'intégralité du cycle de vie client dans un seul outil
- **Automatiser** la production des documents commerciaux (devis, contrats, factures au format PDF)
- **Faciliter** le recouvrement via l'intégration Mobile Money (FedaPay, PayDunya)
- **Donner de la visibilité** aux agences sur leur pipeline commercial et leurs indicateurs financiers

### 3.2 Objectifs secondaires

- Offrir un **portail client** permettant aux clients finaux de consulter, accepter et signer leurs documents sans compte
- Synchroniser les **rendez-vous** avec Google Calendar
- Permettre la **communication multi-canal** (e-mail, SMS, WhatsApp) depuis l'interface
- Exporter les **données analytiques** au format CSV

---

## 4. Périmètre fonctionnel

Le projet est organisé en **6 phases** :

| Phase | Modules | Statut |
|---|---|---|
| Phase 0 | Authentification, Agences, Rôles, Utilisateurs | ✅ Terminé |
| Phase 1 | Clients, Pipeline CRM, Opportunités (Deals) | ✅ Terminé |
| Phase 2 | Devis, Contrats | ✅ Terminé |
| Phase 3 | Facturation, Paiements (Mobile Money) | ✅ Terminé |
| Phase 4 | Gestion de projets (tâches, jalons) | ✅ Terminé |
| Phase 5a | Rendez-vous, Réservation publique, Calendrier | ✅ Terminé |
| Phase 5b | Analytique, Tableaux de bord KPI | ✅ Terminé |
| Phase 6 | Communication multi-canal (SMS, WhatsApp, Email) | ✅ Terminé |

---

## 5. Acteurs et rôles

### 5.1 Rôles internes à l'agence

| Rôle | Description | Permissions clés |
|---|---|---|
| **OWNER** | Propriétaire de l'agence | Accès total, gestion des membres, paramétrage |
| **ADMIN** | Administrateur | Accès complet sauf suppression d'agence |
| **MEMBER** | Collaborateur | Accès lecture/écriture sur les ressources assignées |

### 5.2 Rôles système

| Rôle | Description |
|---|---|
| **SUPER_ADMIN** | Gestionnaire de la plateforme SaaS. Peut verrouiller/déverrouiller des comptes. N'appartient à aucune agence. |
| **CLIENT** | Client d'une agence. Accès uniquement via les portails publics (token UUID). |

---

## 6. Exigences fonctionnelles

### 6.1 Module Authentification (EF-AUTH)

| ID | Exigence |
|---|---|
| EF-AUTH-01 | L'utilisateur peut s'inscrire avec son email et un mot de passe |
| EF-AUTH-02 | L'activation du compte se fait via un lien envoyé par e-mail |
| EF-AUTH-03 | La connexion retourne un token d'accès (JWT, 90 min) et un token de rafraîchissement (7 jours) |
| EF-AUTH-04 | L'utilisateur peut demander une réinitialisation de mot de passe par e-mail |
| EF-AUTH-05 | Le changement d'e-mail est sécurisé par un OTP à 6 chiffres (TTL 15 min) |
| EF-AUTH-06 | Un compte est automatiquement verrouillé après plusieurs tentatives échouées et déverrouillé après 30 minutes |

### 6.2 Module Gestion des Clients (EF-CLIENT)

| ID | Exigence |
|---|---|
| EF-CLIENT-01 | L'agence peut créer, modifier et supprimer des clients |
| EF-CLIENT-02 | Un client possède un statut : PROSPECT, ACTIVE, INACTIVE |
| EF-CLIENT-03 | Les informations OHADA sont supportées (RCCM, IFU) |
| EF-CLIENT-04 | Le type de client est défini : PME, ONG, PUBLIC, STARTUP, PARTICULIER |
| EF-CLIENT-05 | La source de lead est traçée : RÉFÉRENCE, WHATSAPP, RÉSEAUX SOCIAUX, SITE WEB, ÉVÉNEMENT, DÉMARCHAGE |
| EF-CLIENT-06 | La recherche de clients est disponible en temps réel |
| EF-CLIENT-07 | Des statistiques agrégées sont disponibles par agence |

### 6.3 Module Pipeline CRM (EF-CRM)

| ID | Exigence |
|---|---|
| EF-CRM-01 | L'agence dispose d'un pipeline Kanban personnalisable avec étapes librement définies |
| EF-CRM-02 | Chaque étape de pipeline possède une probabilité de succès (win probability) |
| EF-CRM-03 | Les opportunités (Deals) peuvent être déplacées entre étapes par glisser-déposer |
| EF-CRM-04 | Un deal peut être marqué GAGNÉ, PERDU (avec raison), ou ROUVERT |
| EF-CRM-05 | Un scheduler automatique envoie des rappels si un deal est inactif depuis 48 h (configurable) |
| EF-CRM-06 | Le montant pondéré d'un deal est calculé automatiquement (montant × probabilité de l'étape) |
| EF-CRM-07 | Les statistiques du pipeline (total, gagné, perdu, en cours) sont accessibles |

### 6.4 Module Devis (EF-QUOTE)

| ID | Exigence |
|---|---|
| EF-QUOTE-01 | L'agence peut créer des devis avec des lignes d'articles (désignation, quantité, prix unitaire, remise) |
| EF-QUOTE-02 | Le numérotation suit le format OHADA : DEV-AAAA-NNNNN |
| EF-QUOTE-03 | Le devis supporte les taxes, remises globales et notes client/internes |
| EF-QUOTE-04 | Le cycle de vie du devis : BROUILLON → ENVOYÉ → CONSULTÉ → NÉGOCIATION → ACCEPTÉ/REFUSÉ/EXPIRÉ/FACTURÉ |
| EF-QUOTE-05 | Le devis est accessible par le client via un lien sécurisé (token UUID) sans compte |
| EF-QUOTE-06 | Le client peut accepter ou refuser le devis depuis le portail, avec motif de refus |
| EF-QUOTE-07 | Un PDF conforme est généré et téléchargeable |

### 6.5 Module Contrats (EF-CONTRACT)

| ID | Exigence |
|---|---|
| EF-CONTRACT-01 | Un contrat peut être créé de zéro ou converti depuis un devis accepté |
| EF-CONTRACT-02 | Le contenu du contrat est éditable en texte riche |
| EF-CONTRACT-03 | Le cycle de vie : BROUILLON → ENVOYÉ → SIGNÉ / ANNULÉ |
| EF-CONTRACT-04 | La signature électronique enregistre : nom, e-mail, adresse IP, User-Agent, horodatage |
| EF-CONTRACT-05 | L'intégrité de la signature est vérifiable via un hash SHA-256 |
| EF-CONTRACT-06 | Un PDF du contrat signé est généré et archivé |

### 6.6 Module Facturation (EF-INVOICE)

| ID | Exigence |
|---|---|
| EF-INVOICE-01 | La facturation supporte 4 types : AUTONOME, DEPUIS_CONTRAT, ACOMPTE, SOLDE |
| EF-INVOICE-02 | La numérotation suit le format OHADA : FAC-AAAA-NNNNN |
| EF-INVOICE-03 | Le cycle de vie : BROUILLON → ENVOYÉ → PARTIELLEMENT_PAYÉ → PAYÉ / ÉCHU / ANNULÉ |
| EF-INVOICE-04 | L'agence peut enregistrer des paiements partiels ou totaux |
| EF-INVOICE-05 | Les méthodes de paiement supportées : FEDAPAY, PAYDUNYA, VIREMENT, ESPÈCES, AUTRE |
| EF-INVOICE-06 | L'état de la facture est mis à jour automatiquement en fonction des paiements enregistrés |
| EF-INVOICE-07 | La facture est accessible par le client via portail sécurisé (token UUID) |

### 6.7 Module Gestion de Projets (EF-PROJECT)

| ID | Exigence |
|---|---|
| EF-PROJECT-01 | Un projet peut être lié à un contrat, un client et un responsable |
| EF-PROJECT-02 | Les statuts de projet : PLANIFICATION, EN_COURS, EN_ATTENTE, REVUE, TERMINÉ, LIVRÉ, ANNULÉ |
| EF-PROJECT-03 | Les tâches du projet supportent les statuts : À FAIRE, EN COURS, REVUE, FAIT, ANNULÉ |
| EF-PROJECT-04 | Le suivi du temps est possible par tâche (heures estimées vs heures saisies) |
| EF-PROJECT-05 | Les jalons de projet peuvent être marqués comme facturables, avec montant associé |
| EF-PROJECT-06 | La progression globale du projet est calculée automatiquement (% de tâches terminées) |
| EF-PROJECT-07 | Le client peut consulter l'avancement de son projet via un portail dédié (token UUID) |

### 6.8 Module Rendez-vous (EF-APPT)

| ID | Exigence |
|---|---|
| EF-APPT-01 | Un collaborateur peut définir ses créneaux de disponibilité hebdomadaire |
| EF-APPT-02 | Une page de réservation publique affiche les créneaux disponibles |
| EF-APPT-03 | Un client externe peut réserver un rendez-vous sans compte (nom, e-mail, téléphone) |
| EF-APPT-04 | Les types de réunion supportés : DISCOVERY, SUIVI, LIVRAISON, SUPPORT |
| EF-APPT-05 | Les canaux de réunion supportés : Google Meet, Zoom, Présentiel, Téléphone |
| EF-APPT-06 | La synchronisation Google Calendar est disponible via OAuth2 |
| EF-APPT-07 | Des rappels automatiques sont envoyés 24 h et 1 h avant le rendez-vous |
| EF-APPT-08 | Des notes de réunion peuvent être ajoutées après la tenue du rendez-vous |

### 6.9 Module Analytique (EF-ANALYTICS)

| ID | Exigence |
|---|---|
| EF-ANALYTICS-01 | Le tableau de bord affiche les KPI sur une période configurable (30/60/90 jours) |
| EF-ANALYTICS-02 | Les métriques de revenus incluent : total encaissé, en attente, évolution mensuelle |
| EF-ANALYTICS-03 | Les métriques CRM incluent : deals par étape, taux de conversion, valeur moyenne |
| EF-ANALYTICS-04 | Les métriques devis incluent : taux d'acceptation, délai moyen de réponse |
| EF-ANALYTICS-05 | Les métriques projet incluent : projets en retard, en cours, livrés |
| EF-ANALYTICS-06 | L'export CSV des KPI est disponible |

### 6.10 Module Communication (EF-COMM)

| ID | Exigence |
|---|---|
| EF-COMM-01 | L'agence peut envoyer un e-mail, un SMS ou un message WhatsApp depuis l'interface |
| EF-COMM-02 | L'historique des messages envoyés est consultable |
| EF-COMM-03 | Les préférences de notification de chaque utilisateur sont configurables |

---

## 7. Exigences non fonctionnelles

### 7.1 Performance

| ID | Exigence |
|---|---|
| ENF-PERF-01 | Les endpoints API doivent répondre en moins de 500 ms pour 95 % des requêtes sous charge normale |
| ENF-PERF-02 | La génération de PDF doit se faire en moins de 3 secondes |
| ENF-PERF-03 | Le tableau de bord doit se charger en moins de 2 secondes |

### 7.2 Sécurité

| ID | Exigence |
|---|---|
| ENF-SEC-01 | Toutes les communications sont chiffrées en HTTPS/TLS en production |
| ENF-SEC-02 | Les tokens JWT sont signés avec HS256 et une clé secrète d'au moins 256 bits |
| ENF-SEC-03 | Les webhooks de paiement sont vérifiés par HMAC-SHA256 |
| ENF-SEC-04 | La limitation de débit (rate limiting) est appliquée via Redis + Bucket4j |
| ENF-SEC-05 | L'isolation multi-tenant est garantie : un utilisateur ne peut jamais accéder aux données d'une autre agence |
| ENF-SEC-06 | Les mots de passe sont stockés hachés (BCrypt) |

### 7.3 Disponibilité

| ID | Exigence |
|---|---|
| ENF-DISPO-01 | La disponibilité cible est de 99,5 % en production |
| ENF-DISPO-02 | Les sauvegardes PostgreSQL doivent être réalisées quotidiennement |

### 7.4 Scalabilité

| ID | Exigence |
|---|---|
| ENF-SCALE-01 | L'architecture doit supporter au moins 100 agences actives simultanément |
| ENF-SCALE-02 | La plateforme doit supporter au moins 500 utilisateurs connectés simultanément |

### 7.5 Maintenabilité

| ID | Exigence |
|---|---|
| ENF-MAINT-01 | Le code backend doit suivre l'architecture en couches (Controller → Service → Repository) |
| ENF-MAINT-02 | Chaque module doit être organisé dans son propre package Java |
| ENF-MAINT-03 | Les migrations de base de données sont gérées automatiquement en développement (DDL auto-update) |

---

## 8. Architecture technique

### 8.1 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENTS                              │
│  Navigateur web     Portail client    Application mobile │
└──────────────┬──────────────┬────────────────────────────┘
               │              │
               ▼              ▼
┌──────────────────────────────────────────────────────────┐
│              FRONTEND (Next.js 16 — port 3000)            │
│  App Router, React 19, TypeScript, Tailwind CSS 4        │
│  React Query, React Hook Form, Zod, Recharts, dnd-kit    │
└──────────────────────────┬───────────────────────────────┘
                           │ HTTP REST / WebSocket
                           ▼
┌──────────────────────────────────────────────────────────┐
│              BACKEND (Spring Boot 3.x — port 8081)        │
│  Java 21, Spring Security, Spring Data JPA, iText7       │
│  JWT Auth, Rate Limiting (Bucket4j), WebSocket (STOMP)   │
└──────┬────────────┬──────────────┬────────────┬──────────┘
       │            │              │            │
       ▼            ▼              ▼            ▼
┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────────┐
│PostgreSQL│ │  Redis   │ │   SMTP/Email │ │  FedaPay /   │
│  (DB)    │ │ (Cache)  │ │   (Gmail)    │ │  PayDunya    │
└──────────┘ └──────────┘ └──────────────┘ └──────────────┘
                                             ┌──────────────┐
                                             │  Twilio      │
                                             │ (SMS/WA)     │
                                             └──────────────┘
                                             ┌──────────────┐
                                             │Google Cal.   │
                                             │  (OAuth2)    │
                                             └──────────────┘
```

### 8.2 Stack technologique

| Couche | Technologie | Version |
|---|---|---|
| **Backend** | Java | 21 |
| **Backend** | Spring Boot | 3.5.x |
| **Backend** | Spring Security | inclus Spring Boot |
| **Backend** | Spring Data JPA + Hibernate | inclus Spring Boot |
| **Backend** | JJWT | 0.12.6 |
| **Backend** | iText7 (PDF) | 7.2.5 |
| **Backend** | Apache POI (Excel) | inclus |
| **Backend** | Bucket4j (Rate Limiting) | inclus |
| **Backend** | Thymeleaf (Email) | inclus Spring Boot |
| **Frontend** | Next.js | 16.2.4 |
| **Frontend** | React | 19 |
| **Frontend** | TypeScript | 5.x |
| **Frontend** | Tailwind CSS | 4.x |
| **Frontend** | TanStack React Query | 5.x |
| **Frontend** | Zod (validation) | 4.x |
| **Frontend** | React Hook Form | 7.x |
| **Frontend** | Recharts | 2.x |
| **Frontend** | @dnd-kit (glisser-déposer) | 6.x |
| **Frontend** | Framer Motion | 11.x |
| **Frontend** | Zustand (état global) | 5.x |
| **Base de données** | PostgreSQL | 15 |
| **Cache** | Redis | 7 |

---

## 9. Modèle de données

### 9.1 Entités principales

```
Agency (1)
  ├── User (N) — membres de l'équipe
  ├── Client (N) — carnet d'adresses
  │     ├── Deal (N) — opportunités commerciales
  │     ├── Quote (N) — devis
  │     │     └── QuoteItem (N)
  │     ├── Contract (N) — contrats
  │     ├── Invoice (N) — factures
  │     │     ├── InvoiceItem (N)
  │     │     └── Payment (N) — paiements enregistrés
  │     ├── Project (N) — projets de livraison
  │     │     ├── ProjectTask (N)
  │     │     └── ProjectMilestone (N)
  │     └── Appointment (N) — rendez-vous
└── Pipeline (N)
      └── PipelineStage (N)
```

### 9.2 Statuts et cycles de vie

**Devis :** BROUILLON → ENVOYÉ → CONSULTÉ → [NÉGOCIATION →] ACCEPTÉ | REFUSÉ | EXPIRÉ → FACTURÉ

**Contrat :** BROUILLON → ENVOYÉ → SIGNÉ | ANNULÉ

**Facture :** BROUILLON → ENVOYÉ → PARTIELLEMENT_PAYÉ → PAYÉ | ÉCHU | ANNULÉ

**Projet :** PLANIFICATION → EN_COURS → [EN_ATTENTE | REVUE] → TERMINÉ → LIVRÉ | ANNULÉ

**Deal :** OUVERT → [déplacé entre étapes] → GAGNÉ | PERDU

**Rendez-vous :** EN_ATTENTE → CONFIRMÉ → COMPLÉTÉ | ANNULÉ | ABSENT

---

## 10. Intégrations externes

| Service | Usage | Protocole |
|---|---|---|
| **FedaPay** | Paiement Mobile Money (UEMOA) | REST API + Webhooks HMAC |
| **PayDunya** | Paiement Mobile Money (Afrique de l'Ouest) | REST API + Webhooks HMAC |
| **Twilio** | Envoi SMS et messages WhatsApp | REST API + Webhooks |
| **Google Calendar** | Synchronisation des rendez-vous | OAuth2 + REST API |
| **SMTP (Gmail)** | Envoi d'e-mails transactionnels | SMTP TLS |

---

## 11. Sécurité et conformité

### 11.1 Authentification et autorisation

- Authentification sans état (Stateless) par JWT Bearer Token
- Token d'accès : durée de vie 90 minutes
- Token de rafraîchissement : durée de vie 7 jours
- Contrôle d'accès basé sur les rôles (RBAC)

### 11.2 Isolation multi-tenant

- Chaque entité porte un champ `agency_id`
- Toutes les requêtes filtrent par `agency_id` de l'utilisateur connecté
- Aucune requête `findById` seule — toujours `findByIdAndAgencyId`

### 11.3 Portails clients

- Accès sans compte via tokens UUID à usage unique
- Les tokens sont stockés en base et validés à chaque requête
- Aucune donnée sensible exposée via les portails

### 11.4 Conformité OHADA

- Numérotation des devis : `DEV-AAAA-NNNNN`
- Numérotation des factures : `FAC-AAAA-NNNNN`
- Support des identifiants RCCM et IFU
- Champs obligatoires OHADA présents sur les PDF (raison sociale, siège, etc.)

---

## 12. Contraintes et hypothèses

### 12.1 Contraintes techniques

- L'application nécessite Java 21 (fonctionnalités de records et virtual threads)
- PostgreSQL 15 est requis (pas de support pour MySQL ou MariaDB)
- Redis est obligatoire pour le rate limiting et la déduplication des tâches planifiées
- Node.js 20+ est requis pour le frontend Next.js 16

### 12.2 Contraintes métier

- La plateforme est conçue pour le marché africain (UEMOA/OHADA) en priorité
- La langue par défaut de l'interface est le français
- Les devises supportées incluent XOF (franc CFA), EUR, USD

### 12.3 Hypothèses

- Chaque agence dispose de son propre compte dédié (pas de partage inter-agences)
- Les SMS et WhatsApp sont routés via un compte Twilio unique pour toute la plateforme
- Les PDFs générés sont stockés temporairement — un stockage cloud (S3/GCS) est recommandé en production

---

## 13. Livrables

| Livrable | Description |
|---|---|
| **Code source** | Repository Git avec backend Java et frontend TypeScript |
| **API REST** | Toutes les routes documentées dans Swagger UI (`/swagger-ui.html`) |
| **Application frontend** | Interface Next.js déployable en production |
| **Portails clients** | Pages publiques de consultation, signature et paiement |
| **Templates e-mail** | Modèles Thymeleaf pour toutes les communications transactionnelles |
| **Cahier des charges** | Ce document |
| **Manuel d'utilisation** | Guide utilisateur complet |
| **Manuel de déploiement** | Guide de mise en production |
