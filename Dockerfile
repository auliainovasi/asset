FROM node:lts

WORKDIR /var/www/asset

COPY . .

RUN chmod 777 writable/* && \
    yarn install && \
    yarn run build

CMD ["yarn", "start"]
