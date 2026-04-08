# 🎨 OPÇÕES DE DESIGN VISUAL — FASE 2

**Status:** Aguardando aprovação do cliente  
**Foco:** 2 mudanças visuais principais

---

## 📌 MUDANÇA 1: CUSTOS DINÂMICOS (Add/Edit/Delete)

### Contexto Atual (QUEBRADO)
```
┌─────────────────────────────────────────────┐
│ CRIAR NOVO VEÍCULO                          │
├─────────────────────────────────────────────┤
│                                             │
│ Marca: [Toyota____________]                 │
│ Modelo: [SW4_______________]                │
│ Ano: [2024____]                             │
│ Preço Compra: [280000____]                  │
│                                             │
│ ┌─ CUSTOS OPERACIONAIS ──────────────────┐ │
│ │ ☑ Compra do veiculo      R$ 280.000    │ │ ← NÃO PODE EDITAR
│ │ ☑ Funilaria             R$ 600        │ │ ← VALORES FIXOS!
│ │ ☑ Martelinho            R$ 100        │ │
│ │ ☑ Documentacao          R$ 764        │ │
│ │ ☑ Comissao              R$ 400        │ │
│ │ ☑ Combustivel           R$ 47         │ │
│ │                                        │ │
│ │ TOTAL: R$ 281.911 (NÃO SINCRONIZADO)  │ │
│ └────────────────────────────────────────┘ │
│                                             │
│ [CRIAR VEÍCULO]  [CANCELAR]                │
│                                             │
└─────────────────────────────────────────────┘

❌ Problemas:
- Valores hardcoded/pré-definidos
- Não pode adicionar novos custos
- Não pode editar custos existentes
- Não pode remover custos
- Total desincronizado
```

---

## ✅ SOLUÇÃO: 3 OPÇÕES DE INTERFACE

### OPÇÃO A: Tabela Simples (Recomendada - Mais Prática)
```
┌─────────────────────────────────────────────────────────┐
│ CRIAR NOVO VEÍCULO                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Marca: [Toyota____________]  Modelo: [SW4__________]   │
│ Ano: [2024]  Preço Compra: [280000]  Preço Venda: [350K] │
│                                                         │
│ ┌──── CUSTOS E DESPESAS ────────────────────────────┐  │
│ │                                                   │  │
│ │ CATEGORIA           │ VALOR      │ AÇÃO          │  │
│ │ ─────────────────────────────────────────────    │  │
│ │ Compra do veiculo   │ 280.000    │ [editar] [✕] │  │
│ │ Funilaria           │ 600        │ [editar] [✕] │  │
│ │ Martelinho          │ 100        │ [editar] [✕] │  │
│ │ Documentacao        │ 764        │ [editar] [✕] │  │
│ │ Comissao            │ 400        │ [editar] [✕] │  │
│ │ Combustivel         │ 47         │ [editar] [✕] │  │
│ │ ─────────────────────────────────────────────    │  │
│ │ TOTAL               │ 281.911    │               │  │
│ │                                                   │  │
│ │ Nova linha:                                       │  │
│ │ [Selecione categoria▼]  │ [    0  ]  │ [+Adicionar]│  │
│ │                                                   │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
│ [CRIAR VEÍCULO]  [CANCELAR]                            │
│                                                         │
└─────────────────────────────────────────────────────────┘

✅ Vantagens:
- Limpo e organizado
- Fácil de ler todos os custos
- Add/Edit/Delete intuitivos
- Categorias pré-definidas (dropdown)
- Total atualiza em tempo real
- Compatível com mobile
```

---

### OPÇÃO B: Cards Flutuantes (Visual Moderno)
```
┌─────────────────────────────────────────────────────────┐
│ CRIAR NOVO VEÍCULO                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Marca: [Toyota____________]  Modelo: [SW4__________]   │
│ Ano: [2024]  Preço Compra: [280000]  Preço Venda: [350K] │
│                                                         │
│ CUSTOS E DESPESAS                                      │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│ │ Compra   │  │Funilaria │  │Martelinho│  │Document. │ │
│ │ do vei.  │  │          │  │          │  │acao      │ │
│ │          │  │          │  │          │  │          │ │
│ │280.000 R$│  │ 600 R$   │  │ 100 R$   │  │764 R$    │ │
│ │[editar]  │  │[editar]  │  │[editar]  │  │[editar]  │ │
│ │[  ✕   ]  │  │[  ✕   ]  │  │[  ✕   ]  │  │[  ✕   ]  │ │
│ └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│ ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│ │Comissao  │  │Combusti. │  │ [+] Adicionar Custo  │   │
│ │          │  │          │  │                      │   │
│ │ 400 R$   │  │  47 R$   │  │ Selecionar categoria │   │
│ │[editar]  │  │[editar]  │  │ Valor: [        ]    │   │
│ │[  ✕   ]  │  │[  ✕   ]  │  │ [Adicionar]          │   │
│ └──────────┘  └──────────┘  └──────────────────────┘   │
│                                                         │
│ TOTAL CUSTOS: R$ 281.911                               │
│                                                         │
│ [CRIAR VEÍCULO]  [CANCELAR]                            │
│                                                         │
└─────────────────────────────────────────────────────────┘

✅ Vantagens:
- Visual atraente e moderno
- Cada custo é um card independente
- Fácil de ver e clicar
- Responsivo para mobile

❌ Desvantagens:
- Pode ficar confuso com muitos custos
- Menos compacto em desktop
```

