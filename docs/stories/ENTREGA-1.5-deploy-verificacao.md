# Story: ENTREGA-1.5 — Deploy & Verificação Produção

**ID:** ENTREGA-1.5
**Epic:** epic-entrega-cliente.md
**Owner:** @devops (Gage)
**Prazo:** 0.5 dia
**Status:** Blocked by ENTREGA-1.4
**Prioridade:** CRÍTICA

---

## Resumo

Fazer deploy automático de Blocos 1-7 para Vercel (frontend) + Railway (backend), validar que produção está estável.

**Resultado Esperado:** ✅ Frontend e backend deployados, testes de smoke passando

---

## Acceptance Criteria

- [ ] AC1: Código commitado em `main` branch
- [ ] AC2: Vercel build completa sem erro
- [ ] AC3: Railway backend deploy completa sem erro
- [ ] AC4: Frontend acessível em Vercel URL
- [ ] AC5: Backend acessível em Railway URL
- [ ] AC6: Login em produção funciona
- [ ] AC7: Criar veículo em produção persiste
- [ ] AC8: Kanban funciona em produção
- [ ] AC9: Delete foto funciona em produção (sem erro 404)
- [ ] AC10: Segurança validada em produção (/metrics → 401, etc)

---

## Pré-requisitos

- ✅ ENTREGA-1.4 passou (segurança validada)
- Código local buildável: `npm run build` (frontend), backend inicia sem erro
- `.env` produção configurado
- Acesso a Vercel dashboard e Railway dashboard

---

## Instruções de Deploy

### Passo 1: Commit (Local)
```bash
cd /caminho/para/dealer-sourcing
git status

# Esperado: nenhum arquivo não commitado
# Se houver:
git add .
git commit -m "chore: preparar para go-live cliente"
```

**Resultado:** ✅ AC1 PASS

### Passo 2: Push para main
```bash
git push origin main
```

**Esperado:**
- Push sucede (não há conflitos)
- GitHub mostra novo commit em main branch

**Resultado:** ✅ AC1 PASS

### Passo 3: Aguardar Vercel Deploy (AC2)

**Automático:**
- Vercel detecta push em main
- Build inicia automaticamente
- Aguardar ~3-5 minutos

**Monitoramento:**
1. Acessar https://vercel.com/dashboard
2. Selecionar projeto "dealer-sourcing"
3. Aguardar status mudar para "Ready" ou "Completed"

**Se build falha:**
- Clicar em build → ver logs
- Erros comuns:
  - `npm install` falha → dependência quebrada
  - `npm run build` falha → erro de TypeScript ou JSX
  - Missing env variable → configurar em Vercel Settings
- Escalar para @dev se não for óbvio

**Resultado:** ✅ AC2 PASS (quando status = "Ready")

### Passo 4: Aguardar Railway Deploy (AC3)

**Automático:**
- Railway detecta novo commit
- Build e deploy inicia
- Aguardar ~2-3 minutos

**Monitoramento:**
1. Acessar https://railway.app/dashboard
2. Selecionar projeto "dealer-sourcing"
3. Ir para "Deployments"
4. Aguardar status verde (deployed)

**Se deploy falha:**
- Clicar em deployment → Logs
- Erros comuns:
  - Port bind error → port já em uso
  - Missing env variable → configurar em Railway Variables
  - Database migration error → escalar para @data-engineer
- Escalar para @dev

**Resultado:** ✅ AC3 PASS (quando status = deployed)

---

## Verificação em Produção

### AC4: Frontend Acessível
```bash
# Copiar URL de Vercel (ex: dealer-sourcing-seven.vercel.app)
curl -I https://dealer-sourcing-seven.vercel.app

# Esperado: HTTP 200
```

Ou simplesmente abrir no navegador:
- [ ] Página carrega sem erro
- [ ] Vê formulário de login
- [ ] Sem erros de CORS ou 403 Forbidden

**Resultado:** ✅ AC4 PASS

### AC5: Backend Acessível
```bash
# Railway URL (ex: dealer-sourcing-api.railway.app)
curl -I https://dealer-sourcing-api.railway.app/health

# Esperado: HTTP 200 com {"status": "ok"} ou similar
```

**Resultado:** ✅ AC5 PASS

### AC6: Login em Produção
1. Abrir URL Vercel (frontend)
2. Fazer login com credenciais reais
   - Email: dono@lojaA.com (ou conforme seed de prod)
   - Senha: [verificar em Railway variables ou seed]
3. **Esperado:** Dashboard carrega, vê veículos
4. Devtools → localStorage → verificar "token" presente

