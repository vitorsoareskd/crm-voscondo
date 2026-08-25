import express from 'express';
import cors from 'cors';
import { initDB, getDB } from './src/lib/sqlite';

const app = express();
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Initialize Database
initDB();

// Rota: Listar Condominios
app.get('/api/condominios', (req, res) => {
  try {
    const db = getDB();
    const condominios = db.prepare('SELECT * FROM condominios').all();
    res.json(condominios);
  } catch (error) {
    console.error('Erro ao buscar condominios:', error);
    res.status(500).json({ error: 'Erro interno ao buscar condominios' });
  }
});

// Rota: Listar Contratos
app.get('/api/contratos', (req, res) => {
  try {
    const db = getDB();
    const contratos = db.prepare('SELECT * FROM contratos').all();
    res.json(contratos);
  } catch (error) {
    console.error('Erro ao buscar contratos:', error);
    res.status(500).json({ error: 'Erro interno ao buscar contratos' });
  }
});

// Rota: Listar Compliance Laudos
app.get('/api/compliance_laudos', (req, res) => {
  try {
    const db = getDB();
    // Faz o join para trazer o nome do condominio
    const laudos = db.prepare(`
      SELECT cl.*, c.nome as condominio_nome 
      FROM compliance_laudos cl 
      JOIN condominios c ON cl.condominio_id = c.id
    `).all();
    res.json(laudos);
  } catch (error) {
    console.error('Erro ao buscar compliance_laudos:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Rota: Listar Auditoria Terceirizados
app.get('/api/auditoria_terceirizados', (req, res) => {
  try {
    const db = getDB();
    const auditoria = db.prepare(`
      SELECT at.*, col.nome_razao as colaborador_nome, c.nome as condominio_nome
      FROM auditoria_terceirizados at
      JOIN colaboradores col ON at.colaborador_id = col.id
      JOIN condominios c ON col.condominio_id = c.id
    `).all();
    res.json(auditoria);
  } catch (error) {
    console.error('Erro ao buscar auditoria_terceirizados:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Rota: Atualizar Auditoria Terceirizados (checkboxes)
app.put('/api/auditoria_terceirizados/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { cnd_trabalhista_ok, crf_fgts_ok, comprovantes_pagamento_ok } = req.body;
    const db = getDB();
    db.prepare(`
      UPDATE auditoria_terceirizados 
      SET cnd_trabalhista_ok = ?, crf_fgts_ok = ?, comprovantes_pagamento_ok = ?
      WHERE id = ?
    `).run(cnd_trabalhista_ok ? 1 : 0, crf_fgts_ok ? 1 : 0, comprovantes_pagamento_ok ? 1 : 0, id);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar auditoria:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Rota: Listar Esteira Pasta Mensal
app.get('/api/esteira_pasta_mensal', (req, res) => {
  try {
    const db = getDB();
    const pastas = db.prepare(`
      SELECT e.*, c.nome as condominio_nome 
      FROM esteira_pasta_mensal e 
      JOIN condominios c ON e.condominio_id = c.id
    `).all();
    res.json(pastas);
  } catch (error) {
    console.error('Erro ao buscar esteira_pasta_mensal:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Rota: Atualizar status Esteira Pasta Mensal
app.put('/api/esteira_pasta_mensal/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = getDB();
    db.prepare('UPDATE esteira_pasta_mensal SET status = ? WHERE id = ?').run(status, id);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar pasta mensal:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`- Condomínios: http://localhost:${PORT}/api/condominios`);
  console.log(`- Contratos: http://localhost:${PORT}/api/contratos`);
});
