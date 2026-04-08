# 🎨 PLANO: Melhorias Visuais — Imagens de Carros

**Data:** 8 Abril 2026  
**Objetivo:** Enquadrar imagens profissionalmente em Kanban, Lista e Modal  
**Prioridade:** MÉDIA (após 5 bugs críticos fixarem, antes de entregar ao cliente)  
**Timeline:** ~6h de trabalho (paralelo com Dev Agent)

---

## 📋 ANÁLISE DO PROBLEMA ATUAL

### Onde as Imagens Aparecem

1. **Lista de Estoque (Aba Estoque)**
   - Card com imagem + info do carro
   - Problema: imagem pode ser muito grande, muito pequena, errado aspect ratio
   - Esperado: proporcional, crop centralizado, profissional

2. **Kanban (Aba Estoque)**
   - Cards em colunas (Disponível, Reservado, etc)
   - Problema: imagens deformadas, ou muito pequenas, ou ocupam todo espaço
   - Esperado: thumbnail quadrada, crop inteligente, proporcional

3. **Modal Detalhe (Clica no Carro)**
   - Imagem grande no topo
   - Problema: pode ser gigante (overflow), ou muito pequena
   - Esperado: hero image profissional, full width com aspect ratio fixo

4. **Clientes & Dashboard**
   - Cards de clientes, financeiro, etc
   - Problema: sem imagens ainda
   - Esperado: adicionar fotos de clientes (futura feature)

---

## 🎯 ESPECIFICAÇÃO DE DESIGN

### 1. Lista de Estoque — Vehicle Card

**Atualmente:**
```
┌──────────────────────┐
│  [  Imagem 300x200]  │
│                      │
│  Ford Ka             │
│  2020 • 72.000 km    │
│  R$ 68.000           │
└──────────────────────┘
```

**Proposto:**
```
┌─────────────────────────────────────┐
│  [ Imagem 100% width, 250px height] │
│  (aspect-ratio: 16/9, object-fit)   │
│                                      │
│  Ford Ka 2020                        │
│  72.000 km • R$ 68.000               │
│  Status: Disponível                  │
└─────────────────────────────────────┘

Specs:
- Largura: 100% do card (responsive)
- Altura: 250px (fixo, aspect-ratio 16/9)
- object-fit: cover (crop centralizado)
- object-position: center
- Border-radius: 8px (top)
- Opacity hover: 0.9
- Placeholder: gradient cinza enquanto carrega
```

---

### 2. Kanban — Card Compacto

**Atualmente:**
```
┌──────────────┐
│  [Imagem]    │
│  Ford Ka     │
└──────────────┘
```

**Proposto:**
```
┌───────────────────┐
│ [Imagem 150x100]  │ ← Square (1:1 aspect ratio)
│ object-fit: cover │
├───────────────────┤
│ Ford Ka 2020      │ ← Text 2 linhas max
│ R$ 68k            │
└───────────────────┘

Specs:
- Imagem: 150px x 150px square
- aspect-ratio: 1 / 1
- object-fit: cover (centralizado)
- Border-radius: 4px (top)
- Sombra: subtle (hover intensifica)
- Badge de status: top-right (cor + texto)
- Drag indicator: cursor: grab ao passar

Kanban Inteiro:
- Coluna Disponível: imagem full color
- Coluna Reservado: imagem com overlay amarelo (opacity 20%)
- Coluna Vendido: imagem com overlay azul (opacity 20%)
- Coluna Em Reparo: imagem em grayscale
```

---

### 3. Modal Detalhe — Hero Image

**Atualmente:**
```
┌─────────────────────────────────────┐
│                                      │
│  [  Imagem variável, deformada]     │
│                                      │
│  Ford Ka 2020                        │
│  Info: ...                           │
└─────────────────────────────────────┘
```

**Proposto:**
```
┌─────────────────────────────────────────┐
│                                          │
│  [ Hero Image — 100% width, 400px]      │
│  [ aspect-ratio 16/9, object-fit cover] │
│  [ Gradiente overlay (bottom) preto]    │
│                                          │
│  Ford Ka 2020                            │
│  72.000 km • R$ 68.000                   │
│  ──────────────────────────────────────  │
│  Custos: ...                             │
│  Status: ...                             │
└─────────────────────────────────────────┘

Specs:
- Largura: 100% do modal
- Altura: 400px (fixo, aspect-ratio 16/9)
- object-fit: cover (centralizado)
- Overlay: linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))
- Texto: sobreposto no gradiente (white text)
- Border-radius: 8px (top)
- Loading state: skeleton (shimmer animation)
```

