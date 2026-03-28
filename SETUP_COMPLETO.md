# 🚀 SETUP COMPLETO - Dealer Sourcing Bot

## ✅ Status Atual

```
✅ npm install (540 pacotes)
✅ Dockerfile criado
✅ GitHub Actions criado
✅ Render config criado
✅ Vercel config criado
⏳ Aguardando: DATABASE_URL do Railway
```

---

## 📋 Sequência de Passos (4-5 Horas Total)

### HORA 1-2: Setup Local + Database

- [ ] Criar DATABASE_URL no Railway (30 min)
- [ ] Atualizar .env com DATABASE_URL
- [ ] Rodar `node init.js` (criar tabelas)
- [ ] Rodar `node seed.js` (criar usuário teste)
- [ ] Rodar `npm run dev` (testar backend localmente)
- [ ] Testar API com curl

### HORA 2: Preparar GitHub

- [ ] Criar repositório público no GitHub
- [ ] Fazer first commit com `git init` e `git push`
- [ ] Proteger branch `main`

### HORA 3: Deploy Backend (Render)

- [ ] Abrir https://render.com
- [ ] Conectar GitHub
- [ ] Criar Web Service
- [ ] Configurar variáveis de ambiente
- [ ] Deploy automático

### HORA 4: Deploy Frontend (Vercel)

- [ ] Criar novo projeto Vite React
- [ ] Copiar App.jsx
- [ ] Deploy no Vercel
- [ ] Configurar VITE_API_URL

### HORA 5: Validação + CI/CD

- [ ] Testar login (frontend → backend)
- [ ] Testar busca (execute search)
- [ ] Verificar GitHub Actions
- [ ] Auto-deploy ao fazer push

---

## 🔑 Comandos Rápidos

### Local Development
```bash
node init.js                    # Criar banco
node seed.js                    # Criar usuário
npm run dev                     # Rodar backend
```

### Testing
```bash
curl http://localhost:3000/health

curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seu@email.com","password":"senha123"}'
```

### Deploy
```bash
git add .
git commit -m "Initial commit"
git push origin main            # Render faz deploy automaticamente
```

---

## 📊 URLs Finais

Quando pronto:
- **Backend:** `https://dealer-sourcing-backend.onrender.com`
- **Frontend:** `https://dealer-sourcing-frontend.vercel.app`
- **GitHub:** `https://github.com/seu-usuario/dealer-sourcing`

---

## 🛠️ Troubleshooting

### Backend não conecta no banco
```bash
# Verificar DATABASE_URL
echo $DATABASE_URL
node init.js                    # Re-criar schema
```

### Frontend não conecta no backend
```bash
# Verificar .env
cat .env | grep VITE_API_URL
```

### GitHub não faz deploy automático
- Verificar se branch é `main`
- Verificar se está em repositório público
- Verificar GitHub Actions na aba "Actions"

---

## 📞 Próximas Fases (Opcionais)

- [ ] Integração WhatsApp (Twilio)
- [ ] Notificações por Email
- [ ] IA Pricing (Claude API)
- [ ] Autenticação Google/GitHub
- [ ] Webhook para CRM externo

---

**👉 Quando pronto com Railway, me avisa: "DATABASE_URL: postgresql://..."**
