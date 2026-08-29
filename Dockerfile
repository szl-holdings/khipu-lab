# SZL KHIPU lab — Hugging Face Space (port 7860)
# The previous image ran `npm ci` against public.ecr.aws + Playwright
# postinstall and BUILD_ERRORed on the HF factory (same failure class as
# leftover vite-dev NEXUS). Ignore install scripts, pull Node from GCR
# (the pin anatomy already uses), and copy the env file the wrapper reads.
FROM mirror.gcr.io/library/node:22-bookworm-slim

WORKDIR /app
ENV npm_config_cache=/tmp/npm-cache
ENV NPM_CONFIG_IGNORE_SCRIPTS=true
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY package.json package-lock.json ./
RUN npm ci

COPY src ./src
COPY scripts ./scripts
COPY public ./public
COPY server ./server
COPY migrations ./migrations
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY eslint.config.mjs ./
COPY LICENSE ./
COPY .prettierrc ./
COPY .grok ./.grok

ENV HOST=0.0.0.0
ENV PORT=7860
ENV NODE_ENV=development
ENV VITE_AUTH_ENABLED=false

EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:7860/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "scripts/with-app-env.mjs", "vite", "dev", "--host", "0.0.0.0", "--port", "7860"]
