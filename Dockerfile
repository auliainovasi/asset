FROM node:lts

WORKDIR /var/www/asset

COPY . .

RUN chmod 777 src/public && \
    yarn && \
    yarn build

CMD ["yarn", "start"]
