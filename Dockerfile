FROM node:16-buster as builder

ADD . /app
WORKDIR /app
RUN npm install --legacy-peer-deps

RUN wget https://gobinaries.com/tj/node-prune --output-document - | /bin/sh && node-prune

FROM gcr.io/distroless/nodejs16-debian11

COPY --from=builder /app/assets /app/assets
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules

WORKDIR /app

EXPOSE 3000
CMD ["dist/bot.js"]