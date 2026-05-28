# Manuel de Déploiement — Atlas CRM

**Version :** 1.0  
**Date :** Mai 2026  
**Public cible :** Administrateurs système, DevOps  

---

## Table des matières

1. [Prérequis](#1-prérequis)
2. [Architecture de déploiement](#2-architecture-de-déploiement)
3. [Configuration de la base de données](#3-configuration-de-la-base-de-données)
4. [Configuration de Redis](#4-configuration-de-redis)
5. [Déploiement du backend (Spring Boot)](#5-déploiement-du-backend-spring-boot)
6. [Déploiement du frontend (Next.js)](#6-déploiement-du-frontend-nextjs)
7. [Configuration des variables d'environnement](#7-configuration-des-variables-denvironnement)
8. [Configuration du serveur e-mail (SMTP)](#8-configuration-du-serveur-e-mail-smtp)
9. [Configuration des paiements Mobile Money](#9-configuration-des-paiements-mobile-money)
10. [Configuration Twilio (SMS / WhatsApp)](#10-configuration-twilio-sms--whatsapp)
11. [Configuration Google Calendar](#11-configuration-google-calendar)
12. [Configuration du reverse proxy (Nginx)](#12-configuration-du-reverse-proxy-nginx)
13. [Déploiement avec Docker Compose](#13-déploiement-avec-docker-compose)
14. [Déploiement sur VPS cloud (Guide pas-à-pas)](#14-déploiement-sur-vps-cloud-guide-pas-à-pas)
15. [Initialisation de la base de données](#15-initialisation-de-la-base-de-données)
16. [Vérifications post-déploiement](#16-vérifications-post-déploiement)
17. [Sauvegardes](#17-sauvegardes)
18. [Mise à jour de l'application](#18-mise-à-jour-de-lapplication)
19. [Surveillance et logs](#19-surveillance-et-logs)
20. [Résolution des problèmes courants](#20-résolution-des-problèmes-courants)

---

## 1. Prérequis

### 1.1 Logiciels requis

| Composant | Version minimale | Notes |
|---|---|---|
| **Java (JDK)** | 21 | OpenJDK ou Oracle JDK |
| **Node.js** | 20 LTS | Requis pour le build frontend |
| **npm** | 9+ | Livré avec Node.js |
| **PostgreSQL** | 15 | Base de données principale |
| **Redis** | 7 | Cache et rate limiting |
| **Maven** | 3.9+ | Ou utiliser le wrapper `./mvnw` inclus |
| **Nginx** | 1.24+ | Reverse proxy (recommandé) |
| **Git** | 2.x | Pour récupérer les sources |

### 1.2 Ressources serveur recommandées (production)

| Ressource | Minimum | Recommandé |
|---|---|---|
| **CPU** | 2 vCPU | 4 vCPU |
| **RAM** | 4 Go | 8 Go |
| **Disque** | 20 Go SSD | 50 Go SSD |
| **OS** | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

### 1.3 Ports nécessaires

| Port | Service | Direction |
|---|---|---|
| **80** | Nginx (HTTP) | Entrant |
| **443** | Nginx (HTTPS) | Entrant |
| **8081** | Backend Spring Boot | Interne |
| **3000** | Frontend Next.js | Interne |
| **5432** | PostgreSQL | Interne |
| **6379** | Redis | Interne |

> En production, seuls les ports 80 et 443 doivent être accessibles depuis Internet. Les autres doivent être restreints au réseau interne.

---

## 2. Architecture de déploiement

```
Internet
    │
    ▼
┌──────────┐
│  Nginx   │  ← Reverse proxy + SSL/TLS (Let's Encrypt)
│  :443    │
└─────┬────┘
      │
      ├──────────────────────┐
      ▼                      ▼
┌──────────────┐    ┌──────────────────┐
│   Frontend   │    │     Backend      │
│  Next.js     │    │  Spring Boot     │
│  :3000       │    │  :8081           │
└──────────────┘    └────────┬─────────┘
                             │
                ┌────────────┼──────────────┐
                ▼            ▼              ▼
          ┌──────────┐ ┌──────────┐  ┌──────────┐
          │PostgreSQL│ │  Redis   │  │   SMTP   │
          │  :5432   │ │  :6379   │  │  Gmail   │
          └──────────┘ └──────────┘  └──────────┘
```

**Recommandation :** Utiliser Docker Compose pour un déploiement simplifié (voir section 13).

---

## 3. Configuration de la base de données

### 3.1 Installer PostgreSQL

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### 3.2 Créer la base de données et l'utilisateur

```bash
sudo -u postgres psql
```

Dans le shell PostgreSQL :

```sql
CREATE USER atlas_user WITH PASSWORD 'VotreMotDePasseSecurise';
CREATE DATABASE atlas_db OWNER atlas_user;
GRANT ALL PRIVILEGES ON DATABASE atlas_db TO atlas_user;
\q
```

### 3.3 Configurer l'accès (optionnel — si serveur distant)

Éditez `/etc/postgresql/15/main/pg_hba.conf` pour autoriser les connexions depuis l'IP du backend :

```
host    atlas_db    atlas_user    127.0.0.1/32    scram-sha-256
```

Redémarrez PostgreSQL :

```bash
sudo systemctl restart postgresql
```

---

## 4. Configuration de Redis

### 4.1 Installer Redis

```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### 4.2 Sécuriser Redis (production)

Éditez `/etc/redis/redis.conf` :

```conf
# Lier uniquement en local
bind 127.0.0.1

# Définir un mot de passe
requirepass VotreMotDePasseRedis

# Désactiver les commandes dangereuses
rename-command FLUSHALL ""
rename-command FLUSHDB ""
rename-command CONFIG ""
```

Redémarrez Redis :

```bash
sudo systemctl restart redis-server
```

---

## 5. Déploiement du backend (Spring Boot)

### 5.1 Récupérer les sources

```bash
cd /opt
git clone https://github.com/votre-org/atlas.git
cd atlas/backend
```

### 5.2 Créer le fichier de configuration de production

Créez `/opt/atlas/backend/src/main/resources/application-prod.properties` :

```properties
# Serveur
server.port=8081
spring.profiles.active=prod

# Base de données
spring.datasource.url=jdbc:postgresql://localhost:5432/atlas_db
spring.datasource.username=atlas_user
spring.datasource.password=${DB_PASSWORD}
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# Redis
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.data.redis.password=${REDIS_PASSWORD}

# JWT
jwt.secret=${JWT_SECRET}
jwt.expiration=5400000
jwt.refreshExpiration=604800000

# E-mail
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
application.mail.from=${MAIL_FROM}

# CORS
cors.allowed-origins=https://app.votredomaine.com

# URL de l'application
application.base-url=https://api.votredomaine.com
application.frontend-url=https://app.votredomaine.com

# CRM Scheduler
crm.inactivity-threshold-hours=48
crm.max-reminders=3

# Paiements
payment.fedapay.api-key=${FEDAPAY_API_KEY}
payment.fedapay.webhook-secret=${FEDAPAY_WEBHOOK_SECRET}
payment.paydunya.master-key=${PAYDUNYA_MASTER_KEY}
payment.paydunya.public-key=${PAYDUNYA_PUBLIC_KEY}
payment.paydunya.private-key=${PAYDUNYA_PRIVATE_KEY}
payment.paydunya.token=${PAYDUNYA_TOKEN}

# Twilio
twilio.account-sid=${TWILIO_ACCOUNT_SID}
twilio.auth-token=${TWILIO_AUTH_TOKEN}
twilio.phone-number=${TWILIO_PHONE_NUMBER}
twilio.whatsapp-number=${TWILIO_WHATSAPP_NUMBER}

# Google Calendar
google.calendar.client-id=${GOOGLE_CALENDAR_CLIENT_ID}
google.calendar.client-secret=${GOOGLE_CALENDAR_CLIENT_SECRET}
google.calendar.redirect-uri=https://api.votredomaine.com/api/calendar/oauth/callback

# Logs
logging.level.root=WARN
logging.level.com.atlas=INFO
logging.file.name=/var/log/atlas/backend.log
```

### 5.3 Builder l'application

```bash
cd /opt/atlas/backend
./mvnw clean package -DskipTests -P prod
```

Le fichier JAR est généré dans `target/backend-*.jar`.

### 5.4 Créer un service systemd

```bash
sudo nano /etc/systemd/system/atlas-backend.service
```

```ini
[Unit]
Description=Atlas CRM Backend
After=network.target postgresql.service redis.service
Requires=postgresql.service redis.service

[Service]
Type=simple
User=atlas
WorkingDirectory=/opt/atlas/backend
ExecStart=/usr/bin/java -jar -Dspring.profiles.active=prod /opt/atlas/backend/target/backend-*.jar
EnvironmentFile=/opt/atlas/.env
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=atlas-backend

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable atlas-backend
sudo systemctl start atlas-backend
```

---

## 6. Déploiement du frontend (Next.js)

### 6.1 Installer Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 6.2 Créer le fichier d'environnement frontend

```bash
nano /opt/atlas/frontend/.env.production
```

```env
NEXT_PUBLIC_API_URL=https://api.votredomaine.com
NEXT_PUBLIC_APP_NAME=Atlas CRM
```

### 6.3 Builder et démarrer le frontend

```bash
cd /opt/atlas/frontend
npm install
npm run build
```

### 6.4 Créer un service systemd pour le frontend

```bash
sudo nano /etc/systemd/system/atlas-frontend.service
```

```ini
[Unit]
Description=Atlas CRM Frontend
After=network.target

[Service]
Type=simple
User=atlas
WorkingDirectory=/opt/atlas/frontend
ExecStart=/usr/bin/npm start
Environment=PORT=3000
Environment=NODE_ENV=production
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable atlas-frontend
sudo systemctl start atlas-frontend
```

---

## 7. Configuration des variables d'environnement

### 7.1 Créer le fichier `.env` principal

```bash
nano /opt/atlas/.env
```

```env
# Base de données
DB_PASSWORD=VotreMotDePassePostgresSecurise

# Redis
REDIS_PASSWORD=VotreMotDePasseRedisSecurise

# JWT — Générer avec : openssl rand -base64 64
JWT_SECRET=votre_cle_jwt_base64_encodee_256_bits_minimum

# E-mail
MAIL_USERNAME=votre-email@gmail.com
MAIL_PASSWORD=votre_app_password_gmail
MAIL_FROM=no-reply@votredomaine.com

# FedaPay
FEDAPAY_API_KEY=sk_live_XXXXXXXXXXXXXXXX
FEDAPAY_WEBHOOK_SECRET=webhook_secret_XXXXXXXX

# PayDunya
PAYDUNYA_MASTER_KEY=XXXXXXXXXXXXXXXXXXXX
PAYDUNYA_PUBLIC_KEY=XXXXXXXXXXXXXXXXXXXX
PAYDUNYA_PRIVATE_KEY=XXXXXXXXXXXXXXXXXXXX
PAYDUNYA_TOKEN=XXXXXXXXXXXXXXXXXXXX

# Twilio
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Google Calendar
GOOGLE_CALENDAR_CLIENT_ID=XXXXXXXXXX.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=XXXXXXXXXXXXXXXXXXXX
```

> **Sécurité :** Restreignez les permissions de ce fichier :
> ```bash
> chmod 600 /opt/atlas/.env
> chown atlas:atlas /opt/atlas/.env
> ```

### 7.2 Générer la clé JWT secrète

```bash
openssl rand -base64 64
```

Copiez la sortie dans la variable `JWT_SECRET`.

---

## 8. Configuration du serveur e-mail (SMTP)

### 8.1 Avec Gmail (option recommandée pour démarrer)

1. Activez la **validation en 2 étapes** sur votre compte Google
2. Allez dans **Compte Google → Sécurité → Mots de passe des applications**
3. Créez un mot de passe d'application pour "Mail" / "Linux"
4. Utilisez ce mot de passe dans `MAIL_PASSWORD`

> **Note :** Gmail est limité à ~500 e-mails/jour. Pour un volume supérieur, utilisez SendGrid, Mailgun ou Amazon SES.

### 8.2 Avec un SMTP personnalisé

Modifiez dans `application-prod.properties` :

```properties
spring.mail.host=smtp.votredomaine.com
spring.mail.port=587
spring.mail.username=noreply@votredomaine.com
spring.mail.password=${MAIL_PASSWORD}
```

---

## 9. Configuration des paiements Mobile Money

### 9.1 FedaPay

1. Créez un compte sur [fedapay.com](https://fedapay.com)
2. Dans le tableau de bord FedaPay : **API → Clés API**
3. Récupérez la clé **Live Secret Key** (`sk_live_...`)
4. Configurez le webhook : **Webhooks → Créer un webhook**
   - URL : `https://api.votredomaine.com/api/webhooks/payment/fedapay`
   - Secret : notez la valeur affichée
5. Renseignez `FEDAPAY_API_KEY` et `FEDAPAY_WEBHOOK_SECRET`

### 9.2 PayDunya

1. Créez un compte sur [paydunya.com](https://paydunya.com)
2. Dans le tableau de bord : **API → Clés d'accès**
3. Récupérez : Master Key, Public Key, Private Key, Token (mode Live)
4. Configurez le webhook IPN : URL = `https://api.votredomaine.com/api/webhooks/payment/paydunya`
5. Renseignez les variables `PAYDUNYA_*`

---

## 10. Configuration Twilio (SMS / WhatsApp)

### 10.1 Créer un compte Twilio

1. Inscrivez-vous sur [twilio.com](https://twilio.com)
2. Dans la Console Twilio : récupérez **Account SID** et **Auth Token**
3. Achetez un numéro de téléphone virtuel

### 10.2 Activer WhatsApp Sandbox (développement)

Pour tester WhatsApp sans approbation Meta :
1. Dans la Console Twilio : **Messaging → Try it out → Send a WhatsApp message**
2. Configurez le Sandbox
3. Utilisez `whatsapp:+14155238886` comme numéro WhatsApp

### 10.3 Passer en production WhatsApp

Soumettez votre compte à l'approbation Meta Business via la Console Twilio. Ce processus peut prendre 2 à 5 jours ouvrables.

---

## 11. Configuration Google Calendar

### 11.1 Créer les identifiants OAuth2

1. Allez sur [console.cloud.google.com](https://console.cloud.google.com)
2. Créez un nouveau projet ou sélectionnez-en un existant
3. Activez l'API **Google Calendar API**
4. Allez dans **APIs & Services → Identifiants → Créer des identifiants → ID client OAuth**
5. Type : **Application Web**
6. Origines autorisées : `https://api.votredomaine.com`
7. URI de redirection : `https://api.votredomaine.com/api/calendar/oauth/callback`
8. Téléchargez les identifiants JSON
9. Copiez `client_id` et `client_secret` dans les variables d'environnement

---

## 12. Configuration du reverse proxy (Nginx)

### 12.1 Installer Nginx et Certbot

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 12.2 Fichier de configuration Nginx

```bash
sudo nano /etc/nginx/sites-available/atlas
```

```nginx
# Frontend (app.votredomaine.com)
server {
    listen 80;
    server_name app.votredomaine.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.votredomaine.com;

    ssl_certificate /etc/letsencrypt/live/app.votredomaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.votredomaine.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API (api.votredomaine.com)
server {
    listen 80;
    server_name api.votredomaine.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.votredomaine.com;

    ssl_certificate /etc/letsencrypt/live/api.votredomaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.votredomaine.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 10s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/atlas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 12.3 Obtenir les certificats SSL

```bash
sudo certbot --nginx -d app.votredomaine.com -d api.votredomaine.com
```

Certbot configure automatiquement le renouvellement automatique (cron).

---

## 13. Déploiement avec Docker Compose

Pour un déploiement simplifié et reproductible, utilisez Docker Compose.

### 13.1 Prérequis Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo apt install -y docker-compose-plugin
sudo usermod -aG docker $USER
```

### 13.2 Fichier `docker-compose.yml`

Créez `/opt/atlas/docker-compose.yml` :

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    container_name: atlas-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: atlas_db
      POSTGRES_USER: atlas_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - atlas-network

  redis:
    image: redis:7-alpine
    container_name: atlas-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - atlas-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: atlas-backend
    restart: unless-stopped
    ports:
      - "8081:8081"
    env_file:
      - .env
    environment:
      SPRING_PROFILES_ACTIVE: prod
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/atlas_db
      SPRING_DATASOURCE_USERNAME: atlas_user
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      SPRING_DATA_REDIS_HOST: redis
      SPRING_DATA_REDIS_PASSWORD: ${REDIS_PASSWORD}
    depends_on:
      - postgres
      - redis
    networks:
      - atlas-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: atlas-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: https://api.votredomaine.com
    networks:
      - atlas-network

volumes:
  postgres_data:
  redis_data:

networks:
  atlas-network:
    driver: bridge
```

### 13.3 Dockerfile backend

Créez `/opt/atlas/backend/Dockerfile` :

```dockerfile
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline -q
COPY src ./src
RUN ./mvnw clean package -DskipTests -q

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S atlas && adduser -S atlas -G atlas
COPY --from=builder /app/target/*.jar app.jar
RUN chown atlas:atlas app.jar
USER atlas
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 13.4 Dockerfile frontend

Créez `/opt/atlas/frontend/Dockerfile` :

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --quiet
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN addgroup -S atlas && adduser -S atlas -G atlas
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
RUN chown -R atlas:atlas /app
USER atlas
EXPOSE 3000
CMD ["node", "server.js"]
```

> Pour le Dockerfile frontend, activez l'output standalone dans `next.config.js` :
> ```js
> module.exports = { output: 'standalone' }
> ```

### 13.5 Lancer avec Docker Compose

```bash
cd /opt/atlas
docker compose up -d
docker compose logs -f
```

---

## 14. Déploiement sur VPS cloud (Guide pas-à-pas)

Ce guide suppose Ubuntu 22.04 LTS sur un VPS (DigitalOcean, Hetzner, OVH, etc.).

### Étape 1 — Préparer le serveur

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Créer un utilisateur dédié
sudo adduser atlas
sudo usermod -aG sudo atlas

# Configurer le pare-feu
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Désactiver la connexion root SSH (optionnel mais recommandé)
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

### Étape 2 — Installer les dépendances

```bash
# Java 21
sudo apt install -y wget apt-transport-https
wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | sudo apt-key add -
echo "deb https://packages.adoptium.net/artifactory/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/adoptium.list
sudo apt update && sudo apt install -y temurin-21-jdk

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL, Redis, Nginx
sudo apt install -y postgresql-15 redis-server nginx

# Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### Étape 3 — Cloner et configurer l'application

```bash
sudo mkdir -p /opt/atlas
sudo chown atlas:atlas /opt/atlas
su - atlas

cd /opt/atlas
git clone https://github.com/votre-org/atlas.git .

# Créer le fichier .env (voir section 7)
nano .env
```

### Étape 4 — Configurer la base de données

```bash
sudo -u postgres psql -c "CREATE USER atlas_user WITH PASSWORD 'MOT_DE_PASSE';"
sudo -u postgres psql -c "CREATE DATABASE atlas_db OWNER atlas_user;"
```

### Étape 5 — Builder et déployer

```bash
# Backend
cd /opt/atlas/backend
./mvnw clean package -DskipTests

# Frontend
cd /opt/atlas/frontend
npm install && npm run build
```

### Étape 6 — Créer les services systemd

Suivez les sections 5.4 et 6.4 de ce manuel.

### Étape 7 — Configurer Nginx et SSL

```bash
# Pointer votre domaine vers l'IP du VPS dans votre DNS d'abord
# Puis :
sudo certbot --nginx -d app.votredomaine.com -d api.votredomaine.com
```

### Étape 8 — Initialiser la base de données

```bash
sudo -u postgres psql atlas_db
```

```sql
-- Insérer les rôles par défaut (une seule fois)
INSERT INTO role (role_name, description) VALUES
  ('SUPER_ADMIN', 'Administrateur plateforme'),
  ('OWNER', 'Propriétaire agence'),
  ('ADMIN', 'Administrateur agence'),
  ('MEMBER', 'Membre agence'),
  ('CLIENT', 'Accès portail client')
ON CONFLICT DO NOTHING;
```

---

## 15. Initialisation de la base de données

### 15.1 Migration automatique

Lors du premier démarrage, Spring Boot crée automatiquement toutes les tables via `spring.jpa.hibernate.ddl-auto=update`. Aucune migration manuelle n'est nécessaire.

### 15.2 Données initiales obligatoires

Après le premier démarrage du backend, injectez les rôles système :

```bash
sudo -u postgres psql atlas_db
```

```sql
INSERT INTO role (role_name, description) VALUES
  ('SUPER_ADMIN', 'Administrateur plateforme'),
  ('OWNER', 'Propriétaire agence'),
  ('ADMIN', 'Administrateur agence'),
  ('MEMBER', 'Membre agence'),
  ('CLIENT', 'Accès portail client')
ON CONFLICT DO NOTHING;
```

### 15.3 Créer le premier Super Admin

```sql
-- Après avoir créé un compte via /api/auth/register
-- Attribuer le rôle SUPER_ADMIN :
INSERT INTO user_roles (user_id, roles_id)
SELECT u.id, r.id
FROM _user u, role r
WHERE u.email = 'admin@votredomaine.com'
  AND r.role_name = 'SUPER_ADMIN';
```

---

## 16. Vérifications post-déploiement

### 16.1 Checklist de vérification

```bash
# 1. Backend répond correctement
curl https://api.votredomaine.com/actuator/health

# 2. Frontend accessible
curl -I https://app.votredomaine.com

# 3. Base de données connectée
sudo -u postgres psql atlas_db -c "SELECT COUNT(*) FROM role;"

# 4. Redis fonctionnel
redis-cli -a VotreMotDePasseRedis ping
# Réponse attendue : PONG

# 5. Swagger UI accessible
curl -I https://api.votredomaine.com/swagger-ui.html

# 6. Logs backend sans erreurs critiques
sudo journalctl -u atlas-backend -n 50 --no-pager
```

### 16.2 Test de l'inscription

1. Ouvrez `https://app.votredomaine.com`
2. Créez un compte test
3. Vérifiez la réception de l'e-mail de confirmation
4. Activez le compte et connectez-vous
5. Vérifiez que le tableau de bord se charge

### 16.3 Test des webhooks de paiement

Utilisez les outils de test fournis par FedaPay et PayDunya dans leur tableau de bord pour envoyer un webhook de test et vérifier que le backend répond avec un statut 200.

---

## 17. Sauvegardes

### 17.1 Sauvegarde automatique de PostgreSQL

Créez le script de sauvegarde :

```bash
sudo nano /opt/atlas/scripts/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/atlas/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

# Sauvegarde PostgreSQL
PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h localhost \
    -U atlas_user \
    atlas_db \
    | gzip > "$BACKUP_DIR/atlas_db_$DATE.sql.gz"

# Conserver seulement les 30 dernières sauvegardes
ls -t "$BACKUP_DIR"/*.sql.gz | tail -n +31 | xargs rm -f

echo "Backup completed: atlas_db_$DATE.sql.gz"
```

```bash
chmod +x /opt/atlas/scripts/backup.sh
```

Automatisez avec cron :

```bash
sudo crontab -e
```

```cron
# Sauvegarde quotidienne à 2h du matin
0 2 * * * /opt/atlas/scripts/backup.sh >> /var/log/atlas/backup.log 2>&1
```

### 17.2 Restauration d'une sauvegarde

```bash
# Restaurer depuis une sauvegarde
gunzip -c /opt/atlas/backups/atlas_db_YYYYMMDD_HHMMSS.sql.gz \
    | PGPASSWORD="$DB_PASSWORD" psql -h localhost -U atlas_user atlas_db
```

---

## 18. Mise à jour de l'application

### 18.1 Procédure de mise à jour

```bash
cd /opt/atlas

# 1. Récupérer les nouvelles sources
git pull origin main

# 2. Mettre à jour le backend
cd backend
./mvnw clean package -DskipTests
sudo systemctl restart atlas-backend

# 3. Mettre à jour le frontend
cd ../frontend
npm install
npm run build
sudo systemctl restart atlas-frontend

# 4. Vérifier les logs
sudo journalctl -u atlas-backend -n 20 --no-pager
sudo journalctl -u atlas-frontend -n 20 --no-pager
```

### 18.2 Mise à jour avec Docker Compose

```bash
cd /opt/atlas

# Récupérer les sources
git pull origin main

# Reconstruire et redémarrer
docker compose down
docker compose build --no-cache
docker compose up -d

# Vérifier
docker compose logs -f
```

### 18.3 Rollback

```bash
# Revenir à la version précédente
git log --oneline -5       # Identifier le commit précédent
git checkout <commit-hash>

# Rebuilder
cd backend && ./mvnw clean package -DskipTests
sudo systemctl restart atlas-backend

cd ../frontend && npm install && npm run build
sudo systemctl restart atlas-frontend
```

---

## 19. Surveillance et logs

### 19.1 Consulter les logs

```bash
# Logs backend en temps réel
sudo journalctl -u atlas-backend -f

# Logs frontend en temps réel
sudo journalctl -u atlas-frontend -f

# Logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

### 19.2 Niveau de logs configurables

Dans `application-prod.properties`, ajustez le niveau de log selon les besoins :

```properties
# Production normale
logging.level.com.atlas=INFO

# Debug temporaire
logging.level.com.atlas=DEBUG
logging.level.org.springframework.security=DEBUG
```

### 19.3 Surveiller l'utilisation des ressources

```bash
# Utilisation CPU et mémoire
htop

# Espace disque
df -h

# Connexions PostgreSQL actives
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Clés Redis
redis-cli -a VotreMotDePasseRedis info keyspace
```

### 19.4 Alertes (optionnel)

Pour une surveillance avancée, installez Prometheus + Grafana ou configurez des alertes UptimeRobot sur :
- `https://api.votredomaine.com/actuator/health`
- `https://app.votredomaine.com`

---

## 20. Résolution des problèmes courants

### Problème : Le backend ne démarre pas

```bash
# Consulter les logs détaillés
sudo journalctl -u atlas-backend -n 100 --no-pager | grep ERROR

# Vérifications courantes :
# 1. Java 21 installé ?
java -version

# 2. PostgreSQL accessible ?
PGPASSWORD=MotDePasse psql -h localhost -U atlas_user atlas_db -c "SELECT 1"

# 3. Redis accessible ?
redis-cli -a MotDePasse ping

# 4. Variables d'environnement chargées ?
sudo systemctl cat atlas-backend | grep EnvironmentFile
```

### Problème : Le frontend ne se connecte pas à l'API

```bash
# Vérifier la variable d'environnement
cat /opt/atlas/frontend/.env.production

# Tester la connexion directe à l'API
curl https://api.votredomaine.com/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'

# Vérifier CORS dans les logs backend
sudo journalctl -u atlas-backend | grep CORS
```

### Problème : Les e-mails ne sont pas envoyés

```bash
# Vérifier les logs SMTP
sudo journalctl -u atlas-backend | grep -i "mail\|smtp\|email"

# Tester la connexion SMTP manuellement
curl -v --ssl-reqd \
  --url 'smtps://smtp.gmail.com:465' \
  --user 'votre@gmail.com:app_password'
```

### Problème : Erreur SSL/TLS

```bash
# Vérifier les certificats
sudo certbot certificates

# Renouveler manuellement
sudo certbot renew --force-renewal

# Vérifier la configuration Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Problème : Base de données saturée

```bash
# Vérifier la taille des tables
sudo -u postgres psql atlas_db -c "
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;"

# Vacuum et analyse
sudo -u postgres psql atlas_db -c "VACUUM ANALYZE;"
```

### Problème : Erreur de mémoire insuffisante sur le backend Java

Ajoutez les options JVM dans le fichier systemd :

```ini
ExecStart=/usr/bin/java \
  -Xms512m \
  -Xmx2g \
  -XX:+UseG1GC \
  -jar /opt/atlas/backend/target/backend-*.jar
```

```bash
sudo systemctl daemon-reload
sudo systemctl restart atlas-backend
```

---

## Annexe A — Récapitulatif des commandes essentielles

```bash
# Démarrer les services
sudo systemctl start atlas-backend atlas-frontend

# Arrêter les services
sudo systemctl stop atlas-backend atlas-frontend

# Redémarrer les services
sudo systemctl restart atlas-backend atlas-frontend

# Statut des services
sudo systemctl status atlas-backend atlas-frontend

# Logs en temps réel
sudo journalctl -u atlas-backend -f
sudo journalctl -u atlas-frontend -f

# Sauvegarde manuelle
/opt/atlas/scripts/backup.sh

# Accès base de données
sudo -u postgres psql atlas_db
```

## Annexe B — Ports et URLs de référence

| Service | URL / Port | Notes |
|---|---|---|
| Frontend | `https://app.votredomaine.com` | Interface principale |
| Backend API | `https://api.votredomaine.com` | API REST |
| Swagger UI | `https://api.votredomaine.com/swagger-ui.html` | Documentation API |
| Portails client | `https://app.votredomaine.com/portal/...` | Accès client sans compte |
| Health Check | `https://api.votredomaine.com/actuator/health` | Surveillance |
| PostgreSQL | `localhost:5432` | Base de données (interne) |
| Redis | `localhost:6379` | Cache (interne) |
