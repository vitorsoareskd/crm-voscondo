/**
 * SQLite Database Manager for VOS Condomínios (WebAssembly via sql.js)
 */

export interface CondominioSQLite {
  id: number;
  nome: string;
  cnpj?: string;
  endereco?: string;
  sindico_nome?: string;
  sindico_contato?: string;
  taxa_padrao?: number;
  data_criacao?: string;
}

export interface UnidadeSQLite {
  id: number;
  condominio_id: number;
  condominio_nome?: string;
  bloco?: string;
  numero: string;
  fracao_ideal?: number;
}

export interface PessoaSQLite {
  id: number;
  nome: string;
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  tipo: 'Proprietário' | 'Inquilino' | 'Morador';
  data_cadastro?: string;
}

export interface FinanceiroSQLite {
  id: number;
  condominio_id: number;
  condominio_nome?: string;
  unidade_id: number;
  unidade_numero?: string;
  bloco?: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  status: 'Pendente' | 'Pago' | 'Vencido';
  data_pagamento?: string;
}

export interface ChamadoSQLite {
  id: number;
  condominio_id: number;
  condominio_nome?: string;
  unidade_id?: number;
  unidade_numero?: string;
  titulo: string;
  descricao: string;
  prioridade: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  status: 'Aberto' | 'Em Andamento' | 'Concluído' | 'Cancelado';
  data_abertura?: string;
}

export interface VisitanteSQLite {
  id: number;
  condominio_id: number;
  condominio_nome?: string;
  unidade_id: number;
  unidade_numero?: string;
  nome_visitante: string;
  documento?: string;
  veiculo_placa?: string;
  data_entrada?: string;
  data_saida?: string;
}

let db: any = null;
const DB_STORAGE_KEY = 'crm_condominio_sqlite_db';

// Helper to ensure sql.js is loaded
async function ensureSqlJsLoaded(): Promise<any> {
  if ((window as any).initSqlJs) {
    return (window as any).initSqlJs;
  }
  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById('sql-js-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'sql-js-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js';
      script.onload = () => {
        if ((window as any).initSqlJs) {
          resolve((window as any).initSqlJs);
        } else {
          reject(new Error("initSqlJs não encontrado após carregar o script"));
        }
      };
      script.onerror = () => reject(new Error("Falha ao carregar script do sql.js via CDN"));
      document.head.appendChild(script);
    } else {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if ((window as any).initSqlJs) {
          clearInterval(interval);
          resolve((window as any).initSqlJs);
        } else if (attempts > 50) {
          clearInterval(interval);
          reject(new Error("Timeout ao carregar script do sql.js"));
        }
      }, 100);
    }
  });
}

// Inicializar banco de dados SQLite
export async function initSQLite(): Promise<boolean> {
  if (db) return true;
  try {
    const initSqlJsFn = await ensureSqlJsLoaded();
    const config = {
      locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    };
    const SQL = await initSqlJsFn(config);

    // Verificar se existe banco salvo em localStorage
    const savedDb = localStorage.getItem(DB_STORAGE_KEY);
    if (savedDb) {
      try {
        const uInt8Array = new Uint8Array(JSON.parse(savedDb));
        db = new SQL.Database(uInt8Array);
        console.log("⚡ Banco de Dados SQLite carregado do LocalStorage!");
      } catch (e) {
        console.warn("Falha ao parsear banco antigo, iniciando novo:", e);
        db = new SQL.Database();
        createTables();
        seedInitialData();
        saveDatabase();
      }
    } else {
      db = new SQL.Database();
      console.log("⚡ Novo Banco de Dados SQLite criado!");
      createTables();
      seedInitialData();
      saveDatabase();
    }
    return true;
  } catch (err) {
    console.error("Erro ao inicializar SQLite:", err);
    return false;
  }
}

// Salvar estado do banco SQLite no LocalStorage
export function saveDatabase(): void {
  if (!db) return;
  try {
    const data = db.export();
    const arr = Array.from(data);
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(arr));
  } catch (err) {
    console.error("Erro ao salvar SQLite no LocalStorage:", err);
  }
}

