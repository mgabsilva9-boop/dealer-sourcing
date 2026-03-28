# ⚡ DEPLOY EM 5 MINUTOS - VISUAL STEP-BY-STEP

**Seu MVP sai de localhost para a WEB em 5 minutos.**

---

## 🎯 TIMER: 5 minutos = Você vê a URL funcionando

```
T+0min   → Abre Render
T+1min   → Cria serviço
T+2min   → Deploy começa
T+3min   → Build em progresso
T+4min   → Abre Vercel
T+5min   → Você tem 2 URLs prontas
```

---

## ✅ PRÉ-REQUISITOS (Verifique)

- [x] Código está em GitHub: `mgabsilva9-boop/dealer-sourcing`
- [x] npm install foi executado
- [x] npm run build foi executado (dist/ existe)
- [x] .env tem JWT_SECRET gerado

**Status:** ✅ Tudo pronto

---

## 🚀 AÇÃO 1: RENDER BACKEND (3 minutos)

### T+0min: Abra Render.com

1. Acesse: **https://render.com**
2. Faça login com GitHub
3. Clique em **+ New** → **Web Service**

### T+0:30min: Conecte GitHub

1. Clique **GitHub**
2. Selecione seu repo: `mgabsilva9-boop/dealer-sourcing`
3. Clique **Connect**

### T+1min: Configure

Preencha o formulário:

```
Name:                    dealer-sourcing-backend
Environment:             Node
Build Command:           npm install
Start Command:           npm start
Instance Type:           Free
Region:                  South America (São Paulo)
```

### T+1:30min: Environment Variables

Clique em **Environment** e adicione:

```
DATABASE_URL             = postgresql://postgres:SMssTMbTqjwNTXKMnnKTeRFGvBViAOJp@gondola.proxy.rlwy.net:48093/railway
JWT_SECRET               = (copie de .env)
NODE_ENV                 = production
FRONTEND_URL             = https://dealer-sourcing-frontend.vercel.app
PORT                     = 3000
```

### T+2min: Deploy

Clique em **Create Web Service**

Aguarde:
- ⏳ Building... (normalmente 2-3 min)
- ✅ Live (quando ficar verde)

### T+2:30min: Copiar URL

Quando ficar green/live:

1. Procure pelo campo **URL** no topo
2. **COPIE:** `https://dealer-sourcing-backend.onrender.com`

**Salve esta URL** para próximo passo.

---

## 🌐 AÇÃO 2: VERCEL FRONTEND (2 minutos)

### T+3min: Abra Vercel.com

1. Acesse: **https://vercel.com**
2. Faça login com GitHub
3. Clique **+ Add New** → **Project**

### T+3:15min: Importe Repo

1. **Import Git Repository**
2. Selecione: `mgabsilva9-boop/dealer-sourcing`

### T+3:30min: Configure

Preencha:

```
Project Name:            dealer-sourcing-frontend
Framework:               Vite
```

### T+3:45min: Environment Variable

Clique em **Environment Variables** e adicione:

```
VITE_API_URL = https://dealer-sourcing-backend.onrender.com
```

(Use a URL do Render que você copiou)

### T+4min: Deploy

Clique **Deploy**

Aguarde até ver: **"Congratulations! Your project has been deployed"**

### T+4:30min: Copiar URL

Quando ficar verde:

1. Procure pelo campo **Production**
2. **COPIE:** `https://dealer-sourcing-frontend.vercel.app`

---

## ✨ RESULTADO (T+5min)

```
✅ Frontend (Vercel):  https://dealer-sourcing-frontend.vercel.app
✅ Backend (Render):   https://dealer-sourcing-backend.onrender.com
```

---

## 🧪 TESTE AGORA (T+5:30min)

1. Abra no navegador: **https://dealer-sourcing-frontend.vercel.app**

2. Você deve ver:
   - ✅ Login page carregando
   - ✅ Input fields visíveis
   - ✅ Botão de registrar

3. Teste login:
   - Email: `test@example.com`
   - Senha: `Test123!@#`
   - Clique **Registrar**

4. Teste search:
   - Marca: `Toyota`
   - Modelo: `Corolla`
   - Clique **Buscar**
   - Deve aparecer carros do WebMotors + OLX

5. Verifique conexão (DevTools):
   - F12 → Network tab
   - Busque por requests para `onrender.com`
   - Deve retornar dados de carros

---

## ✅ SUCESSO =

```
Frontend respondendo     ✅
Backend respondendo      ✅
Database conectada       ✅
Dados de carros vindo    ✅

MVP ESTÁ VIVO 🚀
```

---

## ⚠️ SE FALHAR

### Erro 502 (Bad Gateway) no Render
- Aguarde mais 2-3 minutos
- Render ainda está buildando
- Atualizar página em 30 segundos

### Erro de CORS no console
- Verifique `VITE_API_URL` em Vercel env vars
- Verifique `FRONTEND_URL` em Render env vars
- Clique **Manual Deploy** em Render depois

### Erro de conexão ao banco
- Verifique `DATABASE_URL` em Render
- Deve ser idêntico ao `.env` local
- Verific cadeado (não copie errado)

---

## 🎖️ AGORA VOCÊ PODE:

```
✅ Compartilhar URL com clientes
✅ Testar em qualquer navegador
✅ Auto-deploy: git push → deploy automático
✅ Escalar quando necessário
```

---

**Tempo total: 5 minutos**
**Esforço: Copiar/colar + clicar**
**Resultado: MVP vivo na web** 🚀

---

Quando terminar, **abra a URL do frontend no navegador e me avisa que vê funcionando!**