---

### OPÇÃO C: Accordion/Expansível (Compacto)
```
┌─────────────────────────────────────────────────────────┐
│ CRIAR NOVO VEÍCULO                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Marca: [Toyota____________]  Modelo: [SW4__________]   │
│ Ano: [2024]  Preço Compra: [280000]  Preço Venda: [350K] │
│                                                         │
│ ▼ CUSTOS E DESPESAS (R$ 281.911)                       │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ □ Compra do veiculo      280.000   [editar] [✕]   │ │
│ │ □ Funilaria              600       [editar] [✕]   │ │
│ │ □ Martelinho             100       [editar] [✕]   │ │
│ │ □ Documentacao           764       [editar] [✕]   │ │
│ │ □ Comissao               400       [editar] [✕]   │ │
│ │ □ Combustivel            47        [editar] [✕]   │ │
│ │                                                    │ │
│ │ + Adicionar custo novo                             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [CRIAR VEÍCULO]  [CANCELAR]                            │
│                                                         │
└─────────────────────────────────────────────────────────┘

✅ Vantagens:
- Compacto, ocupa pouco espaço
- Pode expandir/colapsar
- Bom para desktop e mobile

❌ Desvantagens:
- Menos visibilidade dos custos
- Precisa clicar para expandir
```

---

## ❓ **QUAL OPÇÃO VOCÊ PREFERE PARA CUSTOS?**

**Recomendação:** **OPÇÃO A (Tabela Simples)**
- Mais prática e direta
- Fácil de usar
- Compatível com todo dispositivo
- Professional look

---

---

## 📌 MUDANÇA 2: STATUS VISUAL (Mais Didático e Visível)

### Contexto Atual (DIFÍCIL DE VER)
```
Status: [disponível▼]     ← Tão pequeno que passa despercebido
        ↑
        Dropdown simples, não deixa claro qual é o status atual
```

---

## ✅ SOLUÇÃO: 3 OPÇÕES DE VISUALIZAÇÃO

### OPÇÃO A: Pills/Badges Clicáveis (Recomendada)
```
┌─────────────────────────────────────────────────────────┐
│ STATUS DO VEÍCULO                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Selecione um status:                                    │
│                                                         │
│ [ ✓ Disponível ]  [ Reservado ]  [ Vendido ]           │
│                                                         │
│ [ Negociação ]  [ Recondicionamento ]                  │
│                                                         │
│ ← Um é GREEN/highlighted, outros são GRAY              │
│ ← Clica em outro muda o status                         │
│                                                         │
│ Status selecionado: DISPONÍVEL (verde)                 │
│ Última alteração: 2026-04-08 14:30                     │
│                                                         │
└─────────────────────────────────────────────────────────┘

VISUAL EXPANDIDO:
┌─────────────────────────────────────────────────────────┐
│ STATUS DO VEÍCULO                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [██ Disponível  ]  [  Reservado  ]  [  Vendido  ]     │
│ └─ Verde ────┘                                         │
│                                                         │
│ [  Negociação  ]  [ Recondicionamento ]               │
│                                                         │
│ Ativo: Disponível ✓                                    │
│ Data: 08/04/2026 14:30                                │
│                                                         │
└─────────────────────────────────────────────────────────┘

✅ Vantagens:
- Muito claro e visível
- Ícones coloridos (verde=OK, amarelo=atenção, azul=vendido)
- Fácil de clicar
- Visual profissional
- Compatível com mobile
- Mostra histórico
```

---

