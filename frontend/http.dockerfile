FROM node:10.16.2
RUN npm install -g http-server
WORKDIR /usr/http
CMD http-server files/ -p ${PORT:-8080} --silent
