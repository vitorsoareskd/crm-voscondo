/**
 * api.ts — Camada de serviço centralizada para chamadas à API REST (SQLite backend).
 * Todas as operações CRUD passam por aqui, garantindo persistência permanente.
 */

const BASE = '/api';

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── CONDOMÍNIOS ─────────────────────────────────────────────────────────────

export const apiGetCondominios = () => req<any[]>('GET', '/condominios');
export const apiSaveCondominio = (c: any) => req('POST', '/condominios', c);
export const apiUpdateCondominio = (id: string, c: any) => req('PUT', `/condominios/${id}`, c);
export const apiDeleteCondominio = (id: string) => req('DELETE', `/condominios/${id}`);

// ─── FORNECEDORES ────────────────────────────────────────────────────────────

export const apiGetFornecedores = () => req<any[]>('GET', '/fornecedores');
export const apiSaveFornecedor = (f: any) => req('POST', '/fornecedores', f);
export const apiUpdateFornecedor = (id: string, f: any) => req('PUT', `/fornecedores/${id}`, f);
export const apiDeleteFornecedor = (id: string) => req('DELETE', `/fornecedores/${id}`);

// ─── INADIMPLENTES ───────────────────────────────────────────────────────────

export const apiGetInadimplentes = () => req<any[]>('GET', '/inadimplentes');
export const apiSaveInadimplente = (i: any) => req('POST', '/inadimplentes', i);
export const apiUpdateInadimplente = (id: string, i: any) => req('PUT', `/inadimplentes/${id}`, i);
export const apiDeleteInadimplente = (id: string) => req('DELETE', `/inadimplentes/${id}`);

// ─── TAREFAS GANTT ───────────────────────────────────────────────────────────

export const apiGetTarefasGantt = () => req<any[]>('GET', '/tarefas_gantt');
export const apiSaveTarefaGantt = (t: any) => req('POST', '/tarefas_gantt', t);
export const apiUpdateTarefaGantt = (id: string, t: any) => req('PUT', `/tarefas_gantt/${id}`, t);
export const apiDeleteTarefaGantt = (id: string) => req('DELETE', `/tarefas_gantt/${id}`);

// ─── TAREFAS EQUIPE ──────────────────────────────────────────────────────────

export const apiGetTarefasEquipe = () => req<any[]>('GET', '/tarefas_equipe');
export const apiSaveTarefaEquipe = (t: any) => req('POST', '/tarefas_equipe', t);
export const apiUpdateTarefaEquipe = (id: string, t: any) => req('PUT', `/tarefas_equipe/${id}`, t);
export const apiDeleteTarefaEquipe = (id: string) => req('DELETE', `/tarefas_equipe/${id}`);

// ─── TRANSAÇÕES EXTRATO ──────────────────────────────────────────────────────

export const apiGetTransacoes = () => req<any[]>('GET', '/transacoes_extrato');
export const apiSaveTransacao = (t: any) => req('POST', '/transacoes_extrato', t);
export const apiUpdateTransacao = (id: string, t: any) => req('PUT', `/transacoes_extrato/${id}`, t);
export const apiDeleteTransacao = (id: string) => req('DELETE', `/transacoes_extrato/${id}`);

// ─── PROJEÇÃO ITEMS ──────────────────────────────────────────────────────────

export const apiGetProjecaoItems = () => req<any[]>('GET', '/projecao_items');
export const apiSaveProjecaoItem = (p: any) => req('POST', '/projecao_items', p);
export const apiUpdateProjecaoItem = (id: string, p: any) => req('PUT', `/projecao_items/${id}`, p);
export const apiDeleteProjecaoItem = (id: string) => req('DELETE', `/projecao_items/${id}`);

// ─── PORQUINHOS ──────────────────────────────────────────────────────────────

export const apiGetPorquinhos = () => req<any[]>('GET', '/porquinhos');
export const apiSavePorquinho = (p: any) => req('POST', '/porquinhos', p);
export const apiUpdatePorquinho = (id: string, p: any) => req('PUT', `/porquinhos/${id}`, p);
export const apiDeletePorquinho = (id: string) => req('DELETE', `/porquinhos/${id}`);

// ─── LEADS PRÉ-FUNIL ─────────────────────────────────────────────────────────

export const apiGetLeadsPreFunil = () => req<any[]>('GET', '/leads_pre_funil');
export const apiSaveLeadPreFunil = (l: any) => req('POST', '/leads_pre_funil', l);
export const apiDeleteLeadPreFunil = (id: string) => req('DELETE', `/leads_pre_funil/${id}`);

// ─── RELATÓRIOS E ORÇAMENTOS SALVOS ──────────────────────────────────────────

export const apiGetRelatoriosOrcamento = () => req<any[]>('GET', '/relatorios_orcamento');
export const apiSaveRelatorioOrcamento = (r: any) => req('POST', '/relatorios_orcamento', r);
export const apiDeleteRelatorioOrcamento = (id: string) => req('DELETE', `/relatorios_orcamento/${id}`);
