FROM node:16.8.0-alpine as deps

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn

FROM deps as build

COPY static ./static
COPY index.js ./

FROM build as server

EXPOSE 3000
CMD ["yarn", "start"]
