FROM oven/bun:1.3.5-alpine

WORKDIR /app

COPY ./dist ./

ENV NODE_ENV=production

EXPOSE 8000

CMD ["bun", "api.js"]
