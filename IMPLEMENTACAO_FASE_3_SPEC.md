# 🛠️ ESPECIFICAÇÃO TÉCNICA — FASE 3

**Status:** APROVADO PARA IMPLEMENTAÇÃO  
**Opções Escolhidas:** OPÇÃO B (Cards) + OPÇÃO A (Pills)  
**Data Aprovação:** 2026-04-08  
**ETA:** 7-9 horas

---

## 📌 COMPONENTE 1: CUSTOS DINÂMICOS (Cards Flutuantes)

### Requisitos Funcionais

#### 1.1 Interface de Custos
```
LAYOUT:
┌──────────────────────────────────────────────────────────┐
│ CUSTOS E DESPESAS                                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │Compra    │ │Funilaria │ │Martelhi. │ │Document. │   │
│ │do vei.   │ │          │ │          │ │acao      │   │
│ │          │ │          │ │          │ │          │   │
│ │280.000 R$│ │ 600 R$   │ │ 100 R$   │ │764 R$ │   │
│ │[editar]  │ │[editar]  │ │[editar]  │ │[editar]  │   │
│ │[  ✕   ]  │ │[  ✕   ]  │ │[  ✕   ]  │ │[  ✕   ]  │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                          │
│ ┌──────────┐ ┌──────────┐ ┌────────────────────────┐   │
│ │Comissao  │ │Combusti. │ │ [+] Adicionar Custo   │   │
│ │          │ │          │ │                       │   │
│ │ 400 R$   │ │  47 R$   │ │ Categoria: [dropdown] │   │
│ │[editar]  │ │[editar]  │ │ Valor: [input]        │   │
│ │[  ✕   ]  │ │[  ✕   ]  │ │ [Adicionar]           │   │
│ └──────────┘ └──────────┘ └────────────────────────┘   │
│                                                          │
│ TOTAL CUSTOS: R$ 281.911 (atualizado em tempo real)   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### 1.2 Funcionalidades de Cards

1. **CRIAR NOVO CUSTO**
   - Card especial com inputs (Categoria + Valor)
   - Dropdown de categorias pré-definidas:
     - Compra do veículo
     - Funilaria
     - Martelinho
     - Documentação
     - Comissão
     - Combustível
     - (permitir customizado)
   - Input numérico para valor
   - Botão [+Adicionar] para salvar

2. **EDITAR CUSTO**
   - Click em [editar] abre modal ou inline edit
   - Modal: Categoria + Valor editáveis
   - Salvar: PATCH `/inventory/:id/costs/:costId`
   - Cancelar: volta sem salvar
   - Após salvar: Card atualiza visualmente

3. **DELETAR CUSTO**
   - Click em [✕] remove o card
   - Confirmação: "Deletar R$ XXX de Categoria?"
   - DELETE `/inventory/:id/costs/:costId`
   - Após delete: Card desaparece com animação

4. **CALCULAR TOTAL**
   - Total em tempo real = SUM(todos os valores)
   - Atualiza a cada add/edit/delete
   - Salvo junto com o veículo

---

### Requisitos Técnicos

#### 1.3 Estrutura de Dados

**Frontend State:**
```javascript
// Dentro do formulário de criar/editar veículo
const [costs, setCosts] = useState([
  { id: 'cost_1', category: 'Compra do veiculo', value: 280000 },
  { id: 'cost_2', category: 'Funilaria', value: 600 },
  // ...
]);

const totalCosts = costs.reduce((sum, c) => sum + c.value, 0);
```

**Backend (Já existe, mas verificar):**
```
POST /inventory/:id/costs
  Body: { category, value }
  Return: { id, category, value }

PATCH /inventory/:id/costs/:costId
  Body: { category?, value? }
  Return: { id, category, value }

DELETE /inventory/:id/costs/:costId
  Return: { success: true }

