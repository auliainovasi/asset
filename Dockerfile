FROM node:lts

WORKDIR /var/www/asset

COPY . .
COPY .env.example .env

RUN apt update && \
    apt install -y wget gnupg && \
    wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
    apt update && \ 
    apt install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 --no-install-recommends &&\
    rm -rf /var/lib/apt/lists/* && \
    chmod 777 * && \
    yarn && \
    yarn build

CMD ["google-chrome-stable"]
CMD ["yarn", "start"]
