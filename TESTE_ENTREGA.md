# Plano de Testes — Entrega ao Cliente

**Data:** 31/03/2026
**Versão:** 1.0
**Status:** Pronto para Execução

---

## 1. TESTES DE LOGIN (3 Perfis)

### 1.1 Login com Dono
- [ ] Acessar http://localhost:5173 (frontend) ou URL de produção
- [ ] Email: `dono@lojaA.com` | Senha: verificar `.env` ou banco
- [ ] Esperado: Dashboard carrega, vê 5 veículos
- [ ] Verifica: Badge "Dono da Loja A" na top bar

### 1.2 Login com Admin Loja A
- [ ] Email: `admin@lojaA.com` | Senha: verificar `.env`
- [ ] Esperado: Dashboard carrega, vê 5 veículos
- [ ] Verifica: Badge "Admin Loja A" na top bar

### 1.3 Login com Gerente Loja B
- [ ] Email: `manager@lojaB.com` | Senha: verificar `.env`
- [ ] Esperado: Dashboard carrega, vê **outros** 5 veículos (isolamento por dealership_id)
- [ ] Verifica: Badge "Gerente Loja B" e nenhum veículo da Loja A aparece

### 1.4 Isolamento de Dados
- [ ] Login com Loja A → Vê apenas veículos de Loja A
- [ ] Logout → Login com Loja B → Vê apenas veículos de Loja B
- [ ] ✅ **Esperado:** Isolamento por dealership_id funciona

---

## 2. TESTES DE SESSÃO

### 2.1 F5 Mantém Sessão
- [ ] Login com qualquer usuário
- [ ] Pressionar F5 (page refresh)
- [ ] Esperado: Continua logado, dashboard carrega sem redirecionar para login
- [ ] Verifica: Token em localStorage persiste

### 2.2 Logout Funciona
- [ ] Clicar em "Sair" / "Logout" na interface
- [ ] Esperado: Redireciona para login, localStorage limpo
- [ ] Próximo F5 redireciona para login (token gone)

---

## 3. TESTES DE CRUD — INVENTÁRIO

### 3.1 Criar Novo Veículo
- [ ] Clicar em "Novo Veículo" / "+" na seção Estoque
- [ ] Preencher form:
  - Marca: BMW
  - Modelo: M2
  - VIN: WBSKT3239N2M84590
  - RENAVAM: 34028500000000
  - Preço de Compra: R$ 350.000
  - Status: available
- [ ] Salvar
- [ ] Esperado: Veículo aparece na lista em "available"
- [ ] Verifica: Contador de veículos incrementa

### 3.2 Editar Veículo
- [ ] Clicar em um veículo existente (ex: primeira linha da lista)
- [ ] Abrir detalhe/modal
- [ ] Alterar um campo (ex: Preço → R$ 360.000)
- [ ] Salvar
- [ ] Esperado: Volta para lista, valor atualizado
- [ ] Verifica: F5 → valor permanece (persiste no banco)

### 3.3 Deletar Veículo (opcional)
- [ ] Clicar em "Deletar" em um veículo detalhe
- [ ] Confirmar aviso
- [ ] Esperado: Veículo desaparece da lista
- [ ] Verifica: Contador decremente

---

## 4. TESTES DE IMAGEM

### 4.1 Upload de Foto
- [ ] Abrir detalhe de um veículo
- [ ] Clicar em área de upload de foto (ou botão "Adicionar Foto")
- [ ] Selecionar arquivo JPG/PNG local
- [ ] Esperado: Preview da foto aparece na tela
- [ ] Salvar
- [ ] Esperado: Foto aparece no detalhe, na lista, E no kanban
- [ ] Verifica: URL `v.imageUrl` preenchida no banco

### 4.2 Deletar Foto
- [ ] Abrir detalhe de veículo com foto
- [ ] Clicar em "Deletar Foto" / botão X sobre foto
- [ ] Esperado: **SEM erro "Rota não encontrada"**
- [ ] Esperado: Foto desaparece, volta a mostrar placeholder/IMGS
- [ ] Verifica: Console do navegador sem erros, logs do Railway mostram:
  ```
  [DELETE /:id/image] Deletando imagem do veículo {id}
  ```

### 4.3 Foto Aparece em Todos os Lugares
- [ ] Com foto salva, verificar:
  - [ ] Lista de veículos mostra foto real (não placeholder)
  - [ ] Kanban cards mostram foto real
  - [ ] Detalhe mostra foto real