GET /inventory/:id (já retorna costs agregados)
```

#### 1.4 Validação

- **Categoria:** String não vazia, máx 50 caracteres
- **Valor:** Número >= 0, máximo 10M (limite razoável)
- **Feedback:** Toast de sucesso/erro após ação
- **Desabilitado:** Desabilitar [Adicionar] se categoria vazia ou valor inválido

#### 1.5 Componentes React Necessários

- `<CostCard />` - Card de custo individual (exibe dados)
- `<CostCardEdit />` - Card com inputs para edição
- `<CostCardNew />` - Card especial para adicionar novo custo
- `<CostsList />` - Container que agrupa todos os cards
- `useCosts()` - Custom hook para manage costs

---

---

## 📌 COMPONENTE 2: STATUS VISUAL (Pills Clicáveis)

### Requisitos Funcionais

#### 2.1 Interface de Status

```
LAYOUT:
┌──────────────────────────────────────────────────────────┐
│ STATUS DO VEÍCULO                                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Selecione um status:                                     │
│                                                          │
│ [ ✓ Disponível ]  [ Reservado ]  [ Vendido ]           │
│                                                          │
│ [ Negociação ]  [ Recondicionamento ]  [ Entregue ]    │
│                                                          │
│ ← Um é GREEN/highlighted                               │
│ ← Outros são GRAY não clicáveis ou com hover           │
│                                                          │
│ Status selecionado: DISPONÍVEL (verde)                 │
│ Última alteração: 2026-04-08 14:30 por João           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### 2.2 Funcionalidades

1. **PILLS VISUAIS**
   - 6 Pills (available, reserved, sold, negotiation, maintenance, transit)
   - Um deles é ATIVO (verde, com checkmark ✓)
   - Outros são INATIVOS (cinza, sem hover)
   - Hover effect em pills inativas (escurece um pouco)
   - Click em pill inativa = mudar status

2. **CORES POR STATUS**
   ```
   available      → Verde (#16a34a)  [Disponível]
   reserved       → Amarelo (#d97706) [Reservado]
   sold           → Azul (#2563eb)   [Vendido]
   negotiation    → Roxo (#7c3aed)   [Negociação]
   maintenance    → Vermelho (#dc2626) [Recondicionamento]
   transit        → Cyan (#0891b2)   [Em Trânsito]
   ```

3. **METADATA DO STATUS**
   - Show: "Status selecionado: [STATUS]"
   - Show: "Última alteração: [DATE] por [USER]"
   - Optional: Histórico de mudanças (timeline)

4. **AÇÃO AO CLICAR**
   - Click em pill → Confirmar? (modal ou toast)
   - Confirmação: "Mudar de [OLD] para [NEW]?"
   - PATCH `/inventory/:id` { status: "new_status" }
   - Após sucesso: UI atualiza, Financial tab recalcula (via useMemo)

---

### Requisitos Técnicos

#### 2.3 Estrutura de Dados

**Frontend State:**
```javascript
const [vehicle, setVehicle] = useState({
  id: '...',
  status: 'available', // Um de: available, reserved, sold, negotiation, maintenance, transit
  statusChangedAt: '2026-04-08T14:30:00Z',
  statusChangedBy: 'João Silva'
});
```

**Mapeamento de Status:**
```javascript
const statusConfig = {
  available: { label: "Disponível", color: "#16a34a", bg: "#f0fdf4" },
  reserved: { label: "Reservado", color: "#d97706", bg: "#fffbeb" },
  sold: { label: "Vendido", color: "#2563eb", bg: "#eff6ff" },
  negotiation: { label: "Negociação", color: "#7c3aed", bg: "#f5f3ff" },
  maintenance: { label: "Recondicionamento", color: "#dc2626", bg: "#fef2f2" },
  transit: { label: "Em Trânsito", color: "#0891b2", bg: "#ecfeff" },
};
```

