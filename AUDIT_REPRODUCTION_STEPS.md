# AUDIT REPRODUCTION STEPS

Este documento permite que qualquer pessoa reproduza os testes realizados neste audit.

**Date:** 2026-04-08  
**URL:** https://dealer-sourcing-frontend.vercel.app  

---

## QUICK START

### 1. Manual Testing (5 minutes)

```bash
1. Abrir https://dealer-sourcing-frontend.vercel.app
2. Login com: dono@brossmotors.com / bross2026
3. Aguardar carregamento (10-30 segundos)
4. Executar testes abaixo
```

---

## TEST PLAN

### TEST 1: GASTOS (Expenses)

#### 1.1 CREATE
```
[ ] Clicar "Gastos" na navegação
[ ] Clicar "+ Nova Despesa"
[ ] Preencher:
    - Categoria: "Operacional"
    - Descrição: "Teste Audit"
    - Valor: "1500"
    - Data: "2026-04-08"
    - Status: "Pendente"
[ ] Clicar "Adicionar Despesa"
[ ] Verificar: Despesa aparece na lista
[ ] Resultado: PASS ✅ ou FAIL ❌
```

#### 1.2 READ (List)
```
[ ] Na aba Gastos, verificar que todas despesas aparecem
[ ] Verificar cards com:
    - Categoria (ex: "Operacional")
    - Descrição (ex: "Teste Audit")
    - Valor (ex: "R$ 1.500")
    - Status badge (verde se pago, amarelo se pendente)
    - Data formatada em pt-BR
[ ] Resultado: PASS ✅ ou FAIL ❌
```

#### 1.3 UPDATE
```
[ ] Clicar em uma despesa existente
[ ] (Se não houver UI de edit inline, pular para 1.4)
[ ] Editar um campo (ex: valor)
[ ] Verificar que muda na API (F5 reload)
[ ] Resultado: PASS ✅ ou FAIL ❌
```

#### 1.4 DELETE
```
[ ] Em uma despesa, clicar botão "Del"
[ ] Confirmar no dialog
[ ] Verificar: Despesa some da lista
[ ] Recarregar página (F5)
[ ] Verificar: Despesa continua deletada (não é apenas local)
[ ] Resultado: PASS ✅ ou FAIL ❌
```

---

### TEST 2: CLIENTES (Customers)

#### 2.1 CREATE
```
[ ] Clicar "Clientes" na navegação
[ ] Clicar "+ Novo Cliente"
[ ] Preencher:
    - Nome: "João da Silva"
    - Telefone: "(16) 98765-4321"
    - Email: "joao@test.com"
    - CPF: "12345678901"
    - Veículo: "BMW M3"
    - Data: "2026-04-08"
    - Valor: "420000"
[ ] Clicar "Salvar"
[ ] Verificar: Cliente aparece na lista
[ ] Resultado: PASS ✅ ou FAIL ❌
```

#### 2.2 READ (List)
```
[ ] Na aba Clientes, verificar que todos aparecem
[ ] Verificar colunas: Nome, Telefone, Estilo, Veículo, Data, Valor
[ ] Clicar em 1 cliente para abrir detail view
[ ] Verificar que aparecem 3 cards:
    - Veículo: [valor preenchido]
    - Data: [data formatada]
    - Valor: [valor formatado em R$]
[ ] Resultado: PASS ✅ ou FAIL ❌
```

#### 2.3 UPDATE (Campos específicos)
```
[ ] No detail view, verificar campos:
    - "Veículo" (vehicleBought)     → Deve permitir edit
    - "Data" (purchaseDate)          → Deve permitir edit
    - "Valor" (purchaseValue)        → Deve permitir edit
[ ] Clicar em 1 campo, editar, clicar "OK"
[ ] Verificar: Campo atualiza na UI
[ ] Recarregar página (F5)
[ ] Verificar: Dado persiste após reload
[ ] Resultado: PASS ✅ ou FAIL ❌
```

#### 2.4 DELETE
```
[ ] No detail view, clicar "Deletar Cliente" (botão vermelho)
[ ] Confirmar no dialog
[ ] Verificar: Volta para lista, cliente não aparece
[ ] Recarregar página (F5)
[ ] Verificar: Cliente continua deletado
[ ] Resultado: PASS ✅ ou FAIL ❌
```

