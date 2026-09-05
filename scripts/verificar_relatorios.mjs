import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.resolve(process.cwd(), 'database.sqlite'));

db.exec(`
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
`);

const count = db.prepare('SELECT count(*) as total FROM relatorios_orcamento').get();
console.log('Tabela relatorios_orcamento criada com sucesso! Total no banco:', count.total);
