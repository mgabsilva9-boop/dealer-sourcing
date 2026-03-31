# Story: ENTREGA-1.3 — Testes E2E Imagens & Autenticação

**ID:** ENTREGA-1.3
**Epic:** epic-entrega-cliente.md
**Owner:** @qa (Quinn)
**Prazo:** 1 dia
**Status:** Blocked by ENTREGA-1.1
**Prioridade:** CRÍTICA

---

## Resumo

Validar upload/delete de fotos de veículos e alteração de senha.

**Resultado Esperado:** ✅ Upload com preview, foto aparece em 3 locais, delete sem erros, senha muda

---

## Acceptance Criteria

### Imagens
- [ ] AC1: Upload foto → preview instantâneo na tela
- [ ] AC2: Foto aparece na lista de veículos
- [ ] AC3: Foto aparece nos cards do kanban
- [ ] AC4: Foto aparece no detalhe do veículo
- [ ] AC5: Delete foto → SEM "Rota não encontrada"
- [ ] AC6: Delete foto → imagem desaparece, volta a placeholder

### Autenticação
- [ ] AC7: Alterar senha → nova senha funciona no login
- [ ] AC8: Senha antiga não funciona mais
- [ ] AC9: Logout automático após mudar senha (força novo login)

---

## Instruções de Teste

### Pré-requisito
- ✅ ENTREGA-1.1 passado
- Login como qualquer usuário
- Ter pelo menos 1 veículo criado

### Teste 1: Upload Foto (AC1)
```
Abrir detalhe de um veículo → Seção de Foto
```

- [ ] Visualizar área de upload (input file ou drop zone)
- [ ] Clicar/arrastar arquivo JPG local
- [ ] Selecionar imagem (usar arquivo de teste, ex: test.jpg)
- [ ] **Esperado:** Preview da foto aparece instantaneamente na tela
- [ ] Botão "Salvar" ou "Upload"
- [ ] Clicar salvar
- [ ] **Esperado:** Submissão sem erro
- [ ] Mensagem de sucesso (opcional)

**Resultado:** ✅ AC1 PASS

### Teste 2: Foto em Lista (AC2)
```
Voltar para lista de veículos
```

- [ ] Verificar card do veículo que uploadou foto
- [ ] **Esperado:** Foto real (não placeholder) aparece no card
- [ ] Foto deve ser thumbnail legível

**Resultado:** ✅ AC2 PASS / ❌ AC2 FAIL (photo não aparece)

**Se falha:**
- Verificar DevTools Network → GET request para imageUrl
- Se 404 → bucket Supabase misconfigured, escalar para @dev
- Se aparece placeholder → v.imageUrl não preenchido, escalar para @dev

### Teste 3: Foto no Kanban (AC3)
```
Seção Estoque → Kanban view
```

- [ ] Localizar card do veículo com foto
- [ ] **Esperado:** Foto real aparece no card do kanban
- [ ] Mesma foto que na lista

**Resultado:** ✅ AC3 PASS

### Teste 4: Foto no Detalhe (AC4)
```
Clicar no card do kanban → Abrir detalhe
```

- [ ] **Esperado:** Foto aparece em destaque
- [ ] Mesma foto dos testes anteriores
- [ ] Deve ser a maior/mais clara das 3 visualizações

**Resultado:** ✅ AC4 PASS

**Consolidado:** ✅ AC1+AC2+AC3+AC4 = Foto funciona em todos os 3 lugares

### Teste 5: Delete Foto (AC5) ⭐ CRÍTICO
```
No detalhe do veículo com foto → Botão "Deletar Foto" ou "❌"
```

- [ ] Clicar em deletar
- [ ] **CRÍTICO:** Console do navegador (F12) deve estar limpo
- [ ] **CRÍTICO:** Submissão deve suceder (não retornar "Rota não encontrada")
- [ ] Observar: DevTools Network → deve haver requisição DELETE
- [ ] Status HTTP esperado: 200 OK (não 404)
- [ ] **ESPERADO:** Mensagem de sucesso

**Resultado:** ✅ AC5 PASS / ❌ AC5 FAIL (erro "Rota não encontrada")

**Se AC5 falha com "Rota não encontrada":**
1. Verificar Railway logs: deve ter `[DELETE /:id/image] Deletando imagem`
2. Se não aparecer → Railway rodando código antigo
3. Solução: Fazer novo deploy (git push)
4. Testar novamente após deploy

### Teste 6: Delete Foto Desaparece (AC6)
```
Após deletar com sucesso (AC5)
```

- [ ] Foto desaparece do detalhe
- [ ] Volta a mostrar placeholder ou "Sem foto"
- [ ] Ir para lista → foto sumiu lá também
- [ ] Ir para kanban → foto sumiu
- [ ] Pressionar F5 → foto continua deletada (persiste)

