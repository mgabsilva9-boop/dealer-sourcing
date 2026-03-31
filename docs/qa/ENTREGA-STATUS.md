# Status de Entregas — Garagem MVP

**Última Atualização:** 31/03/2026 20:30
**Responsável:** Claude Code (@qa)

---

## 📊 Resumo Executivo

| ENTREGA | Status | Data | Detalhe |
|---------|--------|------|---------|
| **1.1** | ✅ PASS | 31/03 | Login & Sessão (6/6 ACs) |
| **1.2** | 🔄 PLANEJADO | Hoje | CRUD & Kanban (pendente execução) |
| **1.3** | 📋 ROADMAP | Amanhã | Imagens & RLS Validação |
| **1.4** | 📋 ROADMAP | Amanhã | Segurança (CORS, Auth, RLS) |
| **1.5** | 📋 ROADMAP | 2/4 | Deploy Railway + Vercel |
| **1.6** | 📋 ROADMAP | 3/4 | Handoff Cliente (treinamento) |

---

## ✅ ENTREGA-1.1: Login & Sessão

**Status:** PASSOU (6/6 ACs)

### ACs Validados
- ✅ AC1: Login Dono (`dono@brossmotors.com` / `Dono@Garagem2026`)
- ✅ AC2: Login Admin (`admin@threeon.com` / `Admin@Garagem2026`)
- ✅ AC3: Login Manager (`lojab@brossmotors.com` / `LojB@Garagem2026`)
- ✅ AC4: F5 mantém sessão (token em localStorage)
- ✅ AC5: Logout remove token
- ✅ AC6: JWT inclui dealership_id (RLS isolation)

### Diagnóstico
- **Bloqueador Anterior:** HTTP 500 — DATABASE_URL conectava mas tabela users não existia
- **Fix Aplicado:** Criada tabela users com schema e inseridos 3 usuários com bcrypt hashed passwords
- **Bloqueador AC6:** JWT não incluía dealership_id
- **Fix Aplicado:** Verificado que código já incluía dealership_id; diagnosticado como servidor desatualizado

### Arquivos Afetados
```
✅ src/routes/auth.js (linhas 80-134) — Login e geração JWT
✅ src/middleware/auth.js — Verificação JWT
✅ .env — Senhas de default users
✅ docs/qa/tests/ENTREGA-1.1-results.md — Relatório de testes
```

---

## 🔄 ENTREGA-1.2: CRUD & Kanban (EM PLANEJAMENTO)

**Status:** Planejado para hoje

### ACs a Testar (8 total)
- AC1: Criar veículo (form)
- AC2: Listar veículos (isolamento por dealership)
- AC3: Editar veículo (form + persistência)
- AC4: Deletar veículo
- AC5: Upload de foto (JPG preview + Storage)
- AC6: Deletar foto (SEM erro "Rota não encontrada")
- AC7: Kanban arrastável (3 colunas: available/reserved/sold)
- AC8: RLS isolation (usuário não consegue ver/editar dados de outra loja)

### Dados de Teste
- 10 veículos pré-criados (5 Loja A, 5 Loja B)
- 3 usuários com roles diferentes

### Arquivos Afetados (esperado)
```
📋 src/routes/inventory.js — CRUD de veículos
📋 src/frontend/App.jsx — Kanban component + foto upload
📋 src/frontend/api.js — API calls para inventory
📋 docs/qa/tests/ENTREGA-1.2-results.md — Relatório (a ser criado)
```

---

## 📋 ENTREGA-1.3: Imagens & RLS

**Status:** Roadmap (1/04)

### Objetivos
- Validar que fotos aparecem na lista (não só detalhe)
- Validar que DELETE /inventory/:id/image não retorna 404
- Testar RLS policies em vehicles table
- Confirmar isolamento dealership_id em todas tabelas

### Risco Crítico
```
❌ ATUAL: DELETE /inventory/:id/image → "Rota não encontrada"
✅ ESPERADO: Deletar foto sem erro, image_url = NULL
```

