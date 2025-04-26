FROM node:18.10.0-alpine

WORKDIR /usr

COPY . .

RUN npm install

CMD ["npx","ts-node","bot.ts"]