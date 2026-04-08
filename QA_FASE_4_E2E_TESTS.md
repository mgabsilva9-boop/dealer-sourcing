# FASE 4: TESTES E2E COMPLETOS

**Status:** 🔄 EM EXECUÇÃO  
**Data Início:** 2026-04-08 00:40 UTC  
**QA Agent:** Claude Code (@qa)  
**Ambiente:** Produção (Vercel + Railway)

---

## ENDPOINTS TESTADOS

- Frontend: https://dealer-sourcing-frontend.vercel.app
- Backend: https://dealer-sourcing-api-production.up.railway.app
- Credenciais de Teste: dono@brossmotors.com / bross2026

---

## TEST SUITE 1: BUGS CORRIGIDOS (FASE 1)

### Bug #1: Expenses salvam corretamente
- [ ] Login com credenciais corretas
- [ ] Aba Financeiro → "Nova Despesa"
- [ ] Adicionar despesa com valores válidos
- [ ] Verificar persistência após F5

### Bug #2: Financial tab sincroniza
- [ ] Aba Estoque → Marcar veículo como "Vendido"
- [ ] Aba Financeiro → Verificar atualização instantânea
- [ ] Verificar que NÃO PRECISA F5

### Bug #3: Vehicle sold persists
- [ ] Marcar veículo como "VENDIDO"
- [ ] Refresh página (F5)
- [ ] Verificar que continua "VENDIDO" (não volta para "disponível")

### Bug #4: Edit endpoints validate
- [ ] Tentar editar veículo com ano inválido
- [ ] Verificar erro 400 específico (não 500)
- [ ] Tentar purchasePrice > salePrice
- [ ] Verificar erro 400 apropriado

---

## TEST SUITE 2: CUSTOS DINÂMICOS (Cards)

- [ ] Criar veículo com custos
- [ ] Cards de custos aparecem
- [ ] Total atualiza em tempo real
- [ ] Editar custos existentes
- [ ] Deletar custos com confirmação
- [ ] Persistência após F5

---

## TEST SUITE 3: STATUS VISUAL (Pills)

- [ ] Mudar status via pills (6 status disponíveis)
- [ ] Cores corretas por status
- [ ] Metadata atualiza (last_changed, changed_by)
- [ ] Status persiste após F5

---

## TEST SUITE 4: INTEGRAÇÃO ENTRE ABAS (SEM F5)

- [ ] Estoque → Financeiro sincroniza
- [ ] Despesas integram corretamente
- [ ] Múltiplas mudanças simultâneas
- [ ] Sem F5 necessário

---

## TEST SUITE 5: SMOKE TESTS (Produção)

- [ ] Login funciona
- [ ] Inventory list carrega
- [ ] Criar veículo funciona
- [ ] Editar veículo funciona
- [ ] Dashboard mostra dados
- [ ] Sem console errors
- [ ] Sem 404s ou 500s
- [ ] Mobile responsivo

---

## TEST SUITE 6: EDGE CASES

- [ ] Custo com valor 0
- [ ] Custo com valor negativo
- [ ] Categoria muito longa
- [ ] Múltiplos status changes rápidos
- [ ] Mudança de status durante carregamento

---

## RESULTADO FINAL

| Suite | Status | Detalhes |
|-------|--------|----------|
| Suite 1 (Bugs) | ⏳ Pendente | - |
| Suite 2 (Custos) | ⏳ Pendente | - |
| Suite 3 (Status) | ⏳ Pendente | - |
| Suite 4 (Integração) | ⏳ Pendente | - |
| Suite 5 (Smoke) | ⏳ Pendente | - |
| Suite 6 (Edge) | ⏳ Pendente | - |

---

## LOGS

[Começando testes em 2026-04-08 00:40 UTC]

