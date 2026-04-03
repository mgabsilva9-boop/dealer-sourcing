# ⚡ Configuração Vercel — 5 Minutos

## 🎯 Objetivo
Adicionar `VITE_API_URL` no painel Vercel para que o build use a URL correta do backend em produção.

---

## 📍 PASSO 1: Entrar no Painel Vercel

Acesse: **https://vercel.com/dashboard**

Selecione o projeto: **`dealer-sourcing-frontend`**

---

## ⚙️ PASSO 2: Ir para Settings

No menu superior, clique em:
```
Settings (engrenagem)
```

---

## 🔧 PASSO 3: Adicionar Environment Variable

No menu esquerdo, clique em:
```
Environment Variables
```

Você verá um botão "Add Environment Variable" (ou "Add")

---

## 📝 PASSO 4: Preencher os Campos

**Clique em "Add Environment Variable"**

Preencha exatamente assim:

| Campo | Valor |
|-------|-------|
| **Name** | `VITE_API_URL` |
| **Value** | `https://dealer-sourcing-api-production.up.railway.app` |
| **Environments** | ✅ **Production** (IMPORTANTE!) |

Deixe os outros campos em branco.

**Clique em "Save"** ou **"Add"**

---

## ✅ PASSO 5: Redeploy

Agora você está na aba **Deployments**

1. Encontre o deployment mais recente (topo da lista)
2. Clique nos **3 pontinhos (•••)** no lado direito
3. Selecione **"Redeploy"**

---

## ⏳ PASSO 6: Aguardar Build

O build vai levar **2-3 minutos**

Você verá:
```
Building... 🔄
```

Quando ficar verde (✅), está pronto!

---

## ✅ PASSO 7: Testar

Acesse:
```
https://dealer-sourcing-frontend.vercel.app
```

**Login:**
```
Email: dono@brossmotors.com
Senha: bross2026
```

**Aba Estoque** → Devem aparecer os **5 veículos**! 🎉

---

## 🚨 Se Não Funcionar

**Caso 1: Ainda dá erro 404**
- Aguarde +2 minutos (cache do navegador)
- Pressione `Ctrl + Shift + Del` → Limpar cache
- Recarregue a página (F5)

**Caso 2: Railway offline**
- Verifique: https://dealer-sourcing-api-production.up.railway.app/health
- Se offline → abra issue no Railway ou faça redeploy manual

**Caso 3: Variável não pegou**
- Verifique se está em "Production" (não "Preview" ou "Development")
- Redeploy novamente

---

## 📞 Suporte

Qualquer dúvida, me chama no terminal! 🚀

---

**Tempo estimado:** 5 minutos  
**Dificuldade:** ⭐ Muito fácil
