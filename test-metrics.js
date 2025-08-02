// Teste do endpoint de métricas
const BASE_URL = 'http://localhost:3000';

async function testMetrics() {
  console.log('🧪 Testando Endpoint de Métricas\n');

  try {
    // Teste 1: Métricas gerais (todas)
    console.log('1️⃣ Testando métricas gerais...');
    const response1 = await fetch(`${BASE_URL}/metrics`);
    const data1 = await response1.json();
    console.log('✅ Métricas gerais:', {
      period: data1.period,
      total_records: data1.summary?.total_records,
      total_tables: data1.summary?.total_tables
    });

    // Teste 2: Métricas do dia
    console.log('\n2️⃣ Testando métricas do dia...');
    const response2 = await fetch(`${BASE_URL}/metrics?period=day`);
    const data2 = await response2.json();
    console.log('✅ Métricas do dia:', {
      period: data2.period,
      funcionarios: data2.metrics?.funcionarios,
      recados: data2.metrics?.recados,
      reunioes: data2.metrics?.reunioes
    });

    // Teste 3: Métricas da semana
    console.log('\n3️⃣ Testando métricas da semana...');
    const response3 = await fetch(`${BASE_URL}/metrics?period=week`);
    const data3 = await response3.json();
    console.log('✅ Métricas da semana:', {
      period: data3.period,
      funcionarios: data3.metrics?.funcionarios,
      recados: data3.metrics?.recados,
      reunioes: data3.metrics?.reunioes
    });

    // Teste 4: Métricas do mês
    console.log('\n4️⃣ Testando métricas do mês...');
    const response4 = await fetch(`${BASE_URL}/metrics?period=month`);
    const data4 = await response4.json();
    console.log('✅ Métricas do mês:', {
      period: data4.period,
      funcionarios: data4.metrics?.funcionarios,
      recados: data4.metrics?.recados,
      reunioes: data4.metrics?.reunioes
    });

    // Teste 5: Métricas do ano
    console.log('\n5️⃣ Testando métricas do ano...');
    const response5 = await fetch(`${BASE_URL}/metrics?period=year`);
    const data5 = await response5.json();
    console.log('✅ Métricas do ano:', {
      period: data5.period,
      funcionarios: data5.metrics?.funcionarios,
      recados: data5.metrics?.recados,
      reunioes: data5.metrics?.reunioes
    });

    // Teste 6: Métricas em tempo real
    console.log('\n6️⃣ Testando métricas em tempo real...');
    const response6 = await fetch(`${BASE_URL}/metrics/realtime`);
    const data6 = await response6.json();
    console.log('✅ Métricas em tempo real:', {
      period: data6.period,
      new_recados: data6.metrics?.new_recados,
      new_reunioes: data6.metrics?.new_reunioes,
      chat_interactions: data6.metrics?.chat_interactions
    });

    // Teste 7: Métricas com filtro de instância
    console.log('\n7️⃣ Testando métricas com filtro de instância...');
    const response7 = await fetch(`${BASE_URL}/metrics?period=day&instance=test_instance`);
    const data7 = await response7.json();
    console.log('✅ Métricas com instância:', {
      period: data7.period,
      instance: data7.instance,
      funcionarios: data7.metrics?.funcionarios,
      recados: data7.metrics?.recados
    });

    // Teste 8: Período inválido
    console.log('\n8️⃣ Testando período inválido...');
    const response8 = await fetch(`${BASE_URL}/metrics?period=invalid`);
    const data8 = await response8.json();
    console.log('✅ Erro de período inválido:', {
      status: response8.status,
      error: data8.error
    });

    // Teste 9: Métricas de período customizado (data específica)
    console.log('\n9️⃣ Testando métricas de data específica...');
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const response9 = await fetch(`${BASE_URL}/metrics?period=custom&specific_date=${today}`);
    const data9 = await response9.json();
    console.log('✅ Métricas de data específica:', {
      period: data9.period,
      date_range: data9.date_range,
      funcionarios: data9.metrics?.funcionarios,
      recados: data9.metrics?.recados
    });

    // Teste 10: Métricas de período customizado (intervalo)
    console.log('\n🔟 Testando métricas de intervalo de datas...');
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';
    const response10 = await fetch(`${BASE_URL}/metrics?period=custom&start_date=${startDate}&end_date=${endDate}`);
    const data10 = await response10.json();
    console.log('✅ Métricas de intervalo:', {
      period: data10.period,
      date_range: data10.date_range,
      funcionarios: data10.metrics?.funcionarios,
      recados: data10.metrics?.recados
    });

    // Teste 11: Métricas por intervalo de datas (endpoint específico)
    console.log('\n1️⃣1️⃣ Testando endpoint de intervalo de datas...');
    const response11 = await fetch(`${BASE_URL}/metrics/range?start_date=${startDate}&end_date=${endDate}`);
    const data11 = await response11.json();
    console.log('✅ Endpoint de intervalo:', {
      period: data11.period,
      start_date: data11.start_date,
      end_date: data11.end_date,
      funcionarios: data11.metrics?.funcionarios,
      recados: data11.metrics?.recados
    });

    // Teste 12: Métricas por intervalo com agrupamento por dia
    console.log('\n1️⃣2️⃣ Testando agrupamento por dia...');
    const response12 = await fetch(`${BASE_URL}/metrics/range?start_date=${startDate}&end_date=${endDate}&group_by=day`);
    const data12 = await response12.json();
    console.log('✅ Agrupamento por dia:', {
      period: data12.period,
      group_by: data12.group_by,
      funcionarios_count: data12.metrics?.funcionarios?.length || 0,
      recados_count: data12.metrics?.recados?.length || 0
    });

    // Teste 13: Erro de intervalo inválido
    console.log('\n1️⃣3️⃣ Testando erro de intervalo inválido...');
    const response13 = await fetch(`${BASE_URL}/metrics/range?start_date=2024-01-31&end_date=2024-01-01`);
    const data13 = await response13.json();
    console.log('✅ Erro de intervalo inválido:', {
      status: response13.status,
      error: data13.error
    });

    console.log('\n🎉 Todos os testes concluídos!');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  }
}

// Executar testes se o arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testMetrics();
}

export { testMetrics }; 