# BONUS LOGIN FIX — Quick Test (5 minutos)

## Setup Rápido

```bash
# Terminal 1: Backend
npm run dev:server

# Terminal 2: Frontend
npm run dev

# Browser
open http://localhost:5173
# ou abrir Vercel: https://dealer-sourcing-frontend.vercel.app
```

---

## Teste 1: Login Funciona (1 min)

```
✓ Email: dono@brossmotors.com
✓ Senha: bross2026
✓ Clicar Login
✓ Resultado: Vai para Dashboard
✓ localStorage.token existe? SIM
✓ Console error? NÃO
```

---

## Teste 2: F5 Mantém Sessão (1 min)

```
✓ Estar na Dashboard
✓ Pressionar F5 (reload)
✓ Resultado: Permanece na Dashboard
✓ NÃO pede login
✓ localStorage.token igual? SIM
✓ Console: [useEffect.restoreSession] Token válido
```

---

## Teste 3: Logout Remove Token (1 min)

```
✓ Estar na Dashboard
✓ Clicar "Sair"
✓ Resultado: Vai para /login
✓ localStorage.token removido? SIM
✓ Console: [authAPI.logout] Backend logout successful
```

---

## Teste 4: F5 após Logout (1 min)

```
✓ Estar em /login (logout feito)
✓ Pressionar F5
✓ Resultado: Permanece em /login
✓ localStorage vazio? SIM
✓ Console: [useEffect.restoreSession] Token present? false
```

---

## Teste 5: 3 Ciclos Login/Logout (1 min)

```
✓ CICLO 1:
  - Login (dono@brossmotors.com)
  - Dashboard carrega
  - Logout
  - Vai para /login
  
✓ CICLO 2:
  - Repeat acima
  
✓ CICLO 3:
  - Repeat acima
  
✓ Resultado: 3/3 OK, sem erros
```

---

## PASS/FAIL

- [ ] Teste 1: LOGIN ✓
- [ ] Teste 2: F5 RESTORE ✓
- [ ] Teste 3: LOGOUT ✓
- [ ] Teste 4: F5 AFTER LOGOUT ✓
- [ ] Teste 5: 3 CYCLES ✓

**RESULTADO:** ✅ PASS (5/5 testes OK)

---

## Commit Info

```
Hash: 5751d9b
Message: fix: BONUS — login race condition com cleanup seguro + logout + blacklist
Files: src/frontend/App.jsx, src/frontend/api.js
```

---

## Logs Esperados

**Console** (DevTools F12 → Console tab):

```
[useEffect.restoreSession] Token present? true
[useEffect.restoreSession] Validating token...
[useEffect.restoreSession] Token válido, restaurando user: dono@brossmotors.com
```

Logout:
```
[logout] Calling /auth/logout endpoint...
[authAPI.logout] Backend logout successful: {message: "Logout realizado com sucesso"}
[logout] Removing token from localStorage
```

**Network** (DevTools F12 → Network tab):

```
POST /auth/login → 200 (login)
GET /auth/me → 200 (restore session)
POST /auth/logout → 200 (logout)
```

---

## Problemas? Troubleshooting

| Problema | Solução |
|----------|---------|
| "Cannot read property 'id'" | Limpar localStorage.removeItem('token') |
| localStorage.token não removido | Verificar finally {} em logout button |
| Console warnings persistem | Verificar isMounted flag em useEffect |
| F5 não mantém sessão | Verificar /auth/me retorna 200 |
| Logout não vai para /login | Verificar setUser(null) é chamado |

---

## Full Test Plan

Para testes mais detalhados: `BONUS_LOGIN_FIX_TEST_PLAN.md`

Para sumário técnico: `BONUS_LOGIN_FIX_SUMMARY.md`
