import { Complexidade, Plano } from '../types';

export function calcularTaxaPorUnidade(unidades: number): number {
  if (unidades <= 16) return 17.00;
  if (unidades <= 24) return 16.00;
  if (unidades <= 42) return 15.00;
  if (unidades <= 64) return 14.00;
  if (unidades <= 128) return 13.00;
  return 12.00;
}

export function calcularTaxaComplexidade(complexidade: Complexidade): number {
  switch (complexidade) {
    case 'Tranquilo': return 50.00;
    case 'Moderado': return 150.00;
    case 'Difícil': return 250.00;
    default: return 50.00;
  }
}

export function obterMultiplicadorPlano(plano: Plano): number {
  switch (plano) {
    case 'Vos Essencial': return 1.05;
    case 'Vos Pulse': return 1.25;
    case 'Vos 360': return 1.35;
    case 'Vos Starter': return 1.0;
    default: return 1.05;
  }
}

export interface DetalhesCalculo {
  taxaPorUnidade: number;
  passoA: number;
  taxaComplexidade: number;
  passoB: number;
  multiplicadorPlano: number;
  subtotalPlano: number;
  fatorAjuste: number;
  valorFinal: number;
}

export function calcularMensalidade(
  unidades: number,
  complexidade: Complexidade,
  plano: Plano,
  fatorAjuste: number = 1.0
): DetalhesCalculo {
  const safeUnidades = Math.max(1, unidades || 1);
  const safeFator = fatorAjuste > 0 ? fatorAjuste : 1.0;

  if (plano === 'Vos Starter') {
    const valorBase = 129.90;
    const valorFinal = valorBase * safeFator;
    return {
      taxaPorUnidade: 0,
      passoA: 0,
      taxaComplexidade: 0,
      passoB: valorBase,
      multiplicadorPlano: 1.0,
      subtotalPlano: valorBase,
      fatorAjuste: safeFator,
      valorFinal: Number(valorFinal.toFixed(2))
    };
  }

  const taxaPorUnidade = calcularTaxaPorUnidade(safeUnidades);
  const passoA = safeUnidades * taxaPorUnidade;
  const taxaComplexidade = calcularTaxaComplexidade(complexidade);
  const passoB = passoA + taxaComplexidade;
  const multiplicadorPlano = obterMultiplicadorPlano(plano);
  const subtotalPlano = passoB * multiplicadorPlano;
  const valorFinal = subtotalPlano * safeFator;

  return {
    taxaPorUnidade,
    passoA: Number(passoA.toFixed(2)),
    taxaComplexidade,
    passoB: Number(passoB.toFixed(2)),
    multiplicadorPlano,
    subtotalPlano: Number(subtotalPlano.toFixed(2)),
    fatorAjuste: safeFator,
    valorFinal: Number(valorFinal.toFixed(2))
  };
}

export interface DetalhesSaude {
  saldoTotal: number;
  ratio: number;
  score: number; // 1 a 10
  status: 'Alerta Vermelho' | 'Atenção' | 'Saudável' | 'Excelente';
  cor: string;
  mensagem: string;
}

export function calcularSaudeCondominio(
  livreCaixa: number,
  fundoObras: number,
  fundoPintura: number,
  fundoReforma: number,
  gastoMedioMensal: number
): DetalhesSaude {
  const saldoTotal = (livreCaixa || 0) + (fundoObras || 0) + (fundoPintura || 0) + (fundoReforma || 0);
  const gasto = gastoMedioMensal > 0 ? gastoMedioMensal : 1;
  const ratio = saldoTotal / gasto;

  let score = 1;
  if (ratio <= 1.5) {
    score = 1;
  } else if (ratio >= 15.0) {
    score = 10;
  } else {
    // Interpolação entre 1.5x (score 1) e 15.0x (score 10)
    score = 1 + Math.round(((ratio - 1.5) / (15.0 - 1.5)) * 9);
  }
  score = Math.min(10, Math.max(1, score));

  let status: DetalhesSaude['status'] = 'Alerta Vermelho';
  let cor = '#dc2626'; // Red
  let mensagem = 'Saldo total crítico (apenas 1.5x do gasto mensal). Risco de insolvência!';

  if (score >= 9) {
    status = 'Excelente';
    cor = '#2d5a32'; // Moss Green
    mensagem = `Excelente reserva financeira (${ratio.toFixed(1)}x o gasto mensal). Caixa muito bem estruturado!`;
  } else if (score >= 7) {
    status = 'Saudável';
    cor = '#16a34a'; // Green
    mensagem = `Caixa saudável (${ratio.toFixed(1)}x o gasto mensal). Reservas adequadas para operar.`;
  } else if (score >= 4) {
    status = 'Atenção';
    cor = '#d97706'; // Amber/Orange
    mensagem = `Atenção moderada (${ratio.toFixed(1)}x o gasto mensal). Recomenda-se recompor o fundo de reserva.`;
  }

  return {
    saldoTotal: Number(saldoTotal.toFixed(2)),
    ratio: Number(ratio.toFixed(2)),
    score,
    status,
    cor,
    mensagem
  };
}

export function calcularNotaFundo(saldoAtual: number, meta: number): number {
  if (!meta || meta <= 0) {
    if (saldoAtual <= 0) return 1;
    if (saldoAtual < 5000) return 3;
    return 4;
  }
  const ratio = saldoAtual / meta;
  if (ratio >= 1.0) return 5;
  if (ratio >= 0.75) return 4;
  if (ratio >= 0.50) return 3;
  if (ratio >= 0.25) return 2;
  return 1;
}

export function obterMetaItemCaixa(
  tipo: 'livreCaixa' | 'fundoObras' | 'fundoPintura' | 'fundoReforma',
  gastoMedioMensal: number,
  metaCustom?: number
): { metaValor: number; descMeta: string } {
  const gasto = gastoMedioMensal || 0;
  switch (tipo) {
    case 'livreCaixa':
      return metaCustom && metaCustom > 0
        ? { metaValor: metaCustom, descMeta: `Meta Opcional: ${formatarMoeda(metaCustom)}` }
        : { metaValor: 2 * gasto, descMeta: `Meta: 2x Gasto (${formatarMoeda(2 * gasto)})` };
    case 'fundoObras':
      return metaCustom && metaCustom > 0
        ? { metaValor: metaCustom, descMeta: `Meta Opcional: ${formatarMoeda(metaCustom)}` }
        : { metaValor: 4 * gasto, descMeta: `Meta: 4x Gasto (${formatarMoeda(4 * gasto)})` };
    case 'fundoPintura':
      return metaCustom && metaCustom > 0
        ? { metaValor: metaCustom, descMeta: `Meta Definida: ${formatarMoeda(metaCustom)}` }
        : { metaValor: 0, descMeta: 'Meta: Em aberto' };
    case 'fundoReforma':
      return { metaValor: 4 * gasto, descMeta: `Meta: 4x Gasto (${formatarMoeda(4 * gasto)})` };
    default:
      return { metaValor: 0, descMeta: 'Sem Meta' };
  }
}

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor || 0);
}
