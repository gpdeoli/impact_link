# Guia de Configuração - ImpactLink

Este guia irá ajudá-lo a configurar e executar o ImpactLink em seu ambiente local.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** 18 ou superior
- **PostgreSQL** 14 ou superior
- **npm** ou **yarn**

## 🚀 Passo a Passo

### 1. Instalar Dependências

No diretório raiz do projeto:

```bash
npm install
```

No diretório do servidor:

```bash
cd server
npm install
```

No diretório do cliente:

```bash
cd client
npm install
```

### 2. Configurar Banco de Dados

1. Crie um banco de dados PostgreSQL:

```sql
CREATE DATABASE impactlink;
```

2. Configure a string de conexão no arquivo `server/.env`:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/impactlink?schema=public"
```

### 3. Configurar Variáveis de Ambiente

Crie o arquivo `server/.env` com as seguintes variáveis:

```env
# Database
DATABASE_URL="postgresql://usuario:senha@localhost:5432/impactlink?schema=public"

# JWT
JWT_SECRET="seu-secret-jwt-super-seguro-aqui"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development

# App
APP_URL="http://localhost:3000"
API_URL="http://localhost:3001"

# Link Domain (configure após deploy)
LINK_DOMAIN="localhost:3001"
```

Crie o arquivo `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_LINK_DOMAIN=localhost:3001
```

### 4. Executar Migrações do Banco de Dados

```bash
cd server
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Iniciar o Servidor

No diretório raiz, execute:

```bash
npm run dev
```

Isso iniciará:
- Backend em `http://localhost:3001`
- Frontend em `http://localhost:3000`

Ou você pode iniciar separadamente:

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

## 🎯 Primeiros Passos

1. Acesse `http://localhost:3000`
2. Crie uma conta (escolha entre plano Solo ou Agência)
3. Crie seu primeiro link
4. Comece a rastrear seu impacto!

## 📁 Estrutura do Projeto

```
impact_link/
├── client/              # Frontend Next.js
│   ├── app/            # Páginas e rotas
│   ├── components/     # Componentes React
│   └── lib/            # Utilitários e API client
├── server/             # Backend Express
│   ├── src/
│   │   ├── routes/     # Rotas da API
│   │   ├── middleware/ # Middlewares
│   │   └── utils/      # Funções utilitárias
│   └── prisma/         # Schema e migrações do banco
└── package.json        # Scripts principais
```

## 🔧 Comandos Úteis

### Desenvolvimento
- `npm run dev` - Inicia servidor e cliente em desenvolvimento
- `npm run dev:server` - Apenas servidor
- `npm run dev:client` - Apenas cliente

### Banco de Dados
- `cd server && npx prisma studio` - Abre interface visual do banco
- `cd server && npx prisma migrate dev` - Cria nova migração
- `cd server && npx prisma generate` - Gera Prisma Client

### Build
- `cd client && npm run build` - Build de produção do frontend
- `cd server && npm run build` - Build de produção do backend

## 🐛 Solução de Problemas

### Erro de conexão com banco de dados
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no arquivo `.env`
- Teste a conexão: `psql -U usuario -d impactlink`

### Erro de porta em uso
- Altere a porta no arquivo `.env` do servidor
- Atualize `NEXT_PUBLIC_API_URL` no cliente

### Erro de migração
- Certifique-se de que o banco de dados existe
- Verifique se o usuário tem permissões adequadas
- Tente resetar: `npx prisma migrate reset` (⚠️ apaga todos os dados)

## 📚 Próximos Passos

- Configure um domínio personalizado para os links curtos
- Configure SSL/HTTPS para produção
- Configure variáveis de ambiente de produção
- Configure backup do banco de dados

## 🆘 Suporte

Se encontrar problemas, verifique:
1. Logs do servidor no terminal
2. Console do navegador (F12)
3. Status do banco de dados
4. Variáveis de ambiente configuradas corretamente

