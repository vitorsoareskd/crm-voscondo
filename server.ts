import express from 'express';
import cors from 'cors';
import { initDB, getDB } from './src/lib/sqlite';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
initDB();

// ─── CONDOMÍNIOS ────────────────────────────────────────────────────────────

app.get('/api/condominios', (req, res) => {
  try {
    const rows = getDB().prepare('SELECT * FROM condominios').all() as any[];
    res.json(rows.map(r => ({
      id: String(r.id),
      nome: r.nome,
      cnpj: r.cnpj || '',
      status: r.status === 'Ativo' ? 'Cliente Fidelizado' : (r.status || 'Interessado'),
      data_inicio_contrato: r.data_inicio_contrato || null,
      unidades: r.unidades || 0,
      endereco: r.endereco || 'Curitiba - PR',
      cidade: r.cidade || 'Curitiba',
      bairro: r.bairro || '',
      rua: r.rua || '',
      sindicoResponsavel: r.sindico_responsavel || 'Não informado',
      emailCondominio: r.email_condominio || '',
      numeroCondominio: r.numero_condominio || '',
      banco: r.banco || '',
      agenciaEConta: r.agencia_e_conta || '',
      senhaBanco: r.senha_banco || '',
      complexidade: r.complexidade || 'Moderado',
      plano: r.plano || 'Vos Essencial',
      fatorAjuste: r.fator_ajuste || 1,
      mensalidadeCalculada: r.mensalidade_calculada || 0,
      horasEstimadasMes: r.horas_estimadas_mes || 0,
      livreCaixa: r.livre_caixa || 0,
      fundoObras: r.fundo_obras || 0,
      fundoPintura: r.fundo_pintura || 0,
      fundoReforma: r.fundo_reforma || 0,
      gastoMedioMensal: r.gasto_medio_mensal || 0,
      rendimentoMedioMensal: r.rendimento_medio_mensal || 0,
      saudeScore: r.saude_score || 5,
      anotacoes: r.anotacoes || '',
      historicoCaixa: r.historico_caixa ? JSON.parse(r.historico_caixa) : [],
      templatesRelatorio: r.templates_relatorio ? JSON.parse(r.templates_relatorio) : undefined,
    })));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post('/api/condominios', (req, res) => {
  try {
    const c = req.body;
    getDB().prepare(`
      INSERT OR REPLACE INTO condominios (
        id, nome, cnpj, status, data_inicio_contrato, unidades, endereco, cidade, bairro, rua,
        sindico_responsavel, email_condominio, numero_condominio, banco, agencia_e_conta, senha_banco,
        complexidade, plano, fator_ajuste, mensalidade_calculada, horas_estimadas_mes,
        livre_caixa, fundo_obras, fundo_pintura, fundo_reforma,
        gasto_medio_mensal, rendimento_medio_mensal, saude_score,
        anotacoes, historico_caixa, templates_relatorio
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      c.id, c.nome, c.cnpj||'', c.status||'Interessado', c.data_inicio_contrato||null,
      c.unidades||0, c.endereco||'', c.cidade||'', c.bairro||'', c.rua||'',
      c.sindicoResponsavel||'', c.emailCondominio||'', c.numeroCondominio||'',
      c.banco||'', c.agenciaEConta||'', c.senhaBanco||'',
      c.complexidade||'Moderado', c.plano||'Vos Essencial',
      c.fatorAjuste||1, c.mensalidadeCalculada||0, c.horasEstimadasMes||0,
      c.livreCaixa||0, c.fundoObras||0, c.fundoPintura||0, c.fundoReforma||0,
      c.gastoMedioMensal||0, c.rendimentoMedioMensal||0, c.saudeScore||5,
      c.anotacoes||'',
      c.historicoCaixa ? JSON.stringify(c.historicoCaixa) : null,
      c.templatesRelatorio ? JSON.stringify(c.templatesRelatorio) : null
    );
    res.json({ success: true, id: c.id });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.put('/api/condominios/:id', (req, res) => {
  try {
    const c = req.body;
    getDB().prepare(`
      UPDATE condominios SET
        nome=?, cnpj=?, status=?, data_inicio_contrato=?, unidades=?, endereco=?,
        cidade=?, bairro=?, rua=?, sindico_responsavel=?, email_condominio=?,
        numero_condominio=?, banco=?, agencia_e_conta=?, senha_banco=?,
        complexidade=?, plano=?, fator_ajuste=?, mensalidade_calculada=?, horas_estimadas_mes=?,
        livre_caixa=?, fundo_obras=?, fundo_pintura=?, fundo_reforma=?,
        gasto_medio_mensal=?, rendimento_medio_mensal=?, saude_score=?,
        anotacoes=?, historico_caixa=?, templates_relatorio=?
      WHERE id=?
    `).run(
      c.nome, c.cnpj||'', c.status||'Interessado', c.data_inicio_contrato||null,
      c.unidades||0, c.endereco||'', c.cidade||'', c.bairro||'', c.rua||'',
      c.sindicoResponsavel||'', c.emailCondominio||'', c.numeroCondominio||'',
      c.banco||'', c.agenciaEConta||'', c.senhaBanco||'',
      c.complexidade||'Moderado', c.plano||'Vos Essencial',
      c.fatorAjuste||1, c.mensalidadeCalculada||0, c.horasEstimadasMes||0,
      c.livreCaixa||0, c.fundoObras||0, c.fundoPintura||0, c.fundoReforma||0,
      c.gastoMedioMensal||0, c.rendimentoMedioMensal||0, c.saudeScore||5,
      c.anotacoes||'',
      c.historicoCaixa ? JSON.stringify(c.historicoCaixa) : null,
      c.templatesRelatorio ? JSON.stringify(c.templatesRelatorio) : null,
      req.params.id
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.delete('/api/condominios/:id', (req, res) => {
  try {
    getDB().prepare('DELETE FROM condominios WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ─── CONTRATOS ──────────────────────────────────────────────────────────────

app.get('/api/contratos', (req, res) => {
  try {
    res.json(getDB().prepare(`
      SELECT ct.*, c.nome as condominio_nome FROM contratos ct
      LEFT JOIN condominios c ON ct.condominio_id = c.id
    `).all());
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post('/api/contratos', (req, res) => {
  try {
    const { condominio_id, valor_honorarios, data_vencimento, meses_vigencia } = req.body;
    const result = getDB().prepare(`
      INSERT INTO contratos (condominio_id, valor_honorarios, data_vencimento, meses_vigencia)
      VALUES (?,?,?,?)
    `).run(condominio_id, valor_honorarios, data_vencimento, meses_vigencia);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.put('/api/contratos/:id', (req, res) => {
  try {
    const { valor_honorarios, data_vencimento, meses_vigencia } = req.body;
    getDB().prepare(`UPDATE contratos SET valor_honorarios=?, data_vencimento=?, meses_vigencia=? WHERE id=?`)
      .run(valor_honorarios, data_vencimento, meses_vigencia, req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.delete('/api/contratos/:id', (req, res) => {
  try {
    getDB().prepare('DELETE FROM contratos WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ─── FORNECEDORES ───────────────────────────────────────────────────────────

app.get('/api/fornecedores', (req, res) => {
  try {
    const rows = getDB().prepare('SELECT * FROM fornecedores').all() as any[];
    res.json(rows.map(r => ({
      id: r.id, nome: r.nome, cnpj: r.cnpj, segmento: r.segmento,
      condominioAtendido: r.condominio_atendido, telefone: r.telefone, email: r.email,
      observacoes: r.observacoes, avaliacaoServico: r.avaliacao_servico,
      avaliacaoCustoBeneficio: r.avaliacao_custo_beneficio,
      condominiosAtendidos: r.condominios_atendidos ? JSON.parse(r.condominios_atendidos) : [],
      servicosFeitos: r.servicos_feitos ? JSON.parse(r.servicos_feitos) : [],
    })));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post('/api/fornecedores', (req, res) => {
  try {
    const f = req.body;
    getDB().prepare(`
      INSERT OR REPLACE INTO fornecedores
        (id, nome, cnpj, condominio_atendido, condominios_atendidos, segmento,
         avaliacao_servico, avaliacao_custo_beneficio, telefone, email, observacoes, servicos_feitos)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(f.id, f.nome, f.cnpj||'', f.condominioAtendido||'',
      f.condominiosAtendidos ? JSON.stringify(f.condominiosAtendidos) : null,
      f.segmento||'', f.avaliacaoServico||3, f.avaliacaoCustoBeneficio||3,
      f.telefone||'', f.email||'', f.observacoes||'',
      f.servicosFeitos ? JSON.stringify(f.servicosFeitos) : null);
    res.json({ success: true, id: f.id });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.put('/api/fornecedores/:id', (req, res) => {
  try {
    const f = req.body;
    getDB().prepare(`
      UPDATE fornecedores SET nome=?, cnpj=?, condominio_atendido=?, condominios_atendidos=?,
        segmento=?, avaliacao_servico=?, avaliacao_custo_beneficio=?, telefone=?, email=?,
        observacoes=?, servicos_feitos=? WHERE id=?
    `).run(f.nome, f.cnpj||'', f.condominioAtendido||'',
      f.condominiosAtendidos ? JSON.stringify(f.condominiosAtendidos) : null,
      f.segmento||'', f.avaliacaoServico||3, f.avaliacaoCustoBeneficio||3,
      f.telefone||'', f.email||'', f.observacoes||'',
      f.servicosFeitos ? JSON.stringify(f.servicosFeitos) : null, req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.delete('/api/fornecedores/:id', (req, res) => {
  try {
    getDB().prepare('DELETE FROM fornecedores WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ─── INADIMPLENTES ──────────────────────────────────────────────────────────

app.get('/api/inadimplentes', (req, res) => {
  try {
    const rows = getDB().prepare('SELECT * FROM inadimplentes').all() as any[];
    res.json(rows.map(r => ({
      id: r.id, condominioId: r.condominio_id, condominioNome: r.condominio_nome,
      unidade: r.unidade, moradorNome: r.morador_nome, valorDevido: r.valor_devido,
      mesesAtraso: r.meses_atraso, statusCobranca: r.status_cobranca, dataUltimoContato: r.data_ultimo_contato,
    })));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post('/api/inadimplentes', (req, res) => {
  try {
    const i = req.body;
    getDB().prepare(`
      INSERT OR REPLACE INTO inadimplentes
        (id, condominio_id, condominio_nome, unidade, morador_nome, valor_devido, meses_atraso, status_cobranca, data_ultimo_contato)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(i.id, i.condominioId||'', i.condominioNome||'', i.unidade||'', i.moradorNome||'',
           i.valorDevido||0, i.mesesAtraso||0, i.statusCobranca||'Amigável', i.dataUltimoContato||'');
    res.json({ success: true, id: i.id });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.put('/api/inadimplentes/:id', (req, res) => {
  try {
    const i = req.body;
    getDB().prepare(`
      UPDATE inadimplentes SET condominio_id=?, condominio_nome=?, unidade=?, morador_nome=?,
        valor_devido=?, meses_atraso=?, status_cobranca=?, data_ultimo_contato=? WHERE id=?
    `).run(i.condominioId||'', i.condominioNome||'', i.unidade||'', i.moradorNome||'',
           i.valorDevido||0, i.mesesAtraso||0, i.statusCobranca||'Amigável', i.dataUltimoContato||'', req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.delete('/api/inadimplentes/:id', (req, res) => {
  try {
    getDB().prepare('DELETE FROM inadimplentes WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ─── TAREFAS GANTT ──────────────────────────────────────────────────────────

app.get('/api/tarefas_gantt', (req, res) => {
  try {
    const rows = getDB().prepare('SELECT * FROM tarefas_gantt').all() as any[];
    res.json(rows.map(r => ({
      id: r.id, condominioId: r.condominio_id, condominioNome: r.condominio_nome,
      titulo: r.titulo, categoria: r.categoria, dataInicio: r.data_inicio,
      dataFim: r.data_fim, progresso: r.progresso, status: r.status, responsavel: r.responsavel,
    })));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post('/api/tarefas_gantt', (req, res) => {
  try {
    const t = req.body;
    getDB().prepare(`
      INSERT OR REPLACE INTO tarefas_gantt (id, condominio_id, condominio_nome, titulo, categoria, data_inicio, data_fim, progresso, status, responsavel)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `).run(t.id, t.condominioId||'', t.condominioNome||'', t.titulo, t.categoria||'Outro',
           t.dataInicio||'', t.dataFim||'', t.progresso||0, t.status||'Planejado', t.responsavel||'');
    res.json({ success: true, id: t.id });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.put('/api/tarefas_gantt/:id', (req, res) => {
  try {
    const t = req.body;
    getDB().prepare(`
      UPDATE tarefas_gantt SET condominio_id=?, condominio_nome=?, titulo=?, categoria=?,
        data_inicio=?, data_fim=?, progresso=?, status=?, responsavel=? WHERE id=?
    `).run(t.condominioId||'', t.condominioNome||'', t.titulo, t.categoria||'Outro',
           t.dataInicio||'', t.dataFim||'', t.progresso||0, t.status||'Planejado',
           t.responsavel||'', req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.delete('/api/tarefas_gantt/:id', (req, res) => {
  try {
    getDB().prepare('DELETE FROM tarefas_gantt WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ─── TAREFAS EQUIPE ─────────────────────────────────────────────────────────

app.get('/api/tarefas_equipe', (req, res) => {
  try {
    const rows = getDB().prepare('SELECT * FROM tarefas_equipe').all() as any[];
    res.json(rows.map(r => ({
      id: r.id, condominioId: r.condominio_id, condominioNome: r.condominio_nome,
      titulo: r.titulo, prioridade: r.prioridade, concluida: !!r.concluida,
      dataLimite: r.data_limite, atribuidoPara: r.atribuido_para, googleTaskId: r.google_task_id,
    })));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post('/api/tarefas_equipe', (req, res) => {
  try {
    const t = req.body;
    getDB().prepare(`
      INSERT OR REPLACE INTO tarefas_equipe (id, condominio_id, condominio_nome, titulo, prioridade, concluida, data_limite, atribuido_para, google_task_id)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(t.id, t.condominioId||'', t.condominioNome||'', t.titulo, t.prioridade||'Média',
           t.concluida ? 1 : 0, t.dataLimite||'', t.atribuidoPara||'', t.googleTaskId||'');
    res.json({ success: true, id: t.id });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.put('/api/tarefas_equipe/:id', (req, res) => {
  try {
    const t = req.body;
    getDB().prepare(`
      UPDATE tarefas_equipe SET condominio_id=?, condominio_nome=?, titulo=?, prioridade=?,
        concluida=?, data_limite=?, atribuido_para=?, google_task_id=? WHERE id=?
    `).run(t.condominioId||'', t.condominioNome||'', t.titulo, t.prioridade||'Média',
           t.concluida ? 1 : 0, t.dataLimite||'', t.atribuidoPara||'', t.googleTaskId||'', req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.delete('/api/tarefas_equipe/:id', (req, res) => {
  try {
    getDB().prepare('DELETE FROM tarefas_equipe WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ─── TRANSAÇÕES EXTRATO ──────────────────────────────────────────────────────

app.get('/api/transacoes_extrato', (req, res) => {
  try {
    const rows = getDB().prepare('SELECT * FROM transacoes_extrato').all() as any[];
    res.json(rows.map(r => ({
      id: r.id, data: r.data, mesReferencia: r.mes_referencia, descricao: r.descricao,
      valor: r.valor, tipo: r.tipo, condominioId: r.condominio_id,
      condominioNome: r.condominio_nome, categoria: r.categoria,
    })));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post('/api/transacoes_extrato', (req, res) => {
  try {
    const t = req.body;
    getDB().prepare(`
      INSERT OR REPLACE INTO transacoes_extrato (id, data, mes_referencia, descricao, valor, tipo, condominio_id, condominio_nome, categoria)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(t.id, t.data||'', t.mesReferencia||'', t.descricao||'', t.valor||0, t.tipo||'saida',
           t.condominioId||'', t.condominioNome||'', t.categoria||'');
    res.json({ success: true, id: t.id });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.put('/api/transacoes_extrato/:id', (req, res) => {
  try {
    const t = req.body;
    getDB().prepare(`
      UPDATE transacoes_extrato SET data=?, mes_referencia=?, descricao=?, valor=?, tipo=?,
        condominio_id=?, condominio_nome=?, categoria=? WHERE id=?
    `).run(t.data||'', t.mesReferencia||'', t.descricao||'', t.valor||0, t.tipo||'saida',
           t.condominioId||'', t.condominioNome||'', t.categoria||'', req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.delete('/api/transacoes_extrato/:id', (req, res) => {
  try {
    getDB().prepare('DELETE FROM transacoes_extrato WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ─── PROJEÇÃO ITEMS ──────────────────────────────────────────────────────────

app.get('/api/projecao_items', (req, res) => {
  try {
    const rows = getDB().prepare('SELECT * FROM projecao_items').all() as any[];
    res.json(rows.map(r => ({
      id: r.id, descricao: r.descricao, valor: r.valor, tipo: r.tipo, categoria: r.categoria,
      condominioNome: r.condominio_nome, probabilidade: r.probabilidade,
      horizonteTempo: r.horizonte_tempo, isImposto: !!r.is_imposto,
    })));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post('/api/projecao_items', (req, res) => {
  try {
    const p = req.body;
    getDB().prepare(`
      INSERT OR REPLACE INTO projecao_items (id, descricao, valor, tipo, categoria, condominio_nome, probabilidade, horizonte_tempo, is_imposto)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(p.id, p.descricao, p.valor||0, p.tipo||'despesa', p.categoria||'',
           p.condominioNome||'', p.probabilidade||'Estimado', p.horizonteTempo||'', p.isImposto ? 1 : 0);
    res.json({ success: true, id: p.id });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.put('/api/projecao_items/:id', (req, res) => {
  try {
    const p = req.body;
    getDB().prepare(`
      UPDATE projecao_items SET descricao=?, valor=?, tipo=?, categoria=?, condominio_nome=?,
        probabilidade=?, horizonte_tempo=?, is_imposto=? WHERE id=?
    `).run(p.descricao, p.valor||0, p.tipo||'despesa', p.categoria||'', p.condominioNome||'',
           p.probabilidade||'Estimado', p.horizonteTempo||'', p.isImposto ? 1 : 0, req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.delete('/api/projecao_items/:id', (req, res) => {
  try {
    getDB().prepare('DELETE FROM projecao_items WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ─── PORQUINHOS ──────────────────────────────────────────────────────────────

app.get('/api/porquinhos', (req, res) => {
  try {
    const rows = getDB().prepare('SELECT * FROM porquinhos').all() as any[];
    res.json(rows.map(r => ({
      id: r.id, nome: r.nome, descricao: r.descricao,
      saldoAtual: r.saldo_atual, metaAnual: r.meta_anual, cor: r.cor,
    })));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post('/api/porquinhos', (req, res) => {
  try {
    const p = req.body;
    getDB().prepare(`
      INSERT OR REPLACE INTO porquinhos (id, nome, descricao, saldo_atual, meta_anual, cor)
      VALUES (?,?,?,?,?,?)
    `).run(p.id, p.nome, p.descricao||'', p.saldoAtual||0, p.metaAnual||null, p.cor||'#10b981');
    res.json({ success: true, id: p.id });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.put('/api/porquinhos/:id', (req, res) => {
  try {
    const p = req.body;
    getDB().prepare(`UPDATE porquinhos SET nome=?, descricao=?, saldo_atual=?, meta_anual=?, cor=? WHERE id=?`)
      .run(p.nome, p.descricao||'', p.saldoAtual||0, p.metaAnual||null, p.cor||'#10b981', req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.delete('/api/porquinhos/:id', (req, res) => {
  try {
    getDB().prepare('DELETE FROM porquinhos WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ─── LEADS PRÉ-FUNIL ─────────────────────────────────────────────────────────

app.get('/api/leads_pre_funil', (req, res) => {
  try {
    const rows = getDB().prepare('SELECT * FROM leads_pre_funil').all() as any[];
    res.json(rows.map(r => ({
      id: r.id, cnpj: r.cnpj, nome: r.nome, cidade: r.cidade, bairro: r.bairro,
      rua: r.rua, unidades: r.unidades, telefone: r.telefone, email: r.email,
      contato: r.contato, dataCadastro: r.data_cadastro, observacoes: r.observacoes,
    })));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post('/api/leads_pre_funil', (req, res) => {
  try {
    const l = req.body;
    getDB().prepare(`
      INSERT OR REPLACE INTO leads_pre_funil (id, cnpj, nome, cidade, bairro, rua, unidades, telefone, email, contato, data_cadastro, observacoes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(l.id, l.cnpj||'', l.nome, l.cidade||'', l.bairro||'', l.rua||'',
           l.unidades||0, l.telefone||'', l.email||'', l.contato||'',
           l.dataCadastro||new Date().toISOString(), l.observacoes||'');
    res.json({ success: true, id: l.id });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.delete('/api/leads_pre_funil/:id', (req, res) => {
  try {
    getDB().prepare('DELETE FROM leads_pre_funil WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ─── COMPLIANCE & ERP (existentes) ───────────────────────────────────────────

app.get('/api/compliance_laudos', (req, res) => {
  try {
    res.json(getDB().prepare(`
      SELECT cl.*, c.nome as condominio_nome FROM compliance_laudos cl
      LEFT JOIN condominios c ON cl.condominio_id = c.id
    `).all());
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.get('/api/auditoria_terceirizados', (req, res) => {
  try {
    res.json(getDB().prepare(`
      SELECT at.*, col.nome_razao as colaborador_nome, c.nome as condominio_nome
      FROM auditoria_terceirizados at
      JOIN colaboradores col ON at.colaborador_id = col.id
      JOIN condominios c ON col.condominio_id = c.id
    `).all());
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.put('/api/auditoria_terceirizados/:id', (req, res) => {
  try {
    const { cnd_trabalhista_ok, crf_fgts_ok, comprovantes_pagamento_ok } = req.body;
    getDB().prepare(`UPDATE auditoria_terceirizados SET cnd_trabalhista_ok=?, crf_fgts_ok=?, comprovantes_pagamento_ok=? WHERE id=?`)
      .run(cnd_trabalhista_ok ? 1 : 0, crf_fgts_ok ? 1 : 0, comprovantes_pagamento_ok ? 1 : 0, req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.get('/api/esteira_pasta_mensal', (req, res) => {
  try {
    res.json(getDB().prepare(`
      SELECT e.*, c.nome as condominio_nome FROM esteira_pasta_mensal e
      LEFT JOIN condominios c ON e.condominio_id = c.id
    `).all());
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.put('/api/esteira_pasta_mensal/:id', (req, res) => {
  try {
    getDB().prepare('UPDATE esteira_pasta_mensal SET status=? WHERE id=?').run(req.body.status, req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ─── BANCO DE ORÇAMENTOS E RELATÓRIOS SALVOS ──────────────────────────────────

app.get('/api/relatorios_orcamento', (req, res) => {
  try {
    const rows = getDB().prepare('SELECT * FROM relatorios_orcamento ORDER BY timestamp DESC').all() as any[];
    res.json(rows.map(r => {
      if (r.dados_completos) {
        try {
          return JSON.parse(r.dados_completos);
        } catch { /* fallback */ }
      }
      return {
        id: r.id,
        titulo: r.titulo,
        dataSalvamento: r.data_salvamento,
        timestamp: r.timestamp,
        condominioId: r.condominio_id,
        nomeCondominio: r.nome_condominio,
        mesReferencia: r.mes_referencia,
        numeroUnidades: r.numero_unidades,
        vencimentoBoleto: r.vencimento_boleto,
        totalGeral: r.total_geral,
        totalOrdinarias: r.total_ordinarias,
        totalFundoReserva: r.total_fundo_reserva,
        totalExtraordinarias: r.total_extraordinarias,
        totalFundoPintura: r.total_fundo_pintura,
        totalFundoObras: r.total_fundo_obras,
        totalAgua: r.total_agua,
        observacoes: r.observacoes,
      };
    }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post('/api/relatorios_orcamento', (req, res) => {
  try {
    const r = req.body;
    getDB().prepare(`
      INSERT OR REPLACE INTO relatorios_orcamento (
        id, titulo, data_salvamento, timestamp, condominio_id, nome_condominio,
        mes_referencia, numero_unidades, vencimento_boleto, total_geral,
        total_ordinarias, total_fundo_reserva, total_extraordinarias,
        total_fundo_pintura, total_fundo_obras, total_agua, observacoes, dados_completos
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      r.id, r.titulo, r.dataSalvamento, r.timestamp || Date.now(), r.condominioId, r.nomeCondominio,
      r.mesReferencia, r.numeroUnidades, r.vencimentoBoleto, r.totalGeral,
      r.totalOrdinarias, r.totalFundoReserva, r.totalExtraordinarias,
      r.totalFundoPintura, r.totalFundoObras, r.totalAgua, r.observacoes || '',
      JSON.stringify(r)
    );
    res.json({ success: true, item: r });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.delete('/api/relatorios_orcamento/:id', (req, res) => {
  try {
    getDB().prepare('DELETE FROM relatorios_orcamento WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ─── START ──────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 Servidor VOS rodando na porta ${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api/condominios`);
});
