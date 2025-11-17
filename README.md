# ImpactLink

**Transformando dados de tráfego por link em provas de impacto.**

ImpactLink é uma ferramenta que permite creators, social medias e agências medirem e visualizarem o impacto real do seu conteúdo através de tracking de links e dashboards analíticos.

## 🎯 Funcionalidades Principais

### Links Inteligentes
- Encurtador de links rastreáveis (`impact.link/nomelink`)
- Classificação por tipo: bio, story, direct, campanha, produto
- Sistema de tags para organização
- Links temporários com data de expiração
- Vinculação com clientes e campanhas

### Tracking de Tráfego
- Coleta automática de:
  - Origem do acesso (referrer)
  - Dispositivo e navegador
  - Localização aproximada
  - Data e hora do clique
  - Volume e frequência por período

### Dashboard de Impacto
- Visualização macro da performance
- Evolução histórica do tráfego
- Comparativo entre campanhas e conteúdos
- Top links e fontes de maior impacto
- Insights automáticos inteligentes

### Relatórios Profissionais
- Resumo visual para apresentar resultados
- Download em PDF ou CSV
- Branding personalizado
- Ideal para social medias e agências

### Planos Solo e Agência
- **Solo (CreatorLink)**: Perfil individual com painel próprio e links ilimitados
- **Agência (ImpactLink)**: Múltiplas subcontas com dashboard consolidado e comparativos entre clientes

## 🚀 Como Executar

Para instruções detalhadas de configuração, consulte o [Guia de Setup](SETUP.md).

### Quick Start

1. **Instale as dependências:**
```bash
npm install
cd server && npm install
cd ../client && npm install
```

2. **Configure o banco de dados PostgreSQL** e crie os arquivos `.env`:
   - `server/.env` - Veja `server/.env.example` para referência
   - `client/.env.local` - Veja `client/.env.local.example` para referência

3. **Execute as migrações:**
```bash
cd server
npx prisma generate
npx prisma migrate dev
```

4. **Inicie o servidor:**
```bash
# Na raiz do projeto
npm run dev
```

O servidor estará rodando em `http://localhost:3001` e o cliente em `http://localhost:3000`.

## 📁 Estrutura do Projeto

```
impact_link/
├── client/              # Frontend Next.js
│   ├── app/            # Páginas e rotas (App Router)
│   ├── components/     # Componentes React reutilizáveis
│   └── lib/            # Utilitários e API client
├── server/             # Backend Express
│   ├── src/
│   │   ├── routes/     # Rotas da API REST
│   │   ├── middleware/ # Middlewares (auth, etc)
│   │   └── utils/      # Funções utilitárias
│   └── prisma/         # Schema e migrações do banco
├── package.json        # Scripts principais
├── README.md          # Este arquivo
└── SETUP.md           # Guia detalhado de configuração
```

## 🛠️ Tecnologias

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL com Prisma ORM
- **Autenticação**: JWT
- **Relatórios**: PDFKit, CSV export

## 🔮 Roadmap / Extensões Futuras

- Integração com APIs de redes sociais (Instagram, TikTok, YouTube)
- Módulo de conteúdo para relacionar links com posts publicados
- Painel comparativo avançado de clientes (para agências)
- Webhooks para integrações externas
- API pública para desenvolvedores

## 📝 Licença

MIT

## 🤝 Contribuindo

Este é um projeto MVP. Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

