# GitHub Webhook Setup para Auto-Deploy

## Pré-requisitos
- ✅ Projeto no GitHub (já feito)
- ✅ Backend deployado em Render (próximo passo)
- ✅ GitHub Actions workflow configurado

---

## PASSO 1: Obter Deploy Hook ID do Render

1. Acesse [Render Dashboard](https://dashboard.render.com)
2. Selecione seu serviço backend `dealer-sourcing-backend`
3. Vá em **Settings → Deploy Hook**
4. Clique em **Create Deploy Hook**
5. Selecione **main branch**
6. **Copie a URL completa** (exemplo: `https://api.render.com/deploy/srv_xxxxxxxxxxxx?key=yyyyyyyyy`)

---

## PASSO 2: Extrair Token da URL

Da URL completa acima, extraia apenas a parte final:
```
srv_xxxxxxxxxxxx?key=yyyyyyyyy
```

Este é o seu `RENDER_DEPLOY_HOOK_ID`.

---

## PASSO 3: Adicionar Secret no GitHub

1. Acesse seu repositório no GitHub
2. Vá em **Settings → Secrets and variables → Actions**
3. Clique em **New repository secret**
4. **Name:** `RENDER_DEPLOY_HOOK_ID`
5. **Value:** Cole o ID obtido no PASSO 2
6. Clique em **Add secret**

---

## PASSO 4: Testar o Webhook

1. Faça um commit e push para `main`:
   ```bash
   git add -A
   git commit -m "Fix: Production configuration for Render + Vercel"
   git push origin main
   ```

2. GitHub Actions vai executar:
   - ✅ Lint e tests
   - ✅ Se passar, chama Render webhook
   - ✅ Render inicia deploy automático

3. Verifique:
   - [GitHub Actions](https://github.com/seu-user/dealer-sourcing/actions)
   - [Render Logs](https://dashboard.render.com) → seu serviço → Logs

---

## Status do Deploy

Uma vez configurado, cada `git push` para `main` vai:
1. **Lint + Test** no GitHub
2. **Deploy Backend** no Render (automático via webhook)
3. **Manual:** Deploy Frontend em Vercel

---

**⏭️ Próximo passo:** Fazer push do código para GitHub (ver DEPLOYMENT.md)
