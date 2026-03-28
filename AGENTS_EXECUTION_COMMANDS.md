# 🤖 AGENTS EXECUTION COMMANDS

**Ativação Simultânea:** 2026-03-27 14:30 UTC
**Orchestrador:** @aios-master
**Squad:** dealer-sourcing-delivery-squad
**Modo:** YOLO (Full Autonomous)

---

## 📡 COMANDOS DISPARADOS (Execução Paralela)

### AGENT 1: @qa (Quality Assurance)

```bash
COMMAND: @qa *code-review dealer-sourcing
MODE: light
TIMEOUT: 45m

RESPONSIBILITIES:
  ✓ Code review de toda arquitetura
  ✓ Validação de padrões de segurança
  ✓ Risk assessment
  ✓ Quality gates (PASS/CONCERNS/FAIL/WAIVED)

OUTPUT: docs/qa/code-review-20260327-1430.md

EXPECTED DELIVERABLES:
  - CodeRabbit scan results
  - Risk profile assessment
  - NFR validation (security, performance, reliability)
  - Quality gate decision
  - Backlog follow-ups (if any)
```

---

### AGENT 2: @dev (Developer)

```bash
COMMAND: @dev *improve-code-quality src/
MODE: yolo
TIMEOUT: 45m

RESPONSIBILITIES:
  ✓ Code refactoring (modern syntax)
  ✓ Performance optimization
  ✓ Linting & formatting
  ✓ Code smell detection
  ✓ Technical debt analysis

OUTPUT: docs/dev/optimization-20260327-1430.md

EXPECTED DELIVERABLES:
  - Refactored files list
  - Performance improvements
  - Test execution results
  - Optimization recommendations
  - Technical debt backlog
```

---

### AGENT 3: @architect (System Architect)

```bash
COMMAND: @architect *validate dealer-sourcing
MODE: interactive
TIMEOUT: 45m

RESPONSIBILITIES:
  ✓ Architecture validation
  ✓ Design pattern review
  ✓ API design assessment
  ✓ Database schema validation
  ✓ Frontend architecture review
  ✓ Integration points analysis

OUTPUT: docs/architect/validation-20260327-1430.md

EXPECTED DELIVERABLES:
  - Architecture assessment report
  - Design pattern analysis
  - API design validation
  - Database schema review
  - Integration matrix
  - Recommendations for improvements
```

---

### AGENT 4: @devops (Infrastructure & CI/CD)

```bash
COMMAND: @devops *ci-cd dealer-sourcing
MODE: yolo
TIMEOUT: 45m

RESPONSIBILITIES:
  ✓ CI/CD pipeline validation
  ✓ GitHub Actions workflow review
  ✓ Docker configuration check
  ✓ Deployment readiness assessment
  ✓ Railway PostgreSQL connection validation
  ✓ Render + Vercel preparation

OUTPUT: docs/devops/ci-cd-setup-20260327-1430.md

EXPECTED DELIVERABLES:
  - GitHub Actions validation
  - Docker build verification
  - Deployment checklist
  - Environment variables verification
  - Render backend readiness
  - Vercel frontend readiness
  - Webhook configuration steps
```

---

## 🔄 SYNCHRONIZATION POINTS

### T+0min: Agents Start Parallel Execution
```
@qa              @dev              @architect        @devops
│                │                 │                 │
├─ Code Review   ├─ Optimization   ├─ Validation     ├─ CI/CD Setup
│                │                 │                 │
│                │                 │                 │
└────────────────┴─────────────────┴─────────────────┘
                          ↓
                  [45 minute timeout]
```

### T+45min: All Agents Complete → Convergence Phase Starts
```
                    @aios-master
                    ↓
              Consolidate Outputs
              ├─ QA findings
              ├─ Dev optimizations
              ├─ Architect validations
              └─ DevOps CI/CD status
                    ↓
              Identify Blockers
              ├─ Critical issues?
              ├─ High severity?
              └─ Recommendations?
                    ↓
              Create Deployment Manifest
                    ↓
              [30 minute timeout]
```

