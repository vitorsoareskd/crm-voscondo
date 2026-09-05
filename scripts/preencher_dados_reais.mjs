import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.resolve(process.cwd(), 'database.sqlite'));
db.pragma('foreign_keys = ON');

console.log('\n=======================================================');
console.log('🏗️  PREENCHENDO DADOS REAIS - RESIDENCIAL CABRAL CRUZ');
console.log('=======================================================\n');

// ── 1. Atualizar condomínio com dados completos recuperados ──────────────────
db.prepare(`
  UPDATE condominios SET
    nome                  = 'Residencial Cabral Cruz',
    cnpj                  = '32.964.833/0001-69',
    status                = 'Ativo',
    data_inicio_contrato  = '2026-01-01'
  WHERE id = 1
`).run();
console.log('✅ Condomínio atualizado');

// ── 2. Contrato (honorários recuperados do extrato: R$ 342,90/mês) ──────────
const jaTemContrato = db.prepare('SELECT COUNT(*) as c FROM contratos WHERE condominio_id = 1').get();
if (jaTemContrato.c === 0) {
  db.prepare(`
    INSERT INTO contratos (condominio_id, valor_honorarios, data_vencimento, meses_vigencia)
    VALUES (1, 342.90, '2027-01-01', 12)
  `).run();
  console.log('✅ Contrato inserido (R$ 342,90/mês, vigência 12 meses)');
}

// ── 3. Fornecedor real recuperado do Chrome ─────────────────────────────────
const jaTemColab = db.prepare("SELECT COUNT(*) as c FROM colaboradores WHERE condominio_id = 1 AND nome_razao LIKE '%Charles%'").get();
if (jaTemColab.c === 0) {
  db.prepare(`
    INSERT INTO colaboradores (condominio_id, nome_razao, tipo, documento)
    VALUES (1, 'Charles - Diarista', 'TERCEIRO', '57.465.162/0001-12')
  `).run();
  console.log('✅ Colaborador Charles - Diarista inserido');
}

// ── 4. Checklist de onboarding ───────────────────────────────────────────────
const jaTemOnboard = db.prepare('SELECT COUNT(*) as c FROM onboarding_checklist WHERE condominio_id = 1').get();
if (jaTemOnboard.c === 0) {
  db.prepare(`
    INSERT INTO onboarding_checklist (condominio_id, convencao_recebida, atas_recebidas, cartao_cnpj_recebido, saldos_recebidos, folha_recebida)
    VALUES (1, 0, 0, 1, 0, 0)
  `).run();
  console.log('✅ Onboarding checklist criada (CNPJ já recebido)');
}

// ── 5. Verificação final ─────────────────────────────────────────────────────
console.log('\n📋 ESTADO FINAL DO BANCO:\n');

const condos       = db.prepare('SELECT * FROM condominios').all();
const contratos    = db.prepare('SELECT * FROM contratos').all();
const colaboradores = db.prepare('SELECT * FROM colaboradores').all();
const esteira      = db.prepare('SELECT * FROM esteira_pasta_mensal').all();
const onboarding   = db.prepare('SELECT * FROM onboarding_checklist').all();

console.log('Condomínios:',   JSON.stringify(condos,        null, 2));
console.log('Contratos:',     JSON.stringify(contratos,     null, 2));
console.log('Colaboradores:', JSON.stringify(colaboradores, null, 2));
console.log('Esteira:',       JSON.stringify(esteira,       null, 2));
console.log('Onboarding:',    JSON.stringify(onboarding,    null, 2));

console.log('\n=======================================================');
console.log('🎉 Preenchimento concluído! Nenhum dado fictício presente.');
console.log('=======================================================\n');

db.close();