**Backend (Já existe):**
```
PATCH /inventory/:id
  Body: { status: "available" | "reserved" | "sold" | ... }
  Valida: status deve estar em lista permitida
  Retorna: Vehicle object com novo status
  Side effect: Atualiza updated_at automaticamente
```

#### 2.4 Validação

- **Status válidos:** Apenas 6 opciones pré-definidas (enum)
- **Transições:** Qualquer status pode ir para qualquer outro
- **Feedback:** Toast de sucesso/erro
- **Propagação:** Mudança reflete em tempo real nas outras abas

#### 2.5 Componentes React Necessários

- `<StatusPill />` - Componente individual de pill (ativo ou inativo)
- `<StatusPillGroup />` - Container com 6 pills
- `<StatusMetadata />` - Show "Última alteração: ..."
- `useStatusChange()` - Custom hook para mudar status com confirmação

---

---

## 🔄 INTEGRAÇÃO ENTRE COMPONENTES

### Fluxo Completo

1. **User abre aba "Estoque"**
   - Vê veículo com Cards de Custos + Pills de Status
   
2. **User adiciona um custo**
   - Card novo é criado
   - Total é recalculado (useMemo no pai)
   - Estado local atualiza `costs` array
   - Ao salvar veículo: POST `/inventory` com array de costs

3. **User muda status de "available" para "sold"**
   - Click em pill "Vendido"
   - Modal: "Mudar de Disponível para Vendido?"
   - Click "Confirmar"
   - PATCH `/inventory/:id` { status: "sold" }
   - UI: Pill muda para azul, mostra "Vendido"
   - Side effect: Metadata atualiza com timestamp

4. **User vai para aba "Financeiro"**
   - Financial tab usa useMemo([vehicles, expenses])
   - Detecta que `vehicles[i].status === "sold"`
   - Recalcula revenue automaticamente (SEM API call)
   - Dashboard mostra novo total

5. **User vai para aba "IPVA"**
   - IPVA list pode filtrar/mostrar só "sold" ou todos
   - Sincronizado com status change

---

---

## 🎯 CHECKLIST DE IMPLEMENTAÇÃO

### Antes de Começar
- [ ] Ler este documento completo
- [ ] Entender o fluxo de dados
- [ ] Verificar estrutura existente em App.jsx

### Componentes de Custos (Cards)
- [ ] Criar componente `<CostCard />`
- [ ] Criar componente `<CostCardEdit />`
- [ ] Criar componente `<CostCardNew />`
- [ ] Criar container `<CostsList />`
- [ ] Implementar add cost (local state + API)
- [ ] Implementar edit cost (local state + API)
- [ ] Implementar delete cost (local state + API)
- [ ] Implementar total calculation (useMemo)
- [ ] Adicionar validações
- [ ] Adicionar toasts de feedback

### Componentes de Status (Pills)
- [ ] Criar componente `<StatusPill />`
- [ ] Criar container `<StatusPillGroup />`
- [ ] Criar componente `<StatusMetadata />`
- [ ] Implementar status change (com confirmação)
- [ ] Implementar PUT API call
- [ ] Implementar cores por status
- [ ] Adicionar animações de mudança
- [ ] Adicionar validação de status válido

### Integração
- [ ] Custos salvam junto com veículo
- [ ] Status change reflete em Financial tab (via useMemo)
- [ ] Não quebra nada existente
- [ ] Mobile responsivo

### Testes
- [ ] Adicionar/editar/deletar custos
- [ ] Mudar status
- [ ] Ir para Financial tab e ver valores atualizados
- [ ] Refresh página e dados persistem
- [ ] Testar em mobile

### Deployment
- [ ] Commit com mensagem clara
- [ ] Push para GitHub
- [ ] Railway/Vercel redeploy automático
- [ ] Verificar em produção

---

## 📋 ARQUIVO PARA REFERÊNCIA

Mockups visuais detalhados estão em: `DESIGN_OPTIONS_FASE_2.md`

---

**PRONTO PARA IMPLEMENTAÇÃO!** 🚀
