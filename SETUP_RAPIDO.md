# ⚡ Setup Rápido - Dealer Sourcing Bot

## ✅ Já Feito

- ✅ `.env` criado
- ✅ `npm install` completado (430 pacotes)
- ✅ `init.js` pronto
- ✅ `seed.js` pronto

---

## 📝 PRÓXIMO PASSO: Configurar DATABASE_URL

### Opção 1: Railway.app (RECOMENDADO - 2 min)

1. Abra https://railway.app
2. Click "Sign up" → Login com GitHub
3. Click "New Project" → Selecione "PostgreSQL"
4. Aguarde criar (leva ~2 min)
5. Clique em "Connect"
6. **Copie a "Database URL"** (começa com `postgresql://`)

### Opção 2: PostgreSQL Local

Se tiver PostgreSQL instalado:
```
postgresql://seu_usuario:sua_senha@localhost:5432/dealer_sourcing
```

---

## 🔧 Editar .env

Abra o arquivo `.env` com Notepad ou seu editor:
```
notepad .env
```

Procure esta linha:
```
DATABASE_URL=
```

Cole a URL do Railway ou do PostgreSQL local:
```
DATABASE_URL=postgresql://user:pass@host:port/database
```

Salve (Ctrl+S) e feche.

---

## 🚀 Executar Comandos

Abra um novo terminal/CMD e execute na pasta do projeto:

### 1️⃣ Inicializar banco
```bash
node init.js
```
Esperado: `✅ Schema inicializado com sucesso!`

### 2️⃣ Criar usuário de teste
```bash
node seed.js
```
Esperado: `✅ Usuário criado com sucesso!`

### 3️⃣ Rodar backend
```bash
npm run dev
```
Esperado:
```
✅ Banco de dados conectado
🚗 DEALER SOURCING BOT - BACKEND
🚀 Server rodando em porta 3000
✅ Status: Online
```

---

## 🧪 Testar API (Em outro CMD)

```bash
curl -X POST http://localhost:3000/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"seu@email.com\",\"password\":\"senha123\"}"
```

Deve retornar um token JWT.

---

## 📱 Frontend

Copie `src/frontend/App.jsx` para seu projeto React:
```bash
npm install axios
```

Crie `.env`:
```
VITE_API_URL=http://localhost:3000
```

---

**👉 Próximo passo: Abrir Railway.app e copiar a DATABASE_URL**
