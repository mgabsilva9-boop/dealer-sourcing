import { pool } from './src/config/database.js';
import bcrypt from 'bcryptjs';

console.log('👤 Criando usuário de teste...');
try {
  const password = await bcrypt.hash('senha123', 10);

  const result = await pool.query(
    'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
    ['seu@email.com', password, 'Seu Nome']
  );

  console.log('✅ Usuário criado com sucesso!');
  console.log('\n📧 Credenciais de Teste:');
  console.log('   Email: seu@email.com');
  console.log('   Senha: senha123');
  console.log('\n✨ Pronto para usar a aplicação!');
  process.exit(0);
} catch (error) {
  if (error.code === '23505') {
    console.log('⚠️  Usuário já existe no banco de dados');
    console.log('\n📧 Use as credenciais:');
    console.log('   Email: seu@email.com');
    console.log('   Senha: senha123');
    process.exit(0);
  } else {
    console.error('❌ Erro ao criar usuário:', error.message);
    process.exit(1);
  }
}
