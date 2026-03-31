# Story: ENTREGA-1.2 — Testes E2E CRUD & Kanban

**ID:** ENTREGA-1.2
**Epic:** epic-entrega-cliente.md
**Owner:** @qa (Quinn)
**Prazo:** 1 dia
**Status:** Blocked by ENTREGA-1.1
**Prioridade:** CRÍTICA

---

## Resumo

Validar CRUD completo de veículos, CRM, despesas e drag-and-drop do Kanban.

**Resultado Esperado:** ✅ Todos os testes passando, todas as funcionalidades respondendo

---

## Acceptance Criteria

### Inventário
- [ ] AC1: Criar veículo → aparece em lista e kanban
- [ ] AC2: Editar veículo → atualiza na tela e persiste após F5
- [ ] AC3: Deletar veículo → desaparece de lista
- [ ] AC4: Kanban drag-drop → card se move entre colunas (available → reserved → sold)
- [ ] AC5: Kanban persiste → F5 mantém status na coluna correta

### CRM
- [ ] AC6: Criar cliente → aparece na lista de CRM
- [ ] AC7: Editar cliente → atualiza e persiste
- [ ] AC8: Deletar cliente → desaparece

### Despesas
- [ ] AC9: Criar despesa → aparece na lista
- [ ] AC10: Resumo por categoria → mostra total agregado
- [ ] AC11: Isolamento → Loja A não vê despesas de Loja B

---

## Instruções de Teste

### Pré-requisito
- ✅ ENTREGA-1.1 passado (login funciona)
- Login como Dono ou Admin de uma loja

### Teste 1: Criar Veículo (AC1)
```
Tab: Estoque → Botão "Novo Veículo"
```
Form:
- Marca: BMW
- Modelo: M2
- VIN: WBSKT3239N2M84590
- RENAVAM: 34028500000000
- Preço: 350000 (em centavos ou input normalizado)
- Status: available

- [ ] Form submete sem erro
- [ ] Redireciona para lista
- [ ] Novo veículo aparece na lista (primeira linha ou last)
- [ ] Novo veículo aparece no kanban coluna "available"
- [ ] Contador de veículos incrementa

**Resultado:** ✅ AC1 PASS / ❌ AC1 FAIL

### Teste 2: Editar Veículo (AC2)
```
Clicar em veículo da lista → Abrir detalhe
```
Alterações:
- Preço: 360000 (aumentar em 10K)
- Ou outra alteração visível

- [ ] Modal/detalhe abre
- [ ] Campo editável
- [ ] Salvar sem erro
- [ ] Volta para lista
- [ ] Preço atualizado na lista
- [ ] Pressionar F5
- [ ] Preço permanece atualizado (persiste no banco)

**Resultado:** ✅ AC2 PASS / ❌ AC2 FAIL

### Teste 3: Deletar Veículo (AC3)
```
Detalhe do veículo → Botão "Deletar"
```

- [ ] Confirmar aviso
- [ ] Veículo desaparece da lista
- [ ] Veículo desaparece do kanban
- [ ] Contador decremente
- [ ] F5 → não reaparece (foi deletado)

**Resultado:** ✅ AC3 PASS / ❌ AC3 FAIL

### Teste 4: Kanban Drag-Drop (AC4)
```
Seção Estoque → Visualizar Kanban
```

- [ ] Colunas visíveis: available | reserved | sold
- [ ] Pelo menos 3 cards em coluna "available"
- [ ] Pegar primeiro card, arrastar para "reserved"
  - [ ] Card fica semi-transparente (opacity ~0.5) durante arrasto
  - [ ] Coluna "reserved" mostra borda azul tracejada
  - [ ] Soltar card
  - [ ] Card aparece em "reserved"
  - [ ] Status atualiza sem erro

- [ ] Repetir: "reserved" → "sold"
  - [ ] Card se move novamente
  - [ ] Status = sold

**Resultado:** ✅ AC4 PASS / ❌ AC4 FAIL

**Se drag não funciona:**
- DevTools Console → Ver se há erro JavaScript
- Verificar se card tem `draggable={true}`
- Escalar para @dev: "Drag-drop quebrado"

### Teste 5: Kanban Persiste (AC5)
```
Após mover cards no kanban
```

- [ ] Card em "sold" (exemplo)
- [ ] Pressionar F5
- [ ] Kanban recarrega
- [ ] **Card permanece em "sold"** ← CRÍTICO
- [ ] Status persistiu no banco

**Resultado:** ✅ AC5 PASS / ❌ AC5 FAIL

