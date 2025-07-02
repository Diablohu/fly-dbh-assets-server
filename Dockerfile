FROM node:lts
WORKDIR .
COPY package*.json .
RUN npm install --no-save --only=production
RUN npm install -g pm2
COPY . .
EXPOSE 8081
CMD ["pm2-runtime", "pm2.json"]
