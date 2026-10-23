# Production Deployment Guide: Drishti AI

---

## 1. Deployment Target Options

Drishti AI is built on Next.js 16 (App Router) and can be deployed to two primary production targets:
1. **Google Cloud Run (Recommended for production):** Fully managed, auto-scaling container service with zero idle cost and native integration with Google Secret Manager.
2. **Vercel (Recommended for rapid demo / preview):** Serverless edge deployment with zero configuration.

---

## 2. Google Cloud Run Deployment (Containerized)

### 2.1 Multi-Stage Production Dockerfile

Create a `Dockerfile` at the root of the project:

```dockerfile
# Stage 1: Dependencies
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run check

# Stage 3: Runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### 2.2 Google Cloud CLI Build & Deploy

```bash
# 1. Authenticate with Google Cloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 2. Store Gemini API Key in Google Cloud Secret Manager
echo -n "your-gemini-api-key" | gcloud secrets create gemini-api-key \
    --data-file=- \
    --replication-policy="automatic"

# 3. Build container using Cloud Build
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/drishti-ai

# 4. Deploy container to Cloud Run with Secret Reference
gcloud run deploy drishti-ai \
    --image gcr.io/YOUR_PROJECT_ID/drishti-ai \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --set-secrets=GEMINI_API_KEY=gemini-api-key:latest \
    --set-env-vars=GEMINI_MODEL=gemini-3.5-flash-lite,GEMINI_THINKING_LEVEL=MINIMAL \
    --min-instances 0 \
    --max-instances 10 \
    --memory 512Mi \
    --cpu 1
```

---

## 3. Vercel Deployment

1. Import repository on [vercel.com](https://vercel.com).
2. Configure Environment Variables in Project Settings:
   - `GEMINI_API_KEY`: *(Your Google AI Studio API key)*
   - `GEMINI_MODEL`: `gemini-3.5-flash-lite`
   - `GEMINI_THINKING_LEVEL`: `MINIMAL`
   - `RATE_LIMIT_SALT`: *(Random 32-character string)*
3. Deploy. Vercel automatically runs `npm run build` and issues a secure SSL certificate.

---

## 4. HTTPS & PWA Security Requirements

- **Secure Context Requirement:** Camera access (`getUserMedia`), Screen Wake Lock (`wakeLock`), and Web Speech APIs require a secure HTTPS context. Browsers block sensor APIs over non-HTTPS connections (except `localhost`).
- **Domain Verification:** Ensure your custom domain maps directly to your Cloud Run service or Vercel project with HTTP-to-HTTPS redirect enforced.
- **DDoS & Cloud Armor (Production Scale):** For high-traffic production deployments, front Cloud Run with a Google Cloud Load Balancer and enable Cloud Armor rate-limiting security policies.
