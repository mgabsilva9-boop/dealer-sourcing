# FIX RÁPIDO — Problema #3: Clientes Campos Faltando

**Status:** ✅ CONFIRMADO — 3 campos não editáveis
**Severidade:** 🟡 ALTO
**Esforço:** ~15-20 minutos
**Localização:** `/src/frontend/App.jsx` linhas 406-434

---

## Problema Identificado

Na aba **CLIENTES**, quando cliente clica "Editar" em um cliente, aparecem campos como:
- ✅ Telefone (editável)
- ✅ Email (editável)
- ✅ Profissão (editável)
- ❌ Veículo (SÓ visualização)
- ❌ Data Compra (SÓ visualização)
- ❌ Valor Compra (SÓ visualização)

Os 3 últimos aparecem em cards de visualização, mas não têm botão de editar.

---

## Root Cause

**App.jsx linhas 406-410 (CARDS DE VISUALIZAÇÃO):**
```jsx
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
  <Card style={{ padding: 14 }}>
    <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase" }}>Veiculo</div>
    <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{c.vehicleBought}</div>
  </Card>
  <Card style={{ padding: 14 }}>
    <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase" }}>Data</div>
    <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{c.purchaseDate ? new Date(c.purchaseDate).toLocaleDateString("pt-BR") : "---"}</div>
  </Card>
  <Card style={{ padding: 14 }}>
    <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase" }}>Valor</div>
    <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4, color: C.green }}>{c.purchaseValue ? fmtFull(c.purchaseValue) : "---"}</div>
  </Card>
</div>
```

Depois, campos editáveis estão em dois cards separados (linhas 411-434):
```jsx
Card 1 - "Perfil do Cliente":
  <EditField label="Estilo" ... />
  <EditField label="Regiao" ... />
  <EditField label="Profissao" ... />
  <EditField label="Aniversario" ... />
  // ❌ FALTAM aqui: Vehicle, Date, Value

Card 2 - "Contato & Origem":
  <EditField label="Telefone" ... />
  <EditField label="Email" ... />
  <EditField label="Como chegou" ... />
  // ...
```

---

## Solução (Opção A — Recomendada)

Adicionar 3 `EditField` no Card 1 "Perfil do Cliente" após a linha 417 (depois de "Aniversario"):

**Localização:** `/src/frontend/App.jsx` linha ~417

**Código a Adicionar:**
```jsx
<EditField label="Veiculo Comprado" value={c.vehicleBought || ""} onChange={function(v) { updC("vehicleBought", v); }} />
<EditField label="Data Compra" value={c.purchaseDate || ""} onChange={function(v) { updC("purchaseDate", v); }} type="date" />
<EditField label="Valor Compra" value={c.purchaseValue || 0} onChange={function(v) { updC("purchaseValue", Number(v) || 0); }} type="number" />
```

**Contexto (antes e depois):**

**ANTES (linha 417):**
```jsx
            <EditField label="Aniversario" value={c.birthday || ""} onChange={function(v) { updC("birthday", v); }} />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: C.textDim }}>Colecionador</span>
```

**DEPOIS:**
```jsx
            <EditField label="Aniversario" value={c.birthday || ""} onChange={function(v) { updC("birthday", v); }} />
            <EditField label="Veiculo Comprado" value={c.vehicleBought || ""} onChange={function(v) { updC("vehicleBought", v); }} />
            <EditField label="Data Compra" value={c.purchaseDate || ""} onChange={function(v) { updC("purchaseDate", v); }} />
            <EditField label="Valor Compra" value={c.purchaseValue || 0} onChange={function(v) { updC("purchaseValue", Number(v) || 0); }} type="number" />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: C.textDim }}>Colecionador</span>
```

---

## Por que isso funciona?

1. **`EditField`** é um componente que:
   - Renderiza valor normal (read-only)
   - Ao clicar, transforma em input editável
   - Ao clicar OK, chama `onChange` com novo valor

