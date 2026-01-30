FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de dependência
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Buildar o projeto
RUN npm run build

# Expor porta de desenvolvimento
EXPOSE 4173

# Rodar em modo preview garantindo o diretório correto
CMD ["sh", "-c", "cd /app && npm run preview -- --host --port 4173"]