- [ ] Esperado: `v.imageUrl || IMGS[key] || ""` funciona em todos os 3 locais

---

## 5. TESTES DE KANBAN

### 5.1 Drag-and-Drop Básico
- [ ] Na seção Estoque, visualizar kanban (colunas: available, reserved, sold)
- [ ] Pegar um card de veículo da coluna "available"
- [ ] Arrastar para coluna "reserved"
- [ ] Esperado: Card fica semi-transparente durante arrasto (opacity 0.5)
- [ ] Esperado: Coluna destino fica com borda tracejada azul
- [ ] Soltar card
- [ ] Esperado: Card se move para nova coluna, status atualiza

### 5.2 Persistência Após F5
- [ ] Após mover um card (ex: available → reserved)
- [ ] Pressionar F5
- [ ] Esperado: Kanban recarrega, card permanece na coluna "reserved"
- [ ] Verifica: Status persistiu no banco de dados

### 5.3 Múltiplos Drags
- [ ] Mover card: available → reserved → sold
- [ ] Esperado: Cada movimento atualiza status
- [ ] F5 → Status = sold
- [ ] ✅ **Esperado:** Pipeline de status funciona

---

## 6. TESTES DE CRM

### 6.1 Criar Cliente
- [ ] Tab "Clientes" / "CRM"
- [ ] Clicar "Novo Cliente"
- [ ] Preencher:
  - Nome: João da Silva
  - CPF: 123.456.789-00
  - Telefone: (11) 99999-8888
  - Email: joao@example.com
- [ ] Salvar
- [ ] Esperado: Cliente aparece na lista
- [ ] Verifica: Isolamento por dealership_id (outro usuário não vê)

### 6.2 Editar Cliente
- [ ] Clicar em cliente existente
- [ ] Alterar telefone
- [ ] Salvar
- [ ] Esperado: Lista atualiza, F5 persiste

### 6.3 Deletar Cliente
- [ ] Clicar "Deletar" em cliente
- [ ] Confirmar
- [ ] Esperado: Desaparece da lista

---

## 7. TESTES DE DESPESAS (Gastos)

### 7.1 Criar Despesa
- [ ] Tab "Gastos" / "Despesas"
- [ ] Clicar "Nova Despesa"
- [ ] Preencher:
  - Categoria: Recondicionamento
  - Descrição: Pintura e detalhes
  - Valor: R$ 2.500
  - Data: 30/03/2026
- [ ] Salvar
- [ ] Esperado: Despesa aparece na lista

### 7.2 Resumo por Categoria
- [ ] Verificar se existe botão/seção "Resumo por Categoria"
- [ ] Esperado: Mostra total gasto por categoria
- [ ] Exemplo: "Recondicionamento: R$ 12.500 (5 itens)"

### 7.3 Isolamento
- [ ] Logar com Loja A → Vê despesas de Loja A
- [ ] Logout → Logar com Loja B → Vê apenas despesas de Loja B

---

## 8. TESTES DE AUTENTICAÇÃO

### 8.1 Alterar Senha
- [ ] Menu Configurações (ícone de engrenagem)
- [ ] Clicar "Alterar Senha"
- [ ] Preencher:
  - Senha atual: senha_atual
  - Nova senha: senha_nova123
  - Confirmar: senha_nova123
- [ ] Salvar
- [ ] Esperado: Mensagem "Senha alterada com sucesso!"
- [ ] Logout
- [ ] Tentar login com senha antiga → FALHA (esperado)
- [ ] Login com senha nova → SUCESSO ✅

### 8.2 Autenticação Funciona
- [ ] Tentar acessar `/auth/me` sem token → 401
- [ ] Login → Token guardado em localStorage
- [ ] Requisições incluem `Authorization: Bearer {token}` → 200

---

## 9. TESTES DE SEGURANÇA

### 9.1 GET /metrics Sem Token
```bash
curl -X GET http://localhost:3000/metrics
```
- [ ] Esperado: **401 Unauthorized**
- [ ] Com token: `curl -H "Authorization: Bearer {token}" http://localhost:3000/metrics`
- [ ] Esperado: **200 OK** com métricas

