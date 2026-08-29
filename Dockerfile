# SZL KHIPU lab — Hugging Face Space (port 7860)
#
# Factory class that keeps this Space in BUILD_ERROR:
#   1. FROM public.ecr.aws — HF builders cannot pull ECR Public reliably (exit 128).
#   2. npm ci running Playwright postinstall against a missing browser cache.
#   3. COPY .grok — that directory is gitignored / stripped by the Hub mirror.
#
# GCR mirror + ignore-scripts + ENV VITE_AUTH_ENABLED (wrapper treats a missing
# .grok file as empty and lets process.env win). Anatomy Space already proved
# this FROM line on the same factory.
FROM mirror.gcr.io/library/node:22-bookworm-slim

WORKDIR /app
ENV npm_config_cache=/tmp/npm-cache
ENV NPM_CONFIG_IGNORE_SCRIPTS=true
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV HOST=0.0.0.0
ENV PORT=7860
ENV NODE_ENV=development
ENV VITE_AUTH_ENABLED=false

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
RUN mkdir -p .grok && printf '{"VITE_AUTH_ENABLED":"false"}\n' > .grok/app-env.json

EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:7860/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "scripts/with-app-env.mjs", "vite", "dev", "--host", "0.0.0.0", "--port", "7860"]
