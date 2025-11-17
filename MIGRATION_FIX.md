# 🔧 Correção: Adicionar Coluna `tags` ao Modelo Client

## 🚨 Problema

O erro indica que a coluna `tags` não existe no banco de dados de produção (Supabase), mesmo que a migração já exista localmente.

**Erro:**
```
The column `Client.tags` does not exist in the current database.
```

## ✅ Solução Rápida

### Opção 1: Executar SQL Diretamente no Supabase (Mais Rápido)

1. Acesse o dashboard do Supabase: https://supabase.com
2. Vá em **SQL Editor** (menu lateral)
3. Execute o seguinte SQL:

```sql
-- Adicionar coluna tags ao modelo Client
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
```

4. Clique em **Run** para executar
5. Verifique se a coluna foi criada:
   - Vá em **Table Editor** > **Client**
   - Você deve ver a coluna `tags` do tipo `text[]`

### Opção 2: Executar Migração via Prisma (Recomendado para Futuro)

Se você tem acesso ao servidor de produção ou pode executar comandos:

```bash
cd server
npx prisma migrate deploy
```

Isso aplicará todas as migrações pendentes, incluindo a que adiciona `tags`.

### Opção 3: Usar o Script SQL Fornecido

Execute o arquivo `server/prisma/migrations/apply_tags_migration.sql` no Supabase SQL Editor.

## 🔍 Verificação

Após aplicar a migração, verifique:

1. No Supabase SQL Editor, execute:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Client' AND column_name = 'tags';
```

2. Deve retornar:
```
column_name | data_type
------------|----------
tags        | ARRAY
```

## 📝 Nota Importante

Se você estiver usando Railway, Render ou outro serviço para o backend, você pode:

1. **Adicionar script de migração no build:**
   - No `package.json` do server, adicione:
   ```json
   {
     "scripts": {
       "postinstall": "prisma generate",
       "migrate:deploy": "prisma migrate deploy"
     }
   }
   ```

2. **Executar manualmente após cada deploy:**
   - Conecte-se ao servidor via SSH ou terminal
   - Execute: `npx prisma migrate deploy`

## 🎯 Próximos Passos

Após aplicar a migração:

1. ✅ Teste criar um cliente no Vercel
2. ✅ Verifique se a coluna `tags` está funcionando
3. ✅ Se houver outras migrações pendentes, execute `prisma migrate deploy`

## 🚨 Prevenção Futura

Para evitar esse problema no futuro:

1. **Sempre execute migrações após deploy:**
   ```bash
   npx prisma migrate deploy
   ```

2. **Configure migrações automáticas no build:**
   - Adicione `prisma migrate deploy` no script de build/deploy

3. **Use Prisma Migrate em produção:**
   - Nunca use `prisma migrate dev` em produção
   - Use sempre `prisma migrate deploy` para aplicar migrações existentes

