# CONTEXT — Historial del proyecto

## ¿Qué es este proyecto?
Reto Banorte de HackMTY 2026. Construir agentes de IA que generan interfaces 
en tiempo real usando MCP (Model Context Protocol) en servicios financieros.

## Equipo
- 2 TI (frontend/diseño y backend)
- 2 DevOps (infraestructura y agente de IA)

## Decisiones tomadas

- **Lenguaje:** JavaScript (no TypeScript)
- **Framework:** Next.js 16 App Router — frontend + backend en uno
- **Gestor de paquetes:** pnpm
- **UI:** Tailwind CSS + shadcn/ui con tema Nova
- **Diseño:** Google Stitch para mockups → v0.dev para generar código
- **Animaciones:** Framer Motion
- **Gráficas:** Recharts
- **IA en la app:** Vercel AI SDK 7
- **Protocolo del reto:** MCP (@modelcontextprotocol/sdk)
- **Modelo principal:** Gemini 2.5 Flash (gratis)
- **Modelo fallback:** Groq (gratis, por si Gemini falla)
- **Vibecoding:** Claude Pro + Gemini Pro
- **Base de datos:** Supabase
- **Deploy:** Vercel (plan Hobby, gratis)
- **Backend separado:** No — todo vive dentro de Next.js en app/api/

## Lo que ya está hecho

- [x] Proyecto Next.js creado con todo el stack instalado
- [x] shadcn/ui configurado con tema Nova
- [x] Repo en GitHub (privado)
- [x] Deploy en Vercel funcionando
- [x] Variables de entorno configuradas (Gemini + Groq)
- [x] CLAUDE.md con reglas para la IA
- [x] API route del chat en app/api/chat/route.js
- [x] Página principal con chat básico (page.tsx)

## Lo que falta

- [ ] MCP server con tools financieras
- [ ] Conectar Supabase y definir esquema de base de datos
- [ ] Generative UI — renderizar componentes desde el agente
- [ ] Diseño visual con identidad de Banorte
- [ ] Integrar datos financieros reales o sintéticos
- [ ] Deploy final y pruebas end-to-end

## Notas importantes

- El `.env.local` nunca se sube a GitHub
- shadcn ya está configurado — no correr `pnpm dlx shadcn@latest init` de nuevo
- Vercel lee las env vars desde su dashboard, no desde el repo
- El equipo usa pnpm siempre, nunca npm directamente