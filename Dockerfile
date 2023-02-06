FROM node:lts

WORKDIR /var/www/asset

COPY . .
COPY .env.example .env

RUN apt update &&\
    apt install -yq libgconf-2-4 &&\
    wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb &&\
    dpkg -i google-chrome-stable_current_amd64.deb || truechmod 777 * && \
    yarn && \
    yarn build

CMD ["yarn", "start"]
