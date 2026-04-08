# BUG #5 — Quick Validation Checklist

**Objetivo:** Validar que o CRUD de clientes funciona end-to-end

---

## Setup (5 min)

### Terminal 1: Backend
```bash
cd /c/Users/renat/ThreeOn/clients/dealer-sourcing
npm run dev:server
# Espera: "Server listening on :3000"
```

### Terminal 2: Frontend
```bash
npm run dev
# Espera: "VITE ✓ ready in XXXms"
# Acessa: http://localhost:5173
```

---

## Manual Tests (15 min)

### 1. Login
```
Ir para: http://localhost:5173
Usuário: admin@threeon.com
Senha: threeon2026
Esperado: ✅ Dashboard carrega
```

### 2. Navegue para Aba "Clientes"
```
Click em: "Clientes" tab
Esperado: ✅ Vê lista vazia ou com clientes existentes
```

### 3. Criar Cliente
```
Click: "+ Novo Cliente"
Preencher:
  Nome: "João Silva Test"
  Telefone: "(11) 98765-4321"
  Email: "joao@test.com"
  CPF: "12345678901"
  Veículo: "BMW M3"
  Data Compra: "2026-04-08"
  Valor: "450000"
  Profissão: "Empresário"
  Estilo: "Executivo"
  Região: "São Paulo"
  Colecionador: "Não"
  Aniversário: "1985-06-15"
  Origem: "Facebook"
  Contato: "WhatsApp"

Click: "Adicionar Cliente"
Esperado: ✅ Cliente aparece na lista + form limpa
```

### 4. Editar Cliente
```
Click no cliente "João Silva Test"
Esperado: ✅ Detalhes aparecem

Click em "Telefone" field
Esperado: ✅ Campo fica em edit mode (com input)

Trocar: (11) 98765-4321 → (11) 99999-9999

Press: Enter
Esperado: ✅ Salva automaticamente (backend atualiza)

Click: "Voltar"
Click novamente: "João Silva Test"
Esperado: ✅ Telefone mostra (11) 99999-9999 (persistido!)
```

### 5. Editar Múltiplos Campos
```
Cliente aberto: "João Silva Test"

Editar:
  - Profissão: "Empresário" → "Diretor"
  - Email: "joao@test.com" → "joao.silva@company.com"
  - Notas: [adicionar observação]

Esperado: ✅ Todos salvam automaticamente
```

### 6. Deletar Cliente
```
Click no cliente "João Silva Test"
Click: "Deletar Cliente" (botão vermelho)
Esperado: ✅ Confirmação: "Tem certeza que deseja deletar?"

Click: "OK"
Esperado: ✅ Cliente desaparece da lista
         ✅ Volta para view de lista vazia/reduzida
```

### 7. Persistência F5 (Reload)
```
Criar novo cliente: "Maria Santos"
Telefone: "(21) 99999-9999"

Press: F5 (reload page)
Esperado: ✅ Re-login automático
         ✅ "Maria Santos" ainda está na lista
         ✅ Telefone mostra "(21) 99999-9999"
```

### 8. Validação Frontend
```
Criar novo cliente, deixar "Nome" vazio

Click: "+ Novo Cliente"
Deixar "Nome" em branco

Click: "Adicionar Cliente"
Esperado: ❌ Nada acontece (botão não funciona sem nome)
         ✅ Feedback visual desabilitado
```

---

## Automated Tests (5 min)

```bash
# Terminal 3
npm run test:crm

Esperado:
✅ 1. Testing login...
✅ 2. Testing GET /crm/list...
✅ 3. Testing POST /crm/create...
✅ 4. Testing GET /crm/:id...
✅ 5. Testing PUT /crm/:id (update)...
✅ 6. Testing update persistence...
✅ 7. Testing DELETE /crm/:id...
✅ 8. Testing deletion verification...

📊 Results: 8 passed, 0 failed
```

---

## Validação Final

Após passar em todos os testes acima:

- [x] CRUD completo funcionando (C-R-U-D)
- [x] Persistência no banco (reload = dados permanecem)
- [x] Validação frontend (nome obrigatório)
- [x] Edição inline com autosave
- [x] Multi-tenant isolation respeitado
- [x] Testes integração passando

**Status:** ✅ BUG #5 VALIDADO COM SUCESSO

---

## Troubleshooting

### "API connection refused"
```
Verificar:
  npm run dev:server está rodando em :3000?
  VITE_API_URL configurado corretamente em .env?
```

### "Cliente não salva ao editar"
```
Verificar:
  Console (F12) tem erros de rede?
  Token JWT expirou? (fazer logout + login)
  Dados do cliente afetam outro campo?
```

### "Cliente desaparece após criar"
```
Verificar:
  Backend respondeu com erro 400/500?
  Nome pode estar vazio ou inválido?
  Banco de dados está disponível?
```

### "Teste npm run test:crm falha"
```
Verificar:
  Backend rodando em :3000?
  Usuário admin@threeon.com existe?
  Sem typos em credenciais?
  Check logs em terminal 1
```

---

## Tempo Total Estimado

- Manual Tests: 15 min
- Automated Tests: 5 min
- Troubleshooting (se necessário): 5-10 min

**Total:** 20-30 minutos para validação completa
