# 🚀 Deploy no Render.com

## 1️⃣ Criar Conta e Conectar GitHub

1. Abra https://render.com
2. Click "Sign up" → GitHub login
3. Autorizar Render acessar seus repositórios GitHub

---

## 2️⃣ Criar novo Web Service

1. Click "New +" → "Web Service"
2. Conectar repositório GitHub
3. Selecionar branch: `main`
4. Configurar:
   - **Name:** `dealer-sourcing-backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

---

## 3️⃣ Variáveis de Ambiente

Adicionar as seguintes env vars:

```
DATABASE_URL=postgresql://[sua-url-railway]
JWT_SECRET=seu-secret-mega-seguro-aqui
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://dealer-sourcing-frontend.vercel.app
```

---

## 4️⃣ Deploy

Click "Create Web Service"

Render vai:
1. Clonar seu repo
2. Rodar `npm install`
3. Rodar `npm start`
4. Ativar seu backend em `https://dealer-sourcing-backend.onrender.com`

---

## ✅ Teste

```bash
curl https://dealer-sourcing-backend.onrender.com/health
```

Deve retornar: `{"status":"ok"}`

---

## 📝 Notas

- **Free tier**: Pode hibernar após 15 min sem uso
- **Para produção**: Upgrade para plano pago
- **Auto-deploy**: Cada push no GitHub faz deploy automático
