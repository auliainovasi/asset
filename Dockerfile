FROM node:lts

WORKDIR /var/www/asset

COPY . .

RUN chmod 777 writable/* && \
    npm install && \
    npm run build

CMD ["npm", "start"]