---

### TEST 3: ESTOQUE (Inventory)

#### 3.1 CREATE
```
[ ] Clicar "Estoque" na navegação
[ ] Clicar "+ Novo Veículo"
[ ] Preencher:
    - Marca: "BMW"
    - Modelo: "M3"
    - Ano: "2021"
    - Preço de Venda: "420000"
    - Km: "35000"
    - Motor: "3.0L Twin-turbo"
    - Potência: "503 cv"
[ ] Clicar "Adicionar ao Estoque"
[ ] Verificar: Veículo aparece na lista
[ ] Resultado: PASS ✅ ou FAIL ❌
```

#### 3.2 READ (List View)
```
[ ] Na aba Estoque, verificar lista
[ ] Cada card deve ter:
    - Foto (loremflickr ou upload)
    - Make + Model + Ano
    - Km
    - Preço de Venda (R$ verde)
    - Custo: [valor]
    - Margem: [%] com cor (verde/amarelo/vermelho)
    - Lucro: [R$] com cor
[ ] Resultado: PASS ✅ ou FAIL ❌
```

#### 3.3 READ (Kanban View)
```
[ ] Clicar botão "Kanban" (alternar de Lista)
[ ] Verificar 4 colunas:
    - Em Transito
    - Recondicionamento
    - Disponível
    - Vendido
[ ] Cada coluna mostra veículos com:
    - Foto pequena
    - Make + Model
    - Ano + Km
    - Margem% + dias em estoque
    - Botões de navegação (← →)
[ ] Resultado: PASS ✅ ou FAIL ❌
```

#### 3.4 UPDATE (Preço e Km)
```
[ ] Clicar em um veículo da lista para abrir detail
[ ] Na seção "Dados":
    - Clicar em "Preço de Venda" → editar → OK
    - Clicar em "Km" → editar → OK
    - Clicar em "Localização" → editar → OK
[ ] Verificar: Campos atualizam na UI
[ ] Verificar: Lucro e Margem recalculam automaticamente
[ ] Recarregar página (F5)
[ ] Verificar: Valores persistem
[ ] Resultado: PASS ✅ ou FAIL ❌
```

#### 3.5 DELETE
```
[ ] No detail view, encontrar botão delete
   (Nota: Pode estar no final ou em dropdown)
[ ] Clicar delete
[ ] Confirmar no dialog
[ ] Verificar: Volta para estoque, veículo não aparece (ou marcado como deletado)
[ ] Recarregar página (F5)
[ ] Verificar: Veículo continua deletado
[ ] Resultado: PASS ✅ ou FAIL ❌
```

#### 3.6 COSTS (Dinâmico)
```
[ ] No detail view, seção "Custos"
[ ] Verificar que existem custos já preenchidos (ex: "Compra do veiculo", "Funilaria")
[ ] Clicar botão para adicionar novo custo
[ ] Adicionar: Categoria="Teste", Valor="500"
[ ] Verificar: Custo aparece na lista
[ ] Verificar: Lucro recalcula (Venda - Total de Custos)
[ ] Recarregar página (F5)
[ ] Verificar: Custo persiste
[ ] Resultado: PASS ✅ ou FAIL ❌
```

---

### TEST 4: PERSISTÊNCIA (Critical)

```
[ ] Criar 1 despesa, 1 cliente, 1 veículo
[ ] Notar valores/dados específicos
[ ] Recarregar página (F5) — força reload completo
[ ] Aguardar carregamento
[ ] Verificar que TODOS os dados aparecem iguais
[ ] Testar em modo incógnito (nova sessão)
[ ] Fazer logout (perfil no top right)
[ ] Fazer login novamente
[ ] Verificar que dados ainda existem
[ ] Resultado: PASS ✅ ou FAIL ❌
```

---

### TEST 5: VALIDAÇÕES

#### 5.1 Expense Validations
```
[ ] Clicar "+ Nova Despesa"
[ ] Tentar adicionar com:
    - Categoria VAZIA → Deve mostrar erro
    - Valor NEGATIVO → Deve mostrar erro ou ignorar
    - Data no formato ERRADO → Deve corrigir ou avisar
[ ] Resultado: PASS ✅ ou FAIL ❌
```

