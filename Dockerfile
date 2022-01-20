FROM node:lts

WORKDIR /var/www/asset

COPY . .

RUN npm install && \
    npm run build

CMD ["npm", "start"]
