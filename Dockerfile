FROM node

WORKDIR /var/www/whatsapp-bot

COPY . .

RUN npm install && \
    npm run build

CMD ["npm", "start"]
