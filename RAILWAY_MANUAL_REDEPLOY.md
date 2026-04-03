# 🚂 Redeploy Manual no Railway

Como o Git trigger não está funcionando automaticamente, faça redeploy manualmente:

---

## ✅ Passo 1: Entrar no Painel Railway

Acesse: https://railway.app/dashboard

---

## ✅ Passo 2: Selecionar Projeto

Procure e clique em: **dealer-sourcing-api-production**

---

## ✅ Passo 3: Ir para Deployments

No menu esquerdo, clique em: **Deployments**

---

## ✅ Passo 4: Redeploy Mais Recente

Veja a lista de deployments. O mais recente deve mostrar:
```
Commit: chore: trigger railway rebuild
```

Se não estiver lá, aguarde 2 minutos (GitHub webhook pode demorar).

---

## ✅ Passo 5: Clicar em Redeploy

Clique nos **3 pontinhos (•••)** ao lado do deployment mais recente.

Selecione: **Redeploy**

---

## ✅ Passo 6: Aguardar Build

O status deve mudar para:
```
🔄 Building...
```

Quando ficar verde (✅), o deploy está pronto.

**Tempo esperado:** 3-5 minutos

---

## ✅ Passo 7: Verificar Deploy

Abra o Developer Console (F12) e execute:

```javascript
fetch('https://dealer-sourcing-api-production.up.railway.app/health')
  .then(r => r.json())
  .then(d => console.log('Uptime:', d.uptime, 'segundos'));
```

Se o uptime for **< 600 segundos** (< 10 min), o deploy novo foi ativado! ✅

---

## ✅ Passo 8: Testar em Vercel

Acesse: https://dealer-sourcing-frontend.vercel.app

Login: `dono@brossmotors.com` / `bross2026`

Os **5 veículos devem aparecer** na aba **Estoque**! 🚗

---

## 🚨 Se Ainda Não Funcionar

1. Limpe o localStorage **NOVAMENTE**:
   - DevTools (F12) → Console:
   ```javascript
   localStorage.clear(); location.reload();
   ```

2. Faça login com `dono@brossmotors.com` / `bross2026`

3. Se der 401, **Railway ainda não redeployou** → Repita Passos 5-6

---

**Tempo total:** ~10 minutos (5 min redeploy + 5 min propagação)