// Criar Tabelas no SQLite
function createTables(): void {
  if (!db) return;
  const schemaSQL = `
    CREATE TABLE IF NOT EXISTS condominios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cnpj TEXT UNIQUE,
      endereco TEXT,
      sindico_nome TEXT,
      sindico_contato TEXT,
      taxa_padrao REAL DEFAULT 0.0,
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS unidades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      condominio_id INTEGER NOT NULL,
      bloco TEXT,
      numero TEXT NOT NULL,
      fracao_ideal REAL DEFAULT 1.0,
      FOREIGN KEY (condominio_id) REFERENCES condominios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pessoas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cpf_cnpj TEXT UNIQUE,
      email TEXT,
      telefone TEXT,
      tipo TEXT CHECK(tipo IN ('Proprietário', 'Inquilino', 'Morador')) NOT NULL,
      data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS unidade_pessoa (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unidade_id INTEGER NOT NULL,
      pessoa_id INTEGER NOT NULL,
      eh_principal INTEGER DEFAULT 1,
      FOREIGN KEY (unidade_id) REFERENCES unidades(id) ON DELETE CASCADE,
      FOREIGN KEY (pessoa_id) REFERENCES pessoas(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS financeiro (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      condominio_id INTEGER NOT NULL,
      unidade_id INTEGER NOT NULL,
      descricao TEXT NOT NULL,
      valor REAL NOT NULL,
      data_vencimento DATE NOT NULL,
      status TEXT CHECK(status IN ('Pendente', 'Pago', 'Vencido')) DEFAULT 'Pendente',
      data_pagamento DATE,
      FOREIGN KEY (condominio_id) REFERENCES condominios(id),
      FOREIGN KEY (unidade_id) REFERENCES unidades(id)
    );

    CREATE TABLE IF NOT EXISTS chamados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      condominio_id INTEGER NOT NULL,
      unidade_id INTEGER,
      titulo TEXT NOT NULL,
      descricao TEXT NOT NULL,
      prioridade TEXT CHECK(prioridade IN ('Baixa', 'Média', 'Alta', 'Urgente')) DEFAULT 'Média',
      status TEXT CHECK(status IN ('Aberto', 'Em Andamento', 'Concluído', 'Cancelado')) DEFAULT 'Aberto',
      data_abertura DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (condominio_id) REFERENCES condominios(id),
      FOREIGN KEY (unidade_id) REFERENCES unidades(id)
    );

    CREATE TABLE IF NOT EXISTS visitantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      condominio_id INTEGER NOT NULL,
      unidade_id INTEGER NOT NULL,
      nome_visitante TEXT NOT NULL,
      documento TEXT,
      veiculo_placa TEXT,
      data_entrada DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_saida DATETIME,
      FOREIGN KEY (condominio_id) REFERENCES condominios(id),
      FOREIGN KEY (unidade_id) REFERENCES unidades(id)
    );
  `;
  db.run(schemaSQL);
}

// Inserir Dados Iniciais de Demonstração (Seed)
function seedInitialData(): void {
  if (!db) return;
  db.run(`INSERT INTO condominios (nome, cnpj, endereco, sindico_nome, sindico_contato, taxa_padrao) VALUES 
    ('Residencial Solar das Palmeiras', '12.345.678/0001-90', 'Av. das Americas, 1500 - Barra', 'Carlos Eduardo Silva', '(21) 99887-6655', 650.00),
    ('Edifício Horizon Towers', '98.765.432/0001-10', 'Rua Visconde de Pirajá, 300 - Ipanema', 'Mariana Rocha', '(21) 98765-4321', 1200.00);`);

  db.run(`INSERT INTO unidades (condominio_id, bloco, numero, fracao_ideal) VALUES 
    (1, 'Bloco A', '101', 1.0),
    (1, 'Bloco A', '102', 1.0),
    (1, 'Bloco B', '201', 1.2),
    (2, 'Torre 1', '501', 1.5),
    (2, 'Torre 1', '502', 1.5);`);

  db.run(`INSERT INTO pessoas (nome, cpf_cnpj, email, telefone, tipo) VALUES 
    ('Ana Beatriz Souza', '111.222.333-44', 'ana.souza@email.com', '(21) 97111-2233', 'Proprietário'),
    ('Roberto Lima', '222.333.444-55', 'roberto.lima@email.com', '(21) 97222-3344', 'Morador'),
    ('Fernanda Alves', '333.444.555-66', 'fernanda.alves@email.com', '(21) 97333-4455', 'Inquilino');`);

  db.run(`INSERT INTO unidade_pessoa (unidade_id, pessoa_id, eh_principal) VALUES (1, 1, 1), (2, 2, 1), (4, 3, 1);`);

  db.run(`INSERT INTO financeiro (condominio_id, unidade_id, descricao, valor, data_vencimento, status, data_pagamento) VALUES 
    (1, 1, 'Cota Condominial - Agosto/2026', 650.00, '2026-08-10', 'Pendente', NULL),
    (1, 2, 'Cota Condominial - Agosto/2026', 650.00, '2026-08-10', 'Pago', '2026-08-02'),
    (1, 3, 'Cota Condominial - Julho/2026', 680.00, '2026-07-10', 'Vencido', NULL),
    (2, 4, 'Cota Condominial + Fundo de Reserva', 1350.00, '2026-08-15', 'Pendente', NULL);`);

  db.run(`INSERT INTO chamados (condominio_id, unidade_id, titulo, descricao, prioridade, status) VALUES 
    (1, 1, 'Infiltração no teto da garagem', 'Vazamento aparente vindo da tubulação principal.', 'Alta', 'Em Andamento'),
    (1, 2, 'Lâmpada do corredor queimada', 'Lâmpada do 1º andar bloco A está apagada.', 'Baixa', 'Aberto'),
    (2, 4, 'Portão da garagem travando', 'Motor apresenta barulho estranho ao fechar.', 'Urgente', 'Aberto');`);

  db.run(`INSERT INTO visitantes (condominio_id, unidade_id, nome_visitante, documento, veiculo_placa) VALUES 
    (1, 1, 'Lucas Oliveira (Técnico Internet)', '44.555.666-7', 'ABC-1234'),
    (2, 4, 'Juliana Mendes', '33.222.111-0', 'XYZ-9876');`);
}

