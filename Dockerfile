FROM node:lts

WORKDIR /var/www/asset

COPY . .

RUN chmod 777 src/public/* && \
    yarn install && \
    yarn run build

CMD ["yarn", "start"]
