# AI Tools Platform (Complete)

## Stack
- Backend: Express + Apollo GraphQL + Prisma (PostgreSQL) + JWT + CORS + Upload
- Frontend: Next.js 14 App Router + SSR
- Docker Compose: Postgres + Backend + Frontend

## Quick Start (Docker)
```bash
docker-compose up -d --build
```
- Frontend: http://localhost:3000
- GraphQL:  http://localhost:4000/graphql

> 首次进入 backend 容器执行 seed：
```bash
docker compose exec backend npm run seed
```

## Local Dev
```bash
# Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev

# Frontend
cd ../frontend
cp .env.example .env.local
npm install
npm run dev
```
登录账号（seed）: `admin@example.com` / `admin123`
