# Eisenhower Tasks App

Een persoonlijke taakmanager gebaseerd op de Eisenhower-matrix. Gebouwd met Next.js, Tailwind CSS, Zustand en Prisma (SQLite).

---

## Lokale ontwikkeling

```bash
npm install
npm run dev
```

De app is dan bereikbaar via **http://localhost:3000**.

---

## Docker (aanbevolen voor productie / server)

### Vereisten
- Docker Desktop of Docker + Docker Compose op je server (LXC/VPS/etc.)
- De map `prisma_data/` moet aanwezig zijn in de projectroot (voor SQLite persistentie)

### Starten

```bash
docker compose up --build -d
```

De app is dan bereikbaar via **http://localhost:3005** (of via je domein als je een reverse proxy gebruikt).

### Stoppen

```bash
docker compose down
```

> **Poorten:** De container draait intern op poort `3000` en wordt extern beschikbaar gesteld op poort `3005` (via de `3005:3000` mapping in `docker-compose.yml`).
> `npm run dev` gebruikt altijd poort `3000` en staat **los van Docker**.

---

## Data persistentie

De SQLite-database staat in `prisma_data/dev.db`. Deze map wordt als volume gemount in de container, zodat data bewaard blijft bij het opnieuw bouwen of herstarten van de container.

Het bestand `prisma_data/dev.db` staat **niet** in `.gitignore` zodat je de database kunt meenemen bij een deployment, maar commit hem nooit naar een publieke repo.

---

## Omgevingsvariabelen

Kopieer `.env.example` naar `.env` en vul de juiste waarden in voor Microsoft Entra ID (Azure AD) authenticatie:

```bash
cp .env.example .env
```

```
NEXT_PUBLIC_CLIENT_ID=your_azure_app_client_id
NEXT_PUBLIC_TENANT_ID=common
```

---

## Deployment op een server

1. Kopieer de projectmap naar je server (LXC/VPS)
2. Zorg dat `prisma_data/` bestaat: `mkdir -p prisma_data`
3. Eventueel bestaande database kopiëren: `cp /pad/naar/backup.db prisma_data/dev.db`
4. Start de container: `docker compose up --build -d`
5. Koppel poort 3005 aan je domein via een reverse proxy (bijv. Nginx of Caddy)

---

## Tech stack

| Onderdeel | Technologie |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Database | Prisma + SQLite |
| Auth | Microsoft MSAL (Entra ID) |
| Container | Docker + Docker Compose |