### 9.2 DELETE /api/cache/flush Sem Token
```bash
curl -X DELETE http://localhost:3000/api/cache/flush
```
- [ ] Esperado: **401 Unauthorized**
- [ ] Com token e secret (se necessário):
```bash
curl -X DELETE -H "Authorization: Bearer {token}" http://localhost:3000/api/cache/flush
```
- [ ] Esperado: **200 OK**

### 9.3 POST /auth/seed-default-users Sem Secret
```bash
curl -X POST http://localhost:3000/auth/seed-default-users \
  -H "Content-Type: application/json" \
  -d '{}'
```
- [ ] Esperado: **403 Forbidden** (ou 401)
- [ ] Com secret correto:
```bash
curl -X POST http://localhost:3000/auth/seed-default-users \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: {ADMIN_SECRET}" \
  -d '{}'
```
- [ ] Esperado: **200 OK**

### 9.4 Isolamento dealership_id
**Teste manual - emulação de usuários:**
- [ ] Login como Loja A
- [ ] Abrir DevTools → Network → Copiar um ID de veículo da Loja A
- [ ] Logout → Login como Loja B
- [ ] Tentar GET `/inventory/{id_loja_a}` → Deve falhar ou retornar 403
  ```bash
  curl -H "Authorization: Bearer {token_loja_b}" \
    http://localhost:3000/inventory/{id_loja_a}
  ```
- [ ] Esperado: **403 Forbidden** ou **404 Not Found** (RLS em ação)

### 9.5 Nenhum Hardcode JWT
- [ ] Verificar `sourcingAPI.js` e `api.js`
- [ ] Nenhuma string de JWT visível no código
- [ ] localStorage sempre usado para tokens
- [ ] ✅ Esperado: Código limpo

---

## 10. TESTES DE PERFORMANCE

### 10.1 Lista de Veículos Carrega Rápido
- [ ] Abrir seção Estoque
- [ ] Medir tempo até aparecer 5+ veículos na tela
- [ ] Esperado: < 2 segundos (sem rede lenta)

### 10.2 Kanban Drag Sem Lag
- [ ] Arrastar cards no kanban
- [ ] Esperado: Movimento suave, sem travamento
- [ ] Verifica: Browser DevTools → Performance → sem CPU spike

### 10.3 Busca IA Responde
- [ ] Seção "Busca IA" / "Sourcing"
- [ ] Digitar critérios (ex: BMW, até R$400K)
- [ ] Esperado: Resultados carregam em < 3 segundos

---

## 11. CHECKLIST FINAL

- [ ] Todos os 3 logins funcionam
- [ ] F5 mantém sessão
- [ ] CRUD completo: veículos, clientes, despesas
- [ ] Upload/delete foto SEM erros
- [ ] Kanban drag-and-drop funciona
- [ ] Alteração de senha funciona
- [ ] /metrics retorna 401 sem token
- [ ] /cache/flush retorna 401 sem token
- [ ] /seed-default-users retorna 403 sem secret
- [ ] Isolamento dealership_id validado
- [ ] Nenhuma foto de placeholder onde deveria ter real
- [ ] Nenhum erro "Rota não encontrada" ao deletar foto
- [ ] Nenhum console.error() do navegador
- [ ] Performance aceitável (< 2s para listar veículos)

---

## 12. PASSOS PÓS-TESTE

### Se Todos os Testes Passarem ✅
1. Fazer commit com `git commit -m "test: validar antes de entregar ao cliente"`
2. Push para `main` (ou branch de staging)
3. Trigger do deploy em Vercel + Railway
4. Comunicar ao cliente: "Sistema pronto para go-live"

### Se Algum Teste Falhar ❌
1. Documentar qual teste falhou e o erro exato
2. Criar issue: "TEST FAILED: {descrição}"
3. Voltar ao arquivo relevante e corrigir
4. Re-testar até passar
5. Commit: `fix: resolver falha de teste {teste_id}`

---

## Notas

- **URLs de teste:**
  - Frontend local: http://localhost:5173
  - Backend local: http://localhost:3000
  - Produção: verificar Railway + Vercel

- **Credentials padrão:**
  - Checar `.env.local` ou banco de dados `seed.sql`
  - Exemplo: `dono@lojaA.com` / senha definida no Supabase

- **Console de Erros:**
  - DevTools do navegador: F12 → Console
  - Terminal do Railway: Logs da aplicação
  - Terminal local: npm run dev

---

**Preparado por:** Claude Code
**Próximo passo:** Executar testes, documentar resultados, fazer deploy
