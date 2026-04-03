# 🔧 Solução: Erro 401 em Vercel (Token Antigo no Cache)

## Problema
```
User ID not found in token
401 Unauthorized
```

## Causa
Seu navegador tem um **token antigo em localStorage** que não possui o campo `id` necessário.

---

## ✅ Solução Rápida (3 Passos)

### 1️⃣ Abrir DevTools
Pressione: **F12** (no navegador)

### 2️⃣ Ir para Application / Storage
- Chrome/Edge: **Application** → **Local Storage**
- Firefox: **Storage** → **Local Storage**

### 3️⃣ Deletar Token Antigo
Procure por: `token` (ou `auth:token`)
- Clique com botão direito → **Delete**
- Ou feche o localStorage completamente

### 4️⃣ Limpar Cache do Navegador
Pressione: **Ctrl + Shift + Delete**

Escolha:
- ✅ **Cookies e dados de site**
- Pressione **Limpar dados**

### 5️⃣ Recarregar Página
Pressione: **Ctrl + F5** (força reload sem cache)

---

## 🔓 Fazer Login Novamente

Após limpar o cache, faça login:

```
Email: dono@brossmotors.com
Senha: bross2026
```

Você deve ver os **5 veículos** na aba **Estoque**! 🚗

---

## 🚨 Se Ainda Não Funcionar

1. Abra DevTools (F12)
2. Vá para **Console**
3. Execute:
```javascript
localStorage.clear()
sessionStorage.clear()
```
4. Recarregue (F5)
5. Faça login novamente

---

## ✅ Verificação

Se der certo, você verá no Console:
```
✅ Token salvo
✅ User restaurado
```

E a aba **Estoque** carregará com os veículos!