**Resultado:** ✅ AC6 PASS

### Teste 7: Alterar Senha (AC7)
```
Menu de usuário (canto superior) → Configurações / Settings
```

Formulário:
- Senha Atual: [senha atual do usuário]
- Nova Senha: senha123nova
- Confirmar Senha: senha123nova

- [ ] Preencher campos
- [ ] Clicar "Salvar" / "Alterar Senha"
- [ ] **Esperado:** Mensagem de sucesso
- [ ] **Esperado:** Logout automático (redirecionado para login)

**Resultado:** ✅ AC7 PASS (até aqui)

### Teste 8: Nova Senha Funciona (AC7 cont.)
```
Tela de login
```

- [ ] Email: [mesmo email]
- [ ] Senha: senha123nova (a NOVA senha)
- [ ] Clicar "Entrar"
- [ ] **Esperado:** Login sucede
- [ ] Dashboard carrega

**Resultado:** ✅ AC7 PASS COMPLETO

### Teste 9: Senha Antiga Não Funciona (AC8)
```
Logout → Tela de login
```

- [ ] Email: [mesmo email]
- [ ] Senha: [ANTIGA senha, anterior ao AC7]
- [ ] Clicar "Entrar"
- [ ] **Esperado:** Erro de autenticação
- [ ] **Esperado:** Mensagem "Email ou senha incorretos" (ou similar)

**Resultado:** ✅ AC8 PASS / ❌ AC8 FAIL (senha antiga ainda funciona)

**Se AC8 falha:**
- Senha não foi atualizada no banco
- Escalar para @dev: "Password change não persistiu"

### Teste 10: Logout Automático (AC9) — Validado em AC7
```
Durante teste AC7, observar se logout ocorreu após "Alterar Senha"
```

- [ ] Após salvar nova senha, página redireciona para login
- [ ] Usuário NÃO permanece logado na mesma sessão
- [ ] MOTIVO: Força novo login com nova senha

**Resultado:** ✅ AC9 PASS (observado durante AC7)

---

## Documentação de Resultados

### Arquivo: `docs/qa/tests/ENTREGA-1.3-results.md`

```markdown
# Resultados: ENTREGA-1.3 — Imagens & Autenticação

**Data:** [data]
**Testador:** [nome]
**Status Geral:** ✅ PASSOU / ⚠️ PARCIAL / ❌ FALHOU

## Testes Imagens

| AC | Teste | Resultado | Notas |
|----|-------|-----------|-------|
| AC1 | Upload + Preview | ✅ | Instantâneo |
| AC2 | Foto em Lista | ✅ | Thumbnail visível |
| AC3 | Foto em Kanban | ✅ | Mesma foto |
| AC4 | Foto em Detalhe | ✅ | Maior/clara |
| AC5 | Delete | ✅ | SEM erro 404 |
| AC6 | Desaparece | ✅ | Persiste após F5 |

## Testes Autenticação

| AC | Teste | Resultado | Notas |
|----|-------|-----------|-------|
| AC7 | Alterar Senha | ✅ | Nova funciona, logout auto |
| AC8 | Senha Antiga | ✅ | Falha (esperado) |
| AC9 | Logout Auto | ✅ | Ocorreu após alterar |

## Issues Críticos

- [ ] Nenhum
- [ ] "Rota não encontrada" ao deletar foto → Escalar @dev
- [ ] Senha não muda → Escalar @dev

## Próximas Ações

- [ ] ENTREGA-1.4 (Segurança)
```

---

## Dev Notes

**Se foto não aparece em nenhum lugar (AC2-4 falha):**
1. DevTools → Network → GET /inventory/{id}
2. Response deve ter field `imageUrl` preenchido
3. Verificar URL: deve apontar para bucket Supabase público
4. Se URL não existe → Upload falhou silenciosamente
5. Escalar para @dev: "Upload não persiste na DB"

**Se delete dá "Rota não encontrada":**
1. Verificar Railway logs: Command → "View Logs"
2. Procurar por `[DELETE /:id/image]`
3. Se não aparecer → Railway desatualizado
4. Solução: `git push origin main` (trigger redeploy)
5. Aguardar ~3 min, testar novamente

**Se senha não muda:**
1. Verificar console por erros
2. Network → PUT /auth/change-password
3. Se falha → escalar
4. Se sucede mas senha não muda → problema no bcrypt, escalar

---

**Bloqueador:** ENTREGA-1.1 ✅
**Pode rodar em paralelo:** ENTREGA-1.2
**Desbloqueador para:** ENTREGA-1.4