2. **`updC("vehicleBought", v)`** chama:
   ```javascript
   var updC = function(field, val) {
     setCustomers(...); // atualiza estado React
     crmAPI.update(c.id, { [field]: val }); // envia PUT para backend
   };
   ```

3. **Backend suporta** (routes/crm.js):
   ```javascript
   vehicle_bought = COALESCE($5, vehicle_bought),
   purchase_date = COALESCE($6, purchase_date),
   purchase_value = COALESCE($7, purchase_value),
   ```

---

## Solução (Opção B — Alternativa)

Se quiser manter os cards de visualização, adicionar um novo card separado:

**Localização:** Inserir novo Card entre linhas 434 e 435

```jsx
<Card style={{ padding: 18 }}>
  <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", marginBottom: 12, fontWeight: 500 }}>Compra do Veiculo</div>
  <EditField label="Veiculo" value={c.vehicleBought || ""} onChange={function(v) { updC("vehicleBought", v); }} />
  <EditField label="Data Compra" value={c.purchaseDate || ""} onChange={function(v) { updC("purchaseDate", v); }} />
  <EditField label="Valor Compra" value={c.purchaseValue || 0} onChange={function(v) { updC("purchaseValue", Number(v) || 0); }} type="number" />
</Card>
```

---

## Passos para Implementar

### Opção A (Recomendada):
1. Abrir `/src/frontend/App.jsx`
2. Procurar linha ~417 (após `<EditField label="Aniversario"`)
3. Adicionar 3 linhas de EditField
4. Salvar
5. Testar em `localhost:5173` (ou seu dev server)

### Opção B:
1. Abrir `/src/frontend/App.jsx`
2. Procurar linha ~434 (após fechar Card 2)
3. Adicionar novo Card com 3 EditFields
4. Salvar
5. Testar

### Teste Visual:
1. Ir para aba CLIENTES
2. Clicar em um cliente
3. No Card "Perfil do Cliente", verificar:
   - [ ] Aparece "Veiculo Comprado"
   - [ ] Aparece "Data Compra"
   - [ ] Aparece "Valor Compra"
4. Clicar em um dos campos
5. Editar valor
6. Clicar OK
7. Valor muda na interface?
8. F5 (reload)
9. Valor persiste?

---

## Validação Backend

O backend **JÁ SUPORTA** estes campos (routes/crm.js):

```javascript
// POST CREATE (linhas 42-64):
INSERT INTO customers
(...vehicle_bought, purchase_date, purchase_value...)

// PUT UPDATE (linhas 105-124):
UPDATE customers
SET vehicle_bought = COALESCE($5, vehicle_bought),
    purchase_date = COALESCE($6, purchase_date),
    purchase_value = COALESCE($7, purchase_value),
...
```

Portanto, a API está pronta. Só falta a UI.

---

## Estimativa

- **Leitura do código:** 2 min
- **Copiar-colar 3 linhas:** 2 min
- **Teste manual:** 5-10 min
- **Debug se algo quebrar:** 5-10 min

**Total:** 15-25 minutos

---

## Checklist Final

- [ ] Código adicionado
- [ ] Syntax OK (sem erros)
- [ ] Campos aparecem na UI
- [ ] Editar campo funciona
- [ ] Backend persiste valor
- [ ] F5 reload mantém dados

---

## Alternativa: Remover Cards de Visualização

Se preferir, também pode remover os 3 cards de visualização (linhas 406-410) para evitar duplicação visual:

**Remover:**
```jsx
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
  <Card>Veiculo</Card>
  <Card>Data</Card>
  <Card>Valor</Card>
</div>
```

Assim os campos ficam **UM ÚNICO LUGAR** nos EditFields do Card de Perfil.

**Vantagem:** Sem duplicação, mais limpo.
**Desvantagem:** Perde a visualização rápida durante listing.

---

**Recomendação:** Opção A (adicionar EditFields, manter cards de visualização) = melhor UX.
