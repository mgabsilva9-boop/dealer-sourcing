import { pool } from './src/config/database.js';
import bcrypt from 'bcryptjs';

// ─── CRIAR TABELA SE NÃO EXISTIR ─────────────────────────────────
console.log('🏗️  Verificando estrutura do banco...');
try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ Tabela users verificada/criada');
} catch (error) {
  console.error('❌ Erro ao criar tabela:', error.message);
  process.exit(1);
}

// ─── INSERIR USUÁRIO PADRÃO ─────────────────────────────────────
console.log('👤 Criando usuário padrão...');
try {
  const password = await bcrypt.hash('Fontes13', 10);

  const result = await pool.query(
    'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
    ['penteadojv1314@gmail.com', password, 'Usuário Padrão']
  );

  console.log('✅ Usuário criado com sucesso!');
  console.log('\n📧 Credenciais Padrão:');
  console.log('   Email: penteadojv1314@gmail.com');
  console.log('   Senha: Fontes13');
  console.log('\n✨ Pronto para usar a aplicação!');
  process.exit(0);
} catch (error) {
  if (error.code === '23505') {
    console.log('⚠️  Usuário já existe no banco de dados');
    console.log('\n📧 Use as credenciais:');
    console.log('   Email: penteadojv1314@gmail.com');
    console.log('   Senha: Fontes13');
    process.exit(0);
  } else {
    console.error('❌ Erro ao criar usuário:', error.message);
    process.exit(1);
  }
}