---

## 🔒 ENTREGA-1.4: Segurança

**Status:** Roadmap (1/04)

### Testes
| Teste | Cenário | Resultado Esperado |
|-------|---------|-------------------|
| RLS: Dono Loja A | Tenta ver veículos Loja B | 403 (via RLS policy) |
| RLS: Gerente Loja A | Edita veículo Loja A | 200 OK |
| Auth: Token expirado | F5 com token expirado | Redirect login |
| CORS: Frontend→Backend | Requisição cross-origin | Aceita (mesmo domínio local) |
| SQL Injection | Tenta injetar SQL em search | Sanitized/blocked |
| CSRF (JWT) | POST sem token | 401 Unauthorized |

---

## 🚀 ENTREGA-1.5: Deploy

**Status:** Roadmap (2/4)

### Checklist
- [ ] Railway: Backend (PostgreSQL + Node)
- [ ] Vercel: Frontend (Next.js)
- [ ] Supabase: Database config (production)
- [ ] GitHub Actions: CI/CD pipeline
- [ ] Environment variables setadas
- [ ] Smoke tests em staging
- [ ] Rollback plan documentado

---

## 👥 ENTREGA-1.6: Handoff Cliente

**Status:** Roadmap (3/4)

### Atividades
1. Treinamento básico (login, CRUD, dashboard)
2. Documentação de operações (backup, recovery)
3. Suporte técnico inicial (1-2 semanas)
4. Feedback collection para Phase 2

---

## 🛠️ Ações Imediatas

### HOJE (31/03)
1. [ ] **Executar ENTREGA-1.2 testes** (CRUD, upload, Kanban)
   - Teste manual de cada AC
   - Registrar bugs/blockers
   - Atualizar ENTREGA-1.2-results.md

2. [ ] **Corrigir bloqueador AC6 (foto delete)**
   - Confirmar DELETE /inventory/:id/image existe
   - Testar endpoint
   - Verificar que image_url é NULL após delete

3. [ ] **Validar RLS policies**
   - Test_as_user para cada role
   - Confirmar isolamento dealership_id

### 1º DE ABRIL
1. [ ] **ENTREGA-1.3:** Imagens & RLS (full test)
2. [ ] **ENTREGA-1.4:** Segurança (full test)

### 2º DE ABRIL
1. [ ] **Deploy** Railway + Vercel
2. [ ] Smoke tests em staging

### 3º DE ABRIL
1. [ ] Handoff cliente
2. [ ] Treinamento

---

## 📝 Notas Técnicas

### Bloqueadores Conhecidos
1. ~~HTTP 500 no login~~ ✅ RESOLVIDO
2. ~~JWT sem dealership_id~~ ✅ RESOLVIDO
3. ❌ DELETE /inventory/:id/image → 404 (ativo)

### Decisões de Arquitetura
- JWT com dealership_id em payload (não user_metadata)
- RLS policies em todas tabelas de negócio
- Isolamento obrigatório via dealership_id
- Fotos em Supabase Storage (não DB blob)

### Configuração Produção
```env
DATABASE_URL=postgresql://prod-user:pwd@prod-server/dealer_sourcing
JWT_SECRET=(usar secret de 32+ caracteres)
SUPABASE_URL=(production URL)
SUPABASE_KEY=(production key)
NODE_ENV=production
```

---

## 🎯 Próximo Passo

**EXECUTAR ENTREGA-1.2** com foco em:
1. ✅ CRUD básico (criar/ler/editar/deletar)
2. ✅ Upload de foto (aparece na lista)
3. ✅ Kanban arrastável
4. ✅ RLS isolation (não vazar dados entre lojas)

**Tempo Estimado:** 2-3 horas de testes manuais + correções

---

**Criado:** 31/03/2026 20:30
**Status:** Em execução
**Responsável:** @qa (Claude Code)

