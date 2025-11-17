# 🚀 Guia de Deploy no Vercel

Este guia explica como fazer o deploy da aplicação ImpactLink no Vercel, incluindo tanto o frontend (Next.js) quanto o backend (Express.js).

## 📋 Pré-requisitos

- Conta no [Vercel](https://vercel.com) (gratuita)
- Conta no [Supabase](https://supabase.com) (para o banco de dados)
- Repositório Git (GitHub, GitLab ou Bitbucket)
- Projeto ImpactLink configurado localmente

## 🏗️ Arquitetura da Aplicação

A aplicação é um monorepo com duas partes principais:

1. **Frontend (Client)**: Next.js 14+ rodando na porta 3000
2. **Backend (Server)**: Express.js rodando na porta 3001

### Estratégia de Deploy

**Opção 1: Deploy Separado (Recomendado)**
- Frontend no Vercel (Next.js)
- Backend no Vercel como Serverless Functions ou em outro serviço (Railway, Render, etc.)

**Opção 2: Deploy Full-Stack no Vercel**
- Frontend no Vercel
- Backend como Serverless Functions no Vercel

Este guia foca na **Opção 1**, que é mais flexível e permite escalabilidade independente.

---

## 📦 Parte 1: Deploy do Frontend (Next.js)

### 1.1. Preparar o Projeto

1. Certifique-se de que o projeto está no GitHub/GitLab/Bitbucket
2. O Vercel detectará automaticamente que é um projeto Next.js

### 1.2. Criar Projeto no Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em **"Add New Project"**
3. Importe seu repositório do GitHub
4. Configure o projeto:
   - **Framework Preset**: Next.js (detectado automaticamente)
   - **Root Directory**: `client`
   - **Build Command**: `npm run build` (ou `cd client && npm run build`)
   - **Output Directory**: `.next` (padrão do Next.js)
   - **Install Command**: `npm install` (ou `cd client && npm install`)

### 1.3. Configurar Variáveis de Ambiente

No painel do Vercel, vá em **Settings > Environment Variables** e adicione:

```env
# URL da API Backend (será configurada após deploy do backend)
NEXT_PUBLIC_API_URL=https://seu-backend.vercel.app
# ou
NEXT_PUBLIC_API_URL=https://seu-backend.railway.app

# Domínio para os links curtos
NEXT_PUBLIC_LINK_DOMAIN=seu-dominio.com
# ou se usar subdomínio
NEXT_PUBLIC_LINK_DOMAIN=links.seudominio.com
```

### 1.4. Deploy

1. Clique em **"Deploy"**
2. Aguarde o build completar
3. Anote a URL gerada (ex: `impact-link.vercel.app`)

---

## 🔧 Parte 2: Deploy do Backend (Express.js)

O Vercel suporta Serverless Functions, mas para uma aplicação Express completa, recomendamos usar **Railway** ou **Render**.

### Opção A: Deploy no Railway (Recomendado)

#### 2.1. Criar Conta no Railway

1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub
3. Clique em **"New Project"**

#### 2.2. Conectar Repositório

1. Selecione **"Deploy from GitHub repo"**
2. Escolha o repositório do ImpactLink
3. Configure:
   - **Root Directory**: `server`
   - **Start Command**: `npm start`
   - **Build Command**: `npm install`

#### 2.3. Configurar Variáveis de Ambiente

No Railway, vá em **Variables** e adicione:

```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

# JWT
JWT_SECRET=seu-secret-jwt-super-seguro-aqui
JWT_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=production

# URLs da Aplicação
APP_URL=https://seu-frontend.vercel.app
API_URL=https://seu-backend.railway.app

# Link Domain
LINK_DOMAIN=seu-dominio.com
# ou
LINK_DOMAIN=links.seudominio.com
```

#### 2.4. Deploy

1. Railway fará o deploy automaticamente
2. Anote a URL gerada (ex: `impact-link-production.up.railway.app`)

### Opção B: Deploy no Render

#### 2.1. Criar Conta no Render

1. Acesse [render.com](https://render.com)
2. Faça login com GitHub
3. Clique em **"New +"** > **"Web Service"**

#### 2.2. Conectar Repositório

1. Conecte seu repositório GitHub
2. Configure:
   - **Name**: `impact-link-api`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

#### 2.3. Configurar Variáveis de Ambiente

Adicione as mesmas variáveis do Railway acima.

#### 2.4. Deploy

1. Clique em **"Create Web Service"**
2. Aguarde o deploy
3. Anote a URL gerada

---

## 🔄 Parte 3: Configurar Domínio Personalizado (Opcional)

### 3.1. Configurar Domínio no Vercel (Frontend)

1. No painel do Vercel, vá em **Settings > Domains**
2. Adicione seu domínio (ex: `impactlink.com`)
3. Configure os registros DNS conforme instruções do Vercel

### 3.2. Configurar Subdomínio para Links Curtos

Para os links curtos funcionarem, você pode:

**Opção 1: Usar o domínio do backend**
- Configure `LINK_DOMAIN` com o domínio do backend
- Exemplo: `links.impactlink.com` apontando para o backend

**Opção 2: Usar o domínio do frontend com proxy**
- Configure um proxy no Next.js para redirecionar `/api/redirect/*` para o backend

---

## 🔐 Parte 4: Configurar Banco de Dados (Supabase)

### 4.1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a connection string

### 4.2. Executar Migrations

No Railway/Render, você pode executar migrations de duas formas:

**Opção 1: Via Terminal do Serviço**
```bash
cd server
npx prisma migrate deploy
```

**Opção 2: Via Script de Build**
Adicione ao `package.json` do server:
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "migrate": "prisma migrate deploy"
  }
}
```

### 4.3. Configurar Connection String

Use a connection string do Supabase no formato:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

---

## ⚙️ Parte 5: Configurações Finais

### 5.1. Atualizar URLs no Frontend

Após o deploy do backend, atualize a variável de ambiente no Vercel:

```env
NEXT_PUBLIC_API_URL=https://seu-backend.railway.app
# ou
NEXT_PUBLIC_API_URL=https://seu-backend.render.com
```

### 5.2. Configurar CORS no Backend

Certifique-se de que o CORS está configurado corretamente no `server/src/index.ts`:

```typescript
app.use(cors({
  origin: process.env.APP_URL || 'https://seu-frontend.vercel.app',
  credentials: true
}));
```

### 5.3. Testar a Aplicação

1. Acesse o frontend no Vercel
2. Teste login/registro
3. Crie um link e teste o redirecionamento
4. Verifique se os relatórios funcionam

---

## 🐛 Troubleshooting

### Problema: Erro de CORS

**Solução**: Verifique se `APP_URL` no backend está apontando para a URL correta do frontend.

### Problema: Erro de conexão com banco

**Solução**: 
- Verifique se a connection string do Supabase está correta
- Certifique-se de que o IP do servidor está permitido no Supabase (se necessário)
- Use a connection string com pooler para melhor performance

### Problema: Links curtos não redirecionam

**Solução**:
- Verifique se `LINK_DOMAIN` está configurado corretamente
- Certifique-se de que o backend está acessível publicamente
- Verifique se a rota `/:shortCode` está funcionando

### Problema: Build falha no Vercel

**Solução**:
- Verifique se o `Root Directory` está configurado como `client`
- Certifique-se de que todas as dependências estão no `package.json`
- Verifique os logs de build no Vercel

### Problema: Variáveis de ambiente não funcionam

**Solução**:
- Variáveis que começam com `NEXT_PUBLIC_` são expostas ao cliente
- Reinicie o deploy após adicionar novas variáveis
- Verifique se não há espaços extras nos valores

---

## 📝 Checklist de Deploy

- [ ] Frontend deployado no Vercel
- [ ] Backend deployado no Railway/Render
- [ ] Variáveis de ambiente configuradas em ambos
- [ ] Banco de dados Supabase configurado
- [ ] Migrations executadas
- [ ] CORS configurado corretamente
- [ ] URLs atualizadas e testadas
- [ ] Domínio personalizado configurado (opcional)
- [ ] Links curtos testados e funcionando
- [ ] Relatórios PDF/CSV testados

---

## 🔄 Atualizações Futuras

Após o deploy inicial, para atualizar a aplicação:

1. Faça commit das mudanças no Git
2. Push para o repositório
3. O Vercel e Railway/Render farão deploy automático

### Deploy Manual

Se necessário, você pode forçar um novo deploy:
- **Vercel**: Dashboard > Project > Deployments > Redeploy
- **Railway**: Dashboard > Service > Deploy > Redeploy
- **Render**: Dashboard > Service > Manual Deploy

---

## 📚 Recursos Adicionais

- [Documentação do Vercel](https://vercel.com/docs)
- [Documentação do Railway](https://docs.railway.app)
- [Documentação do Render](https://render.com/docs)
- [Documentação do Supabase](https://supabase.com/docs)
- [Documentação do Next.js](https://nextjs.org/docs)

---

## 💡 Dicas

1. **Use variáveis de ambiente** para diferentes ambientes (development, staging, production)
2. **Monitore os logs** no Vercel e Railway/Render para debug
3. **Configure alertas** para erros em produção
4. **Use domínio personalizado** para melhor branding
5. **Configure SSL/HTTPS** (automático no Vercel e Railway/Render)
6. **Backup do banco de dados** regularmente no Supabase

---

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs de build e runtime
2. Confirme que todas as variáveis de ambiente estão corretas
3. Teste localmente com as mesmas configurações
4. Consulte a documentação dos serviços utilizados

