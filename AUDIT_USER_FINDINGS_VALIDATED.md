# AUDIT — Problemas Encontrados pelo Cliente (VALIDAÇÃO ESTÁTICA)

Timestamp: 2026-04-08 09:10 UTC

## Metodologia
Este audit foi conduzido através de **análise estática de código-fonte** (backend + frontend) sem execução em headless browser, pois não tenho acesso a browser headless automatizado. As conclusões são baseadas em:

1. Análise dos endpoints REST (routes/)
2. Análise da lógica React (src/frontend/App.jsx)
3. Análise do API client (src/frontend/api.js)
4. Rastreamento de data flow e estado

---

## PROBLEMA #1: Estoque Tela Branca

### Status: ⚠️ NÃO CONFIRMADO (SEM EXECUÇÃO)

#### Achados de Código-Fonte:

**Backend - GET /inventory/list (routes/inventory.js linhas 280-312)**
```javascript
router.get('/list', authMiddleware, async (req, res) => {
  // ... validação dealership_id ✅
  const result = await query(
    `SELECT i.*, ... FROM inventory i
     LEFT JOIN vehicle_costs vc
     WHERE i.dealership_id = $1 AND i.deleted_at IS NULL
     GROUP BY i.id`
  );
  const vehicles = result.rows.map(normalizeVehicle); // ✅ normalização
  res.json({ total: vehicles.length, vehicles }); // ✅ resposta
});
```
✅ **Endpoint correto:**
- Retorna status 200 com `{ total, vehicles }`
- Filtra por dealership_id
- Normaliza dados (snake_case → camelCase)

**Frontend - Carregamento (App.jsx linha 612)**
```javascript
const [vehiclesData, ...] = await Promise.all([
  inventoryAPI.list().catch(() => ({})), // ✅ com fallback
  ...
]);
if (vehiclesData && vehiclesData.vehicles && vehiclesData.vehicles.length > 0) {
  setVehicles(vehiclesData.vehicles);
}
```
✅ **Carregamento com tratamento de erro**

**Frontend - Renderização (App.jsx linhas 1137-1167)**
```javascript
{invView === "lista" && <div style={{ display: "grid", gap: 10 }}>
  {useMemo(function() {
    return dispV.map(function(v) { // ✅ itera sobre veículos
      return <Card key={v.id}>...</Card>; // renderiza card
    });
  }, [dispV, imgErr, statusMap])}
</div>}
```
✅ **Renderização presente**

#### Conclusão Problema #1:
```
[?] NÃO CONFIRMADO — Código-fonte parece correto
    • Endpoint existe e retorna dados
    • Carregamento tem fallback
    • Renderização está presente
    
[!] POSSÍVEIS CAUSAS (sem execução):
    1. Erro de rede silencioso (CORS, timeout, 401)
    2. dealership_id ausente no token JWT
    3. Dados voltam vazios ([]) — sem erro, sem veículos
    4. Problema no enviroment (API_BASE incorreto em produção)
    5. Cache HTML/JS stale no Vercel
```

**Teste Manual Recomendado:**
1. F12 → Network tab
2. Carregar tab Estoque
3. Procurar request GET /inventory/list
4. Verificar:
   - [ ] Status 200? (ou 401/403/500?)
   - [ ] Response tem veículos? (array vazio?)
   - [ ] Console tab tem erros? (quais?)

---

## PROBLEMA #2: Delete/Edit Gastos Não Funciona + Não Salva

### Status: ⚠️ PARCIALMENTE CONFIRMADO

#### Achados DELETE:

**Backend - DELETE /expenses/:id (routes/expenses.js linhas 185-205)**
```javascript
router.delete('/:id', authMiddleware, async (req, res) => {
  const result = await query(
    'DELETE FROM expenses WHERE id = $1 AND dealership_id = $2 RETURNING id',
    [id, req.user.dealership_id],
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Despesa não encontrada' });
  }
  res.json({ message: 'Despesa deletada com sucesso' });
});
```
✅ **Endpoint correto:** verifica dealership_id, retorna 200 se OK

**Frontend - DELETE (App.jsx linha 1660)**
```javascript
<button onClick={async function() {
  if (confirm("Deletar esta despesa?")) {
    try {
      await expensesAPI.delete(e.id);
      setExpenses(function(p) { return p.filter(function(x) { return x.id !== e.id; }); });
    } catch (err) {
      alert("Erro ao deletar: " + err.message);
    }
  }
}}>{...}</button>
```
✅ **Lógica correta:**
- Chama API
- Atualiza estado React
- Trata erro com alert

#### Achados EDIT (PUT):