// Helper: Executar SQL de Leitura (SELECT) e retornar Objetos
export function querySQL<T = any>(sql: string, params: any[] = []): T[] {
  if (!db) return [];
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const result: T[] = [];
    while (stmt.step()) {
      result.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return result;
  } catch (err) {
    console.error("Erro na consulta SQL:", err, sql);
    return [];
  }
}

// Helper: Executar SQL de Alteração (INSERT, UPDATE, DELETE)
export function executeSQL(sql: string, params: any[] = []): boolean {
  if (!db) return false;
  try {
    db.run(sql, params);
    saveDatabase();
    return true;
  } catch (err: any) {
    console.error("Erro na execução SQL:", err, sql);
    alert("Erro SQL: " + (err.message || err));
    return false;
  }
}

// Exportar arquivo .db do SQLite
export function exportDatabaseFile(): void {
  if (!db) return;
  const binaryArray = db.export();
  const blob = new Blob([binaryArray], { type: 'application/x-sqlite3' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `condominio_backup_${new Date().toISOString().slice(0, 10)}.db`;
  a.click();
}

// Importar arquivo .db do SQLite enviado pelo usuário
export function importDatabaseFile(file: File): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const uInt8Array = new Uint8Array(this.result as ArrayBuffer);
        const initSqlJsFn = (window as any).initSqlJs;
        if (!initSqlJsFn) throw new Error("Motor SQL.js não carregado");
        initSqlJsFn({
          locateFile: (f: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${f}`
        }).then((SQL: any) => {
          db = new SQL.Database(uInt8Array);
          saveDatabase();
          alert("✅ Banco de Dados SQLite importado com sucesso!");
          resolve(true);
        });
      } catch (err: any) {
        alert("❌ Falha ao carregar o arquivo .db SQLite: " + err.message);
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

// Resetar banco para o estado padrão
export function resetSQLiteDatabase(): void {
  if (confirm("Tem certeza que deseja resetar todo o banco de dados SQLite para os valores padrões de fábrica?")) {
    localStorage.removeItem(DB_STORAGE_KEY);
    window.location.reload();
  }
}

// Sincronizar Condomínios do CRM/ERP para a tabela condominios do SQLite
export function syncAppCondosToSQLite(appCondos: Array<{ nome: string; cnpj?: string; endereco?: string; sindico?: string; sindicoContato?: string; taxaPadrao?: number }>): void {
  if (!db || !appCondos || appCondos.length === 0) return;
  try {
    const existing = querySQL<CondominioSQLite>('SELECT nome FROM condominios');
    const existingNames = new Set(existing.map((c) => c.nome.trim().toLowerCase()));

    appCondos.forEach((c) => {
      if (c.nome && !existingNames.has(c.nome.trim().toLowerCase())) {
        db.run(
          'INSERT INTO condominios (nome, cnpj, endereco, sindico_nome, sindico_contato, taxa_padrao) VALUES (?, ?, ?, ?, ?, ?)',
          [c.nome, c.cnpj || null, c.endereco || null, c.sindico || null, c.sindicoContato || null, c.taxaPadrao || 0]
        );
        existingNames.add(c.nome.trim().toLowerCase());
      }
    });
    saveDatabase();
  } catch (e) {
    console.warn("Erro ao sincronizar condomínios no SQLite:", e);
  }
}

