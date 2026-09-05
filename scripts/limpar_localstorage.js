// ===========================================================
// SCRIPT DE LIMPEZA DO LOCALSTORAGE - VOS CONDOMÍNIOS
// Execute este script no console do navegador (F12 > Console)
// ===========================================================

(function limparDadosFicticios() {
  // Chaves do localStorage da aplicação
  const chaves = [
    'vos_condominios',
    'vos_servicos_extras',
    'vos_inadimplentes',
    'vos_tarefas_gantt',
    'vos_tarefas_equipe',
    'vos_fornecedores',
    'vos_porquinhos',
    'vos_transacoes_extrato',
    'vos_projecao_items',
    'vos_agenda',
    'vos_pre_funil_leads',
    'vos_orcamentos_relatorios_salvos',
    'vos_treasury_nfes',
    'vos_extrato',
    'vos_saude_gastos',
    'vos_saude_rendimentos',
    'vos_estrategias_pdca',
  ];

  chaves.forEach(chave => {
    const valor = localStorage.getItem(chave);
    if (valor !== null) {
      try {
        const dados = JSON.parse(valor);
        if (Array.isArray(dados) && dados.length > 0) {
          console.warn(`🗑️  Limpando "${chave}" (${dados.length} item(s))`);
          localStorage.setItem(chave, JSON.stringify([]));
        }
      } catch (e) {
        // não é JSON array, manter
      }
    }
  });

  // Marcar como limpo
  localStorage.setItem('vos_data_cleared', 'true');

  console.log('✅ localStorage limpo! Recarregue a página (F5) para atualizar a aplicação.');
  console.log('ℹ️  Os dados do Residencial Cabral Cruz continuam salvos no banco de dados.');
})();
