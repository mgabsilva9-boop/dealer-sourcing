import { initializeSchema } from './src/config/database.js';

console.log('🔧 Inicializando schema do banco de dados...');
try {
  await initializeSchema();
  console.log('✅ Schema inicializado com sucesso!');
  console.log('\n📝 Tabelas criadas:');
  console.log('  - users');
  console.log('  - searches');
  console.log('  - found_vehicles');
  console.log('  - interested_vehicles');
  process.exit(0);
} catch (error) {
  console.error('❌ Erro ao inicializar schema:', error.message);
  process.exit(1);
}
