# 🚀 Deploy no Vercel

## Opção A: Direct Git Deploy (Recomendado)

### 1️⃣ Criar App Vite React Novo

```bash
npm create vite@latest dealer-sourcing-frontend -- --template react
cd dealer-sourcing-frontend
npm install axios
```

### 2️⃣ Copiar Componentes

Copie de `dealer-sourcing/src/frontend/App.jsx` para:
```
dealer-sourcing-frontend/src/App.jsx
```

### 3️⃣ Configurar .env

```
VITE_API_URL=https://dealer-sourcing-backend.onrender.com
```

### 4️⃣ Deploy no Vercel

```bash
npm install -g vercel
vercel
```

Responda as perguntas e pronto! Seu frontend estará em:
```
https://dealer-sourcing-frontend.vercel.app
```

---

## Opção B: Vercel Dashboard

1. Abra https://vercel.com
2. Click "New Project"
3. Importar repo GitHub
4. Configurar:
   - **Framework:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Adicionar env var:
   - `VITE_API_URL=https://dealer-sourcing-backend.onrender.com`
6. Click "Deploy"

---

## ✅ Teste

Abra em navegador:
```
https://dealer-sourcing-frontend.vercel.app
```

Login com:
- Email: `seu@email.com`
- Senha: `senha123`

---

## 🔗 Conectar com Backend

Certifique-se que `.env` tem:
```
VITE_API_URL=https://dealer-sourcing-backend.onrender.com
```

Seu frontend vai se conectar automaticamente ao backend do Render.