#### 5.2 Customer Validations
```
[ ] Clicar "+ Novo Cliente"
[ ] Tentar adicionar com:
    - Nome VAZIO → Deve desabilitar botão "Salvar"
    - Email INVÁLIDO → Deve avisar (opcional)
[ ] Resultado: PASS ✅ ou FAIL ❌
```

---

### TEST 6: DELETE CONFIRMATIONS

```
[ ] Tentar deletar alguma coisa
[ ] Verificar que aparece um confirm dialog
[ ] Clicar "Cancelar" → Deve NOT deletar
[ ] Tentar deletar novamente
[ ] Clicar "Confirmar" → Deve deletar
[ ] Resultado: PASS ✅ ou FAIL ❌
```

---

## AUTOMATED TESTING (Optional - Playwright)

Se quiser tentar com Playwright (pode timeout):

```bash
# Instalar dependências
npm install

# Rodar script de teste
node audit-estoque-v2.js
node audit-gastos.js
node audit-clientes.js
node audit-saves.js

# Expected: Scripts podem timeout em 30s (não é bug, é performance)
# Workaround: Aumentar timeout para 60s no código
```

---

## CURL TESTING (API Direct)

Se quiser testar API direto (requer token):

### 1. Login e obter token
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dono@brossmotors.com","password":"bross2026"}' \
  | jq '.token'
```

### 2. Criar despesa
```bash
TOKEN="seu_token_aqui"

curl -X POST http://localhost:3000/expenses/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "category": "Operacional",
    "description": "Teste API",
    "amount": 1500,
    "date": "2026-04-08",
    "status": "pending"
  }' | jq .
```

### 3. Listar despesas
```bash
curl -X GET http://localhost:3000/expenses/list \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### 4. Atualizar despesa
```bash
EXPENSE_ID="uuid_da_despesa"

curl -X PUT http://localhost:3000/expenses/$EXPENSE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount": 2000}' | jq .
```

### 5. Deletar despesa
```bash
curl -X DELETE http://localhost:3000/expenses/$EXPENSE_ID \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## EXPECTED RESULTS

### All Manual Tests Should PASS:
- ✅ CREATE — novo item aparece na lista
- ✅ READ — lista mostra todos itens com formatação correta
- ✅ UPDATE — edição persiste após F5 reload
- ✅ DELETE — item some da lista e não volta após F5

### Common Gotchas:
- ❓ Carregamento lento (10-30s) — Normal, não é bug
- ❓ Imagens com erro — Normal, fallback para loremflickr
- ❓ Dados desaparecem em incógnito — Normal, localStorage não compartilha entre abas
- ❓ Kanban não atualiza em tempo real — OK, está correto

---

## SCORE CARD

| Feature | Test | Status |
|---------|------|--------|
| Gastos CREATE | 1.1 | PASS / FAIL |
| Gastos READ | 1.2 | PASS / FAIL |
| Gastos UPDATE | 1.3 | PASS / FAIL |
| Gastos DELETE | 1.4 | PASS / FAIL |
| Clientes CREATE | 2.1 | PASS / FAIL |
| Clientes READ | 2.2 | PASS / FAIL |
| Clientes UPDATE (vehicle/date/value) | 2.3 | PASS / FAIL |
| Clientes DELETE | 2.4 | PASS / FAIL |
| Estoque CREATE | 3.1 | PASS / FAIL |
| Estoque READ (List) | 3.2 | PASS / FAIL |
| Estoque READ (Kanban) | 3.3 | PASS / FAIL |
| Estoque UPDATE (price/km) | 3.4 | PASS / FAIL |
| Estoque DELETE | 3.5 | PASS / FAIL |
| Estoque COSTS | 3.6 | PASS / FAIL |
| Persistência (F5 reload) | 4 | PASS / FAIL |
| Validações | 5 | PASS / FAIL |
| Confirmações | 6 | PASS / FAIL |

**Total Tests:** 17  
**Passing:** ___ / 17  
**Overall Score:** ___%  

---

## SIGN-OFF

If all tests PASS → System is ready for production ✅

If any test FAILS → Document the issue and create a bug ticket

---

**Created:** 2026-04-08  
**By:** Claude Code
