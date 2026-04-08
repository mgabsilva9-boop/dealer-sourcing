# AUDITORIA EXECUTIVA - RECOMENDAÇÕES E PLANO DE AÇÃO

**Data:** 2026-04-07  
**Projeto:** Garagem (Dealer Sourcing MVP)  
**Preparado para:** Stakeholders (João, Kadu, Enzo)  
**Classificação:** CRÍTICO — MVP não pronto para entrega

---

## RESUMO EM 30 SEGUNDOS

O MVP tem **4 bugs críticos** que tornam impossível usar os módulos Financeiro e Estoque corretamente. Estimado **12-16 horas** para corrigir o mínimo necessário. **Recomendação:** Prorrogar entrega para cliente em 2-3 dias.

---

## OS 4 BUGS CRÍTICOS (prioridade de fix)

### 1️⃣ GASTOS NÃO SALVAM (Impacto: 10/10)

**O que é:** Clica "Nova Despesa" → erro ao salvar
- Criar: Erro genérico 500
- Editar: Erro genérico 500
- Deletar: Erro genérico 500

**Por que:** Backend valida mal dealership_id, retorna erro 500 sem dizer o quê

**Como fix (1-2h):** 
```javascript
// /src/routes/expenses.js linha 33
router.post('/create', authMiddleware, async (req, res) => {
  // ✅ VALIDAÇÃO EXPLÍCITA
  if (!req.user || !req.user.dealership_id) {
    return res.status(400).json({ error: 'dealership_id ausente' });
  }
  
  const amount = parseFloat(req.body.amount);
  if (isNaN(amount) || amount < 0) {
    return res.status(400).json({ error: 'Valor inválido' });
  }
  
  // ... resto do código
  
  catch (error) {
    console.error('Erro ao criar despesa:', error);
    // ✅ RETORNAR DETALHES
    res.status(500).json({
      error: 'Erro ao criar despesa',
      code: error.code,
      detail: error.message
    });
  }
});
```

**Impacto negócio:** Sem isto, NENHUMA despesa pode ser registrada. P&L completamente quebrado.

---

### 2️⃣ DASHBOARD NÃO ATUALIZA (Impacto: 9/10)

**O que é:** Adiciona novo carro → Dashboard continua mostrando totais antigos até F5

**Por que:** `useEffect` só executa no mount, sem polling automático

**Como fix (2-3h):**
```javascript
// /src/frontend/pages/DashboardFinancial.jsx linha 13

// ❌ ANTES
useEffect(() => {
  loadData();
}, []); // Executa APENAS no mount

// ✅ DEPOIS — Opção 1: Polling simples
useEffect(() => {
  loadData(); // Executar agora
  const interval = setInterval(loadData, 30000); // A cada 30s
  return () => clearInterval(interval); // Cleanup
}, []);

// ✅ DEPOIS — Opção 2: Auto-refetch após eventos
useEffect(() => {
  loadData();
  // Quando um novo veículo é adicionado em outro tab
  const handleStorageChange = () => loadData();
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);

// ✅ DEPOIS — Opção 3: React Query (melhor)
// const { data: financial } = useQuery(['financial'], fetchFinancial, {
//   refetchInterval: 30000,
// });
```

**Impacto negócio:** Gerente toma decisão financeira com dados de 5 min atrás.

---

### 3️⃣ CARRO DESAPARECE AO F5 (Impacto: 8/10)

**O que é:** Marca carro como "vendido" → desaparece ao recarregar página em alguns casos

**Por que:** 
1. `sold_date` é DATE (sem timezone), não TIMESTAMP
2. Query sem índice composto (dealership_id, status)
3. Table scan em produção = inconsistência

**Como fix (1-2h):**
```sql
-- 1. Adicionar índice (backend: src/routes/inventory.js)
CREATE INDEX IF NOT EXISTS idx_inventory_dealership_status 
ON inventory(dealership_id, status);

-- 2. Fixar sold_date para usar TIMESTAMP com timezone
ALTER TABLE inventory 
ALTER COLUMN sold_date TYPE TIMESTAMPTZ USING sold_date AT TIME ZONE 'America/Sao_Paulo';
```

