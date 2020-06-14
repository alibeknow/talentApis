FROM keymetrics/pm2:latest-alpine

RUN mkdir /app
WORKDIR /app

RUN apk update && apk add python g++ make && rm -rf /var/cache/apk/*

COPY . .

ENV NPM_CONFIG_LOGLEVEL warn

RUN npm install
#RUN npm run migrate
EXPOSE 8080

CMD [ "pm2-runtime", "start", "ecosystem.config.js" ]

