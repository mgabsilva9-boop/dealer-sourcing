# INVESTIGAÇÃO DE BUGS CRÍTICOS - GARAGEM MVP v1.5

## BUG #1: IPVA Tela Branca

### Status: INVESTIGADO - ROOT CAUSE IDENTIFICADO

### Root Cause Encontrado:

**Problema 1: Formato da resposta do `/ipva/list` incompatível**
- Backend retorna: `{ count: number, ipva_records: array }`
- Frontend espera: `array`

Localização em `src/routes/ipva.js` (linhas 223-226):
```javascript
res.json({
  count: result.rows.length,
  ipva_records: result.rows,  // ← AQUI!
});
```

Localização em `src/frontend/App.jsx` (linhas 631-634):
```javascript
const ipvaListData = await ipvaAPI.list();
if (ipvaListData && ipvaListData.length > 0) {  // ❌ ipvaListData é um objeto, não array!
  setIpvaList(ipvaListData);
}
```

**Resultado**: `setIpvaList()` recebe um objeto vazio, a tabela de IPVA tenta renderizar `{}.map()`, o que causa erro.

---

### Problema 2: Formato do `/ipva/summary` incompatível

Backend retorna:
```javascript
{
  paid: { count: 0, total: 0 },
  pending: { count: 0, total: 0 },
  urgent: { count: 0, total: 0 }
}
```

Frontend tenta acessar (`App.jsx` linhas 1430-1441):
```javascript
{ipvaSummary?.pending || 0}         // ← busca `pending` (objeto, não number!)
{ipvaSummary?.pending_amount || 0}  // ← `pending_amount` NÃO EXISTE
```

---

### Console Error Esperado (no browser F12):

```
TypeError: ipvaList.map is not a function
  at IPVATab (App.jsx:1496)
  at renderWithHooks (react.development.js:...)
```

---

## SOLUÇÃO PROPOSTA

### Fix #1: Alterar response do backend `/ipva/list`
- Mudar linha 223-226 em `src/routes/ipva.js` para retornar array direto:
```javascript
res.json(result.rows);
```

### Fix #2: Alterar response do backend `/ipva/summary`
- Mudar formato para retornar objeto simples com contadores:
```javascript
res.json({
  paid: result.rows.find(r => r.status === 'paid')?.count || 0,
  pending: result.rows.find(r => r.status === 'pending')?.count || 0,
  urgent: result.rows.find(r => r.status === 'urgent')?.count || 0,
  paid_amount: result.rows.find(r => r.status === 'paid')?.total_due || 0,
  pending_amount: result.rows.find(r => r.status === 'pending')?.total_due || 0,
  urgent_amount: result.rows.find(r => r.status === 'urgent')?.total_due || 0,
});
```

### Fix #3 (Alternativa): Frontend adaptar ao formato atual
- Mudar `App.jsx` linha 631-634 para:
```javascript
const ipvaListData = await ipvaAPI.list();
if (ipvaListData && ipvaListData.ipva_records && ipvaListData.ipva_records.length > 0) {
  setIpvaList(ipvaListData.ipva_records);
}
```

---

## DECISÃO

Vou implementar **Fix #1 + Fix #2** (backend):
- É mais correto ter o backend retornar dados estruturados
- A tabela renderiza direto: `ipvaList.map()` ✅
- Os cards stats ficam simples: `ipvaSummary.pending` ✅

---

## IMPLEMENTAÇÃO & RESULTADO FINAL

### Alterações Realizadas:

1. **src/routes/ipva.js (linha 236)**
   - Mudou: `res.json({ count, ipva_records })`
   - Para: `res.json(result.rows)`
   - ✅ Array agora retorna direto

2. **src/routes/ipva.js (linhas 173-199)**
   - Mudou: Objeto com estrutura `{ [status]: { count, total } }`
   - Para: Objeto flat com campos `paid`, `pending`, `urgent`, `paid_amount`, `pending_amount`, `urgent_amount`
   - ✅ Frontend consegue acessar `ipvaSummary.pending` e `ipvaSummary.pending_amount`

### Build Status:
```
✓ npm run build — 0 errors
✓ Vite build successful (257.39 kB gzipped)
```

### Commit:
```
Hash: ae0e07c
Message: fix: BUG #1 - IPVA tela branca - ajusta formato de resposta da API
```

### Timeline Real:

- Investigação + diagnóstico: 25 min
- Implementação dos 2 fixes: 10 min
- Build validation: 2 min
- Commit: 2 min
- **TOTAL: ~39 minutos**

### Próximos Passos:
- Deploy para produção (Railway)
- Teste em browser real (F12 Console)
- Verificar que aba IPVA carrega sem tela branca
- Proceeder com BUG #2

---

