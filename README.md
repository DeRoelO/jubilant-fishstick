# Eisenhower Tasks

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-1B222D?style=for-the-badge&logo=Prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker)](https://www.docker.com/)

A task management application based on the Eisenhower Matrix. The application is designed for categorizing and managing tasks based on urgency and importance.

---

## Preview

![Eisenhower Matrix Preview](./docs/screenshot.png)

---

## Core Features

- **Eisenhower Matrix:** Categorization of tasks into the four standard quadrants (Do, Schedule, Delegate, Ignore).
- **Drag & Drop support:** Drag and drop functionality to move tasks between quadrants seamlessly.
- **Authentication:** Login mechanism utilizing Microsoft Entra ID (MSAL) integration.
- **Data Management:** Data storage facilitated by SQLite in combination with the Prisma ORM.
- **Frontend Stack:** Single-page architecture built with Next.js, styled with Tailwind CSS.

---

## Local Development

Instructions for setting up a local development environment:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Database setup:**
   Verify that the `.env` file is configured correctly, then generate the Prisma clients and database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   The environment will then be available at `http://localhost:3000`.

---

## Deployment (Docker / Portainer)

Instructions for deployment via Portainer to an LXC or other Docker hosting systems:

The repository contains a Next.js `standalone` configuration in the provided Dockerfile.

1. Navigate to **Stacks** > **Add stack** in the Portainer dashboard.
2. Select **Repository** as the *Build method*.
3. Enter this URL into the *Repository URL* field: 
   `https://github.com/DeRoelO/jubilant-fishstick.git` 
4. Configure any necessary *Environment variables* in the interface.
5. Click **Deploy the stack**. 

Upon successful deployment, the stack automatically exposes port `3000` and provisions persistent data storage for the SQLite database at `/prisma_data`.

---
*Maintained by [DeRoelO](https://github.com/DeRoelO)*
