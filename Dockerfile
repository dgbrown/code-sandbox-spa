FROM node:16.8.0-alpine as deps

WORKDIR /app

# install server deps
COPY package.json yarn.lock ./
RUN yarn

# install ui deps
COPY ui/package.json ui/yarn.lock ./ui/
RUN cd /app/ui && yarn && cd /app

FROM deps as build

# build server
COPY index.js ./

# build ui
COPY ui/public ./ui/public
COPY ui/src ./ui/src
RUN cd ./ui && yarn build

FROM build as app

ENV PORT=3000
ENV NODE_ENV=production

# run app
EXPOSE 3000
CMD ["yarn", "start"]
