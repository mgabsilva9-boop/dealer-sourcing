# 🚗 DEALER SOURCING BOT

Bot de sourcing interno para dealer de carros premium. Busca carros em múltiplas plataformas (WebMotors, OLX, Google) com uma única query.

---

## 🎯 Funcionalidades

- ✅ **Motor de Busca Inteligente** - Busca em WebMotors, OLX, Google simultaneamente
- ✅ **Dashboard Interativo** - Gerenciar buscas e veículos de interesse
- ✅ **CRM Básico** - Salvar dados de clientes interessados
- ✅ **Histórico Completo** - Todas as buscas e interesses persistem
- ✅ **Score de Oportunidade** - Cada carro tem um score de 0-100
- ✅ **Login/Autenticação** - JWT tokens seguros

---

## 🏗️ Stack Técnico

```
Backend:    Node.js + Express.js
Database:   PostgreSQL
ORM:        pg (driver nativo)
Auth:       JWT + bcryptjs
Scraping:   Puppeteer
Frontend:   React (seu MVP refactored)
Deploy:     Render.com (backend) + Vercel (frontend)
```

---

## 📋 Instalação & Setup

### 1️⃣ **Pré-requisitos**

- Node.js 18+ instalado
- PostgreSQL 13+ instalado localmente OU conta em Railway/Render
- Git

### 2️⃣ **Clonar e Instalar**

```bash
# Clonar o repositório
git clone <seu-repo>
cd dealer-sourcing

# Instalar dependências
npm install
```

### 3️⃣ **Configurar Banco de Dados**

**Opção A: PostgreSQL Local**

```bash
# Criar banco de dados
createdb dealer_sourcing

# Copiar .env
cp .env.example .env

# Editar .env
nano .env
# DATABASE_URL=postgresql://user:password@localhost:5432/dealer_sourcing
```

**Opção B: Railway.app (Recomendado)**

```bash
# 1. Criar conta em Railway.app
# 2. Criar novo PostgreSQL database
# 3. Copiar connection string para .env
```

### 4️⃣ **Inicializar Schema**

```bash
# Criar arquivo init.js
cat > init.js << 'EOF'
import { initializeSchema } from './src/config/database.js';
await initializeSchema();
EOF

# Executar
node init.js

# Deletar arquivo
rm init.js
```

### 5️⃣ **Criar Usuário de Teste**

```bash
# Criar arquivo seed.js
cat > seed.js << 'EOF'
import { pool } from './src/config/database.js';
import bcrypt from 'bcryptjs';

const hashedPassword = await bcrypt.hash('senha123', 10);

await pool.query(
  'INSERT INTO users (email, password, name) VALUES ($1, $2, $3)',
  ['seu@email.com', hashedPassword, 'Seu Nome']
);

console.log('✅ Usuário criado!');
process.exit(0);
EOF

# Executar
node seed.js
rm seed.js
```

### 6️⃣ **Iniciar em Desenvolvimento**

```bash
npm run dev
```

Output esperado:
```
╔════════════════════════════════════╗
║  🚗 DEALER SOURCING BOT - BACKEND  ║
║  🚀 Server rodando em porta 3000   ║
║  ✅ Status: Online                 ║
╚════════════════════════════════════╝
```

---

## 🧪 Testando Endpoints

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu@email.com",
    "password": "senha123"
  }'

# Resposta:
# { "token": "eyJ...", "user": { "id": 1, "email": "...", "name": "..." } }
```

### Buscar Carros
```bash
curl -X POST http://localhost:3000/search/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "queryText": "BMW 3 series até 150K"
  }'

# Vai demorar 30-60 segundos enquanto busca
# Resposta:
# { "searchId": 1, "query": "BMW 3 series até 150K", "totalResults": 5, "vehicles": [...] }
```

### Listar Histórico
```bash
curl -X GET http://localhost:3000/history \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Resposta:
# { "total": 5, "searches": [{ "id": 1, "query": "BMW...", "resultsCount": 5, ... }] }
```

### Salvar Veículo de Interesse
```bash
curl -X POST http://localhost:3000/vehicles/interested \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "vehicleId": 1,
    "customerName": "João Silva",
    "customerPhone": "11 99999-9999",
    "customerEmail": "joao@email.com",
    "notes": "Cliente quer financiar"
  }'
```

---

## 📱 Frontend (React Refactored)

O arquivo `src/frontend/App.jsx` contém o React refactored.

### Como usar:

1. **Copiar para seu projeto React:**
   ```bash
   cp src/frontend/App.jsx seu-projeto-react/src/
   ```

2. **Instalar dependência:**
   ```bash
   npm install axios
   ```

3. **Criar arquivo `.env`:**
   ```
   VITE_API_URL=http://localhost:3000
   ```

4. **Rodar:**
   ```bash
   npm run dev
   ```

---

## 🚀 Deploy em Produção

### Backend (Render.com)

```bash
# 1. Criar conta em Render.com
# 2. Novo Web Service → GitHub → seu repo
# 3. Settings:
#    - Runtime: Node
#    - Build: npm install
#    - Start: npm start
#    - Environment Variables: adicionar DATABASE_URL, JWT_SECRET

# 4. Deploy automático quando faz git push
```

### Frontend (Vercel)

```bash
# 1. Criar conta em Vercel
# 2. Import project → seu repo → next (não precisa de config)
# 3. Env: VITE_API_URL=https://seu-backend.onrender.com
# 4. Deploy!
```

---

## 📊 API Endpoints Completos

### **Auth**
- `POST /auth/login` - Login
- `POST /auth/register` - Registrar novo usuário
- `GET /auth/me` - Dados do usuário atual
- `POST /auth/logout` - Logout

### **Search**
- `POST /search/query` - Buscar carros (WebMotors, OLX, Google)
- `GET /search/results/:searchId` - Resultados de uma busca

### **Vehicles**
- `POST /vehicles/interested` - Salvar veículo de interesse
- `GET /vehicles/interested` - Listar veículos salvos
- `PUT /vehicles/interested/:id` - Atualizar status
- `DELETE /vehicles/interested/:id` - Remover interesse
- `GET /vehicles/:id` - Detalhe do veículo

### **History**
- `GET /history` - Histórico de buscas
- `GET /history/:searchId` - Detalhes de uma busca
- `GET /history/stats/summary` - Estatísticas gerais

---

## 🐛 Troubleshooting

### Erro: "Cannot find module..."
```bash
# Instalar novamente
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Database connection failed"
```bash
# Verificar .env
cat .env | grep DATABASE_URL

# Testar conexão
psql DATABASE_URL
```

### Puppeteer lento/travando
```bash
# Aumentar timeout em src/utils/scraper.js
page.setDefaultTimeout(30000); // 30 segundos

# Ou usar browser pool (futuro)
```

---

## 📋 Próximos Passos

- [ ] Dia 2: Deploy em Render + Vercel
- [ ] Dia 3: Agentes AIOS revisam código
- [ ] Dia 3: Testes finais
- [ ] Pronto para usar! 🎉

---

## 📞 Suporte

Se tiver dúvidas, diga `*correct-course` para Orion analisar o problema.

---

**Desenvolvido com ❤️ usando AIOS Framework**
