FROM node:14-alpine

# be carefull changing this, it should change in Jenkinsfile as well
WORKDIR /usr/src/app/

EXPOSE 8080

COPY package.json yarn.lock /usr/src/app/

RUN yarn install --production=false

COPY . .

CMD ["yarn", "start"]