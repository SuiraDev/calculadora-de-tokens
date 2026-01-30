FROM node:20-alpine

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm install

# Copiar código fonte
COPY . .

# Expor porta de desenvolvimento (Vite = 5173 ou você pode configurar para 3000)
# Para produção sem Nginx, temos que usar o comando preview do Vite
# IMPORTANTE: preview é apenas para testar localmente, não recomendado para alta carga
# Mas se o Dokploy resolve o SSL/Proxy, funciona.
EXPOSE 4173

# Buildar o projeto
RUN npm run build

# Rodar em modo preview (serve a pasta dist)
# A flag --host é crucial para o Docker aceitar conexões externas
CMD ["npm", "run", "preview", "--", "--host", "--port", "4173"]
