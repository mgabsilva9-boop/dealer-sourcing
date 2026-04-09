# 🎯 PLANO DE QA — Pré-Entrega ao Cliente

**Data:** 2026-04-09  
**Status:** ATIVO  
**Objetivo:** Validar 100% do sistema antes de entregar ao cliente

---

## ✅ CHECKLIST - AUTHENTICATION & BASICS

### Login
- [ ] Dono (dono@brossmotors.com / bross2026) consegue fazer login
- [ ] Login invalido mostra erro apropriado
- [ ] Após login, redireciona para dashboard
- [ ] Token JWT está sendo armazenado
- [ ] Logout funciona e limpa sessão

---

## ✅ CHECKLIST - ABA ESTOQUE

### Listagem de Veículos
- [ ] Mostra todos os 23 veículos (20 Loja A + 3 Loja B)
- [ ] Veículos têm foto, marca, modelo, ano
- [ ] Status visual (Disponível, Vendido, etc) está correto
- [ ] Days in stock mostra valores corretos

### Filtros por Loja
- [ ] Clica "Loja A" → mostra 20 veículos
- [ ] Clica "Loja B" → mostra 3 veículos
- [ ] Clica "Todas" → mostra 23 veículos
- [ ] Filtro persiste ao navegar para outra aba e voltar

### Criar Novo Veículo
- [ ] Abre modal com form completo
- [ ] Campos obrigatórios (Marca, Modelo) validam
- [ ] Dropdown "Loja" mostra "Loja A" e "Loja B"
- [ ] Salva novo veículo com sucesso
- [ ] Novo veículo aparece na listagem
- [ ] Custos podem ser adicionados (Funilaria, Documentação, etc)

### Editar Veículo
- [ ] Clica em veículo → abre detalhes
- [ ] Consegue editar campos (preço, km, status)
- [ ] Salva edição com sucesso
- [ ] Mudanças aparecem na listagem

### Deletar Veículo
- [ ] Opção de deletar está disponível
- [ ] Pede confirmação antes de deletar
- [ ] Veículo desaparece da listagem

---

## ✅ CHECKLIST - ABA CUSTOS GERAIS

### Listagem de Custos
- [ ] Mostra categorias (Aluguel, Seguro, Marketing, etc)
- [ ] Mostra valores
- [ ] Total de custos está calculado corretamente

### Adicionar Custo
- [ ] Abre modal com form
- [ ] Consegue selecionar categoria ou criar personalizada
- [ ] Salva novo custo
- [ ] Total recalcula automaticamente

### Editar Custo
- [ ] Consegue editar valor
- [ ] Salva edição
- [ ] Total recalcula

### Deletar Custo
- [ ] Consegue deletar
- [ ] Total recalcula

---

## ✅ CHECKLIST - ABA FINANCEIRO

### Visão Geral
- [ ] Mostra P&L overall (Faturamento, Custos, Lucro, Despesas, Lucro Líquido)
- [ ] Gráfico de lucro nos últimos 6 meses
- [ ] Top 5 veículos com maior margem

### Por Veículo
- [ ] Mostra tabela com todos os veículos vendidos
- [ ] Colunas: Veículo, Compra, Custos, Venda, Lucro, Margem
- [ ] Valores estão corretos (Lucro = Venda - Custos)
- [ ] Margem % está correta

### Comparar Lojas (NOVO!)
- [ ] Botão "Comparar Lojas" está visível
- [ ] Clica nele → mostra Loja A e Loja B lado a lado
- [ ] Cada loja mostra:
  - Faturamento (total de vendas)
  - Custos (soma de todos os custos dos veículos)
  - Lucro (Faturamento - Custos)
  - Quantidade de vendas
  - Margem média %
- [ ] Valores estão corretos para ambas lojas

### Mensal
- [ ] Consegue selecionar mês e ano
- [ ] Botão "Carregar" funciona
- [ ] Mostra dados do mês/ano selecionado

---

## ✅ CHECKLIST - ABA CUSTOS POR VEÍCULO

### Detalhe de Custos
- [ ] Clica em veículo → mostra todos os custos associados
- [ ] Consegue adicionar novo custo
- [ ] Consegue editar custo
- [ ] Consegue deletar custo
- [ ] Total de custos recalcula corretamente

---

## ✅ CHECKLIST - ABA IPVA

### Listagem
- [ ] Mostra IPVA de todos os veículos
- [ ] Status visual (Pago, Pendente, Urgente)
- [ ] Data de vencimento está correta

### Criar IPVA
- [ ] Consegue registrar novo IPVA
- [ ] Estado, valor, data preenchem corretamente
- [ ] IPVA aparece na listagem

### Editar IPVA
- [ ] Consegue alterar status
- [ ] Consegue alterar data de vencimento

---

## ✅ CHECKLIST - ABA CRM

### Listagem de Clientes
- [ ] Mostra todos os clientes
- [ ] Consegue filtrar por tipo (Lead, Prospect, Customer)

### Criar Cliente
- [ ] Form abre com campos (Nome, Email, Telefone, Tipo)
- [ ] Salva novo cliente
- [ ] Cliente aparece na listagem

