FROM node:11.9.0
WORKDIR /usr/testo
COPY package.json package.json
COPY yarn.lock yarn.lock
RUN yarn install --pure-lockfile
CMD yarn watch
