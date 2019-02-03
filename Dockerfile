FROM node:8.15
COPY ./ /build
WORKDIR /build
RUN rm -rf node_modules www electron android ios e2e
RUN npm i
RUN npm run postinstall
RUN npm run ng:build:prod


FROM nginx:1.15.8-alpine
COPY --from=0 /build/www /usr/share/nginx/html

EXPOSE 80