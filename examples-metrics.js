// Exemplos práticos de uso das métricas com intervalos de datas
const BASE_URL = 'http://localhost:3000';

// Função auxiliar para fazer requisições
async function fetchMetrics(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Exemplo 1: Análise de crescimento mensal
async function analiseCrescimentoMensal() {
  console.log('📈 Análise de Crescimento Mensal\n');
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // Métricas dos últimos 3 meses
  for (let i = 2; i >= 0; i--) {
    const month = currentMonth - i;
    const year = month < 0 ? currentYear - 1 : currentYear;
    const monthName = new Date(year, month).toLocaleString('pt-BR', { month: 'long' });
    
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]; // Último dia do mês
    
    const url = `${BASE_URL}/metrics/range?start_date=${startDate}&end_date=${endDate}`;
    const result = await fetchMetrics(url);
    
    if (result.success) {
      const { data } = result;
      console.log(`${monthName} ${year}:`);
      console.log(`  - Usuários: ${data.metrics.usuarios}`);
      console.log(`  - Recados: ${data.metrics.recados}`);
      console.log(`  - Reuniões: ${data.metrics.reunioes}`);
      console.log(`  - Total: ${data.summary.total_records} registros\n`);
    } else {
      console.log(`❌ Erro ao obter dados de ${monthName} ${year}: ${result.error}\n`);
    }
  }
}

// Exemplo 2: Comparação semanal
async function comparacaoSemanal() {
  console.log('📊 Comparação Semanal\n');
  
  const today = new Date();
  const lastWeekDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
  
  // Semana atual
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay());
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
  
  // Semana anterior
  const lastWeekStart = new Date(currentWeekStart);
  lastWeekStart.setDate(currentWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(lastWeekStart);
  lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
  
  const currentWeekUrl = `${BASE_URL}/metrics/range?start_date=${currentWeekStart.toISOString().split('T')[0]}&end_date=${currentWeekEnd.toISOString().split('T')[0]}&group_by=day`;
  const lastWeekUrl = `${BASE_URL}/metrics/range?start_date=${lastWeekStart.toISOString().split('T')[0]}&end_date=${lastWeekEnd.toISOString().split('T')[0]}&group_by=day`;
  
  const [currentWeek, lastWeekData] = await Promise.all([
    fetchMetrics(currentWeekUrl),
    fetchMetrics(lastWeekUrl)
  ]);
  
  if (currentWeek.success && lastWeekData.success) {
    console.log('Semana Atual vs Semana Anterior:');
    
    const currentTotal = currentWeek.data.metrics.recados?.reduce((sum, day) => sum + day.total, 0) || 0;
    const lastTotal = lastWeekData.data.metrics.recados?.reduce((sum, day) => sum + day.total, 0) || 0;
    
    const growth = ((currentTotal - lastTotal) / lastTotal * 100).toFixed(1);
    console.log(`  - Recados: ${currentTotal} vs ${lastTotal} (${growth}%)`);
    
    const currentMeetings = currentWeek.data.metrics.reunioes?.reduce((sum, day) => sum + day.total, 0) || 0;
    const lastMeetings = lastWeekData.data.metrics.reunioes?.reduce((sum, day) => sum + day.total, 0) || 0;
    
    const meetingGrowth = ((currentMeetings - lastMeetings) / lastMeetings * 100).toFixed(1);
    console.log(`  - Reuniões: ${currentMeetings} vs ${lastMeetings} (${meetingGrowth}%)\n`);
  }
}

// Exemplo 3: Análise por instância
async function analisePorInstancia() {
  console.log('🏢 Análise por Instância\n');
  
  const instances = ['prefeitura_sp', 'prefeitura_rj', 'prefeitura_mg'];
  const startDate = '2024-01-01';
  const endDate = '2024-01-31';
  
  for (const instance of instances) {
    const url = `${BASE_URL}/metrics/range?start_date=${startDate}&end_date=${endDate}&instance=${instance}`;
    const result = await fetchMetrics(url);
    
    if (result.success) {
      const { data } = result;
      console.log(`${instance}:`);
      console.log(`  - Usuários: ${data.metrics.usuarios}`);
      console.log(`  - Funcionários: ${data.metrics.funcionarios}`);
      console.log(`  - Recados: ${data.metrics.recados}`);
      console.log(`  - Reuniões: ${data.metrics.reunioes}`);
      console.log(`  - Total: ${data.summary.total_records} registros\n`);
    } else {
      console.log(`❌ Erro ao obter dados de ${instance}: ${result.error}\n`);
    }
  }
}

// Exemplo 4: Dashboard em tempo real
async function dashboardTempoReal() {
  console.log('🔄 Dashboard em Tempo Real\n');
  
  // Métricas das últimas 24h
  const realtimeUrl = `${BASE_URL}/metrics/realtime`;
  const realtimeResult = await fetchMetrics(realtimeUrl);
  
  if (realtimeResult.success) {
    const { data } = realtimeResult;
    console.log('Últimas 24 horas:');
    console.log(`  - Novos recados: ${data.metrics.new_recados}`);
    console.log(`  - Novas reuniões: ${data.metrics.new_reunioes}`);
    console.log(`  - Novos usuários: ${data.metrics.new_usuarios}`);
    console.log(`  - Interações de chat: ${data.metrics.chat_interactions}`);
    console.log(`  - Interações de informações: ${data.metrics.info_interactions}\n`);
  }
  
  // Métricas de hoje
  const todayUrl = `${BASE_URL}/metrics?period=day`;
  const todayResult = await fetchMetrics(todayUrl);
  
  if (todayResult.success) {
    const { data } = todayResult;
    console.log('Hoje:');
    console.log(`  - Recados pendentes: ${data.metrics.recados_pending}`);
    console.log(`  - Reuniões agendadas: ${data.metrics.reunioes_today}`);
    console.log(`  - Total de registros: ${data.summary.total_records}\n`);
  }
}

// Exemplo 5: Relatório personalizado
async function relatorioPersonalizado() {
  console.log('📋 Relatório Personalizado\n');
  
  // Período específico (último trimestre)
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(new Date().getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const url = `${BASE_URL}/metrics/range?start_date=${startDate}&end_date=${endDate}&group_by=month`;
  const result = await fetchMetrics(url);
  
  if (result.success) {
    const { data } = result;
    console.log(`Relatório do último trimestre (${startDate} a ${endDate}):`);
    
    // Análise por mês
    if (data.metrics.recados) {
      console.log('\nRecados por mês:');
      data.metrics.recados.forEach(month => {
        const monthName = new Date(month.period).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        console.log(`  - ${monthName}: ${month.total} recados`);
      });
    }
    
    if (data.metrics.reunioes) {
      console.log('\nReuniões por mês:');
      data.metrics.reunioes.forEach(month => {
        const monthName = new Date(month.period).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        console.log(`  - ${monthName}: ${month.total} reuniões`);
      });
    }
  }
}

// Executar todos os exemplos
async function executarExemplos() {
  console.log('🚀 Executando Exemplos de Métricas\n');
  console.log('=' .repeat(50) + '\n');
  
  await analiseCrescimentoMensal();
  await comparacaoSemanal();
  await analisePorInstancia();
  await dashboardTempoReal();
  await relatorioPersonalizado();
  
  console.log('✅ Todos os exemplos concluídos!');
}

// Executar se o arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  executarExemplos();
}

export {
  analiseCrescimentoMensal,
  comparacaoSemanal,
  analisePorInstancia,
  dashboardTempoReal,
  relatorioPersonalizado,
  executarExemplos
}; 