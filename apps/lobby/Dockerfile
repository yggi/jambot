# The lobby server, for hosting: build from the repository's root,
#   docker build -f apps/lobby/Dockerfile -t jambot-lobby .
#   docker run -p 8787:8787 jambot-lobby
# It serves plain ws:// on $PORT; the host's proxy gives it wss://.
FROM node:22-slim
WORKDIR /jambot
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/theory packages/theory
COPY packages/engine packages/engine
COPY packages/session packages/session
COPY apps/lobby apps/lobby
RUN pnpm install --frozen-lockfile --prod --filter @jambot/lobby...
ENV PORT=8787
EXPOSE 8787
USER node
CMD ["node", "--experimental-strip-types", "--no-warnings", "apps/lobby/src/main.ts"]
