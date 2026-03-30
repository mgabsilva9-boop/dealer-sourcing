# AÇÃO IMEDIATA: Configurar Vercel Dashboard

## Status
- Código corrigido: ✅ (commit feito)
- Ambiente local pronto: ✅ (npm run verify:api passou)
- **Falta apenas:** Configurar variável em Vercel Dashboard + Redeploy

## O Que Fazer AGORA

### Passo 1: Abrir Vercel Dashboard
```
https://vercel.com/dashboard
```

### Passo 2: Selecionar Projeto
- Procure por: `dealer-sourcing-frontend`
- Clique nele

### Passo 3: Ir para Settings
```
Settings (menu no topo) → Environment Variables
```

### Passo 4: Adicionar Variável
Crie UMA nova variável com:
- **Name**: `VITE_API_URL`
- **Value**: `https://dealer-sourcing-api-production.up.railway.app`
- **Environments**: Selecione `Production` (e opcionalmente `Preview` e `Development`)

### Passo 5: Salvar
Clique no botão verde de salvar/confirmar

### Passo 6: Fazer Redeploy
```
Deployments → Clique no deploy mais recente → Redeploy
```
OU
```
Settings → Git → Clique em "Redeploy" ao lado do commit mais recente
```

## Verificação Após Redeploy

Assim que o build terminar (5-10 minutos), teste no browser:

1. Abra: `https://dealer-sourcing-frontend.vercel.app`
2. Abra DevTools (F12)
3. Console tab
4. Cole e execute:
```javascript
import.meta.env.VITE_API_URL
```

### Resultado Esperado
```javascript
'https://dealer-sourcing-api-production.up.railway.app'
```

### Se Mostrar `undefined` ou `null`
- Espere mais alguns minutos (build pode estar em progresso)
- Recarregue a página (Ctrl+Shift+R para hard refresh)
- Se persistir: redeploy novamente

## Teste de Funcionamento Completo

Após confirmar que `VITE_API_URL` está definido:

```javascript
// No console do navegador:
fetch('https://dealer-sourcing-api-production.up.railway.app/health')
  .then(r => r.json())
  .then(d => {
    console.log('✅ API respondeu:', d)
  })
  .catch(e => {
    console.log('❌ Erro:', e.message)
  })
```

**Resultado esperado:** API retorna status `200` com dados

## Por Que Isso Resolveu o Problema

| Antes | Depois |
|-------|--------|
| `API_BASE = process.env.VITE_API_URL` | `API_BASE = import.meta.env.VITE_API_URL` |
| ❌ `process.env` = undefined (navegador) | ✅ `import.meta.env` = injetado por Vite |
| Resultado: `/null/auth/login` (erro 405) | Resultado: `/auth/login` (funciona) |

## Checklist Final
- [ ] Variável criada em Vercel Dashboard
- [ ] Redeploy concluído
- [ ] `import.meta.env.VITE_API_URL` retorna URL correta
- [ ] `/health` endpoint responde
- [ ] Login tenta acessar `/auth/login` (não `/null/auth/login`)

## Referências
- Arquivo corrigido: `src/frontend/api.js` (linha 7)
- Documentação completa: `CRITICAL_FIX_FRONTEND_API.md`
- Verificação local: `npm run verify:api`

---

**ETA para resolução:** 10-15 minutos após redeploy no Vercel
