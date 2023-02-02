FROM node:lts

WORKDIR /var/www/asset

COPY . .
COPY .env.example .env

RUN chmod 777 src/public && \
    yarn && \
    yarn build

CMD ["yarn", "start"]
