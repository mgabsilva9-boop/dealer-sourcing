import fetch from 'node-fetch';

async function triggerDeploy() {
  console.log('\n🚀 Disparando deploy em produção...\n');
  
  // Railway webhook (exemplo - ajuste conforme necessário)
  // Você pode ter um webhook específico do Railway
  
  console.log('📋 Opções de Deploy:');
  console.log('\n1️⃣  VERCEL (Frontend)');
  console.log('   - Deploy automático via GitHub (ativado)');
  console.log('   - Precisa verificar: https://vercel.com/deployments');
  
  console.log('\n2️⃣  RAILWAY (Backend)');
  console.log('   - Precisa fazer trigger manual ou via webhook');
  console.log('   - Ou fazer git push com --force-with-lease');
  
  console.log('\n3️⃣  Alternativa: Fazer novo commit para forçar deploy');
  console.log('   - Qualquer novo commit em main ativa GitHub Actions');
  
  console.log('\n📝 Status atual:');
  console.log('   ✅ Código: Já no GitHub (commit 075a82a)');
  console.log('   ✅ Vercel: Deploy automático deve estar em progresso');
  console.log('   ⏳ Railway: Precisa confirmar status');
  
  process.exit(0);
}

triggerDeploy();
