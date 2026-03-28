# Deploy Frontend em Vercel - Step by Step

## Pré-requisito
✅ Backend já deployado em Render: `https://dealer-sourcing-backend.onrender.com`

---

## PASSO 1: Acessar Vercel

1. Acesse [Vercel.com](https://vercel.com) e faça login (com GitHub é mais fácil)
2. Clique em **Add New...** → **Project**

---

## PASSO 2: Importar repositório

3. **Import Git Repository**
   - Selecione: `mgabsilva9-boop/dealer-sourcing`
   - Clique em **Import**

---

## PASSO 3: Configurar projeto

4. **Project Name:** `dealer-sourcing-frontend` (ou qualquer nome único)

5. **Framework Preset:** Selecione **Vite**

6. **Root Directory:** Leave as `/` (padrão)

---

## PASSO 4: Adicionar Environment Variables

7. Clique em **Environment Variables**

8. Adicione:
   ```
   VITE_API_URL=https://dealer-sourcing-backend.onrender.com
   ```
   (Use a URL exata do Render)

---

## PASSO 5: Deploy

9. Clique em **Deploy**

10. Vercel vai:
    - ✅ Download código
    - ✅ Rodar `npm run build`
    - ✅ Gerar build Vite
    - ✅ Deploy em CDN global

11. Aguarde **Congratulations! Your project has been deployed**

---

## PASSO 6: Copiar URL do Vercel

12. Quando terminar, você vai ter uma URL tipo:
    ```
    https://dealer-sourcing-frontend.vercel.app
    ```

13. **COPIE ESTA URL** - você vai precisar dela no próximo passo

---

## PASSO 7: Atualizar FRONTEND_URL no Render

14. Volte ao [Render Dashboard](https://dashboard.render.com)

15. Selecione seu serviço `dealer-sourcing-backend`

16. Vá em **Environment** → Edite `FRONTEND_URL`:
    ```
    FRONTEND_URL=https://dealer-sourcing-frontend.vercel.app
    ```

17. Clique em **Save**

18. Render vai fazer **auto-deploy** (alguns segundos)

---

## PASSO 8: Testar a Aplicação

19. Acesse: `https://dealer-sourcing-frontend.vercel.app`

20. Teste:
    - ✅ **Login:** Registre um usuário novo
    - ✅ **Search:** Faça uma busca de carros
    - ✅ **Backend:** Verifique se data vem do Render

---

## ⚠️ Se falhar:

### Frontend não carrega:
```bash
curl https://dealer-sourcing-frontend.vercel.app
# Deve retornar HTML (não erro)
```

### API não responde:
```bash
curl https://dealer-sourcing-backend.onrender.com/health
# Deve retornar: {"status":"ok",...}
```

### CORS error no console:
- Verifique `FRONTEND_URL` no Render (deve ser exato)
- Clique em **Manual Deploy** no Render

---

## Próximo Passo:

Assim que tudo estiver funcionando:
1. Teste login/search em: `https://dealer-sourcing-frontend.vercel.app`
2. Vá para `GITHUB_WEBHOOK_SETUP.md` para configurar auto-deploy

---

**Quando terminar, avise aqui o status ✅ ou ❌**