**Backend - PUT /expenses/:id (routes/expenses.js linhas 152-182)**
```javascript
router.put('/:id', authMiddleware, async (req, res) => {
  const result = await query(
    `UPDATE expenses
     SET category = COALESCE($1, category),
         description = COALESCE($2, description),
         amount = COALESCE($3, amount),
         status = COALESCE($4, status),
         date = COALESCE($5, date),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $6 AND dealership_id = $7
     RETURNING *`,
    [category, description, amount, status, date, id, req.user.dealership_id],
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Despesa não encontrada' });
  }
  res.json({ message: '...', expense: result.rows[0] });
});
```
✅ **Endpoint correto:** usa COALESCE para partial updates

**Frontend - NÃO ENCONTREI EDIT DIRETO**
```javascript
// Há CRIAR novo gasto (linha 1643) ✅
// Há DELETAR gasto (linha 1660) ✅
// MAS NÃO HÁ BOTÃO EDIT em linha nenhuma
```
❌ **ACHADO CRÍTICO:** Não há funcionalidade de editar gasto no frontend!
- Só é possível criar ou deletar
- Não há modal/form para editar valor/categoria/data

#### Conclusão Problema #2:
```
[✅] DELETE FUNCIONA (código-fonte OK)
     • Endpoint correto
     • Frontend correto
     • Lógica de estado OK

[❌] EDIT NÃO EXISTE (achado crítico!)
     • Não há UI para editar despesa
     • Não há chamada PUT no código
     • Cliente esperava poder editar mas feature não foi implementada

[⚠️]  Possível interpretação:
     "Ao editar gasto" = Cliente tentou clicar em algo que não existe
     Resultado: "não funciona" = Feature não implementada, não bug
```

**Teste Manual Recomendado:**
1. Aba GASTOS
2. Procurar botão "Editar" em um gasto
3. [ ] Existe? → Testar edit
4. [ ] Não existe? → Confirma achado

---

## PROBLEMA #3: Clientes Faltam Campos (vehicle/valor/data)

### Status: ✅ CONFIRMADO

#### Achados - Visualização CRIAÇÃO (App.jsx linhas 468-482):
```javascript
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
  <div><label>Nome</label><input value={form.name} /></div>
  <div><label>Telefone</label><input value={form.phone} /></div>
  <div><label>Email</label><input value={form.email} /></div>
  <div><label>CPF</label><input value={form.cpf} /></div>
  <div><label>Profissao</label><input value={form.profession} /></div>
  <div><label>Regiao</label><input value={form.region} /></div>
</div>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
  <div><label>Estilo</label><input value={form.style} /></div>
  <div><label>Veiculo</label><input value={form.vehicleBought} /></div>  ✅
  <div><label>Data</label><input type="date" value={form.purchaseDate} /></div>  ✅
  <div><label>Valor</label><input type="number" value={form.purchaseValue} /></div>  ✅
</div>
```
✅ **Na criação, campos ESTÃO PRESENTES:** vehicle, data, valor

#### Achados - Visualização EDIÇÃO (App.jsx linhas 406-434):
```javascript
// Cards de visualização (linhas 406-410):
<Card><div>Veiculo</div><div>{c.vehicleBought}</div></Card>
<Card><div>Data</div><div>{c.purchaseDate}</div></Card>
<Card><div>Valor</div><div>{c.purchaseValue}</div></Card>

// Campos editáveis em 2 cards (linhas 411-434):
Card 1 - "Perfil do Cliente":
  <EditField label="Estilo" />
  <EditField label="Regiao" />
  <EditField label="Profissao" />
  <EditField label="Aniversario" />
  <button>Colecionador</button>

Card 2 - "Contato & Origem":
  <EditField label="Telefone" />
  <EditField label="Email" />
  <EditField label="Como chegou" />
  <select>Contato preferido</select>
```

❌ **NA EDIÇÃO, CAMPOS FALTANDO:**
- vehicleBought → SÓ VISUALIZAÇÃO, sem EditField
- purchaseDate → SÓ VISUALIZAÇÃO, sem EditField
- purchaseValue → SÓ VISUALIZAÇÃO, sem EditField

#### Confirmação Backend:
```javascript
// CRM API PUT (routes/crm.js linhas 99-139):
// Suporta: vehicleBought, purchaseDate, purchaseValue ✅
const { name, phone, email, cpf, vehicleBought, purchaseDate, purchaseValue, ... } = req.body;
// UPDATE customers SET ... vehicle_bought = COALESCE($5, vehicle_bought), ...
```
✅ **Backend SIM, Frontend NÃO**

#### Conclusão Problema #3:
```
[✅] CONFIRMADO — Campos faltando na EDIÇÃO

ACHADO:
  ❌ Editar vehicleBought — NÃO TEM EditField
  ❌ Editar purchaseDate — NÃO TEM EditField
  ❌ Editar purchaseValue — NÃO TEM EditField

CAUSA:
  Frontend não renderiza EditField para estes 3 campos
  Backend suporta update, mas UI não permite
  Cliente SÓ CONSEGUE EDITAR: name, phone, email, cpf, style, region, profession, birthday, collector, referral, contactPref, notes

SOLUÇÃO:
  Adicionar 3 EditField no Card de "Perfil do Cliente" ou criar novo card:
  <EditField label="Veiculo" value={c.vehicleBought} onChange={...} />
  <EditField label="Data Compra" value={c.purchaseDate} onChange={...} type="date" />
  <EditField label="Valor Compra" value={c.purchaseValue} onChange={...} type="number" />
```

