# ⚡ QUICK START - 10 MINUTOS

**Você tem o código completo pronto. Siga esses passos para rodar.**

---

## 🚀 PASSO 1: Setup (5 min)

### 1.1 Instalar dependências
```bash
npm install
```

### 1.2 Copiar .env
```bash
cp .env.example .env
```

### 1.3 Editar .env - Escolher opção:

**Opção A: PostgreSQL Local (se tiver instalado)**
```
DATABASE_URL=postgresql://seu_user:sua_senha@localhost:5432/dealer_sourcing
```

**Opção B: Railway.app (RECOMENDADO - gratuito)**
1. Ir para https://railway.app
2. Sign up
3. Create new project → PostgreSQL
4. Copiar connection string
5. Colar no .env
```
DATABASE_URL=postgresql://user:password@host:port/database
```

**Opção C: Neon.tech (ALTERNATIVA - gratuita)**
1. Ir para https://neon.tech
2. Sign up
3. Create project → PostgreSQL
4. Copiar connection string
5. Colar no .env

---

## 🎲 PASSO 2: Inicializar Banco (2 min)

### 2.1 Criar e popular tabelas

Criar arquivo `init.js`:
```javascript
import { initializeSchema } from './src/config/database.js';

console.log('Inicializando schema...');
await initializeSchema();
console.log('✅ Feito!');
process.exit(0);
```

Rodar:
```bash
node init.js
```

Deletar:
```bash
rm init.js
```

### 2.2 Criar usuário de teste

Criar arquivo `seed.js`:
```javascript
import { pool } from './src/config/database.js';
import bcrypt from 'bcryptjs';

const pass = await bcrypt.hash('senha123', 10);

await pool.query(
  'INSERT INTO users (email, password, name) VALUES ($1, $2, $3)',
  ['seu@email.com', pass, 'Seu Nome']
);

console.log('✅ Usuário criado!');
process.exit(0);
```

Rodar:
```bash
node seed.js
rm seed.js
```

---

## 🎬 PASSO 3: Rodar Backend (1 min)

```bash
npm run dev
```

Esperado:
```
✅ Banco de dados conectado
🚗 DEALER SOURCING BOT - BACKEND
🚀 Server rodando em porta 3000
✅ Status: Online
```

---

## 🧪 PASSO 4: Testar API (1 min)

### Abrir novo terminal (deixa o anterior rodando)

### 4.1 Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu@email.com",
    "password": "senha123"
  }'
```

**Copiar o token da resposta** (valor de `token`)

### 4.2 Buscar (isso vai demorar 30-60 seg)
```bash
curl -X POST http://localhost:3000/search/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "queryText": "BMW 3 series até 150K"
  }'
```

Esperado: Retorna 3-10 carros encontrados em WebMotors/OLX

---

## 📱 PASSO 5: React Frontend

### 5.1 Arquivo já existe em:
```
src/frontend/App.jsx
```

### 5.2 Em seu projeto React:
```bash
# Instalar axios
npm install axios

# Copiar App.jsx
cp ./dealer-sourcing/src/frontend/App.jsx ./seu-projeto/src/

# Criar .env
echo "VITE_API_URL=http://localhost:3000" > .env

# Rodar
npm run dev
```

### 5.3 Login
- Email: `seu@email.com`
- Senha: `senha123`

---

## ✅ Você tem tudo rodando!

```
Backend:  http://localhost:3000
Frontend: http://localhost:5173
```

---

## 🎯 O que pode fazer agora:

1. ✅ **Buscar carros** (WebMotors, OLX, Google)
2. ✅ **Salvar carros de interesse**
3. ✅ **Ver histórico de buscas**
4. ✅ **Gerenciar CRM básico**

---

## 🚀 Próximos passos (DIA 2-3):

1. **Deploy Backend (Render.com)**
   - Criar conta
   - Conectar GitHub
   - Deploy automático

2. **Deploy Frontend (Vercel)**
   - Importar repo
   - Deploy automático
   - Pronto em produção!

3. **Chamar Agentes AIOS** (opcional)
   ```
   /AIOS:agents:qa *validate-dealer-code
   /AIOS:agents:architect *review-architecture
   ```

---

## 🐛 Se tiver erro:

### "Cannot find module"
```bash
npm install
```

### "Database connection failed"
```bash
# Verificar .env
cat .env | grep DATABASE_URL

# Se usar Railway, copiar string exata (não modificar)
```

### "Puppeteer timeout"
- Primeira busca é lenta (instala browser)
- Próximas buscas são rápidas (30seg)
- Se travar, tente novamente

### Port 3000 já em uso
```bash
npm run dev -- --port 3001
```

---

## 📞 Precisa de ajuda?

Diga dentro da conversa:
```
*correct-course
```

Orion vai analisar e ajudar!

---

**Você tem tudo. BOA SORTE!** 🚗⚡