**Impacto negócio:** Dois vendedores tentam vender o mesmo carro (double-booking).

---

### 4️⃣ EDIÇÕES DÃO ERRO (Impacto: 7/10)

**O que é:** Edita preço, nome do carro, cliente → erro genérico 500

**Por que:** 
1. Sem validação de tipo (year: string vs number)
2. Sem validação de business logic (purchasePrice > salePrice)
3. Erro 500 genérico ao rejeitar

**Como fix (2-3h):**
```javascript
// /src/routes/inventory.js linha 502
router.put('/:id', authMiddleware, async (req, res) => {
  // ✅ VALIDAÇÃO DE TIPOS
  const year = parseInt(req.body.year, 10);
  if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
    return res.status(400).json({ error: 'year inválido' });
  }
  
  const purchasePrice = parseFloat(req.body.purchasePrice);
  const salePrice = parseFloat(req.body.salePrice);
  
  // ✅ VALIDAÇÃO DE BUSINESS LOGIC
  if (purchasePrice > salePrice) {
    return res.status(400).json({ 
      error: 'Preço de compra não pode ser maior que preço de venda',
      received: { purchasePrice, salePrice }
    });
  }
  
  // ✅ SANITIZAÇÃO
  const make = (req.body.make || '').trim().substring(0, 100);
  if (!make) return res.status(400).json({ error: 'make obrigatório' });
  
  // ... resto do código
  
  catch (error) {
    // ✅ DIFERENCIAÇÃO DE ERRO
    if (error.code === '23505') { // Unique constraint
      return res.status(409).json({ error: 'Registro duplicado' });
    }
    if (error.code === '23503') { // Foreign key
      return res.status(400).json({ error: 'Referência inválida' });
    }
    res.status(500).json({
      error: 'Erro ao atualizar',
      code: error.code
    });
  }
});
```

**Impacto negócio:** Usuário desiste de editar, cria carro novo → duplicação de registros.

---

## PLANO DE AÇÃO (48 HORAS)

### DIA 1 (8h) — Unblock Módulo Financeiro

**Morning (2-3h): Fix #1 + #2**
- [ ] Adicionar validações em `/src/routes/expenses.js`
- [ ] Implementar polling em `DashboardFinancial.jsx`
- [ ] Testar: criar/editar/deletar despesa 3x cada
- [ ] Testar: Dashboard atualiza sem F5 após criar veículo

**Afternoon (2-3h): Fix #3 + #4**
- [ ] Adicionar índice composto ao banco
- [ ] Corrigir sold_date para TIMESTAMPTZ
- [ ] Adicionar validações em `/src/routes/inventory.js` (tipos + business logic)
- [ ] Testar: marcar como vendido 5x, F5 sempre mostra vendido
- [ ] Testar: editar preço de carro, persiste ao F5

**Evening (1-2h): Testes Integrados**
- [ ] Testar fluxo completo: criar carro → atualizar preço → marcar vendido → checar dashboard
- [ ] Verificar logs para erros não detectados
- [ ] Commit + push para GitHub

### DIA 2 (4-6h) — Observabilidade + Deploy

**Morning (2-3h): Logging Estruturado**
- [ ] Adicionar logger com Winston (estruturado com request ID)
- [ ] Instrumentar endpoints críticos
- [ ] Setup Sentry para erros em produção

**Afternoon (2-3h): Deploy + Validação**
- [ ] Deploy para staging (Vercel + Railway)
- [ ] Smoke tests em staging
- [ ] Deploy para produção
- [ ] Validar com cliente real

### DIA 3 (4h) — Segurança + Documentação

**Morning (2h): Security Fixes**
- [ ] Sanitizar strings (usar biblioteca `xss`)
- [ ] Implementar rate limiting (express-rate-limit)
- [ ] Adicionar CSRF tokens

