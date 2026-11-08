FROM node:26.13.0-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma.config.ts tsconfig.json tsconfig.build.json nest-cli.json ./
COPY prisma ./prisma
COPY src ./src

# prisma.config.ts reads DATABASE_URL while generating the client. The image
# build has no database; migrate at container start uses the runtime URL.
RUN DATABASE_URL=postgresql://catalog:catalog@localhost:5432/catalog npm run prisma:generate && npm run build

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
