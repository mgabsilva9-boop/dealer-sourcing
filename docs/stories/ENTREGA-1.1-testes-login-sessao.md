# Story: ENTREGA-1.1 — Testes E2E Login & Sessão

**ID:** ENTREGA-1.1
**Epic:** epic-entrega-cliente.md
**Owner:** @qa (Quinn)
**Prazo:** 1 dia
**Status:** 🔄 IN PROGRESS
**Prioridade:** CRÍTICA

---

## Resumo

Executar testes end-to-end para validar login com 3 perfis (Dono, Admin, Manager) e persistência de sessão (F5 refresh).

**Resultado Esperado:** ✅ Todos os 4 testes passando, documentado em relatório

---

## Acceptance Criteria

- [ ] AC1: Login com Dono funciona → Dashboard carrega com badge correto
- [ ] AC2: Login com Admin funciona → Dashboard carrega com badge correto
- [ ] AC3: Login com Manager funciona → Dashboard carrega com badge correto
- [ ] AC4: F5 mantém sessão → Token em localStorage persiste
- [ ] AC5: Logout limpa localStorage → Próximo acesso redireciona para login
- [ ] AC6: Isolamento de dados validado → Loja A não vê dados de Loja B

---

## Testes a Executar

### Pré-requisitos
- Frontend rodando: http://localhost:5173 (ou URL Vercel)
- Backend rodando: http://localhost:3000 (ou Railway)
- DevTools (F12) disponível

### Teste AC1: Login com Dono
```
Email: dono@lojaA.com
Senha: [verificar .env.local]
```

### Teste AC2: Login com Admin
```
Email: admin@lojaA.com
Senha: [verificar .env.local]
```

### Teste AC3: Login com Manager (Loja B)
```
Email: manager@lojaB.com
Senha: [verificar .env.local]
```

### Teste AC4: F5 Mantém Sessão
- Estar logado
- Pressionar F5
- Verificar se continua logado (token persiste em localStorage)

### Teste AC5: Logout
- Clicar em "Sair"
- Verificar localStorage vazio
- F5 → deve redirecionar para login

### Teste AC6: Isolamento
- Login Loja A → vê veículos da Loja A
- Logout
- Login Loja B → vê veículos da Loja B (diferentes)
- Nenhum veículo de A aparece em B

---

## Instruções de Teste (Executadas AGORA)

[Testes serão executados e documentados abaixo]

---