**Afternoon (2h): Documentação**
- [ ] Atualizar README.md com troubleshooting
- [ ] Documentar APIs com exemplos de erro
- [ ] Criar guia de deploy

---

## RISCOS SE NÃO CORRIGIRMOS

| Risk | Impacto | Probabilidade | Mitigação |
|------|---------|--------------|-----------|
| Cliente não consegue salvar despesas | Operação parada | 100% | Fix #1 (1-2h) |
| Dashboard sempre desatualizado | Decisões erradas | 90% | Fix #2 (2-3h) |
| Double-booking de venda | Perda de venda | 40% | Fix #3 (1-2h) |
| Duplicação de registros | Dados inconsistentes | 70% | Fix #4 (2-3h) |
| Não saber causa de erro em produção | Support inefetivo | 95% | Logging + Sentry (2-3h) |

---

## ORÇAMENTO DE TEMPO (Total: 12-16h)

```
Fix #1 (Gastos):         2-3h  ← MÁXIMO IMPACTO
Fix #2 (Dashboard):      2-3h
Fix #3 (Carro desaparece): 1-2h
Fix #4 (Edições):        2-3h
Logging + Sentry:        2-3h
Testes:                  1-2h
Deploy:                  1-2h
─────────────────────────────
TOTAL:                   12-16h
```

**Estimativa de conclusão:** 2-3 dias de trabalho em tempo integral (ou 4-5 dias se part-time)

---

## COMUNICAÇÃO COM CLIENTE

### Mensagem Recomendada

> Olá [Cliente],
>
> Concluímos auditoria completa do MVP Garagem. Identificamos 4 bugs críticos que precisam ser corrigidos antes da entrega:
>
> 1. **Despesas não salvam** (impacto: módulo Financeiro parado)
> 2. **Dashboard não atualiza** (decisões com dados atrasados)
> 3. **Status de carro não persiste** (risco de double-booking)
> 4. **Edições dão erro** (impossível corrigir dados)
>
> **Plano:** Corrigir em 2-3 dias (12-16h de trabalho)
>
> **Opções:**
> - A) Prorrogar entrega para [data + 3 dias] — recomendado
> - B) Fazer demo com MVP parcial (apenas estoque, sem financeiro)
> - C) Manter cronograma, entregar com bugs (não recomendado)
>
> Qual sua preferência?
>
> Att, ThreeOn

---

## MÉTRICAS PÓS-FIX

Após aplicar todos os 4 fixes, esperamos:

- ✅ **100% de despesas salvam**
- ✅ **Dashboard atualiza em <5s**
- ✅ **Status persiste corretamente**
- ✅ **Edições funcionam sem erro**
- ✅ **Erros são detalhados (não genéricos)**
- ✅ **Logs estruturados com request ID**

---

## RECOMENDAÇÕES FUTURAS (Fase 2)

1. **Testes Automatizados:** Implementar Jest + Supertest
2. **CI/CD:** Rodar testes em cada PR
3. **Monitoring:** Setup Datadog ou New Relic
4. **SLOs:** Definir uptime target (99.5% min)
5. **Backup:** Daily backups de produção
6. **Disaster Recovery:** RTO < 2h, RPO < 1h

---

## CHECKLIST PRÉ-ENTREGA

- [ ] Todos os 4 bugs corrigidos
- [ ] Validações em todos endpoints (400 vs 500)
- [ ] Logging estruturado com request ID
- [ ] Testes manuais completos (checklist incluído)
- [ ] Deploy em staging validado
- [ ] Console sem erros (F12)
- [ ] Performance aceitável (< 2s load)
- [ ] Responsividade confirmada (mobile + tablet)
- [ ] Credenciais de teste funcionando
- [ ] Documentação atualizada
- [ ] Stakeholders aprovam

---

## CONTATO PARA DÚVIDAS

- **Tech Lead:** @dev (implementação)
- **QA:** @qa (testes)
- **DevOps:** @devops (deploy)
- **PM:** @pm (cronograma)