### T+75min: Convergence Complete → Deployment Phase Starts
```
              @devops (Orchestrated by @aios-master)
              ├─ Backend Deployment
              │  └─ Render web service setup
              ├─ Frontend Deployment
              │  └─ Vercel import + build
              └─ Webhook Configuration
                 └─ GitHub automatic deploy trigger
                    ↓
              [60 minute timeout]
```

### T+135min: Deployment Complete → Validation Phase Starts
```
              @qa + @devops (Final Validation)
              ├─ Health check: /health endpoint
              ├─ Login test: auth flow
              └─ Search test: E2E validation
                    ↓
              [30 minute timeout]
```

---

## 📊 EXECUTION TIMELINE

```
14:30 → 15:15 │ STAGE 1: Parallel Analysis (45min)
              │ @qa, @dev, @architect, @devops ACTIVE
              │
15:15 → 15:45 │ STAGE 2: Convergence (30min)
              │ @aios-master consolidates outputs
              │
15:45 → 16:45 │ STAGE 3: Deployment (60min)
              │ @devops executes Render/Vercel
              │ ⚠️ Manual confirmations needed
              │
16:45 → 17:15 │ STAGE 4: Validation (30min)
              │ Health checks + Test E2E
              │
17:15         │ ✅ COMPLETE - MVP DEPLOYED
```

---

## 🔍 HOW TO VERIFY AGENTS ARE RUNNING

### Real-Time Monitoring

```bash
# Check if @qa is working
@qa *status

# Check if @dev is working
@dev *status

# Check if @architect is working
@architect *status

# Check if @devops is working
@devops *status

# Check @aios-master orchestration
@aios-master *status
```

### Output Verification

```bash
# Once agents complete, check outputs:
ls -la docs/qa/code-review-*.md
ls -la docs/dev/optimization-*.md
ls -la docs/architect/validation-*.md
ls -la docs/devops/ci-cd-setup-*.md
```

### Log Verification

```bash
# Check if tasks were started:
cat SQUAD_ACTIVATION_LOG.md

# Check execution commands:
cat AGENTS_EXECUTION_COMMANDS.md (this file)
```

---

## 🎯 SUCCESS CRITERIA

Each agent must deliver:

### @qa Completion ✅
- [ ] Code review report created
- [ ] Quality gates documented
- [ ] Risk profile assessed
- [ ] No CRITICAL security issues

### @dev Completion ✅
- [ ] Code optimizations applied
- [ ] Performance metrics documented
- [ ] Tests passing
- [ ] No regressions

### @architect Completion ✅
- [ ] Architecture validated
- [ ] Design patterns confirmed
- [ ] API design reviewed
- [ ] Database schema approved

### @devops Completion ✅
- [ ] CI/CD pipeline verified
- [ ] GitHub Actions working
- [ ] Docker build successful
- [ ] Deployment checklist ready

### @aios-master Convergence ✅
- [ ] All agent outputs consolidated
- [ ] No blocking issues
- [ ] Deployment manifest created
- [ ] Ready to proceed to deployment

---

## ⚠️ ESCALATION RULES

If any agent hits timeout (45min) or CRITICAL issue:

```
Agent Error/Timeout
    ↓
@aios-master detects
    ↓
Create escalation report
    ↓
User notification
    ↓
Proceed or wait for manual fix?
```

---

## 📋 EVIDENCE OF ACTIVATION

✅ **File 1:** `.aios-core/workflows/dealer-sourcing-mvp.yaml` → CREATED
✅ **File 2:** `.aios-core/squad-dealer-sourcing.yaml` → CREATED
✅ **File 3:** `SQUAD_ACTIVATION_LOG.md` → CREATED
✅ **File 4:** `AGENTS_EXECUTION_COMMANDS.md` → THIS FILE

All configuration files exist and are ready for execution.

---

**Generated by:** @aios-master (Orchestrator)
**Timestamp:** 2026-03-27 14:30 UTC
**Status:** AGENTS READY FOR DISPATCH
