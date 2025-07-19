import fetch from 'node-fetch';

const API_URL = 'https://backends-backend-autoserp.iqxn2g.easypanel.host';

async function testServer() {
  console.log('🧪 Testando servidor autoSERP...\n');
  
  // Teste 1: Verificar se o servidor está online
  try {
    console.log('1️⃣ Testando GET /');
    const response1 = await fetch(`${API_URL}/`);
    console.log(`Status: ${response1.status}`);
    console.log(`Headers:`, Object.fromEntries(response1.headers.entries()));
    console.log(`Body: ${await response1.text()}\n`);
  } catch (error) {
    console.error('❌ Erro no teste 1:', error.message);
  }
  
  // Teste 2: Testar OPTIONS (preflight)
  try {
    console.log('2️⃣ Testando OPTIONS /code/generate');
    const response2 = await fetch(`${API_URL}/code/generate`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://frontends-autoserp.iqxn2g.easypanel.host',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    console.log(`Status: ${response2.status}`);
    console.log(`CORS Headers:`);
    console.log(`  Access-Control-Allow-Origin: ${response2.headers.get('Access-Control-Allow-Origin')}`);
    console.log(`  Access-Control-Allow-Methods: ${response2.headers.get('Access-Control-Allow-Methods')}`);
    console.log(`  Access-Control-Allow-Headers: ${response2.headers.get('Access-Control-Allow-Headers')}`);
    console.log(`  Access-Control-Allow-Credentials: ${response2.headers.get('Access-Control-Allow-Credentials')}\n`);
  } catch (error) {
    console.error('❌ Erro no teste 2:', error.message);
  }
  
  // Teste 3: Testar POST real
  try {
    console.log('3️⃣ Testando POST /code/generate');
    const response3 = await fetch(`${API_URL}/code/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://frontends-autoserp.iqxn2g.easypanel.host'
      },
      body: JSON.stringify({
        email: 'teste@exemplo.com'
      })
    });
    console.log(`Status: ${response3.status}`);
    console.log(`CORS Headers:`);
    console.log(`  Access-Control-Allow-Origin: ${response3.headers.get('Access-Control-Allow-Origin')}`);
    console.log(`  Access-Control-Allow-Methods: ${response3.headers.get('Access-Control-Allow-Methods')}`);
    console.log(`  Access-Control-Allow-Headers: ${response3.headers.get('Access-Control-Allow-Headers')}`);
    console.log(`  Access-Control-Allow-Credentials: ${response3.headers.get('Access-Control-Allow-Credentials')}`);
    console.log(`Body: ${await response3.text()}\n`);
  } catch (error) {
    console.error('❌ Erro no teste 3:', error.message);
  }
  
  // Teste 4: Testar rota de teste CORS
  try {
    console.log('4️⃣ Testando GET /test-cors');
    const response4 = await fetch(`${API_URL}/test-cors`, {
      method: 'GET',
      headers: {
        'Origin': 'https://frontends-autoserp.iqxn2g.easypanel.host'
      }
    });
    console.log(`Status: ${response4.status}`);
    console.log(`CORS Headers:`);
    console.log(`  Access-Control-Allow-Origin: ${response4.headers.get('Access-Control-Allow-Origin')}`);
    console.log(`Body: ${await response4.text()}\n`);
  } catch (error) {
    console.error('❌ Erro no teste 4:', error.message);
  }
}

testServer(); 