###################
# BUILD FOR PRODUCTION
###################

FROM node:alpine AS build

WORKDIR /usr/src/app

COPY --chown=node:node ./ ./
RUN npm i
RUN npm run build

USER node

###################
# PRODUCTION
###################

FROM node:alpine AS production

WORKDIR /usr/src/app

# Copy the bundled code from the build stage to the production image
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
# COPY --chown=node:node --from=build /usr/src/app/.env ./

# Start the server using the production build correlates with the memory settings in cumulocity.json
CMD [ "node", "--max-old-space-size=3600", "dist/main.js" ]

EXPOSE 80