### Editar/Deletar
- [ ] Consegue editar dados do cliente
- [ ] Consegue deletar cliente

---

## ✅ CHECKLIST - BUSCA IA (SOURCING)

### Listagem
- [ ] Mostra oportunidades de compra
- [ ] Score está visual (verde/amarelo/vermelho)
- [ ] Informações: Plataforma, Marca, Modelo, Preço, FIPE, Desconto, KM

### Filtros
- [ ] Consegue filtrar por score
- [ ] Consegue filtrar por plataforma

---

## ✅ CHECKLIST - PERFORMANCE & UX

### Velocidade
- [ ] App carrega em < 3s
- [ ] Abas trocam em < 500ms
- [ ] Filtros respondem em < 1s
- [ ] Sem lag ao scroll

### Responsividade
- [ ] Funciona em desktop (1920x1080)
- [ ] Funciona em tablet (768px)
- [ ] Sem layout quebrado

### Usabilidade
- [ ] Botões têm feedback visual (hover)
- [ ] Modais têm close button
- [ ] Validações mostram mensagens de erro
- [ ] Sucessos mostram feedback (toast/mensagem)

---

## ✅ CHECKLIST - DADOS & INTEGRIDADE

### Persistência
- [ ] Dados salvos continuam após logout/login
- [ ] Cálculos (Lucro, Margem, etc) estão corretos
- [ ] Filtros não perdem dados

### Sincronização
- [ ] Frontend → Backend → Supabase funciona corretamente
- [ ] Dados são retornados do banco (não mock)
- [ ] Múltiplos usuários podem acessar sem conflito

### Validações
- [ ] Campos obrigatórios não permitem salvar vazio
- [ ] Valores numéricos aceitam apenas números
- [ ] CPF/CNPJ validam corretamente
- [ ] Datas são válidas

---

## 🧪 CENÁRIOS DE TESTE END-TO-END

### Cenário 1: Gerenciamento de Loja
1. Login como Dono
2. Vai para Estoque
3. Cria novo veículo em Loja A
4. Adiciona custos (Funilaria, Documentação)
5. Vai para Financeiro → Por Veículo
6. Verifica P&L do veículo
7. Vai para Financeiro → Comparar Lojas
8. Verifica que Loja A tem mais faturamento

### Cenário 2: Busca & Compra
1. Login como Dono
2. Vai para Sourcing
3. Vê oportunidades (WebMotors, OLX, etc)
4. Filtra por score > 85
5. Clica em uma oportunidade
6. Vê detalhes (km, donos, sinistro, etc)

### Cenário 3: IPVA
1. Login como Dono
2. Vai para IPVA
3. Vê veículos com IPVA pendente
4. Clica em um veículo
5. Registra IPVA com sucesso
6. Vê status "Pago"

### Cenário 4: Múltiplas Lojas
1. Login como Dono
2. Estoque: Filtra por Loja A (mostra 20 veículos)
3. Estoque: Filtra por Loja B (mostra 3 veículos)
4. Financeiro: Clica "Comparar Lojas"
5. Vê lado a lado: Loja A vs Loja B
6. Verifica cálculos

---

## 📊 MATRIZ DE TESTES

| Funcionalidade | Login | Estoque | Financeiro | IPVA | CRM | Sourcing | Prioridade |
|---|---|---|---|---|---|---|---|
| Listar | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | CRÍTICA |
| Criar | ✅ | ✅ | ✅ | ✅ | ✅ | - | CRÍTICA |
| Editar | ✅ | ✅ | ✅ | ✅ | ✅ | - | ALTA |
| Deletar | ✅ | ✅ | ✅ | ✅ | ✅ | - | ALTA |
| Filtrar | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | CRÍTICA |
| Performance | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ALTA |

---

## 🎯 CRITÉRIO DE APROVAÇÃO

✅ **APROVADO PARA ENTREGA** se:
- [ ] 100% dos testes CRÍTICA passam
- [ ] 95%+ dos testes ALTA passam
- [ ] Zero erros no console (F12)
- [ ] Zero lag/performance issues
- [ ] Dados persistem corretamente
- [ ] Cálculos estão 100% corretos

❌ **BLOQUEADO** se:
- [ ] Qualquer teste CRÍTICA falha
- [ ] Dados desaparecem
- [ ] Cálculos estão incorretos
- [ ] Filtros não funcionam

---

## 📝 REGISTRO DE TESTES

| Data | Teste | Resultado | Notas |
|------|-------|-----------|-------|
| 2026-04-09 | Básico | ⏳ PENDENTE | - |
| 2026-04-09 | E2E | ⏳ PENDENTE | - |
| 2026-04-09 | Performance | ⏳ PENDENTE | - |

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Executar todos os testes acima
2. ✅ Documentar resultados
3. ✅ Fixar bugs encontrados (se houver)
4. ✅ Re-testar bugs fixados
5. ✅ Aprovação final
6. ✅ Deploy em produção
7. ✅ Notificar cliente

---

**Responsável:** @qa + @dev  
**Deadline:** 2026-04-09 EOD  
**Status:** ⏳ Em Progresso
