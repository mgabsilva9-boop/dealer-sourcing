# GitHub Secrets Configuration for Auto-Deploy

O workflow CI/CD está pronto, mas precisa de secrets do GitHub para funcionar.

## 🔐 Secrets Necessários

### Para Render (Backend)

1. **RENDER_SERVICE_ID**
   - Vá para: https://dashboard.render.com/services/dealer-sourcing-backend
   - URL da página contém: `...services/srv-xxxxx...`
   - Copie: `srv-xxxxx` (apenas o ID, sem "srv-")

2. **RENDER_API_KEY**
   - Vá para: https://dashboard.render.com/account/api-tokens
   - Clique: "Create Token"
   - Copie o token inteiro (começa com "rnd_")

### Para Vercel (Frontend)

3. **VERCEL_TOKEN**
   - Vá para: https://vercel.com/account/tokens
   - Clique: "Create"
   - Copie o token inteiro

4. **VERCEL_ORG_ID**
   - Vá para: https://vercel.com/account/general/profile
   - Procure "ID" ou "Vercel ID"

5. **VERCEL_PROJECT_ID**
   - Vá para: https://vercel.com/dashboard
   - Clique no projeto "dealer-sourcing-frontend"
   - Settings → General → Project ID

---

## 📝 Como Adicionar os Secrets

### Via GitHub Web

1. Acesse: https://github.com/mgabsilva9-boop/dealer-sourcing
2. Vá para: **Settings** → **Secrets and variables** → **Actions**
3. Clique: **New repository secret**
4. Adicione cada secret com seu nome e valor

### Via GitHub CLI

```bash
gh secret set RENDER_SERVICE_ID --body "srv-xxxxx"
gh secret set RENDER_API_KEY --body "rnd_xxxx..."
gh secret set VERCEL_TOKEN --body "vercel_xxxx..."
gh secret set VERCEL_ORG_ID --body "Team_xxxxx"
gh secret set VERCEL_PROJECT_ID --body "prj_xxxxx"
```

---

## ✅ Testar Auto-Deploy

Depois de adicionar os secrets:

```bash
# Trigger o workflow com um push dummy
git commit --allow-empty -m "test: trigger auto-deploy workflow"
git push

# Monitore em:
# - GitHub: https://github.com/mgabsilva9-boop/dealer-sourcing/actions
# - Render: https://dashboard.render.com/services/dealer-sourcing-backend
# - Vercel: https://vercel.com/dashboard
```

---

## 🔄 Como Funciona

1. **Você faz: `git push`**
2. **GitHub Actions dispara:**
   - ✅ Lint
   - ✅ Test
   - ✅ Build
3. **Se tudo passar:**
   - Render redeploy automático
   - Vercel redeploy automático
4. **URLs ficam 🟢 LIVE**
   - Backend: https://dealer-sourcing-backend.onrender.com
   - Frontend: https://dealer-sourcing-frontend.vercel.app

---

## 🐛 Troubleshooting

### Workflow não executa
- Verifique se `.github/workflows/deploy.yml` está em `main`
- Espere 30 segundos após push

### Deploy falha
- Verifique logs em: https://github.com/mgabsilva9-boop/dealer-sourcing/actions
- Procure por erro específico (secrets faltando, build failed, etc)

### Render/Vercel não redeploya
- Verifique se tokens estão válidos
- Tente redeploy manual via dashboard

---

**Próximo passo:** Configure os 5 secrets acima e teste com `git commit --allow-empty && git push`