### Teste 6: CRM Criar (AC6)
```
Tab "Clientes" → Botão "Novo Cliente"
```

Form:
- Nome: João da Silva
- CPF: 12345678900
- Telefone: 11999998888
- Email: joao@example.com

- [ ] Form submete
- [ ] Cliente aparece na lista
- [ ] Isolamento: outro usuário não vê este cliente

**Resultado:** ✅ AC6 PASS

### Teste 7: CRM Editar (AC7)
- [ ] Clicar em cliente
- [ ] Alterar telefone
- [ ] Salvar
- [ ] Lista atualiza
- [ ] F5 persiste

**Resultado:** ✅ AC7 PASS

### Teste 8: CRM Deletar (AC8)
- [ ] Abrir cliente
- [ ] Clicar "Deletar"
- [ ] Confirmar
- [ ] Desaparece da lista
- [ ] F5 não reaparece

**Resultado:** ✅ AC8 PASS

### Teste 9: Despesa Criar (AC9)
```
Tab "Gastos" → Botão "Nova Despesa"
```

Form:
- Categoria: Recondicionamento
- Descrição: Pintura e detalhes
- Valor: 2500 (em centavos ou normalizado)
- Data: [data de hoje ou anterior]

- [ ] Submete sem erro
- [ ] Aparece na lista de despesas

**Resultado:** ✅ AC9 PASS

### Teste 10: Resumo Despesas (AC10)
```
Tab "Gastos" → Seção "Resumo por Categoria" (se existir)
```

- [ ] Tabela com: Categoria | Total | Quantidade
- [ ] "Recondicionamento: R$ 2.500,00 (1 item)" [ou similar]
- [ ] Se criar outro "Recondicionamento", incrementa

**Resultado:** ✅ AC10 PASS / ⚠️ AC10 PARTIAL (resumo não existe mas CRUD funciona)

### Teste 11: Isolamento Despesas (AC11)
- [ ] Login Loja A → Cria despesa
- [ ] Logout → Login Loja B
- [ ] Despesa de Loja A **não aparece** na lista
- [ ] Criar despesa em Loja B → só essa aparece

**Resultado:** ✅ AC11 PASS / ❌ AC11 FAIL

---

## Documentação de Resultados

### Arquivo: `docs/qa/tests/ENTREGA-1.2-results.md`

```markdown
# Resultados: ENTREGA-1.2 — CRUD & Kanban

**Data:** [data]
**Testador:** [nome]
**Status Geral:** ✅ PASSOU / ⚠️ PARCIAL / ❌ FALHOU

## Testes

| AC | Teste | Resultado | Notas |
|----|-------|-----------|-------|
| AC1 | Criar Veículo | ✅ | Aparece em lista e kanban |
| AC2 | Editar Veículo | ✅ | Persiste após F5 |
| AC3 | Deletar Veículo | ✅ | Desaparece completamente |
| AC4 | Drag-Drop | ✅ | Feedback visual OK, status muda |
| AC5 | Kanban Persiste | ✅ | F5 mantém coluna correta |
| AC6 | CRM Criar | ✅ | Aparece na lista |
| AC7 | CRM Editar | ✅ | Persiste |
| AC8 | CRM Deletar | ✅ | Remove |
| AC9 | Despesa Criar | ✅ | Aparece na lista |
| AC10 | Resumo | ⚠️ | Não implementado (ACEITO) |
| AC11 | Isolamento | ✅ | Loja B não vê Loja A |

## Issues

- [ ] Nenhum
- [ ] [Se houver]

## Próximas Ações

- [ ] Proceeder para ENTREGA-1.3
```

---

## Dev Notes

**Se Kanban drag não funciona:**
1. Verificar DevTools Console por erros JS
2. Verificar se `draggable={true}` está no card JSX
3. Escalar para @dev

**Se CRUD não persiste (F5 perde alterações):**
1. Verificar Network tab → POST/PUT requests
2. Se request falha → escalar para @dev
3. Se request OK mas ainda perde → problema de cache

**Se Isolamento falha:**
1. Login Loja A → DevTools Network → GET /crm (ou /expenses)
2. Copiar response JSON
3. Verificar se todos os records têm `dealership_id` = A
4. Se vê IDs diferentes → escalar para @dev

---

**Bloqueador:** ENTREGA-1.1 deve estar ✅ PASS
**Desbloqueado:** ENTREGA-1.4 pode começar durante este teste
**Handoff:** Avisar @qa quando AC1-11 completos
