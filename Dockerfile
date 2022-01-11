FROM node:lts

WORKDIR /var/www/whatsapp-bot

COPY . .

RUN npm install && \
    npm run build

CMD ["npm", "start"]
