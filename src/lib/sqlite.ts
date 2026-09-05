import Database from 'better-sqlite3';
import path from 'path';

// Define the absolute path for the sqlite database
const dbPath = path.resolve(process.cwd(), 'database.sqlite');

let db: Database.Database | null = null;

export function initDB(): Database.Database {
  if (db) return db;

  // Initialize better-sqlite3
  db = new Database(dbPath, { verbose: console.log });

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create tables
  const createTablesSQL = `
    CREATE TABLE IF NOT EXISTS condominios (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      cnpj TEXT,
      status TEXT,
      data_inicio_contrato DATE,
      unidades INTEGER DEFAULT 0,
      endereco TEXT,
      cidade TEXT,
      bairro TEXT,
      rua TEXT,
      sindico_responsavel TEXT,
      email_condominio TEXT,
      numero_condominio TEXT,
      banco TEXT,
      agencia_e_conta TEXT,
      senha_banco TEXT,
      complexidade TEXT DEFAULT 'Moderado',
      plano TEXT DEFAULT 'Vos Essencial',
      fator_ajuste REAL DEFAULT 1.0,
      mensalidade_calculada REAL DEFAULT 0,
      horas_estimadas_mes REAL DEFAULT 0,
      livre_caixa REAL DEFAULT 0,
      fundo_obras REAL DEFAULT 0,
      fundo_pintura REAL DEFAULT 0,
      fundo_reforma REAL DEFAULT 0,
      gasto_medio_mensal REAL DEFAULT 0,
      rendimento_medio_mensal REAL DEFAULT 0,
      saude_score REAL DEFAULT 5,
      anotacoes TEXT,
      historico_caixa TEXT,
      templates_relatorio TEXT
    );

    CREATE TABLE IF NOT EXISTS logs_auditoria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tabela_afetada TEXT NOT NULL,
      acao TEXT CHECK(acao IN ('INSERT', 'UPDATE', 'DELETE')) NOT NULL,
      id_registro INTEGER NOT NULL,
      data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
      detalhes TEXT
    );

    CREATE TABLE IF NOT EXISTS onboarding_checklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      condominio_id TEXT NOT NULL,
      convencao_recebida BOOLEAN DEFAULT 0,
      atas_recebidas BOOLEAN DEFAULT 0,
      cartao_cnpj_recebido BOOLEAN DEFAULT 0,
      saldos_recebidos BOOLEAN DEFAULT 0,
      folha_recebida BOOLEAN DEFAULT 0,
      FOREIGN KEY (condominio_id) REFERENCES condominios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS contratos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      condominio_id TEXT NOT NULL,
      valor_honorarios REAL NOT NULL,
      data_vencimento DATE,
      meses_vigencia INTEGER,
      FOREIGN KEY (condominio_id) REFERENCES condominios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS colaboradores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      condominio_id TEXT NOT NULL,
      nome_razao TEXT NOT NULL,
      tipo TEXT CHECK(tipo IN ('ORGANICO', 'TERCEIRO')) NOT NULL,
      documento TEXT,
      FOREIGN KEY (condominio_id) REFERENCES condominios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS compliance_laudos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      condominio_id TEXT NOT NULL,
      tipo_laudo TEXT NOT NULL,
      data_emissao DATE,
      data_vencimento DATE,
      status TEXT,
      FOREIGN KEY (condominio_id) REFERENCES condominios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS auditoria_terceirizados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      colaborador_id INTEGER NOT NULL,
      mes_ano TEXT NOT NULL,
      cnd_trabalhista_ok BOOLEAN DEFAULT 0,
      crf_fgts_ok BOOLEAN DEFAULT 0,
      comprovantes_pagamento_ok BOOLEAN DEFAULT 0,
      FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS esteira_pasta_mensal (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      condominio_id TEXT NOT NULL,
      mes_ano TEXT NOT NULL,
      status TEXT CHECK(status IN ('RECEBIMENTO', 'CONCILIACAO', 'FISCAL', 'APROVACAO', 'ENVIADO')) DEFAULT 'RECEBIMENTO',
      FOREIGN KEY (condominio_id) REFERENCES condominios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS retencoes_impostos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      colaborador_id INTEGER NOT NULL,
      mes_ano TEXT NOT NULL,
      inss REAL DEFAULT 0.0,
      iss REAL DEFAULT 0.0,
      irrf REAL DEFAULT 0.0,
      pis_cofins_csll REAL DEFAULT 0.0,
      status_pagamento TEXT,
      FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS fornecedores (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      cnpj TEXT,
      condominio_atendido TEXT,
      condominios_atendidos TEXT,
      segmento TEXT,
      avaliacao_servico REAL DEFAULT 3,
      avaliacao_custo_beneficio REAL DEFAULT 3,
      telefone TEXT,
      email TEXT,
      observacoes TEXT,
      servicos_feitos TEXT
    );

    CREATE TABLE IF NOT EXISTS inadimplentes (
      id TEXT PRIMARY KEY,
      condominio_id TEXT,
      condominio_nome TEXT,
      unidade TEXT,
      morador_nome TEXT,
      valor_devido REAL DEFAULT 0,
      meses_atraso INTEGER DEFAULT 0,
      status_cobranca TEXT DEFAULT 'Amigável',
      data_ultimo_contato TEXT
    );

    CREATE TABLE IF NOT EXISTS tarefas_gantt (
      id TEXT PRIMARY KEY,
      condominio_id TEXT,
      condominio_nome TEXT,
      titulo TEXT NOT NULL,
      categoria TEXT,
      data_inicio TEXT,
      data_fim TEXT,
      progresso INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Planejado',
      responsavel TEXT
    );

    CREATE TABLE IF NOT EXISTS tarefas_equipe (
      id TEXT PRIMARY KEY,
      condominio_id TEXT,
      condominio_nome TEXT,
      titulo TEXT NOT NULL,
      prioridade TEXT DEFAULT 'Média',
      concluida BOOLEAN DEFAULT 0,
      data_limite TEXT,
      atribuido_para TEXT,
      google_task_id TEXT
    );

    CREATE TABLE IF NOT EXISTS transacoes_extrato (
      id TEXT PRIMARY KEY,
      data TEXT,
      mes_referencia TEXT,
      descricao TEXT,
      valor REAL DEFAULT 0,
      tipo TEXT CHECK(tipo IN ('entrada', 'saida')),
      condominio_id TEXT,
      condominio_nome TEXT,
      categoria TEXT
    );

    CREATE TABLE IF NOT EXISTS projecao_items (
      id TEXT PRIMARY KEY,
      descricao TEXT NOT NULL,
      valor REAL DEFAULT 0,
      tipo TEXT CHECK(tipo IN ('ganho', 'despesa')),
      categoria TEXT,
      condominio_nome TEXT,
      probabilidade TEXT DEFAULT 'Estimado',
      horizonte_tempo TEXT,
      is_imposto BOOLEAN DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS porquinhos (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      descricao TEXT,
      saldo_atual REAL DEFAULT 0,
      meta_anual REAL,
      cor TEXT DEFAULT '#10b981'
    );

    CREATE TABLE IF NOT EXISTS leads_pre_funil (
      id TEXT PRIMARY KEY,
      cnpj TEXT,
      nome TEXT NOT NULL,
      cidade TEXT,
      bairro TEXT,
      rua TEXT,
      unidades INTEGER,
      telefone TEXT,
      email TEXT,
      contato TEXT,
      data_cadastro TEXT,
      observacoes TEXT
    );

    CREATE TABLE IF NOT EXISTS relatorios_orcamento (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      data_salvamento TEXT,
      timestamp INTEGER,
      condominio_id TEXT,
      nome_condominio TEXT,
      mes_referencia TEXT,
      numero_unidades INTEGER,
      vencimento_boleto TEXT,
      total_geral REAL,
      total_ordinarias REAL,
      total_fundo_reserva REAL,
      total_extraordinarias REAL,
      total_fundo_pintura REAL,
      total_fundo_obras REAL,
      total_agua REAL,
      observacoes TEXT,
      dados_completos TEXT
    );
  `;


  try {
    // Migration: verificar se a tabela condominios antiga precisa ser atualizada para suportar ID TEXT e novos campos
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='condominios'").get();
    if (tableCheck) {
      const cols = db.prepare("PRAGMA table_info(condominios)").all() as any[];
      const hasUnidades = cols.some(c => c.name === 'unidades');
      const idCol = cols.find(c => c.name === 'id');
      const idIsText = idCol && idCol.type.toUpperCase().includes('TEXT');

      if (!hasUnidades || !idIsText) {
        console.log('🔄 Migrando tabela condominios para o novo formato com suporte a IDs de texto e todos os campos...');
        db.exec(`PRAGMA foreign_keys = OFF;`);
        db.exec(`
          CREATE TABLE IF NOT EXISTS condominios_migration_v2 (
            id TEXT PRIMARY KEY,
            nome TEXT NOT NULL,
            cnpj TEXT,
            status TEXT,
            data_inicio_contrato DATE,
            unidades INTEGER DEFAULT 0,
            endereco TEXT,
            cidade TEXT,
            bairro TEXT,
            rua TEXT,
            sindico_responsavel TEXT,
            email_condominio TEXT,
            numero_condominio TEXT,
            banco TEXT,
            agencia_e_conta TEXT,
            senha_banco TEXT,
            complexidade TEXT DEFAULT 'Moderado',
            plano TEXT DEFAULT 'Vos Essencial',
            fator_ajuste REAL DEFAULT 1.0,
            mensalidade_calculada REAL DEFAULT 0,
            horas_estimadas_mes REAL DEFAULT 0,
            livre_caixa REAL DEFAULT 0,
            fundo_obras REAL DEFAULT 0,
            fundo_pintura REAL DEFAULT 0,
            fundo_reforma REAL DEFAULT 0,
            gasto_medio_mensal REAL DEFAULT 0,
            rendimento_medio_mensal REAL DEFAULT 0,
            saude_score REAL DEFAULT 5,
            anotacoes TEXT,
            historico_caixa TEXT,
            templates_relatorio TEXT
          );
        `);
        // Copiar dados preservados
        db.exec(`
          INSERT OR IGNORE INTO condominios_migration_v2 (id, nome, cnpj, status, data_inicio_contrato)
          SELECT CAST(id AS TEXT), nome, cnpj, status, data_inicio_contrato FROM condominios;
        `);
        db.exec(`DROP TABLE condominios;`);
        db.exec(`ALTER TABLE condominios_migration_v2 RENAME TO condominios;`);
        db.exec(`PRAGMA foreign_keys = ON;`);
        console.log('✅ Migração de condominios concluída com sucesso!');
      }
    }

    db.exec(createTablesSQL);
    console.log('Tabelas inicializadas com sucesso.');
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
  }

  return db;
}

export function getDB(): Database.Database {
  if (!db) {
    return initDB();
  }
  return db;
}
