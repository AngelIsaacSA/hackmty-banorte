@AGENTS.md

# Contexto del proyecto

Este es el proyecto del equipo "Memorias Rotas" para el reto Banorte de HackMTY 2026.
El reto consiste en construir agentes de IA que generan interfaces en tiempo real usando MCP.

## Stack

- Next.js 16 (App Router) — JavaScript, NO TypeScript en archivos nuevos
- Tailwind CSS + shadcn/ui (tema Nova)
- Vercel AI SDK 7
- MCP (@modelcontextprotocol/sdk)
- Gemini 2.5 Flash (modelo principal) + Groq (fallback)
- Supabase (base de datos)
- Vercel (deploy)
- pnpm como gestor de paquetes — nunca usar npm

## Reglas

- Nunca modificar ni consultar la base de datos de Supabase directamente
- Solo conocer el esquema de la base de datos, no ejecutar queries
- No modificar AGENTS.md
- No modificar .env.local
- No cambiar la configuración de Tailwind ni de shadcn
- Todos los archivos nuevos en JavaScript (.js, .jsx), no TypeScript
- Usar pnpm para instalar paquetes, nunca npm

## Estructura

- `app/` — páginas y API routes
- `app/api/` — backend (API routes)
- `app/api/chat/` — ruta del agente de IA
- `components/` — componentes React reutilizables
- `lib/` — utilidades y configuración
- `public/` — archivos estáticos

## Base de datos (solo referencia, no modificar)

Por definir — se actualizará cuando se diseñe el esquema de Supabase.