### OPÇÃO B: Kanban-Style (Drag & Drop)
```
┌────────────────────────────────────────────────────────────┐
│ VISUALIZAR ESTOQUE POR STATUS (Kanban)                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌─Disponível──┐ ┌─Reservado───┐ ┌─Vendido───┐           │
│ │             │ │             │ │           │           │
│ │ RAM 1500    │ │ BMW M3      │ │ Gol 1.0   │           │
│ │ R$315K      │ │ R$420K      │ │ R$68K     │           │
│ │             │ │             │ │           │           │
│ │ Toyota SW4  │ │ Ford Ka     │ │ Hilux     │           │
│ │ R$350K      │ │ R$68K       │ │ R$298K    │           │
│ │             │ │             │ │           │           │
│ │ VW Gol      │ │             │ │ Toyota    │           │
│ │ R$71K       │ │             │ │ SW4       │           │
│ │             │ │             │ │ R$340K    │           │
│ │ [+ Mais]    │ │ [+ Mais]    │ │ [+ Mais]  │           │
│ └─────────────┘ └─────────────┘ └───────────┘           │
│                                                            │
│ ← Arrastar veículo entre colunas para mudar status       │
│ ← Visual organizado por status                           │
│ ← Fácil ver quanto estoque em cada estágio              │
│                                                            │
└────────────────────────────────────────────────────────────┘

✅ Vantagens:
- Muito visual e intuitivo
- Drag & drop moderno
- Ver todos estágios simultaneamente
- Professional (tipo Trello)

❌ Desvantagens:
- Complexo de implementar
- Pode não funcionar bem em mobile
- Mais tempo de desenvolvimento (6-8 horas)
```

---

### OPÇÃO C: Timeline/Progress Visual
```
┌─────────────────────────────────────────────────────────┐
│ STATUS DO VEÍCULO                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Estágio de Processo:                                    │
│                                                         │
│ [●]──── [○]──── [○]──── [○]──── [○]                    │
│  │       │       │       │       │                     │
│  │       │       │       │       └─ Entregue           │
│  │       │       │       └─ Vendido                    │
│  │       │       └─ Negociação                         │
│  │       └─ Reservado                                  │
│  └─ Disponível (AQUI AGORA ●)                         │
│                                                         │
│ ← Clica em próximo estágio para avançar               │
│ ← Clica em anterior para voltar                        │
│                                                         │
│ Data em estágio atual: 08/04/2026 14:30               │
│ Tempo no estágio: 3 dias 2 horas                       │
│                                                         │
└─────────────────────────────────────────────────────────┘

✅ Vantagens:
- Visual de progresso claro
- Mostra "fluxo" do processo
- Profissional e organizador
- Fácil de entender

❌ Desvantagens:
- Menos claro que Pills para "mudar direto" para outro status
- Pode confundir se tentar voltar atrás
```

---

## ❓ **QUAL OPÇÃO VOCÊ PREFERE PARA STATUS?**

**Recomendação:** **OPÇÃO A (Pills Clicáveis)**
- Mais clara e direta
- Intuitiva
- Rápida de implementar (2-3 horas)
- Professional

**Se quiser Kanban:** Usar depois como feature extra (Fase 2.5)

---

---

## 📋 RESUMO DAS OPÇÕES

| Item | OPÇÃO A | OPÇÃO B | OPÇÃO C |
|------|---------|---------|---------|
| **Custos** | Tabela Simples | Cards Flutuantes | Accordion |
| Complexidade | ⭐ Simples | ⭐⭐ Média | ⭐⭐ Média |
| Implementação | 4-5h | 5-6h | 4-5h |
| Mobile | ✅ Ótimo | ✅ Bom | ✅ Ótimo |
| Profissional | ✅✅ Muito | ✅ Bom | ✅ Bom |
| **Status** | Pills Click | Kanban | Timeline |
| Complexidade | ⭐ Simples | ⭐⭐⭐ Complexo | ⭐⭐ Média |
| Implementação | 2-3h | 6-8h | 3-4h |
| Mobile | ✅ Ótimo | ❌ Difícil | ✅ Bom |
| Profissional | ✅✅ Muito | ✅✅✅ Excelente | ✅✅ Muito |

---

## 🎯 **PRÓXIMO PASSO**

**Qual combinação você quer?**

1. **RECOMENDAÇÃO:** Opção A (Tabela) + Opção A (Pills)
   - Tempo total: 6-8 horas
   - Resultado: Sistema profissional, intuitivo, rápido

2. **PREMIUM:** Opção B (Cards) + Opção A (Pills)
   - Tempo total: 7-9 horas
   - Resultado: Visual moderno, cards elegantes

3. **OUTRO:** Mande a combinação que prefere

**Após sua aprovação, vamos para FASE 3 (implementação)!**
