# ⚙️ Configuração Manual no Painel Vercel

## Passo 1: Adicionar Environment Variable

1. Acesse: https://vercel.com/dashboard
2. Selecione projeto **dealer-sourcing-frontend**
3. Clique em **Settings** (engrenagem)
4. Vá para **Environment Variables**
5. Clique em **Add Environment Variable**

### Preenchimento:

| Campo | Valor |
|-------|-------|
| **Name** | `VITE_API_URL` |
| **Value** | `https://dealer-sourcing-api-production.up.railway.app` |
| **Environments** | ✅ Production (IMPORTANTE!) |

6. Clique em **Add** ou **Save**

---

## Passo 2: Redeploy

1. Na aba **Deployments**
2. Encontre o deployment mais recente
3. Clique nos 3 pontinhos (...)
4. Selecione **Redeploy**

Isso vai usar a nova variável de ambiente durante o build.

---

## Passo 3: Aguardar Build

- O build deve levar 2-3 minutos
- Quando ficar verde (✅), está pronto!

---

## ✅ Verificação

1. Acesse: https://dealer-sourcing-frontend.vercel.app
2. Login: `dono@brossmotors.com` / `bross2026`
3. Aba **Estoque** → Devem aparecer os 5 veículos!

Se ainda não aparecer, aguarde +2 min e recarregue (F5).
