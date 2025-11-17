# Como Gerar o Prisma Client

O Prisma Client precisa ser gerado antes de usar o código. Execute um dos comandos abaixo:

## Opção 1: Usando npm (recomendado)
```bash
cd server
npm install  # Se ainda não instalou as dependências
npm run prisma:generate
```

## Opção 2: Usando npx diretamente
```bash
cd server
npx prisma generate
```

## Opção 3: Usando yarn
```bash
cd server
yarn prisma generate
```

Após executar, o Prisma Client será gerado em `server/node_modules/.prisma/client` e o erro de TypeScript desaparecerá.

**Nota:** Você precisa ter:
- Node.js instalado
- Dependências instaladas (`npm install` no diretório server)
- Um arquivo `schema.prisma` válido (já existe em `server/prisma/schema.prisma`)

