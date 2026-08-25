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
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cnpj TEXT,
      status TEXT,
      data_inicio_contrato DATE
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
      condominio_id INTEGER NOT NULL,
      convencao_recebida BOOLEAN DEFAULT 0,
      atas_recebidas BOOLEAN DEFAULT 0,
      cartao_cnpj_recebido BOOLEAN DEFAULT 0,
      saldos_recebidos BOOLEAN DEFAULT 0,
      folha_recebida BOOLEAN DEFAULT 0,
      FOREIGN KEY (condominio_id) REFERENCES condominios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS contratos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      condominio_id INTEGER NOT NULL,
      valor_honorarios REAL NOT NULL,
      data_vencimento DATE,
      meses_vigencia INTEGER,
      FOREIGN KEY (condominio_id) REFERENCES condominios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS colaboradores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      condominio_id INTEGER NOT NULL,
      nome_razao TEXT NOT NULL,
      tipo TEXT CHECK(tipo IN ('ORGANICO', 'TERCEIRO')) NOT NULL,
      documento TEXT,
      FOREIGN KEY (condominio_id) REFERENCES condominios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS compliance_laudos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      condominio_id INTEGER NOT NULL,
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
      condominio_id INTEGER NOT NULL,
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
  `;

  try {
    db.exec(createTablesSQL);
    console.log('Tabelas inicializadas com sucesso.');
    seedMockData(db);
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
  }

  return db;
}

function seedMockData(database: Database.Database) {
  const condominios = database.prepare('SELECT COUNT(*) as count FROM condominios').get() as { count: number };
  if (condominios.count === 0) {
    console.log('Populando dados iniciais mockados no SQLite...');
    database.prepare("INSERT INTO condominios (nome, cnpj, status, data_inicio_contrato) VALUES ('Condomínio Alpha', '12.345.678/0001-90', 'Ativo', '2023-01-01')").run();
    database.prepare("INSERT INTO condominios (nome, cnpj, status, data_inicio_contrato) VALUES ('Condomínio Beta', '98.765.432/0001-10', 'Ativo', '2022-05-15')").run();
    
    // Contratos
    // Um vencendo daqui a 35 dias (aproximadamente 1 mes)
    const umMesFuturo = new Date();
    umMesFuturo.setDate(umMesFuturo.getDate() + 35);
    const dateStr = umMesFuturo.toISOString().split('T')[0];

    // Um vencendo daqui a 65 dias (aproximadamente 2 meses)
    const doisMesesFuturo = new Date();
    doisMesesFuturo.setDate(doisMesesFuturo.getDate() + 65);
    const dateStr2 = doisMesesFuturo.toISOString().split('T')[0];

    database.prepare(`INSERT INTO contratos (condominio_id, valor_honorarios, data_vencimento, meses_vigencia) VALUES (1, 1500.00, '${dateStr}', 12)`).run();
    database.prepare(`INSERT INTO contratos (condominio_id, valor_honorarios, data_vencimento, meses_vigencia) VALUES (2, 2000.00, '${dateStr2}', 24)`).run();

    // Compliance Laudos
    // Um vencendo amanhã (alerta vermelho)
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 5);
    const dateAmanha = amanha.toISOString().split('T')[0];
    database.prepare(`INSERT INTO compliance_laudos (condominio_id, tipo_laudo, data_emissao, data_vencimento, status) VALUES (1, 'AVCB', '2025-01-01', '${dateAmanha}', 'Válido')`).run();
    database.prepare("INSERT INTO compliance_laudos (condominio_id, tipo_laudo, data_emissao, data_vencimento, status) VALUES (2, 'SPDA', '2023-01-01', '2028-01-01', 'Válido')").run();

    // Colaboradores e Auditoria
    database.prepare("INSERT INTO colaboradores (condominio_id, nome_razao, tipo, documento) VALUES (1, 'Limpeza Express LTDA', 'TERCEIRO', '11.111.111/0001-11')").run();
    database.prepare("INSERT INTO auditoria_terceirizados (colaborador_id, mes_ano, cnd_trabalhista_ok, crf_fgts_ok, comprovantes_pagamento_ok) VALUES (1, 'Agosto/2026', 0, 1, 0)").run();

    // Esteira Pasta Mensal
    database.prepare("INSERT INTO esteira_pasta_mensal (condominio_id, mes_ano, status) VALUES (1, 'Agosto/2026', 'RECEBIMENTO')").run();
    database.prepare("INSERT INTO esteira_pasta_mensal (condominio_id, mes_ano, status) VALUES (2, 'Agosto/2026', 'FISCAL')").run();
  }
}

export function getDB(): Database.Database {
  if (!db) {
    return initDB();
  }
  return db;
}
