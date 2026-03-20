# Eisenhower Tasks

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-1B222D?style=for-the-badge&logo=Prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker)](https://www.docker.com/)

Applicatie voor task management gebaseerd op de Eisenhower Matrix. De applicatie is bedoeld voor het categoriseren en beheren van taken op basis van urgentie en belangrijkheid.

---

## Preview

![Eisenhower Matrix Preview](./docs/screenshot.png)

---

## Kernfuncties

- **Eisenhower Matrix:** Categorisatie van taken in de vier standaard kwadranten (Do, Schedule, Delegate, Ignore).
- **Drag & Drop support:** Mogelijkheid om taken tussen kwadranten te verplaatsen.
- **Authenticatie:** Inlogmechanisme via Microsoft Entra ID (MSAL) integratie.
- **Databeheer:** Data-opslag gefaciliteerd door SQLite in combinatie met de Prisma ORM.
- **Frontend Stack:** Single-page structuur gebouwd met Next.js, gestyled met Tailwind CSS.

---

## Lokale Development

Instructies voor het inrichten van een werkomgeving:

1. **Afhankelijkheden installeren:**
   ```bash
   npm install
   ```

2. **Database instellen:**
   Controleer of het `.env` bestand correct is geconfigureerd en genereer de Prisma clients en database.
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Development server starten:**
   ```bash
   npm run dev
   ```
   De omgeving is hierna beschikbaar op `http://localhost:3000`.

---

## Deployment (Docker / Portainer)

Instructies voor uitrol via Portainer richting een LXC of ander Docker-hostingssysteem:

De repository bevat een Next.js `standalone` configuratie in de bijgevoegde Dockerfile.

1. Navigeer in het Portainer dashboard naar **Stacks** > **Add stack**.
2. Selecteer **Repository** als *Build method*.
3. Vul deze URL in bij de *Repository URL*: 
   `https://github.com/DeRoelO/jubilant-fishstick.git` 
4. Stel eventuele noodzakelijke *Environment variables* vast.
5. Klik ten slotte op **Deploy the stack**. 

Bij een succesvolle deploy regelt de stack een automatische externe koppeling van poort `3000` en wordt er een persisterende data storage gereserveerd voor de SQLite database onder `/prisma_data`.

---
*Beheerd door [DeRoelO](https://github.com/DeRoelO)*