**Resultado:** ✅ AC6 PASS

### AC7: Criar Veículo em Prod
1. Ainda logado
2. Novo Veículo → preencher form
3. Salvar
4. **Esperado:** Aparece na lista
5. Logout → Login → **Esperado:** Veículo ainda lá (persistiu)

**Resultado:** ✅ AC7 PASS

### AC8: Kanban em Prod
1. Ir para seção Estoque
2. Ver kanban com 3 colunas
3. Arrastar card: available → reserved
4. **Esperado:** Card se move, drag feedback visual funciona
5. Refresh F5 → **Esperado:** Status persiste

**Resultado:** ✅ AC8 PASS

### AC9: Delete Foto em Prod ⭐
1. Abrir detalhe de veículo com foto
2. Botão delete foto
3. **CRÍTICO:** Não deve retornar erro 404 ("Rota não encontrada")
4. DevTools Console → nenhum erro JS
5. Foto desaparece

**Resultado:** ✅ AC9 PASS

**Se AC9 falha com 404:**
- Provavelmente Railway ainda rodam código antigo
- Opção 1: Aguardar mais redeploy
- Opção 2: Forçar redeploy manual:
  - Railway dashboard → Deployments → "Deploy latest" button
  - Aguardar 2-3 min
  - Testar novamente

### AC10: Segurança em Prod
```bash
API_URL="https://dealer-sourcing-api.railway.app"

# Teste 1: /metrics sem token → 401
curl -I $API_URL/metrics
# Esperado: 401 Unauthorized

# Teste 2: /cache/flush sem token → 401
curl -I -X DELETE $API_URL/api/cache/flush
# Esperado: 401 Unauthorized

# Teste 3: /seed sem secret → 403
curl -I -X POST $API_URL/auth/seed-default-users
# Esperado: 403 Forbidden
```

**Resultado:** ✅ AC10 PASS

---

## Documentação de Resultados

### Arquivo: `docs/qa/tests/ENTREGA-1.5-results.md`

```markdown
# Resultados: ENTREGA-1.5 — Deploy & Verificação

**Data:** [data]
**Deployer:** [nome]
**Status Geral:** ✅ PASSOU / ❌ FALHOU

## Deploy Status

| AC | Componente | Build | Deploy | URL |
|----|-----------|-------|--------|-----|
| AC2 | Frontend (Vercel) | ✅ | ✅ | [vercel URL] |
| AC3 | Backend (Railway) | ✅ | ✅ | [railway URL] |

## Smoke Tests (Produção)

| AC | Teste | Resultado | Notas |
|----|-------|-----------|-------|
| AC4 | Frontend Acessível | ✅ | 200 OK |
| AC5 | Backend Acessível | ✅ | /health OK |
| AC6 | Login | ✅ | Dashboard carrega |
| AC7 | Criar Veículo | ✅ | Persiste após F5 |
| AC8 | Kanban | ✅ | Drag funciona |
| AC9 | Delete Foto | ✅ | SEM erro 404 |
| AC10 | Segurança | ✅ | /metrics 401, /cache 401 |

## Problemas

- [ ] Nenhum
- [ ] [Se houver]

## Próximas Ações

- [ ] Avisar @sm que pode iniciar ENTREGA-1.6 (handoff)
- [ ] Notificar cliente que sistema está em produção
```

---

## Rollback (Se Necessário)

**Se produção quebra completamente:**

1. Identifique o problema (erro em logs)
2. Faça fix local em nova branch
3. Push da branch fix
4. Abra PR, espere review
5. Merge para main (auto-triggers redeploy)
6. Aguardar novo deploy

**OU (emergência):**

1. Reverter commit anterior:
```bash
git revert HEAD --no-edit
git push origin main
```
2. Vercel/Railway detectam e redeploy automático
3. Sistema volta à versão anterior

---

## Checklist Pós-Deploy

- [ ] Vercel build: ✅ PASS
- [ ] Railway build: ✅ PASS
- [ ] Frontend URL: ✅ Acessível
- [ ] Backend URL: ✅ Acessível
- [ ] Login: ✅ Funciona
- [ ] Smoke tests (AC6-10): ✅ PASS
- [ ] Nenhum erro crítico em produção
- [ ] Cliente pode acessar

---

**Bloqueador:** ENTREGA-1.4 ✅
**Desbloqueador para:** ENTREGA-1.6 (Handoff)
**Tempo Estimado:** 15-20 minutos (execução) + 10 min aguardando deploys
