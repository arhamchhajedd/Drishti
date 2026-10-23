# Contributing to Drishti AI

Thank you for contributing to Drishti AI! This repository follows strict engineering, security, and accessibility standards to ensure high reliability for visually impaired users.

---

## 1. Quality Standards & Engineering Rules

- **Zero `any` Tolerance:** All TypeScript must be strictly typed. Never use `any`, `@ts-ignore`, or `@ts-expect-error` without an explicit written justification.
- **Module Size Boundaries:** Small, single-purpose modules. No logic file should exceed ~200 lines, and no UI component should exceed ~120 lines.
- **Separation of Concerns:** Keep UI components strictly presentation-focused. All device API logic, state machines, and calculations reside in custom hooks (`hooks/`) or utility libraries (`lib/`).
- **Fail-Closed Security:** Never disable a security check to make something work. All input from clients or model responses must pass Zod schema validation.
- **Universal Verification:** Every PR must pass `npm run check` with zero errors and zero warnings.

---

## 2. Local Development Workflow

```bash
# 1. Clone & install
git clone https://github.com/arhamchhajedd/Drishti.git
cd drishti
npm install

# 2. Setup environment variables
cp .env.example .env.local
# Add your GEMINI_API_KEY from Google AI Studio

# 3. Start local dev server
npm run dev
```

---

## 3. Pre-Commit Verification Gate

Before submitting any commit or pull request, run the single unified check:

```bash
npm run check
```

This command sequentially runs:
1. `npm run lint`: ESLint with `core-web-vitals` (0 warnings allowed).
2. `npm run typecheck`: TypeScript compilation check (`tsc --noEmit`).
3. `npm test`: Full 44-test Vitest suite covering security, schemas, sanitizer, prompt injection, and accessibility contracts.
4. `npm run build`: Production Next.js build verification.

---

## 4. Conventional Commit Standards

Commits must follow the Conventional Commits specification:
- `feat:` New features or user-facing enhancements
- `fix:` Bug fixes or behavioral corrections
- `security:` Security hardening, CSP updates, or sanitization logic
- `test:` Unit, integration, or contract tests
- `docs:` Documentation, architecture, or demo guides
- `perf:` Performance optimizations or latency reductions