---

## 🛠️ IMPLEMENTAÇÃO TÉCNICA

### Mudanças em CSS (Tailwind)

```css
/* Vehicle Card — Lista */
.vehicle-card-image {
  @apply w-full h-[250px] object-cover object-center rounded-t-lg;
  aspect-ratio: 16 / 9;
  background: linear-gradient(90deg, #e5e7eb 0%, #d1d5db 100%); /* placeholder */
  animation: shimmer 2s infinite;
}

/* Vehicle Card — Kanban */
.vehicle-kanban-image {
  @apply w-[150px] h-[150px] object-cover object-center rounded-t;
  aspect-ratio: 1 / 1;
  background: linear-gradient(45deg, #e5e7eb, #d1d5db);
}

/* Modal — Hero Image */
.vehicle-modal-hero {
  @apply w-full h-[400px] object-cover object-center rounded-t-xl relative;
  aspect-ratio: 16 / 9;
  background: linear-gradient(45deg, #e5e7eb, #d1d5db);
}

.vehicle-modal-hero::after {
  content: '';
  @apply absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent;
}

/* Placeholder shimmer */
@keyframes shimmer {
  0%, 100% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

/* Status overlay para Kanban */
.kanban-card.status-reserved {
  .vehicle-kanban-image {
    filter: brightness(0.9);
    position: relative;
  }
  
  .vehicle-kanban-image::before {
    content: '';
    @apply absolute inset-0 bg-yellow-300 opacity-20 rounded-t;
  }
}

.kanban-card.status-sold {
  .vehicle-kanban-image::before {
    @apply bg-blue-300 opacity-20;
  }
}

.kanban-card.status-maintenance {
  .vehicle-kanban-image {
    filter: grayscale(100%);
  }
}
```

### Mudanças em React (JSX)

#### Lista — VehicleCard.jsx
```jsx
<div className="vehicle-card bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition">
  {/* Imagem com placeholder + loading state */}
  <div className="relative">
    <div className="vehicle-card-image bg-gray-200">
      <img
        src={imageUrl}
        alt={`${make} ${model}`}
        className="vehicle-card-image"
        onError={(e) => {
          e.target.src = '/images/placeholder-car.png'; // fallback
        }}
        loading="lazy"
      />
    </div>
    
    {/* Status badge (canto superior direito) */}
    <div className={`absolute top-2 right-2 px-3 py-1 rounded text-xs font-bold text-white ${statusColor}`}>
      {statusLabel}
    </div>
  </div>

  {/* Info */}
  <div className="p-4">
    <h3 className="font-bold text-lg">{make} {model}</h3>
    <p className="text-sm text-gray-600">{year} • {mileage.toLocaleString()} km</p>
    <p className="text-lg font-bold text-green-600">R$ {price.toLocaleString('pt-BR')}</p>
  </div>
</div>
```

#### Kanban — KanbanCard.jsx
```jsx
<div
  draggable
  className={`kanban-card bg-white rounded shadow cursor-grab hover:shadow-lg transition status-${status}`}
>
  {/* Imagem quadrada com status overlay */}
  <div className="relative vehicle-kanban-image bg-gray-200">
    <img
      src={imageUrl}
      alt={`${make} ${model}`}
      className="vehicle-kanban-image"
      onError={(e) => {
        e.target.src = '/images/placeholder-car.png';
      }}
      loading="lazy"
    />
  </div>

  {/* Info compacta */}
  <div className="p-2">
    <h4 className="font-bold text-sm truncate">{make} {model}</h4>
    <p className="text-xs text-gray-600">R$ {(price / 1000).toFixed(0)}k</p>
  </div>
</div>
```

