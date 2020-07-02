#FROM keymetrics/pm2:latest-alpine
FROM  node:10.21.0-stretch

ARG MYSQL_HOST=host
ARG MYSQL_DATABASE=db
ARG MYSQL_USER=user
ARG MYSQL_PASSWORD=pass
ARG MYSQL_PORT=3306

RUN mkdir /app
WORKDIR /app

#RUN apk update && apk add python g++ make && rm -rf /var/cache/apk/*
COPY . .

#ENV NPM_CONFIG_LOGLEVEL warn

RUN npm install

#RUN npm run migrate

#CMD [ "pm2-runtime", "start", "ecosystem.config.js" ]
ENTRYPOINT [ "node", "index.js" ]
