# Derivix Demo Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first independently runnable Derivix demo chunk: branded landing page plus a navigable demo trading workspace shell.

**Architecture:** Next.js App Router with TypeScript and Tailwind CSS. Chunk 1 is intentionally credential-free and uses static demo data; later chunks will add the typed domain store, deposit state machine, and simulated trading engine behind stable interfaces.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Lucide React.

**Spec:** `docs/superpowers/specs/2026-09-07-derivix-production-foundation-design.md`

## Global Constraints

- Show `DEMO MODE` visibly in the product shell.
- Do not claim regulatory approval, guaranteed returns, live brokerage execution, or confirmed external payment processing.
- Use the supplied Derivix logo as the brand anchor.
- Keep the app runnable without environment variables or external credentials.

---

### Task 1: Scaffold the web application

**Files:**
- Create: `package.json`, `tsconfig.json`, `next-env.d.ts`, `next.config.ts`, `postcss.config.mjs`
- Create: `app/layout.tsx`, `app/globals.css`
- Create: `public/derivix-logo.png`

- [ ] **Step 1: Create the minimal project configuration and install dependencies.**
- [ ] **Step 2: Add the global font, color tokens, layout metadata, and logo asset.**
- [ ] **Step 3: Run the typecheck/build command to verify the empty shell compiles.**

### Task 2: Build the landing page

**Files:**
- Create: `app/page.tsx`
- Create: `components/brand/logo.tsx`, `components/marketing/market-preview.tsx`

- [ ] **Step 1: Add the hero, trust strip, feature cards, platform preview, and CTA.**
- [ ] **Step 2: Add responsive layout and accessible navigation links.**
- [ ] **Step 3: Run lint and build.**

### Task 3: Build the demo application shell

**Files:**
- Create: `app/app/layout.tsx`, `app/app/page.tsx`
- Create: `components/app/sidebar.tsx`, `components/app/topbar.tsx`, `components/app/stat-card.tsx`

- [ ] **Step 1: Add the sidebar, topbar, DEMO MODE badge, and dashboard summary cards.**
- [ ] **Step 2: Add watchlist, portfolio preview, open-position preview, and navigation placeholders.**
- [ ] **Step 3: Run lint and build, then manually inspect desktop and narrow layouts.**

### Chunk boundary

After Tasks 1–3, stop with a runnable landing page and demo dashboard shell. The next chunk begins with tests-first domain logic for deposits, ledger balance, and trade gating.
