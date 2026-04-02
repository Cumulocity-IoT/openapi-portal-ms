###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM alpine:3.23.3 AS nodejs

# Install nodejs
RUN addgroup -S node && \
    adduser -S node -G node && \
    apk add --no-cache nodejs && \
    node -v

# allow node to bind to port 80
# This is required for the application to run on port 80 without root privileges
RUN apk add --no-cache libcap && \
    setcap CAP_NET_BIND_SERVICE=+eip $(which node)

FROM nodejs AS nodejs-and-pnpm

# Install pnpm via corepack
RUN apk add --no-cache npm && \
    npm install -g corepack && \
    corepack enable && \
    corepack prepare pnpm@latest --activate

FROM nodejs-and-pnpm AS development

# Create app directory
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# Copying this first prevents re-running pnpm install on every code change.
COPY --chown=node:node package.json ./
COPY --chown=node:node pnpm-lock.yaml ./
COPY --chown=node:node .npmrc ./

RUN pnpm install --frozen-lockfile

# Use the node user from the image (instead of the root user)
USER node

###################
# BUILD FOR PRODUCTION
###################

FROM nodejs-and-pnpm AS build

WORKDIR /usr/src/app

# Copy node_modules from development stage, then source files
COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules
COPY --chown=node:node ./ ./
COPY --chown=node:node package.json ./
COPY --chown=node:node pnpm-lock.yaml ./

# Run the build command which creates the production bundle
RUN pnpm build

USER node

###################
# PRODUCTION
###################

FROM nodejs AS production

WORKDIR /usr/src/app

# Copy the bundled code from the build stage to the production image
COPY --chown=node:node --from=build /usr/src/app/package.json ./package.json
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

ENV NODE_ENV=production
ENV NO_COLOR=true
ENV NODE_OPTIONS="--max-old-space-size=2048 --max-http-header-size=16384000"
USER node

# Start the server using the production build
CMD [ "node", "dist/main.js" ]

EXPOSE 80