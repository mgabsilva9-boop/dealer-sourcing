# CHECKLIST DE VALIDAÇÃO PÓS-FIX

**Objetivo:** Validar que todos os 4 problemas foram corrigidos  
**Data:** 2026-04-07  
**Testador:** @dev ou @qa  
**Ambiente:** Localhost (antes de deploy)

---

## PROBLEMA #1: Dashboard Financeiro Atualiza em Tempo Real

### Teste 1.1: Criar Veículo Atualiza Dashboard Automaticamente

**Pré-requisitos:**
- Estar logado como "Dono" ou "Admin"
- Abrir aba "Dashboard" em navegador

**Passos:**
1. Observar card "Lucro Bruto" no Dashboard (anotar valor inicial)
2. Abrir nova aba, acessar "Estoque"
3. Clique "+ Novo Veículo"
4. Preencher: Ford Ka, R$ 50.000 compra, R$ 70.000 venda
5. Clique "Salvar"
6. **Voltar à aba Dashboard SEM FAZER F5**
7. Observar card "Lucro Bruto"

**Resultado Esperado:**
- ✅ Card "Lucro Bruto" aumenta automaticamente em <5 segundos
- ✅ Nenhum F5 necessário
- ✅ Valor reflete: R$ 70.000 - R$ 50.000 = R$ 20.000 adicional

**Status:** [ ] PASS [ ] FAIL  
**Tempo Decorrido:** _____ seg  
**Notas:** ___________________________________________________________________

---

### Teste 1.2: Deletar Veículo Atualiza Dashboard

**Resultado Esperado:**
- ✅ Card "Lucro Bruto" diminui em <5 segundos sem F5

**Status:** [ ] PASS [ ] FAIL  

---

### Teste 1.3: Múltiplas Operações Refletem em Tempo Real

**Resultado Esperado:**
- ✅ Todas as operações refletem no Dashboard <5s após conclusão
- ✅ Sem F5

**Status:** [ ] PASS [ ] FAIL  

---

## PROBLEMA #2: Criar/Deletar/Editar Gastos Funciona

### Teste 2.1: Criar Despesa com Sucesso

**Resultado Esperado:**
- ✅ Nenhum erro
- ✅ Despesa aparece na lista **imediatamente** (sem F5)
- ✅ Valor reflete corretamente

**Status:** [ ] PASS [ ] FAIL  

---

### Teste 2.2: Editar Despesa Criada

**Resultado Esperado:**
- ✅ Nenhum erro
- ✅ Despesa atualiza visualmente imediatamente

**Status:** [ ] PASS [ ] FAIL  

---

### Teste 2.3: Deletar Despesa

**Resultado Esperado:**
- ✅ Nenhum erro
- ✅ Despesa desaparece **imediatamente** da lista (sem F5)

**Status:** [ ] PASS [ ] FAIL  

---

### Teste 2.4: Validação de Erro (Campo Vazio)

**Resultado Esperado:**
- ✅ Erro legível: "Valor é obrigatório" (não genérico)

**Status:** [ ] PASS [ ] FAIL  

---

### Teste 2.5: Persistência Após F5

**Resultado Esperado:**
- ✅ Despesa continua listada após F5

**Status:** [ ] PASS [ ] FAIL  

---

## PROBLEMA #3: Status de Carro Persiste

### Teste 3.1: Marcar Como Vendido Persiste

**Resultado Esperado:**
- ✅ Após F5, veículo **continua com status "Vendido"**
- ✅ Não voltou para "Disponível"

**Status:** [ ] PASS [ ] FAIL  

---

### Teste 3.2: Marcar Como Reservado Persiste

**Resultado Esperado:**
- ✅ Status continua "Reservado" após F5

**Status:** [ ] PASS [ ] FAIL  

---

### Teste 3.3: Status Persiste Após Logout/Login

**Resultado Esperado:**
- ✅ Veículo continua com mesmo status após logout/login

**Status:** [ ] PASS [ ] FAIL  

---

### Teste 3.4: Múltiplas Alterações de Status

**Resultado Esperado:**
- ✅ Todas as mudanças persistem com F5 entre elas

**Status:** [ ] PASS [ ] FAIL  

---

## PROBLEMA #4: Edições de Dados Salvam

### Teste 4.1: Editar Preço de Venda de Veículo

**Resultado Esperado:**
- ✅ Preço atualiza após blur/save
- ✅ Após F5, preço continua atualizado
- ✅ Nenhum erro "Erro ao atualizar"

**Status:** [ ] PASS [ ] FAIL  

---

### Teste 4.2: Editar KM de Veículo

**Resultado Esperado:**
- ✅ KM persistiu corretamente

**Status:** [ ] PASS [ ] FAIL  

---

### Teste 4.3: Editar Cliente (CRM)

**Resultado Esperado:**
- ✅ Email persistiu
- ✅ Nenhum erro

**Status:** [ ] PASS [ ] FAIL  

---

### Teste 4.4: Validação: Preço Compra > Preço Venda

**Resultado Esperado:**
- ✅ Erro legível: "Preço de compra não pode ser > preço de venda"
- ✅ Campo destacado

**Status:** [ ] PASS [ ] FAIL  

---

### Teste 4.5: Validação: Campos Obrigatórios

**Resultado Esperado:**
- ✅ Erro: "Marca é obrigatória"
- ✅ Não salva

**Status:** [ ] PASS [ ] FAIL  

---

## RESULTADO FINAL

| Problema | Status |
|----------|--------|
| #1 Dashboard | [ ] PASS [ ] FAIL |
| #2 Gastos | [ ] PASS [ ] FAIL |
| #3 Status | [ ] PASS [ ] FAIL |
| #4 Edições | [ ] PASS [ ] FAIL |

**APROVADO PARA DEPLOY?** [ ] SIM (TODOS PASS) [ ] NÃO (FALHAS ACIMA)

**Testador:** ________________________  
**Data:** ___/___/______  

