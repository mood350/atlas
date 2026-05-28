# Manuel d'Utilisation — Atlas CRM

**Version :** 1.0  
**Date :** Mai 2026  
**Public cible :** Propriétaires d'agences, Administrateurs, Collaborateurs  

---

## Table des matières

1. [Prise en main](#1-prise-en-main)
2. [Tableau de bord](#2-tableau-de-bord)
3. [Gestion des clients](#3-gestion-des-clients)
4. [Pipeline CRM](#4-pipeline-crm)
5. [Devis](#5-devis)
6. [Contrats](#6-contrats)
7. [Facturation](#7-facturation)
8. [Gestion de projets](#8-gestion-de-projets)
9. [Rendez-vous](#9-rendez-vous)
10. [Prospection](#10-prospection)
11. [Analytique](#11-analytique)
12. [Communication](#12-communication)
13. [Paramètres et compte](#13-paramètres-et-compte)
14. [Portail client](#14-portail-client)
15. [Foire aux questions](#15-foire-aux-questions)

---

## 1. Prise en main

### 1.1 Accès à l'application

Ouvrez votre navigateur et accédez à l'adresse de votre instance Atlas CRM (ex. : `https://app.votredomaine.com`).

Atlas CRM est compatible avec les navigateurs modernes : Google Chrome, Firefox, Microsoft Edge, Safari (versions récentes recommandées).

### 1.2 Création de compte

1. Cliquez sur **"S'inscrire"** sur la page d'accueil
2. Renseignez votre **prénom**, **nom**, **adresse e-mail** et un **mot de passe** (8 caractères minimum)
3. Cliquez sur **"Créer mon compte"**
4. Un e-mail de confirmation est envoyé à votre adresse
5. Cliquez sur le lien dans l'e-mail pour **activer votre compte**
6. Vous pouvez désormais vous connecter

> **Note :** Si vous ne recevez pas l'e-mail dans les 5 minutes, vérifiez votre dossier **Spam/Indésirables**.

### 1.3 Connexion

1. Saisissez votre **adresse e-mail** et **mot de passe**
2. Cliquez sur **"Se connecter"**
3. Vous êtes redirigé vers le tableau de bord de votre agence

### 1.4 Mot de passe oublié

1. Sur la page de connexion, cliquez sur **"Mot de passe oublié ?"**
2. Saisissez votre adresse e-mail
3. Cliquez sur **"Envoyer le lien"**
4. Ouvrez l'e-mail reçu et cliquez sur le lien de réinitialisation
5. Saisissez votre nouveau mot de passe et confirmez

### 1.5 Navigation principale

La barre latérale gauche donne accès à tous les modules :

| Icône | Module |
|---|---|
| Tableau de bord | Vue d'ensemble KPI |
| Pipeline | CRM Kanban |
| Clients | Carnet d'adresses |
| Devis | Propositions commerciales |
| Contrats | Gestion des contrats |
| Factures | Facturation |
| Projets | Suivi de projets |
| Rendez-vous | Calendrier |
| Prospection | Gestion des leads |
| Analytique | Rapports et métriques |
| Paramètres | Configuration du compte |

---

## 2. Tableau de bord

Le tableau de bord est la page d'accueil après connexion. Il présente une vue synthétique de l'activité de votre agence.

### 2.1 Indicateurs clés (KPI)

| Indicateur | Description |
|---|---|
| **Revenu total** | Montant total des factures payées sur la période |
| **En attente** | Montant des factures envoyées non encore réglées |
| **Deals actifs** | Nombre d'opportunités ouvertes dans le pipeline |
| **Projets en cours** | Nombre de projets au statut EN_COURS |
| **Taux de conversion devis** | Ratio devis acceptés / devis envoyés |
| **Clients actifs** | Nombre de clients au statut ACTIVE |

### 2.2 Graphiques

- **Évolution du chiffre d'affaires** : courbe mensuelle sur 12 mois
- **Répartition du pipeline** : distribution des deals par étape
- **Top clients** : classement par volume facturé

### 2.3 Activité récente

Une liste des dernières actions dans l'application (nouveaux clients, devis envoyés, factures payées, rendez-vous confirmés).

---

## 3. Gestion des clients

### 3.1 Créer un client

1. Dans le menu, cliquez sur **"Clients"**
2. Cliquez sur le bouton **"+ Nouveau client"**
3. Renseignez les informations obligatoires :
   - **Nom de l'entreprise** (ou nom complet pour un particulier)
   - **Prénom et nom du contact principal**
   - **Adresse e-mail**
4. Complétez les informations optionnelles :
   - Téléphone, WhatsApp
   - Type de client : PME, ONG, Secteur public, Startup, Particulier
   - Source du lead : Référence, WhatsApp, Réseaux sociaux, Site web, Événement, Démarchage
   - Pays, Ville
   - RCCM, IFU (identifiants OHADA)
   - Secteur d'activité
   - Notes internes
5. Cliquez sur **"Enregistrer"**

### 3.2 Changer le statut d'un client

Le statut d'un client reflète l'état de la relation commerciale :

- **PROSPECT** : contact initial, pas encore de relation formalisée
- **ACTIF** : client avec au moins un projet ou contrat en cours
- **INACTIF** : client sans activité récente

Pour modifier le statut :
1. Ouvrez la fiche client
2. Cliquez sur le badge de statut
3. Sélectionnez le nouveau statut dans la liste déroulante

### 3.3 Fiche client

La fiche client centralise toute l'information :

- **Informations générales** : coordonnées, statut, type, source
- **Onglet Deals** : opportunités commerciales liées
- **Onglet Devis** : propositions envoyées
- **Onglet Contrats** : contrats signés ou en cours
- **Onglet Factures** : historique de facturation
- **Onglet Projets** : projets en cours et terminés
- **Onglet Rendez-vous** : historique des rencontres

### 3.4 Rechercher un client

Utilisez la barre de recherche en haut de la liste des clients. La recherche est instantanée et porte sur le nom, l'e-mail et le numéro de téléphone.

---

## 4. Pipeline CRM

Le Pipeline CRM est un tableau Kanban qui représente visuellement le cycle de vente de vos opportunités.

### 4.1 Comprendre le Kanban

Chaque colonne correspond à une **étape du pipeline** (ex. : Prise de contact, Proposition envoyée, Négociation, Contrat signé). Les cartes représentent des **opportunités (Deals)**.

### 4.2 Créer une opportunité

1. Cliquez sur **"+ Ajouter"** dans la colonne souhaitée
2. Renseignez :
   - **Titre** de l'opportunité
   - **Client** associé (existant ou à créer)
   - **Montant** estimé
   - **Date de clôture** prévisionnelle
   - **Priorité** : FAIBLE, MOYENNE, HAUTE, URGENTE
3. Cliquez sur **"Créer"**

### 4.3 Déplacer une opportunité

Faites glisser une carte d'une colonne à une autre pour la faire avancer dans le pipeline. Le montant pondéré est recalculé automatiquement.

### 4.4 Marquer une opportunité

- **Gagnée** : cliquez sur le menu de la carte → "Marquer comme gagnée". Le deal passe en statut GAGNÉ.
- **Perdue** : cliquez sur "Marquer comme perdue" → saisissez la raison de la perte.
- **Rouvrir** : un deal fermé peut être rouvert depuis sa fiche détail.

### 4.5 Rappels automatiques

Si une opportunité est inactive depuis **48 heures** (sans modification ni action), un rappel est envoyé automatiquement au responsable de l'agence. Ce délai est configurable dans les paramètres.

### 4.6 Configurer les étapes du pipeline

1. Cliquez sur l'icône **"Paramètres"** en haut du Kanban
2. Cliquez sur **"Gérer les étapes"**
3. Ajoutez, renommez ou supprimez des étapes
4. Définissez la **probabilité de succès** (%) de chaque étape — ce pourcentage sert au calcul du montant pondéré

---

## 5. Devis

### 5.1 Créer un devis

1. Allez dans **"Devis"** → **"+ Nouveau devis"**
2. Sélectionnez le **client** destinataire
3. Donnez un **titre** à votre devis
4. Ajoutez des **lignes d'articles** :
   - Désignation (description de la prestation)
   - Quantité
   - Prix unitaire HT
   - Remise (%)
5. Configurez les paramètres financiers :
   - **Taux de TVA** (en %)
   - **Remise globale** (en %)
   - **Date de validité** du devis
   - **Conditions de paiement** (texte libre)
6. Ajoutez des **notes client** (visibles sur le PDF) et des **notes internes** (visibles uniquement en interne)
7. Cliquez sur **"Enregistrer en brouillon"**

> Le numéro du devis est généré automatiquement au format `DEV-AAAA-NNNNN` lors de l'enregistrement.

### 5.2 Envoyer un devis

1. Ouvrez le devis (statut BROUILLON)
2. Cliquez sur **"Envoyer au client"**
3. Le client reçoit un e-mail avec un lien vers le portail de consultation
4. Le statut passe automatiquement à **ENVOYÉ**, puis à **CONSULTÉ** dès que le client ouvre le lien

### 5.3 Suivre la réponse du client

Depuis la liste des devis, l'icône de statut indique :
- **ENVOYÉ** : e-mail envoyé, pas encore ouvert
- **CONSULTÉ** : le client a ouvert le lien
- **NÉGOCIATION** : votre équipe a initié une négociation
- **ACCEPTÉ** : le client a accepté
- **REFUSÉ** : le client a refusé (motif enregistré)
- **EXPIRÉ** : la date de validité est dépassée

### 5.4 Télécharger le PDF

Depuis la fiche d'un devis, cliquez sur **"Télécharger PDF"**. Le document est généré à la volée au format A4 conforme aux normes OHADA.

### 5.5 Convertir un devis en contrat

1. Ouvrez un devis **ACCEPTÉ**
2. Cliquez sur **"Créer un contrat"**
3. Le contrat est pré-rempli avec les informations du devis

---

## 6. Contrats

### 6.1 Créer un contrat

Un contrat peut être créé :
- **De zéro** : Contrats → + Nouveau contrat
- **Depuis un devis accepté** : bouton "Créer un contrat" sur la fiche devis

Renseignez :
- **Titre** du contrat
- **Contenu** (éditeur de texte)
- **Date de validité**
- **Client** destinataire

### 6.2 Envoyer pour signature

1. Ouvrez le contrat (statut BROUILLON)
2. Cliquez sur **"Envoyer pour signature"**
3. Le client reçoit un e-mail avec un lien vers le portail de signature
4. Le statut passe à **ENVOYÉ**

### 6.3 Processus de signature côté client

1. Le client ouvre le lien reçu par e-mail
2. Il lit le contrat
3. Il saisit son **nom complet** et son **adresse e-mail** pour confirmer son identité
4. Il clique sur **"Signer le contrat"**
5. La signature est enregistrée avec : date/heure, adresse IP, User-Agent du navigateur
6. Un hash SHA-256 de vérification est généré et stocké
7. Le statut passe automatiquement à **SIGNÉ**
8. Un e-mail de confirmation est envoyé à l'agence et au client

### 6.4 Vérifier l'intégrité d'un contrat signé

Sur la fiche d'un contrat signé, cliquez sur **"Vérifier la signature"**. Le système recalcule le hash et confirme l'intégrité du document.

---

## 7. Facturation

### 7.1 Types de factures

| Type | Usage |
|---|---|
| **Autonome** | Facture indépendante, sans lien avec un contrat |
| **Depuis contrat** | Générée à partir d'un contrat signé |
| **Acompte** | Facture partielle d'un pourcentage du montant total |
| **Solde** | Facture du solde restant après acompte |

### 7.2 Créer une facture

**Option A — Facture autonome :**
1. Factures → + Nouvelle facture
2. Sélectionnez le client, ajoutez les lignes d'articles, configurez la TVA
3. Définissez la **date d'échéance**
4. Enregistrez

**Option B — Depuis un contrat :**
1. Ouvrez la fiche du contrat signé
2. Cliquez sur **"Générer une facture"**
3. Choisissez le type (Depuis contrat / Acompte / Solde)
4. Pour un acompte, saisissez le **pourcentage** (ex. : 30 %)

> Le numéro de facture est généré automatiquement : `FAC-AAAA-NNNNN`

### 7.3 Envoyer une facture

1. Ouvrez la facture (statut BROUILLON)
2. Cliquez sur **"Envoyer au client"**
3. Le client reçoit la facture par e-mail avec un lien vers son portail

### 7.4 Enregistrer un paiement

Lorsqu'un client règle (partiellement ou totalement) :
1. Ouvrez la facture
2. Cliquez sur **"Enregistrer un paiement"**
3. Saisissez :
   - **Montant** versé
   - **Méthode** : FedaPay, PayDunya, Virement bancaire, Espèces, Autre
   - **Référence** de transaction (optionnel)
   - **Date** du paiement
4. Validez

Le statut de la facture se met à jour automatiquement :
- Paiement partiel → **PARTIELLEMENT PAYÉE**
- Paiement total → **PAYÉE**

### 7.5 Suivi des factures échues

Les factures dont la date d'échéance est dépassée et non payées passent automatiquement au statut **ÉCHU**. Elles apparaissent en rouge dans la liste des factures.

---

## 8. Gestion de projets

### 8.1 Créer un projet

1. Projets → + Nouveau projet
2. Renseignez :
   - **Nom** du projet
   - **Client** associé
   - **Contrat** lié (optionnel)
   - **Responsable** de l'équipe
   - **Dates** de début et de livraison prévue
   - **Budget** et **heures estimées**
   - **Priorité**
3. Enregistrez

> Le numéro de projet est généré automatiquement.

### 8.2 Statuts de projet

| Statut | Description |
|---|---|
| **PLANIFICATION** | Projet en préparation, pas encore démarré |
| **EN COURS** | Travaux actifs |
| **EN ATTENTE** | Bloqué (attente client, ressource, etc.) |
| **REVUE** | En cours de vérification |
| **TERMINÉ** | Travaux achevés |
| **LIVRÉ** | Remis officiellement au client |
| **ANNULÉ** | Projet abandonné |

### 8.3 Gérer les tâches

**Créer une tâche :**
1. Depuis la fiche projet, onglet **"Tâches"**
2. Cliquez sur **"+ Ajouter une tâche"**
3. Renseignez : titre, description, responsable, date d'échéance, heures estimées, priorité
4. Enregistrez

**Avancer une tâche :**
- Cliquez sur le statut de la tâche pour le modifier : À FAIRE → EN COURS → REVUE → FAIT

**Saisir les heures :**
1. Ouvrez la tâche
2. Cliquez sur **"Saisir des heures"**
3. Entrez le nombre d'heures effectuées

### 8.4 Gérer les jalons

Les jalons permettent de baliser les étapes importantes d'un projet.

1. Onglet **"Jalons"** → + Nouveau jalon
2. Renseignez : titre, date, description
3. Si le jalon est **facturable**, cochez l'option et saisissez le montant
4. Pour valider un jalon : bouton **"Marquer comme complété"**

### 8.5 Progression automatique

La barre de progression affichée sur la fiche projet est calculée automatiquement :  
`Progression = (nombre de tâches FAIT / total des tâches) × 100`

### 8.6 Partager l'avancement avec le client

1. Depuis la fiche projet, cliquez sur **"Partager avec le client"**
2. Copiez le lien sécurisé généré
3. Envoyez le lien par e-mail ou WhatsApp
4. Le client peut consulter l'avancement en temps réel via ce lien, sans compte

---

## 9. Rendez-vous

### 9.1 Créer un rendez-vous

1. Rendez-vous → + Nouveau rendez-vous
2. Renseignez :
   - **Titre** et **description**
   - **Type** : Découverte, Suivi, Livraison, Support
   - **Client** (optionnel pour les réservations publiques)
   - **Date, heure de début et durée**
   - **Canal de réunion** : Google Meet, Zoom, Présentiel, Téléphone
   - **Lien de réunion** (si Google Meet ou Zoom)
   - **Fuseau horaire**
3. Enregistrez

### 9.2 Gérer l'état d'un rendez-vous

| Statut | Action |
|---|---|
| **EN ATTENTE** | Rendez-vous créé, en attente de confirmation |
| **CONFIRMÉ** | Cliquez sur "Confirmer" |
| **COMPLÉTÉ** | Cliquez sur "Marquer complété" après la réunion |
| **ANNULÉ** | Cliquez sur "Annuler" avec un motif |
| **ABSENT** | Marquez si le client ne s'est pas présenté |

### 9.3 Notes de réunion

Après un rendez-vous complété, cliquez sur **"Ajouter des notes"** pour consigner un compte-rendu. Ces notes sont accessibles depuis la fiche du rendez-vous et depuis la fiche client.

### 9.4 Configurer vos disponibilités

Pour activer la réservation publique :
1. Allez dans **Paramètres → Disponibilités**
2. Pour chaque jour de la semaine, cochez les créneaux disponibles (ex. : Lun–Ven, 9h–17h)
3. Enregistrez

### 9.5 Lien de réservation publique

Une fois vos disponibilités configurées, votre lien de réservation public est accessible dans Paramètres. Partagez ce lien avec vos prospects — ils peuvent choisir un créneau et s'y inscrire sans compte.

### 9.6 Synchronisation Google Calendar

1. Allez dans **Paramètres → Calendrier**
2. Cliquez sur **"Connecter Google Calendar"**
3. Autorisez l'accès sur la page Google
4. Vos rendez-vous Atlas sont désormais synchronisés avec votre Google Calendar

---

## 10. Prospection

Le module Prospection centralise la gestion des leads entrants.

1. Dans **Prospection**, vous retrouvez les contacts qui ont utilisé votre formulaire ou votre lien de réservation sans être encore qualifiés comme clients
2. Vous pouvez convertir un lead en client en cliquant sur **"Convertir en client"**
3. Un deal peut être automatiquement créé lors de la conversion

---

## 11. Analytique

### 11.1 Tableau de bord analytique

Accessible depuis **Analytique** dans le menu. Filtrez les données sur 30, 60 ou 90 jours.

### 11.2 Métriques disponibles

**Revenus :**
- Chiffre d'affaires total (factures payées)
- Montant en attente (factures envoyées, non réglées)
- Évolution mensuelle (graphique linéaire)

**Pipeline CRM :**
- Nombre de deals par étape
- Valeur totale du pipeline
- Taux de conversion (GAGNÉ/total fermés)
- Valeur moyenne des deals gagnés

**Devis :**
- Taux d'acceptation global
- Délai moyen entre envoi et réponse client
- Montant moyen des devis

**Projets :**
- Projets en retard (date de livraison dépassée)
- Taux de livraison dans les délais
- Utilisation des heures (estimées vs réelles)

**Clients :**
- Nouveaux clients sur la période
- Répartition par type (PME, ONG, etc.)
- Source des leads (Référence, WhatsApp, etc.)

### 11.3 Exporter les données

Cliquez sur **"Exporter CSV"** en haut à droite de la page Analytique pour télécharger l'ensemble des KPI au format tableur.

---

## 12. Communication

### 12.1 Envoyer un message

1. Cliquez sur l'icône **"Message"** dans le menu ou depuis une fiche client
2. Choisissez le canal : **E-mail**, **SMS**, ou **WhatsApp**
3. Sélectionnez le(s) destinataire(s)
4. Rédigez votre message
5. Cliquez sur **"Envoyer"**

> **Prérequis :** Les SMS et WhatsApp nécessitent une configuration Twilio active (voir Paramètres → Intégrations).

### 12.2 Historique des messages

L'onglet **"Messages"** dans la fiche client liste tous les messages échangés avec ce contact. L'historique global est accessible depuis **Communication** dans le menu.

### 12.3 Préférences de notification

Chaque utilisateur peut configurer ses préférences dans **Paramètres → Notifications** :
- Activer/désactiver les notifications par **e-mail**
- Activer/désactiver les notifications par **SMS**
- Activer/désactiver les notifications par **WhatsApp**

---

## 13. Paramètres et compte

### 13.1 Profil utilisateur

Accédez à **Paramètres → Mon profil** pour :
- Modifier votre **prénom** et **nom**
- Changer votre **photo de profil** (via URL)
- Modifier votre **numéro de téléphone**
- Définir votre **fuseau horaire** (ex. : Africa/Abidjan, Africa/Dakar)
- Choisir votre **langue préférée**

### 13.2 Changer de mot de passe

1. Paramètres → Sécurité
2. Saisissez votre mot de passe actuel
3. Saisissez et confirmez le nouveau mot de passe
4. Validez

### 13.3 Changer d'adresse e-mail

1. Paramètres → Mon profil → Changer d'e-mail
2. Saisissez la nouvelle adresse
3. Un code OTP à 6 chiffres est envoyé à la nouvelle adresse
4. Saisissez le code pour valider le changement

### 13.4 Gestion de l'équipe (OWNER/ADMIN uniquement)

1. Paramètres → Équipe
2. **Inviter un membre** : saisissez l'e-mail et choisissez le rôle (ADMIN ou MEMBER)
3. **Modifier le rôle** d'un membre existant : cliquez sur son rôle
4. **Retirer un membre** : cliquez sur l'icône de suppression à côté de son nom

### 13.5 Paramètres de l'agence (OWNER uniquement)

1. Paramètres → Agence
2. Modifiez : nom, logo, adresse, numéro de téléphone, site web, taux de TVA par défaut, devise

---

## 14. Portail client

### 14.1 Qu'est-ce que le portail client ?

Le portail client est une interface accessible sans compte, via un lien sécurisé (token UUID). Il permet à vos clients de :
- **Consulter un devis** et l'accepter ou le refuser
- **Lire et signer un contrat** électroniquement
- **Consulter une facture** et initier un paiement Mobile Money
- **Suivre l'avancement** d'un projet

### 14.2 Partager un lien portail

Les liens portail sont générés automatiquement. Pour les récupérer :
- **Devis** : bouton "Copier le lien client" sur la fiche devis
- **Contrat** : bouton "Copier le lien de signature" sur la fiche contrat
- **Facture** : envoyée automatiquement par e-mail lors de l'envoi de la facture
- **Projet** : bouton "Partager avec le client" sur la fiche projet

### 14.3 Expérience côté client (Devis)

Le client reçoit un e-mail contenant un bouton. En cliquant :
1. Il consulte le devis détaillé (articles, montants, conditions)
2. Il clique sur **"Accepter"** ou **"Refuser"**
3. En cas de refus, un champ texte lui permet de motiver sa décision
4. L'agence reçoit une notification immédiate

### 14.4 Expérience côté client (Contrat)

Le client reçoit un e-mail d'invitation à signer :
1. Il lit le contrat intégralement
2. Il saisit son **nom** et son **e-mail** pour confirmer son identité
3. Il clique sur **"Signer le contrat"**
4. Un e-mail de confirmation avec le PDF signé lui est envoyé

### 14.5 Expérience côté client (Facture)

Le client consulte sa facture en ligne :
- Détail des articles
- Montants HT, TVA, TTC
- Date d'échéance
- Statut de paiement
- Bouton de paiement Mobile Money (si FedaPay ou PayDunya est configuré)

---

## 15. Foire aux questions

**Q : Mon client dit ne pas avoir reçu l'e-mail de devis. Que faire ?**  
R : Vérifiez d'abord que l'adresse e-mail du client est correcte dans sa fiche. Demandez-lui de vérifier son dossier Spam. Vous pouvez renvoyer l'e-mail depuis la fiche devis.

**Q : Puis-je modifier un devis après l'avoir envoyé ?**  
R : Oui, tant que le client ne l'a pas encore accepté. Le statut repasse à BROUILLON lors de la modification.

**Q : Comment modifier le taux de TVA d'une facture existante ?**  
R : Seules les factures au statut BROUILLON sont modifiables. Une facture ENVOYÉE ou PAYÉE ne peut pas être modifiée (intégrité comptable).

**Q : Mon client a signé le contrat mais je ne vois pas la mise à jour. Que faire ?**  
R : Rafraîchissez la page. La mise à jour est instantanée mais peut nécessiter un rechargement du navigateur.

**Q : Comment exporter mes factures pour la comptabilité ?**  
R : Depuis **Analytique**, cliquez sur "Exporter CSV" pour obtenir un récapitulatif de toutes les factures et paiements. Les PDF individuels sont téléchargeables depuis chaque fiche facture.

**Q : Puis-je avoir plusieurs pipelines CRM ?**  
R : Oui. Dans Paramètres → Pipeline, vous pouvez créer autant de pipelines que nécessaire (ex. : un pour les projets web, un pour le conseil).

**Q : Les données de mes clients sont-elles partagées avec d'autres agences ?**  
R : Non. Atlas est une plateforme multi-tenant strictement isolée. Chaque agence n'a accès qu'à ses propres données.
