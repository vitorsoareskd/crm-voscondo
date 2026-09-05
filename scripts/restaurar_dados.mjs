import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

console.log('\n🔄 Iniciando restauração dos dados reais...\n');

// 1. Limpar TODOS os dados de exemplo (ordem inversa por causa das FK)
db.exec(`
  DELETE FROM esteira_pasta_mensal;
  DELETE FROM auditoria_terceirizados;
  DELETE FROM colaboradores;
  DELETE FROM compliance_laudos;
  DELETE FROM contratos;
  DELETE FROM onboarding_checklist;
  DELETE FROM condominios;
`);

// Reset autoincrement
db.exec(`
  DELETE FROM sqlite_sequence WHERE name IN (
    'condominios','contratos','compliance_laudos',
    'colaboradores','auditoria_terceirizados',
    'esteira_pasta_mensal','onboarding_checklist'
  );
`);

console.log('✅ Dados de exemplo removidos');

// 2. Inserir Residencial Cabral Cruz com os dados reais recuperados
const insertCondo = db.prepare(`
  INSERT INTO condominios (nome, cnpj, status, data_inicio_contrato)
  VALUES (?, ?, ?, ?)
`);

const condoResult = insertCondo.run(
  'Residencial Cabral Cruz',
  '32.964.833/0001-69',
  'Ativo',
  '2026-01-01'
);

const condoId = condoResult.lastInsertRowid;
console.log(`✅ Condomínio inserido com ID: ${condoId}`);

// 3. Inserir esteira pasta mensal para o condomínio
db.prepare(`
  INSERT INTO esteira_pasta_mensal (condominio_id, mes_ano, status)
  VALUES (?, ?, ?)
`).run(condoId, 'Agosto/2026', 'RECEBIMENTO');

console.log('✅ Esteira pasta mensal criada');

// 4. Verificar resultado
const condos = db.prepare('SELECT * FROM condominios').all();
console.log('\n📋 Condomínios no banco após restauração:');
console.log(JSON.stringify(condos, null, 2));

console.log('\n🎉 Restauração concluída com sucesso!');
db.close();
