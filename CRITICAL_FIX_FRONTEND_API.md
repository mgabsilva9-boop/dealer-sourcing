# CORREÇÃO CRÍTICA: Frontend API Connection - 405 Error

## Problema Identificado
- Frontend tentava acessar `/null/auth/login` em produção
- Causa raiz: `VITE_API_URL` era `undefined` no build do Vercel
- Resultado: `API_BASE = null` → requisições para `/null/endpoint`

## Raiz Causante
1. **api.js usava `process.env`** (❌ errado para client-side Vite)
   - `process.env` NÃO funciona em navegadores
   - Vite precisa de `import.meta.env.VITE_*`

2. **vercel.json não injetava variáveis em tempo de build**
   - `env` em `vercel.json` é apenas para runtime do Node.js
   - Vite build em Vercel precisa que as variáveis estejam em:
     - Environment Variables do Vercel Dashboard, OU
     - `.env.production` commitado no repo (⚠️ cuidado com secrets)

## Correções Aplicadas

### 1. api.js (linha 7)
```javascript
// ANTES ❌
const API_BASE = process.env.VITE_API_URL || ...

// DEPOIS ✅
const API_BASE = import.meta.env.VITE_API_URL || ...
```

### 2. .env.production (frontend config)
Adicionadas variáveis para o Vite:
```
VITE_API_URL=https://dealer-sourcing-api-production.up.railway.app
VITE_API_TIMEOUT=10000
VITE_LOG_LEVEL=error
```

## Próximos Passos - CRÍTICO

### Opção A: Usar Vercel Dashboard (RECOMENDADO)
1. Ir em: https://vercel.com/dashboard
2. Selecionar projeto: `dealer-sourcing-frontend`
3. Settings → Environment Variables
4. Adicionar uma nova variável:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://dealer-sourcing-api-production.up.railway.app`
   - **Environments**: Production (e Development se quiser)
5. **IMPORTANTE**: Redeploy o site após adicionar

### Opção B: Build Local e Deploy
```bash
# Local (garante que build funciona)
npm run build
npm run preview

# No navegador da dev tools console:
console.log(import.meta.env.VITE_API_URL)
# Deve mostrar: https://dealer-sourcing-api-production.up.railway.app
```

### Opção C: Verificar Build no Vercel
1. Ir em Deployments
2. Ver logs do build mais recente
3. Procurar por: "VITE_API_URL"
4. Se disser "undefined" → falta variável no Dashboard

## Teste Final (CRÍTICO)
Após redeploy, abra browser DevTools (F12) e execute:
```javascript
// No Console:
import.meta.env.VITE_API_URL
// ✅ Deve retornar: https://dealer-sourcing-api-production.up.railway.app
// ❌ Se retornar null/undefined: redeploy ainda não completou

// Testar API health:
fetch('https://dealer-sourcing-api-production.up.railway.app/health')
  .then(r => r.json())
  .then(d => console.log(d))
```

## Checklist
- [x] api.js corrigido para usar `import.meta.env`
- [x] .env.production com `VITE_API_URL`
- [ ] Adicionar `VITE_API_URL` em Vercel Dashboard
- [ ] Redeploy em Vercel
- [ ] Testar no browser console
- [ ] Verificar health check da API

## Arquivos Modificados
- `/src/frontend/api.js` → Linha 7: `process.env` → `import.meta.env`
- `/.env.production` → Adicionadas variáveis VITE_*

## Referências
- [Vite: Env Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Vercel: Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
