FROM node

WORKDIR /var/www/whatsapp-bot

COPY . .

RUN chmod 777 writable/* && \
    npm install && \
    npm run build

CMD ["npm", "start"]