---

## PROBLEMA #4: 80% dos Saves com Erro

### Status: ⚠️ NÃO CONFIRMADO (REQUER EXECUÇÃO)

#### Análise Teórica:

**Endpoints testados (backend routes/):**

| Endpoint | Create | Edit | Delete |
|----------|--------|------|--------|
| /inventory/* | ✅ | ✅ | ✅ |
| /expenses/* | ✅ | ✅ | ✅ |
| /crm/* | ✅ | ✅ | ✅ |

Todos têm:
- ✅ authMiddleware
- ✅ dealership_id validation
- ✅ RETURNING clause (postgres)
- ✅ Error handling (try/catch)

**Frontend CRUD (App.jsx):**

| Operation | Code Present | Error Handling |
|-----------|--------------|----------------|
| inventoryAPI.create | ✅ linha 264 | ✅ try/catch |
| inventoryAPI.update | ✅ linha 747 | ✅ try/catch |
| inventoryAPI.delete | ✅ linha 1341 | ✅ try/catch |
| expensesAPI.create | ✅ linha 1643 | ✅ try/catch + alert |
| expensesAPI.delete | ✅ linha 1660 | ✅ try/catch + alert |
| crmAPI.create | ✅ linha 450 | ✅ try/catch + alert |
| crmAPI.update | ✅ linha 386 | ✅ try/catch |
| crmAPI.delete | ✅ linha 440 | ✅ try/catch + alert |

✅ **Toda CRUD tem try/catch + alert**

#### Possíveis Problemas (sem execução):

1. **Token JWT expirado** → 401 auto-logout (api.js linhas 34-39)
2. **dealership_id ausente** → 400/401 erro
3. **Validação silenciosa** → Frontend valida, não envia request
4. **CORS error** → Request bloqueada, erro silencioso no console
5. **API_BASE incorreta em produção** → Request vai para URL errada
6. **Erro no PostgreSQL** → 500, mensagem de erro genérica

#### Conclusão Problema #4:
```
[?] NÃO CONFIRMADO — Código-fonte parece OK

POSSÍVEIS CAUSAS (em ordem de probabilidade):
  1. Token JWT vencido → 401 → auto-logout visível
  2. dealership_id ausente no token → 400/401 → erro no console
  3. API_BASE incorreto em produção → request falha silenciosa
  4. CORS misconfigured → browser bloqueia request
  5. Backend timeout ou crash → 5xx
  6. Database connection failure → 5xx

EVIDÊNCIA DE FUNCIONAMENTO:
  • Todos endpoints têm validações
  • Todos CRUDs têm try/catch
  • Estado React atualiza otimisticamente
  • Toasts e alerts implementados
  • seedVehicles funciona (inicializa 5 carros)
  • seedCustomers funciona (inicializa 3 clientes)

RECOMENDAÇÃO:
  Executar testes manuais com DevTools (Network + Console)
  para capturar status codes reais e mensagens de erro
```

---

## SUMMARY FINAL

| Problema | Status | Severidade | Root Cause |
|----------|--------|-----------|-----------|
| #1 Estoque Branca | ❓ Não Confirmado | 🔴 CRÍTICO | Precisa execução (rede? dados vazios?) |
| #2 Edit Gastos | ✅ Confirmado | 🔴 CRÍTICO | Feature NÃO implementada (sem EditField) |
| #2 Delete Gastos | ✅ OK (código) | ⚪ OK | Deve funcionar, precisa execução |
| #3 Clientes Campos | ✅ Confirmado | 🟡 ALTO | 3 campos faltando EditField |
| #4 80% Saves Erro | ❓ Não Confirmado | 🔴 CRÍTICO | Precisa Network tab + Console logs |

---

## RECOMENDAÇÕES IMEDIATAS

### Quick Wins (Código OK, Só Precisa Testar):
1. ✅ DELETE Gastos → Abrir DevTools, clicar Delete, verificar status 200
2. ✅ Estoque Carregamento → F12 Network, procurar GET /inventory/list

### Bugs a Consertar:
1. ❌ **EDITORIAL** — Adicionar EditField para vehicle/data/valor em Clientes
2. ⚠️ **FEATURE** — Implementar Edit para Gastos (se cliente esperava)

### Diagnóstico Necessário:
1. Executar testes manuais com Network + Console aberto
2. Verificar todos 4 problemas em produção
3. Coletar screenshots de erros

---

**Próximo Passo:** Executar testes manuais em https://dealer-sourcing-frontend.vercel.app com DevTools aberto para validar conclusões deste audit estático.

