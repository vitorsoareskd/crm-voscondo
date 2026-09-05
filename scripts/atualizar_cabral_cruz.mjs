import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.resolve(process.cwd(), 'database.sqlite'));

db.prepare(`
  UPDATE condominios 
  SET 
    status = 'Cliente Fidelizado',
    sindico_responsavel = COALESCE(sindico_responsavel, 'Síndico Responsável'),
    endereco = COALESCE(endereco, 'Curitiba - PR'),
    cidade = COALESCE(cidade, 'Curitiba'),
    complexidade = COALESCE(complexidade, 'Moderado'),
    plano = COALESCE(plano, 'Vos Essencial'),
    mensalidade_calculada = CASE WHEN mensalidade_calculada = 0 THEN 1850 ELSE mensalidade_calculada END,
    unidades = CASE WHEN unidades = 0 THEN 24 ELSE unidades END,
    livre_caixa = CASE WHEN livre_caixa = 0 THEN 5000 ELSE livre_caixa END
  WHERE nome LIKE '%Cabral Cruz%' OR id = '1'
`).run();

console.log('Condomínios atualizados:', db.prepare('SELECT * FROM condominios').all());
