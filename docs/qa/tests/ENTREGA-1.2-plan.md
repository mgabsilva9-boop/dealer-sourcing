# Plano: ENTREGA-1.2 — Testes CRUD & Kanban Arrastável

**Data Planejada:** 31/03/2026
**Executor:** Claude Code (@qa)
**Status:** Planejado

---

## Escopo

ENTREGA-1.2 testa as funcionalidades de gestão de inventário:
- ✅ CRUD de veículos (criar, ler, atualizar, deletar)
- ✅ Pipeline de status (available → reserved → sold)
- ✅ Kanban arrastável entre colunas
- ✅ Upload e deleção de fotos
- ✅ Isolamento por dealership_id (Loja A vs Loja B)

---

## Acceptance Criteria

### AC1: Criar Veículo
```
Dado um usuário logado como dono
Quando preenche formulário com dados do veículo
  - Make/Model (ex: BMW M3)
  - Ano (2023)
  - Preço de entrada (R$ 150.000)
  - Status (available)
E clica "Salvar"
Então o veículo aparece na lista com status "available"
E dealership_id é o da loja do dono
```

### AC2: Listar Veículos
```
Dado Loja A com 5 veículos
E Loja B com 5 veículos
Quando usuário da Loja A faz login
Então vê apenas 5 veículos (isolamento RLS)
E usuário da Loja B vê seus 5 veículos
```

### AC3: Editar Veículo
```
Dado um veículo na lista
Quando clica para abrir detalhe
E modifica preço ou status
E clica "Salvar"
Então mudança persiste após F5
E outro usuário da mesma loja vê a mudança
```

### AC4: Deletar Veículo
```
Dado um veículo na lista
Quando clica botão "Deletar"
E confirma ação
Então veículo desaparece da lista
E não pode ser recuperado
```

### AC5: Upload de Foto
```
Dado veículo sem foto
Quando clica "Upload foto"
E seleciona arquivo JPG
E clica "Salvar"
Então:
  - Preview da foto aparece no formulário
  - Foto é salva no Supabase Storage
  - Path é armazenado em vehicles.image_url
  - Foto aparece no card da lista (não só detalhe)
```

### AC6: Deletar Foto
```
Dado veículo com foto
Quando clica botão "Deletar foto"
E confirma
Então:
  - Foto é removida do Storage
  - Column image_url é setada para NULL
  - Erro SEM mensagem "Rota não encontrada"
  - Card volta para imagem placeholder
```

### AC7: Kanban Arrastável
```
Dado 3 colunas: Available | Reserved | Sold
Quando arrasta card de "Available" para "Reserved"
Então:
  - Status visual muda imediatamente (otimista)
  - API é chamada para persistir
  - Após F5, status permanece em "Reserved"
E se arrasta de "Reserved" para "Sold"
  - Status muda para Sold
  - Cor muda (verde → cinza)
```

### AC8: Isolamento por Dealership
```
Dado veículos:
  - Loja A: BMW, Audi, Range Rover (3 total)
  - Loja B: Toyota, Jeep (2 total)
Quando gerente da Loja A faz login
Então vê apenas 3 veículos
E NÃO consegue editar/deletar veículos da Loja B
(mesmo com conhecimento de IDs via dev console)
```

---

## Testes Específicos

| AC | Teste | Tipo | Esforço |
|----|-------|------|---------|
| AC1 | Criar BMW M3 com preço R$200K | Manual | 10min |
| AC1 | Tentar criar sem preço (validação) | Manual | 5min |
| AC2 | Login Loja A = 5 veículos | Manual | 5min |
| AC2 | Login Loja B = 5 veículos diferentes | Manual | 5min |
| AC3 | Editar preço BMW de 200K para 180K | Manual | 10min |
| AC3 | F5 + verificar preço persiste | Manual | 5min |
| AC4 | Deletar último Audi da lista | Manual | 10min |
| AC5 | Upload JPG do BMW | Manual | 15min |
| AC5 | Verificar foto no card da lista | Manual | 5min |
| AC6 | Deletar foto do BMW | Manual | 10min |
| AC6 | Verificar NO erro "Rota não encontrada" | Manual | 5min |
| AC7 | Arrastar BMW de available para reserved | Manual | 15min |
| AC7 | Arrastar de reserved para sold | Manual | 10min |
| AC7 | F5 + verificar status persiste | Manual | 5min |
| AC8 | Gerente Loja A tenta acessar veículo Loja B por ID | Manual | 10min |

---

## Dados de Teste

### Veículos Pré-criados

**Loja A (dealership_id: 9272801a-bbf6-40ef-bc78-6217332e408c)**
```
1. BMW M3 2023 - R$ 250.000 - available
2. Audi A4 2022 - R$ 180.000 - available
3. Range Rover 2024 - R$ 500.000 - available
4. Mercedes C300 2023 - R$ 200.000 - reserved
5. Jeep Wrangler 2021 - R$ 150.000 - available
```

**Loja B (dealership_id: 9b59b6e3-4607-4449-b412-eb110b64f338)**
```
1. Toyota Hilux SRX 2024 - R$ 180.000 - available
2. SW4 Diamond 2023 - R$ 250.000 - available
3. Truck RAM 2500 2024 - R$ 350.000 - available
4. Toyota Land Cruiser 2022 - R$ 400.000 - sold
5. Jeep Grand Cherokee 2023 - R$ 280.000 - reserved
```

---

## Checklist Pré-testes

- [ ] Banco com 10 veículos (5 por loja)
- [ ] Cada veículo tem dealership_id correto
- [ ] Backend rodando em localhost:3000
- [ ] Frontend rodando em localhost:5173
- [ ] Supabase Storage configurado para uploads
- [ ] RLS habilitado nas tabelas
- [ ] DELETE /inventory/:id/image rota existe

---

## Resultado Esperado

✅ **ENTREGA-1.2 PASSA** quando:
- AC1-4: CRUD funciona (criar, ler, editar, deletar)
- AC5-6: Upload/deleção de fotos sem erros
- AC7: Kanban arrastável com persistência
- AC8: Isolamento RLS funciona (sem data leakage)

---

**Criado:** 31/03/2026 20:30
**Próxima Etapa:** Executar testes manuais conforme checklist acima

