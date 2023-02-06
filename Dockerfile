FROM node:lts

WORKDIR /var/www/asset

COPY . .
COPY .env.example .env

RUN apk update && apk upgrade && \
    apk add --no-cache && \
    chromium \
    chromium-chromedriver && \
    chmod 777 * && \
    yarn && \
    yarn build

CMD ["yarn", "start"]
