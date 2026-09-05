import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.resolve(process.cwd(), 'database.sqlite'));

console.log('\n========================================================');
console.log('📊 ANÁLISE COMPLETA DO BANCO DE DADOS - VOS CONDOMÍNIOS');
console.log('========================================================\n');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('📋 Tabelas encontradas:', tables.map(t => t.name).join(', '), '\n');

for (const { name } of tables) {
  const rows = db.prepare(`SELECT * FROM "${name}"`).all();
  console.log(`─────────────────────────────────`);
  console.log(`Tabela: ${name} (${rows.length} registro(s))`);
  if (rows.length > 0) {
    console.log(JSON.stringify(rows, null, 2));
  } else {
    console.log('  (vazia)');
  }
}

console.log('\n========================================================');
console.log('✅ Análise concluída');