#### Modal — VehicleDetail.jsx
```jsx
<div className="modal-content">
  {/* Hero Image com overlay */}
  <div className="relative vehicle-modal-hero bg-gray-200">
    <img
      src={imageUrl}
      alt={`${make} ${model}`}
      className="vehicle-modal-hero"
      onError={(e) => {
        e.target.src = '/images/placeholder-car.png';
      }}
    />
    
    {/* Título sobreposto */}
    <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
      <h2 className="text-3xl font-bold">{make} {model} {year}</h2>
      <p className="text-lg opacity-90">{mileage.toLocaleString()} km • R$ {price.toLocaleString('pt-BR')}</p>
    </div>
  </div>

  {/* Info detalhada */}
  <div className="p-6">
    {/* Custos, status, etc */}
  </div>
</div>
```

---

## 📸 Fallback & Placeholder

### Placeholder Image
```jsx
// Se não tiver imagem, mostrar placeholder profissional
const placeholderImage = '/images/placeholder-car.png'

// Ou: usar gradiente dinâmico baseado em cor
<div className="vehicle-card-image bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
  <svg className="w-24 h-24 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
    {/* Ícone de carro */}
  </svg>
</div>
```

### Loading State (Shimmer)
```jsx
{isLoading && (
  <div className="vehicle-card-image bg-gradient-to-r from-gray-200 via-white to-gray-200 animate-pulse" />
)}
```

---

## 🎨 Design System — Cores por Status

```css
/* Tailwind color mapping */
.status-available  { --status-color: #16a34a; } /* Green */
.status-reserved   { --status-color: #f59e0b; } /* Amber */
.status-sold       { --status-color: #2563eb; } /* Blue */
.status-maintenance { --status-color: #dc2626; } /* Red */
.status-transit    { --status-color: #0891b2; } /* Cyan */
.status-negotiation { --status-color: #7c3aed; } /* Purple */
```

---

## 🖼️ Responsividade

```css
/* Mobile (< 640px) */
.vehicle-card-image {
  height: 200px; /* menor no mobile */
  aspect-ratio: 4 / 3; /* crop diferente no mobile */
}

/* Tablet (640px - 1024px) */
.vehicle-card-image {
  height: 250px;
  aspect-ratio: 16 / 9;
}

/* Desktop (> 1024px) */
.vehicle-card-image {
  height: 300px;
  aspect-ratio: 16 / 9;
}
```

---

## 📋 Checklist de Implementação

### Frontend (UI/Design Agent)
- [ ] Criar classes CSS com Tailwind (aspect-ratio, object-fit)
- [ ] Adicionar placeholders & loading states
- [ ] Implementar em VehicleCard.jsx (lista)
- [ ] Implementar em KanbanCard.jsx
- [ ] Implementar em VehicleDetail.jsx (modal)
- [ ] Testar responsividade (mobile/tablet/desktop)
- [ ] Testar com imagens reais
- [ ] Testar com imagens quebradas (fallback)

### Backend
- [ ] Verificar que imageUrl sempre retorna string válida
- [ ] Adicionar placeholder default se null/undefined
- [ ] Comprimir imagens no upload (se aplicável)

### QA
- [ ] Layout correto em lista
- [ ] Layout correto em Kanban
- [ ] Layout correto em modal
- [ ] Imagens carregam rápido (lazy loading)
- [ ] Aspect ratio mantém em todos tamanhos
- [ ] Fallback image aparece se quebrada
- [ ] Status colors visíveis
- [ ] Mobile responsive
- [ ] Performance: bundle size não aumentou muito

---

## 🚀 Timeline

**PARALELO com bugs críticos:**
- 2h: Design + CSS (Tailwind)
- 2h: Implementação em componentes
- 2h: Testes + responsividade

**TOTAL: 6h** (pode ser simultâneo com Dev Agent nos bugs)

---

## 📊 Resultado Final Esperado

**Lista de Estoque:**
- Cards com imagens full-width, aspect ratio 16:9
- Status badge visível
- Informações limpas
- Profissional ✅

**Kanban:**
- Imagens quadradas (1:1)
- Status overlay (cor + transparência)
- Texto compacto
- Profissional ✅

**Modal:**
- Hero image grande (400px, 16:9)
- Overlay com gradiente preto
- Texto sobreposto em branco
- Muito profissional ✅

---

**Próximo:** Quer que eu acione UI/Design Agent para isso enquanto Dev Agent termina os bugs?
