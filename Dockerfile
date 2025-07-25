FROM node:24 AS builder

ENV NODE_ENV=build

# Create app directory
WORKDIR /usr/src/app

RUN apt-get update
RUN  apt-get install -y python3
RUN  apt-get install -y build-essential
RUN  apt-get install -y make
RUN  apt-get install -y g++
RUN  apt-get install -y libc6-dev
RUN npm install -g node-gyp
RUN npm install -g pnpm

# Copy package files first to leverage Docker cache
COPY package*.json pnpm-*.yaml ./
COPY apps/fnf/package*.json ./apps/fnf/
COPY apps/fnf/postinstall.js ./apps/fnf/
COPY apps/fnf-api/package*.json ./apps/fnf-api/
COPY libs/fnf-data/package*.json ./libs/fnf-data/

# Install dependencies
RUN pnpm install

# Create necessary directories for the build
#RUN mkdir -p apps/fnf/dist apps/fnf-api/dist apps/fnf-api-test/dist libs/fnf-data/dist

# Bundle app source (excluding node_modules and dist directories as specified in .dockerignore)
COPY . .

# Build the application
RUN pnpm build:all

# Prune dev dependencies after build
RUN pnpm prune --prod

# ---

FROM node:24-slim AS production

LABEL "nick"="fnf"

ENV NODE_ENV=production

WORKDIR /usr/src/app

RUN apt-get update
RUN  apt-get install -y python3
RUN  apt-get install -y build-essential
RUN  apt-get install -y make
RUN  apt-get install -y g++
RUN  apt-get install -y libc6-dev
RUN npm install -g node-gyp
RUN npm install -g pnpm

# Optional:
RUN apt-get install -y rsync
RUN apt-get install -y  zip unzip
RUN apt-get install -y  p7zip-full
RUN apt-get install -y  tar
RUN apt-get install -y  xz-utils
RUN apt-get install -y  zstd
RUN apt-get install -y  curl wget
RUN apt-get install -y  jq
RUN apt-get install -y  tree
RUN apt-get install -y  file
RUN apt-get install -y  mc



# Copy package files needed for rebuild
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /usr/src/app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Copy root node_modules
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Rebuild native modules for the production environment
# RUN cd node_modules/.pnpm/node-pty@1.0.0/node_modules/node-pty && node-gyp rebuild

# Copy your full app (built dist + sources if needed)
COPY --from=builder /usr/src/app/apps/fnf-api/dist ./apps/fnf-api
COPY --from=builder /usr/src/app/apps/fnf-api/src/assets ./apps/fnf-api/assets
COPY --from=builder /usr/src/app/apps/fnf-api/node_modules ./apps/fnf-api/node_modules
COPY --from=builder /usr/src/app/libs/fnf-data ./libs/fnf-data

COPY --from=builder /usr/src/app/apps/fnf/dist/fnf ./apps/fnf-api/fnf


# friends don’t let friends run containers as root!
# USER node
USER root

EXPOSE 3333 3334

CMD ["node", "apps/fnf-api/main.js"]


