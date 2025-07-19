import https from 'https';
import http from 'http';

const API_URL = 'https://backends-backend-autoserp.iqxn2g.easypanel.host';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'CORS-Test/1.0',
        'Origin': 'https://frontends-autoserp.iqxn2g.easypanel.host',
        ...options.headers
      }
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testCORS() {
  console.log('🧪 Testando CORS do servidor autoSERP...\n');
  
  // Teste 1: GET simples
  try {
    console.log('1️⃣ Testando GET /');
    const response1 = await makeRequest(`${API_URL}/`);
    console.log(`Status: ${response1.status}`);
    console.log(`CORS Headers:`);
    console.log(`  Access-Control-Allow-Origin: ${response1.headers['access-control-allow-origin']}`);
    console.log(`  Access-Control-Allow-Methods: ${response1.headers['access-control-allow-methods']}`);
    console.log(`Body: ${response1.body}\n`);
  } catch (error) {
    console.error('❌ Erro no teste 1:', error.message);
  }
  
  // Teste 2: OPTIONS preflight
  try {
    console.log('2️⃣ Testando OPTIONS /code/generate');
    const response2 = await makeRequest(`${API_URL}/code/generate`, {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    console.log(`Status: ${response2.status}`);
    console.log(`CORS Headers:`);
    console.log(`  Access-Control-Allow-Origin: ${response2.headers['access-control-allow-origin']}`);
    console.log(`  Access-Control-Allow-Methods: ${response2.headers['access-control-allow-methods']}`);
    console.log(`  Access-Control-Allow-Headers: ${response2.headers['access-control-allow-headers']}`);
    console.log(`  Access-Control-Allow-Credentials: ${response2.headers['access-control-allow-credentials']}\n`);
  } catch (error) {
    console.error('❌ Erro no teste 2:', error.message);
  }
  
  // Teste 3: POST real
  try {
    console.log('3️⃣ Testando POST /code/generate');
    const response3 = await makeRequest(`${API_URL}/code/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'teste@exemplo.com'
      })
    });
    console.log(`Status: ${response3.status}`);
    console.log(`CORS Headers:`);
    console.log(`  Access-Control-Allow-Origin: ${response3.headers['access-control-allow-origin']}`);
    console.log(`  Access-Control-Allow-Methods: ${response3.headers['access-control-allow-methods']}`);
    console.log(`Body: ${response3.body}\n`);
  } catch (error) {
    console.error('❌ Erro no teste 3:', error.message);
  }
  
  // Teste 4: Rota de teste CORS
  try {
    console.log('4️⃣ Testando GET /test-cors');
    const response4 = await makeRequest(`${API_URL}/test-cors`);
    console.log(`Status: ${response4.status}`);
    console.log(`CORS Headers:`);
    console.log(`  Access-Control-Allow-Origin: ${response4.headers['access-control-allow-origin']}`);
    console.log(`Body: ${response4.body}\n`);
  } catch (error) {
    console.error('❌ Erro no teste 4:', error.message);
  }
}

testCORS(); 