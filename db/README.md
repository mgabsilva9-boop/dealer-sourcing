# Database Setup - dealer-sourcing

## 📋 Quick Start

### 1️⃣ Instalar PostgreSQL

**Opção A: Docker (Recomendado)**
```bash
# Criar container PostgreSQL 15
docker run --name dealer-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:15

# Verificar se está rodando
docker ps | grep dealer-postgres
```

**Opção B: Instalar Nativo**
- Windows: https://www.postgresql.org/download/windows/
- macOS: `brew install postgresql@15`
- Linux: `sudo apt-get install postgresql`

---

### 2️⃣ Configurar .env

Arquivo: `.env`
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dealer_sourcing"
JWT_SECRET=seu-secret-aqui
NODE_ENV=development
```

---

### 3️⃣ Executar Migrações

```bash
# Instalar dependências (se não tiver)
npm install pg

# Dry-run: testar sem aplicar
node db/migrate.js dry-run

# Apply: aplicar migração
node db/migrate.js apply

# Rollback: desfazer (se necessário)
node db/migrate.js rollback
```

---

## 📊 Schema Overview

### Tables

| Tabela | Propósito | RLS | Índices |
|--------|-----------|-----|---------|
| `users` | Usuários com JWT auth | ✅ | jwt_sub (unique) |
| `vehicles_cache` | Cache compartilhada de veículos | ✅ | vehicle_id, source, price/km |
| `interested_vehicles` | Favoritos por usuário | ✅ | user_id, status, vehicle_id |
| `search_queries` | Log de buscas/analytics | ✅ | user_id, validation |
| `vehicle_validations` | Histórico de validações | ✅ | vehicle_id, validated_by |

---

## 🔒 RLS (Row Level Security)

3 Roles:
- **owner** (admin): vê tudo, pode modificar
- **shop** (lojaB): vê apenas dados públicos
- **user** (pessoa): vê apenas seus dados

---

## 🔄 Triggers Automáticos

1. **update_vehicles_cache_timestamp** - atualiza `updated_at` em vehicles_cache
2. **sync_vehicle_validation** - sincroniza validação entre tables
3. **update_interested_vehicles_timestamp** - atualiza timestamps em interested_vehicles

---

## 📈 Índices de Performance

Otimizados para:
- **A**: Get interested vehicles for user (user_id, status)
- **C**: Find specific vehicle (vehicle_id)
- **D**: Count by status (status)

---

## ✅ Validação

Após aplicar migração:

```bash
# Smoke test: validar schema
npm test  # (se houver testes)

# Ou verificar manualmente:
psql postgresql://postgres:postgres@localhost:5432/dealer_sourcing

# Inside psql:
\dt                    # Listar tabelas
\d users               # Schema de users
SELECT * FROM migrations;  # Ver migrações aplicadas
```

---

## 🚀 Próximos Passos

1. ✅ Aplicar migração (você está aqui)
2. 📝 Seed data (dados iniciais)
3. 🔗 Conectar backend (src/server.js)
4. 🧪 Testes de integração
5. 🚢 Deploy para Render

---

## 🆘 Troubleshooting

### "psql: command not found"
PostgreSQL não está instalado. Use Docker ou instale via package manager.

### "connection refused"
PostgreSQL não está rodando:
```bash
# Docker
docker start dealer-postgres

# Nativo (macOS/Linux)
brew services start postgresql
sudo service postgresql start
```

### "database does not exist"
Migration runner cria automaticamente. Se erro persistir:
```bash
createdb -U postgres dealer_sourcing
```

### "RLS policy violates"
Certifique que `auth.uid()` está setado corretamente na connection string.

---

## 📚 Referências

- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Migration Best Practices](https://wiki.postgresql.org/wiki/Migrations)
- [Supabase Patterns](https://supabase.com/docs/guides/database)

---

**Database setup by Dara - The Sage** 🧙‍♂️
