# ⚡ COMO COMEÇAR AGORA — 5 Minutos para Entrar em Ação

**Leia isto PRIMEIRO, depois abra as stories detalhadas.**

---

## 🎯 Objetivo em Uma Frase

**Executar 6 stories AIOS para testar, deployar e entregar Garagem MVP ao cliente.**

---

## 👥 Se Você é @qa (Quinn)

### ⏱️ AGORA (Começa hoje)

1. Abra a primeira story:
   ```bash
   cat docs/stories/ENTREGA-1.1-testes-login-sessao.md
   ```

2. Faça login no sistema:
   - URL: http://localhost:5173 (ou Vercel)
   - Email: dono@lojaA.com
   - Senha: [verificar .env]

3. Execute os 6 testes de login (5 minutos cada)

4. Documente resultados em `docs/qa/tests/ENTREGA-1.1-results.md`

5. Quando 6/6 testes passarem → **Marque como ✅ DONE**

### 📋 Depois (Próximas 3 stories)

- ENTREGA-1.2 (CRUD & Kanban)
- ENTREGA-1.3 (Imagens & Autenticação)
- ENTREGA-1.4 (Segurança)

**Total:** ~4 dias de testes

---

## 👥 Se Você é @devops (Gage)

### ⏱️ AGUARDE @qa

Quando @qa disser "ENTREGA-1.4 ✅ DONE":

1. Abra a story:
   ```bash
   cat docs/stories/ENTREGA-1.5-deploy-verificacao.md
   ```

2. Execute estes 3 passos:
   - Commit + Push para main
   - Aguarde Vercel build (3-5 min)
   - Aguarde Railway deploy (2-3 min)

3. Valide 10 smoke tests (< 10 min cada)

4. **Done em ~0.5 dia**

---

## 👥 Se Você é @sm (River)

### ⏱️ AGUARDE @devops

Quando @devops disser "ENTREGA-1.5 ✅ DONE":

1. Abra a story:
   ```bash
   cat docs/stories/ENTREGA-1.6-handoff-cliente.md
   ```

2. Execute estes 6 passos:
   - AC1: Enviar email com URLs (template pronto)
   - AC2: Preparar docs (markdown prontos)
   - AC3: Testar credenciais (2 min)
   - AC4: Entregar guias (copia os arquivos)
   - AC5: Agendar treinamento (enviar email)
   - AC6: Setup WhatsApp (criar grupo)

3. **Done em ~0.5 dia**

---

## 📂 Arquivos Importantes

```
Início:
├── PLANO_ACAO_AIOS.md ← Leia ESTE depois
├── TESTE_ENTREGA.md ← Referência rápida para @qa

Stories AIOS (6 arquivos):
├── docs/stories/ENTREGA-1.1-testes-login-sessao.md
├── docs/stories/ENTREGA-1.2-testes-crud-kanban.md
├── docs/stories/ENTREGA-1.3-testes-imagens-autenticacao.md
├── docs/stories/ENTREGA-1.4-validacao-seguranca.md
├── docs/stories/ENTREGA-1.5-deploy-verificacao.md
└── docs/stories/ENTREGA-1.6-handoff-cliente.md

Epic (orquestração):
└── docs/epics/epic-entrega-cliente.md
```

---

## ⚡ Tl;dr — Resumo Executivo

| Agente | O que fazer | Quando | Duração |
|--------|-----------|--------|---------|
| @qa | Testar 4 stories | AGORA | 4 dias |
| @devops | Fazer deploy | Após @qa | 0.5 dia |
| @sm | Handoff cliente | Após @devops | 0.5 dia |

**Total:** ~5 dias (parallelizável em 2 dias)

---

## 🚀 Comece AGORA

### @qa (Quinn)
```bash
# Abra a primeira story
less docs/stories/ENTREGA-1.1-testes-login-sessao.md

# Ou copie para arquivo para ler com calma
cat docs/stories/ENTREGA-1.1-testes-login-sessao.md > /tmp/entrega-1.1.txt
```

### @devops (Gage) & @sm (River)
```bash
# Enquanto isso, leia o plano completo
less PLANO_ACAO_AIOS.md
```

---

## ❓ Dúvidas Rápidas

**P: Por onde começo?**
R: Leia a story correspondente ao seu agente. Ela tem TUDO (instruções, pré-requisitos, documentação).

**P: E se um teste falhar?**
R: Documenta no arquivo de results. Se for algo grave, escalate para @dev.

**P: Quanto tempo leva?**
R: @qa: 4 dias | @devops: 0.5 dia | @sm: 0.5 dia

**P: Posso fazer em paralelo?**
R: SIM! 1.1, 1.2, 1.3 podem rodar juntas. 1.4 precisa delas prontas. 1.5 precisa de 1.4. 1.6 precisa de 1.5.

---

## ✅ Quando Termina?

Quando todos os 6 stories estão ✅ DONE:
- Cliente tem acesso
- Documentação entregue
- Treinamento agendado
- Sistema em produção

🎉 **ENTREGA COMPLETA**

---

**Próximo passo:** Abra sua story específica acima. Lá tem TUDO.

🚀 Vamos fazer!
