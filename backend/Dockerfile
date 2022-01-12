FROM node:14-alpine

# be carefull changing this, it should change in Jenkinsfile as well
WORKDIR /usr/src/app/

EXPOSE 3000

COPY package.json yarn.lock /usr/src/app/

RUN yarn install --production=false

COPY . .

RUN chmod +x ./wait-for

CMD ["yarn start"]