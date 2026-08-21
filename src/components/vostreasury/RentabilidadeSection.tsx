import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TransacaoExtrato, Condominio } from '../../types';
import { formatarMoeda } from '../../utils/pricingEngine';
import {
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  FileText,
  Percent,
  CheckCircle2,
  Info,
  Printer,
  Download,
  Sparkles,
  Users,
  Home
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ComposedChart,
  Line
} from 'recharts';

interface RentabilidadeSectionProps {
  transacoes: TransacaoExtrato[];
  condominios: Condominio[];
}

export const RentabilidadeSection: React.FC<RentabilidadeSectionProps> = ({
  transacoes = [],
  condominios = []
}) => {
  // Extract all unique years from transaction dates or mesReferencia
  const anosDisponiveis = useMemo(() => {
    const setAnos = new Set<string>();
    transacoes.forEach((t) => {
      if (t.data) {
        const y = t.data.split('-')[0];
        if (y && y.length === 4 && !isNaN(Number(y))) setAnos.add(y);
      }
      if (t.mesReferencia) {
        const parts = t.mesReferencia.split('/');
        if (parts[1] && parts[1].length === 4 && !isNaN(Number(parts[1]))) {
          setAnos.add(parts[1]);
        }
      }
    });
    // Ensure base years are available
    setAnos.add('2026');
    setAnos.add('2025');
    setAnos.add('2024');
    return Array.from(setAnos).sort((a, b) => b.localeCompare(a));
  }, [transacoes]);

  // Selected Year Reference state
  const [anoReferencia, setAnoReferencia] = useState<string>('2026');

  // Selected Months state (1 = Jan, 12 = Dez)
  const [mesesSelecionados, setMesesSelecionados] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

  const LISTA_MESES = [
    { num: 1, sigla: 'Jan', nome: 'Janeiro' },
    { num: 2, sigla: 'Fev', nome: 'Fevereiro' },
    { num: 3, sigla: 'Mar', nome: 'Março' },
    { num: 4, sigla: 'Abr', nome: 'Abril' },
    { num: 5, sigla: 'Mai', nome: 'Maio' },
    { num: 6, sigla: 'Jun', nome: 'Junho' },
    { num: 7, sigla: 'Jul', nome: 'Julho' },
    { num: 8, sigla: 'Ago', nome: 'Agosto' },
    { num: 9, sigla: 'Set', nome: 'Setembro' },
    { num: 10, sigla: 'Out', nome: 'Outubro' },
    { num: 11, sigla: 'Nov', nome: 'Novembro' },
    { num: 12, sigla: 'Dez', nome: 'Dezembro' }
  ];

  const getMonthFromTransaction = (t: TransacaoExtrato): number | null => {
    if (t.data) {
      const parts = t.data.split('-');
      if (parts.length >= 2) {
        const monthNum = parseInt(parts[1], 10);
        if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
          return monthNum;
        }
      }
    }
    if (t.mesReferencia) {
      const lower = t.mesReferencia.toLowerCase();
      if (lower.includes('janeiro') || lower.includes('jan')) return 1;
      if (lower.includes('fevereiro') || lower.includes('fev')) return 2;
      if (lower.includes('março') || lower.includes('marco') || lower.includes('mar')) return 3;
      if (lower.includes('abril') || lower.includes('abr')) return 4;
      if (lower.includes('maio') || lower.includes('mai')) return 5;
      if (lower.includes('junho') || lower.includes('jun')) return 6;
      if (lower.includes('julho') || lower.includes('jul')) return 7;
      if (lower.includes('agosto') || lower.includes('ago')) return 8;
      if (lower.includes('setembro') || lower.includes('set')) return 9;
      if (lower.includes('outubro') || lower.includes('out')) return 10;
      if (lower.includes('novembro') || lower.includes('nov')) return 11;
      if (lower.includes('dezembro') || lower.includes('dez')) return 12;
    }
    return null;
  };

  const isMesSelecionado = (mesNum: number) => mesesSelecionados.includes(mesNum);

  const toggleMes = (mesNum: number) => {
    setMesesSelecionados((prev) => {
      if (prev.includes(mesNum)) {
        if (prev.length === 1) return prev; // Mantém pelo menos um mês
        return prev.filter((m) => m !== mesNum).sort((a, b) => a - b);
      } else {
        return [...prev, mesNum].sort((a, b) => a - b);
      }
    });
  };

  const selecionarTodosMeses = () => setMesesSelecionados([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const selecionarPrimeiroSemestre = () => setMesesSelecionados([1, 2, 3, 4, 5, 6]);
  const selecionarSegundoSemestre = () => setMesesSelecionados([7, 8, 9, 10, 11, 12]);
  const selecionarTrimestre = (q: number) => {
    const start = (q - 1) * 3 + 1;
    setMesesSelecionados([start, start + 1, start + 2]);
  };

  const textoPeriodo = useMemo(() => {
    if (mesesSelecionados.length === 12) return 'Ano Todo (Jan a Dez)';
    if (mesesSelecionados.length === 1) {
      const m = LISTA_MESES.find((lm) => lm.num === mesesSelecionados[0]);
      return m ? m.nome : '1 mês';
    }
    const ordenados = [...mesesSelecionados].sort((a, b) => a - b);
    if (ordenados.length === 6 && ordenados[0] === 1 && ordenados[5] === 6) return '1º Semestre (Jan - Jun)';
    if (ordenados.length === 6 && ordenados[0] === 7 && ordenados[5] === 12) return '2º Semestre (Jul - Dez)';
    if (ordenados.length === 3 && ordenados[0] === 1 && ordenados[2] === 3) return '1º Trimestre (Jan - Mar)';
    if (ordenados.length === 3 && ordenados[0] === 4 && ordenados[2] === 6) return '2º Trimestre (Abr - Jun)';
    if (ordenados.length === 3 && ordenados[0] === 7 && ordenados[2] === 9) return '3º Trimestre (Jul - Set)';
    if (ordenados.length === 3 && ordenados[0] === 10 && ordenados[2] === 12) return '4º Trimestre (Out - Dez)';

    const siglas = ordenados.map((n) => LISTA_MESES.find((lm) => lm.num === n)?.sigla).join(', ');
    return `${ordenados.length} meses (${siglas})`;
  }, [mesesSelecionados]);

  // Calculation of Condominiums and Units from Cadastro & Operação / Perfil de Clientes
  const totalCondominiosAtendidos = condominios.length;
  const totalApartamentosAtendidos = useMemo(() => {
    return condominios.reduce((acc, c) => acc + (c.unidades || 0), 0);
  }, [condominios]);

  // Filter transactions for the selected year AND selected months
  const transacoesAno = useMemo(() => {
    return transacoes.filter((t) => {
      const matchesData = t.data && t.data.startsWith(anoReferencia);
      const matchesMesRef = t.mesReferencia && t.mesReferencia.includes(anoReferencia);
      if (!matchesData && !matchesMesRef) return false;

      // Filter by selected months
      if (mesesSelecionados.length === 12) return true;
      const mNum = getMonthFromTransaction(t);
      if (mNum === null) return true;
      return mesesSelecionados.includes(mNum);
    });
  }, [transacoes, anoReferencia, mesesSelecionados]);

  // KPI calculations based strictly on Extrato Financeiro data for anoReferencia
  const receitaTotalAno = useMemo(() => {
    return transacoesAno
      .filter((t) => t.tipo === 'entrada')
      .reduce((acc, t) => acc + (t.valor || 0), 0);
  }, [transacoesAno]);

  const despesaTotalAno = useMemo(() => {
    return transacoesAno
      .filter((t) => t.tipo === 'saida')
      .reduce((acc, t) => acc + (t.valor || 0), 0);
  }, [transacoesAno]);

  const lucroLiquidoAno = receitaTotalAno - despesaTotalAno;
  const margemLucroAno = receitaTotalAno > 0 ? (lucroLiquidoAno / receitaTotalAno) * 100 : 0;
  const mediaMensalReceita = receitaTotalAno / 12;

  // Monthly Breakdown Data (Jan to Dec) for anoReferencia
  const dataEvolucaoMensal = useMemo(() => {
    const meses = [
      { nome: 'Jan', num: '01', pt: 'Janeiro' },
      { nome: 'Fev', num: '02', pt: 'Fevereiro' },
      { nome: 'Mar', num: '03', pt: 'Março' },
      { nome: 'Abr', num: '04', pt: 'Abril' },
      { nome: 'Mai', num: '05', pt: 'Maio' },
      { nome: 'Jun', num: '06', pt: 'Junho' },
      { nome: 'Jul', num: '07', pt: 'Julho' },
      { nome: 'Ago', num: '08', pt: 'Agosto' },
      { nome: 'Set', num: '09', pt: 'Setembro' },
      { nome: 'Out', num: '10', pt: 'Outubro' },
      { nome: 'Nov', num: '11', pt: 'Novembro' },
      { nome: 'Dez', num: '12', pt: 'Dezembro' }
    ];

    return meses.map((m) => {
      const transMes = transacoesAno.filter((t) => {
        if (t.data) {
          const parts = t.data.split('-');
          if (parts[0] === anoReferencia && parts[1] === m.num) return true;
        }
        if (t.mesReferencia) {
          return t.mesReferencia.toLowerCase().startsWith(m.pt.toLowerCase());
        }
        return false;
      });

      const receita = transMes
        .filter((t) => t.tipo === 'entrada')
        .reduce((acc, t) => acc + t.valor, 0);

      const despesa = transMes
        .filter((t) => t.tipo === 'saida')
        .reduce((acc, t) => acc + t.valor, 0);

      const resultado = receita - despesa;

      return {
        mes: m.nome,
        mesCompleto: `${m.pt}/${anoReferencia}`,
        Receita: receita,
        Despesa: despesa,
        Lucro: resultado
      };
    });
  }, [transacoesAno, anoReferencia]);

  // Distribution Pie Chart: Receita por Categoria (no Extrato Financeiro)
  const dataPieCategoria = useMemo(() => {
    const catMap: Record<string, number> = {};
    transacoesAno
      .filter((t) => t.tipo === 'entrada')
      .forEach((t) => {
        const cat = t.categoria || 'Geral';
        catMap[cat] = (catMap[cat] || 0) + t.valor;
      });

    const getCategoryColor = (catName: string, index: number) => {
      const norm = catName.trim().toLowerCase();
      if (norm.includes('laudos') || norm.includes('engenharia')) return '#18181b'; // Preta / Black
      if (norm.includes('serviços extras') || norm.includes('servicos extras')) return '#78350f'; // Marrom / Brown
      if (norm.includes('honorários') || norm.includes('honorarios') || norm.includes('gestão') || norm.includes('gestao')) return '#2d5a32';
      if (norm.includes('dividendos')) return '#312e81';
      if (norm.includes('sistemas') || norm.includes('ti')) return '#0284c7';
      if (norm.includes('impostos')) return '#dc2626';

      const fallbackColors = ['#15803d', '#0f766e', '#0369a1', '#6b21a8', '#b91c1c', '#334155'];
      return fallbackColors[index % fallbackColors.length];
    };

    const keys = Object.keys(catMap);

    if (keys.length === 0) {
      return [{ name: 'Sem lançamentos no ano', value: 1, color: '#cbd5e1' }];
    }

    return keys.map((cat, idx) => ({
      name: cat,
      value: catMap[cat],
      color: getCategoryColor(cat, idx)
    }));
  }, [transacoesAno]);

  // Revenue by Condominium Bar Chart
  const dataBarCondominios = useMemo(() => {
    const condoMap: Record<string, number> = {};
    transacoesAno
      .filter((t) => t.tipo === 'entrada')
      .forEach((t) => {
        const nome = t.condominioNome || 'Outros / VOS';
        condoMap[nome] = (condoMap[nome] || 0) + t.valor;
      });

    const keys = Object.keys(condoMap);
    if (keys.length === 0) {
      return [{ nome: 'Sem Entradas', faturamento: 0 }];
    }

    return keys.map((key) => {
      const shortName = key.replace('Residencial ', '').replace('Edifício ', '').replace('Condomínio ', '');
      return {
        nome: shortName,
        nomeCompleto: key,
        faturamento: condoMap[key]
      };
    });
  }, [transacoesAno]);

  // DRE Categories breakdown
  const dreCategoriasReceita = useMemo(() => {
    const map: Record<string, number> = {};
    transacoesAno
      .filter((t) => t.tipo === 'entrada')
      .forEach((t) => {
        const cat = t.categoria || 'Outras Receitas';
        map[cat] = (map[cat] || 0) + t.valor;
      });
    return map;
  }, [transacoesAno]);

  const dreCategoriasDespesa = useMemo(() => {
    const map: Record<string, number> = {};
    transacoesAno
      .filter((t) => t.tipo === 'saida')
      .forEach((t) => {
        const cat = t.categoria || 'Outras Despesas';
        map[cat] = (map[cat] || 0) + t.valor;
      });
    return map;
  }, [transacoesAno]);

  const gerarPDFDRE = (acao: 'download' | 'imprimir') => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Header Banner
      doc.setFillColor(18, 34, 21); // Dark VOS Green
      doc.rect(0, 0, 210, 32, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text('VOS TREASURY MANAGEMENT', 14, 14);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`DEMONSTRATIVO DO RESULTADO DO EXERCÍCIO (DRE - ${anoReferencia})`, 14, 21);

      doc.setFontSize(8);
      doc.setTextColor(200, 230, 205);
      doc.text(`Período Selecionado: ${textoPeriodo}  |  Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 27);

      // Summary Cards Box
      doc.setFillColor(248, 250, 246);
      doc.setDrawColor(220, 230, 220);
      doc.roundedRect(14, 37, 182, 22, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(45, 90, 50);

      doc.text(`RESUMO EXECUTIVO DO EXERCÍCIO (${textoPeriodo}):`, 18, 44);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      doc.text(`(+) Receita Bruta: ${formatarMoeda(receitaTotalAno)}`, 18, 52);
      doc.text(`(-) Despesas Operacionais: -${formatarMoeda(despesaTotalAno)}`, 80, 52);

      doc.setFont('helvetica', 'bold');
      const isPos = lucroLiquidoAno >= 0;
      doc.setTextColor(isPos ? 30 : 180, isPos ? 120 : 30, isPos ? 35 : 30);
      doc.text(`(=) Lucro Líquido: ${formatarMoeda(lucroLiquidoAno)} (${margemLucroAno.toFixed(1)}%)`, 142, 52);

      // Build Table Data
      const tableBody: any[] = [];

      // RECEITAS HEADER
      tableBody.push([
        {
          content: '(+) RECEITA BRUTA OPERACIONAL (ENTRADAS NO EXTRATO)',
          colSpan: 4,
          styles: { fillColor: [232, 245, 233], textColor: [20, 70, 30], fontStyle: 'bold' }
        }
      ]);

      if (Object.keys(dreCategoriasReceita).length === 0) {
        tableBody.push(['Nenhuma entrada registrada para o ano de ' + anoReferencia, 'Entrada', 'R$ 0,00', '0.0%']);
      } else {
        Object.entries(dreCategoriasReceita).forEach(([cat, val]: [string, number]) => {
          const pct = receitaTotalAno > 0 ? (val / receitaTotalAno) * 100 : 0;
          tableBody.push([cat, 'Entrada', formatarMoeda(val), `${pct.toFixed(1)}%`]);
        });
      }

      // TOTAL RECEITAS
      tableBody.push([
        { content: '(=) TOTAL DE RECEITAS BRUTAS', styles: { fontStyle: 'bold', fillColor: [200, 230, 205], textColor: [15, 50, 20] } },
        { content: 'Entradas', styles: { fontStyle: 'bold', fillColor: [200, 230, 205], textColor: [15, 50, 20] } },
        { content: formatarMoeda(receitaTotalAno), styles: { fontStyle: 'bold', halign: 'right', fillColor: [200, 230, 205], textColor: [15, 50, 20] } },
        { content: '100.0%', styles: { fontStyle: 'bold', halign: 'right', fillColor: [200, 230, 205], textColor: [15, 50, 20] } }
      ]);

      // DESPESAS HEADER
      tableBody.push([
        {
          content: '(-) CUSTOS & DESPESAS OPERACIONAIS (SAÍDAS NO EXTRATO)',
          colSpan: 4,
          styles: { fillColor: [255, 235, 238], textColor: [130, 20, 30], fontStyle: 'bold' }
        }
      ]);

      if (Object.keys(dreCategoriasDespesa).length === 0) {
        tableBody.push(['Nenhuma saída registrada para o ano de ' + anoReferencia, 'Saída', 'R$ 0,00', '0.0%']);
      } else {
        Object.entries(dreCategoriasDespesa).forEach(([cat, val]: [string, number]) => {
          const pct = receitaTotalAno > 0 ? (val / receitaTotalAno) * 100 : 0;
          tableBody.push([cat, 'Saída', `- ${formatarMoeda(val)}`, `${pct.toFixed(1)}%`]);
        });
      }

      // TOTAL DESPESAS
      tableBody.push([
        { content: '(=) TOTAL DE DESPESAS OPERACIONAIS', styles: { fontStyle: 'bold', fillColor: [255, 205, 210], textColor: [100, 15, 20] } },
        { content: 'Saídas', styles: { fontStyle: 'bold', fillColor: [255, 205, 210], textColor: [100, 15, 20] } },
        { content: `- ${formatarMoeda(despesaTotalAno)}`, styles: { fontStyle: 'bold', halign: 'right', fillColor: [255, 205, 210], textColor: [100, 15, 20] } },
        { content: `${receitaTotalAno > 0 ? ((despesaTotalAno / receitaTotalAno) * 100).toFixed(1) : '0.0'}%`, styles: { fontStyle: 'bold', halign: 'right', fillColor: [255, 205, 210], textColor: [100, 15, 20] } }
      ]);

      // BALANÇO LÍQUIDO
      tableBody.push([
        { content: `(=) RESULTADO LÍQUIDO DO EXERCÍCIO (${anoReferencia})`, styles: { fontStyle: 'bold', fillColor: [18, 34, 21], textColor: [255, 255, 255] } },
        { content: 'Balanço Líquido', styles: { fontStyle: 'bold', fillColor: [18, 34, 21], textColor: [255, 255, 255] } },
        { content: formatarMoeda(lucroLiquidoAno), styles: { fontStyle: 'bold', halign: 'right', fillColor: [18, 34, 21], textColor: [255, 255, 255] } },
        { content: `${margemLucroAno.toFixed(1)}%`, styles: { fontStyle: 'bold', halign: 'right', fillColor: [18, 34, 21], textColor: [255, 255, 255] } }
      ]);

      autoTable(doc, {
        startY: 65,
        head: [['Categoria / Descrição DRE', 'Tipo', `Valor Total (${anoReferencia} - ${textoPeriodo})`, '% da Rec. Bruta']],
        body: tableBody,
        theme: 'grid',
        headStyles: {
          fillColor: [45, 90, 50],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        styles: {
          fontSize: 8.5,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 92 },
          1: { cellWidth: 28 },
          2: { cellWidth: 38, halign: 'right' },
          3: { cellWidth: 24, halign: 'right' }
        }
      });

      // Footer numbering
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(140, 140, 140);
        doc.text(`VOS Treasury - DRE Relatório Financeiro (${anoReferencia}) - Página ${i} de ${totalPages}`, 14, 288);
      }

      if (acao === 'imprimir') {
        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
      } else {
        doc.save(`DRE_VOS_Treasury_${anoReferencia}.pdf`);
      }
    } catch (err) {
      console.error('Erro ao gerar PDF da DRE:', err);
      alert('Não foi possível gerar o arquivo PDF. Executando impressão nativa...');
      window.print();
    }
  };

  const handleImprimirDRE = () => {
    gerarPDFDRE('imprimir');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Year Reference Selector */}
      <div className="bg-[#122215] text-white p-5 rounded-2xl border border-emerald-800/80 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-800/80 p-3 rounded-xl border border-emerald-600/40 text-emerald-200">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-white">
                Painel de Rentabilidade & DRE
              </h2>
              <span className="bg-emerald-600/90 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Extrato Financeiro
              </span>
            </div>
            <p className="text-xs text-emerald-200/90 mt-0.5">
              Cálculo automático de receitas e despesas captados do Extrato Financeiro
            </p>
          </div>
        </div>

        {/* YEAR REFERENCE SELECTOR CONTROL */}
        <div className="flex items-center gap-2 bg-[#1b3320] p-2 rounded-xl border border-emerald-700/60 shadow-inner">
          <Calendar className="w-4 h-4 text-emerald-400 ml-1" />
          <span className="text-xs font-bold text-emerald-100">Ano de Referência:</span>
          <select
            value={anoReferencia}
            onChange={(e) => setAnoReferencia(e.target.value)}
            className="bg-[#2d5a32] text-white font-extrabold text-sm px-3 py-1.5 rounded-lg border border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
          >
            {anosDisponiveis.map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top KPI Summary Cards based on Extrato and Cadastro & Operação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Receita Total Ano */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Receita Bruta ({anoReferencia})
            </span>
            <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#2d5a32] font-mono">
            {formatarMoeda(receitaTotalAno)}
          </p>
          <span className="text-[10px] text-slate-500 font-semibold block">
            Média de ~{formatarMoeda(mediaMensalReceita)}/mês
          </span>
        </div>

        {/* Despesas Total Ano */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Despesas ({anoReferencia})
            </span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-600 font-mono">
            {formatarMoeda(despesaTotalAno)}
          </p>
          <span className="text-[10px] text-slate-500 font-semibold block">
            Saídas no Extrato
          </span>
        </div>

        {/* Lucro Líquido do Ano */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Lucro Líquido ({anoReferencia})
            </span>
            <div className={`p-1.5 rounded-lg ${lucroLiquidoAno >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-black font-mono ${lucroLiquidoAno >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {formatarMoeda(lucroLiquidoAno)}
          </p>
          <span className="text-[10px] text-slate-500 font-semibold block">
            Receitas (-) Despesas
          </span>
        </div>

        {/* Margem de Lucro (%) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Margem Líquida ({anoReferencia})
            </span>
            <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-blue-900 font-mono">
            {margemLucroAno.toFixed(1)}%
          </p>

          <span className="text-[10px] text-slate-500 font-semibold block">
            Base: {transacoesAno.length} lançamentos
          </span>
        </div>

        {/* Total Condomínios Atendidos */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Condomínios
            </span>
            <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {totalCondominiosAtendidos} <span className="text-xs font-normal text-slate-500">prédios</span>
          </p>
          <span className="text-[10px] text-amber-800 font-semibold block">
            Cadastro & Operação
          </span>
        </div>

        {/* Total Apartamentos / Unidades Atendidas */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Apartamentos
            </span>
            <div className="p-1.5 bg-purple-50 text-purple-700 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-purple-950 font-mono">
            {totalApartamentosAtendidos} <span className="text-xs font-normal text-slate-500">unidades</span>
          </p>
          <span className="text-[10px] text-purple-800 font-semibold block">
            Perfil de Clientes
          </span>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Evolução Mensal (Receitas vs Despesas) */}
        <div className="lg:col-span-12 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
            <div>
              <h3 className="font-bold text-[#1c3220] text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#2d5a32]" />
                <span>Evolução Mensal de Receitas x Despesas ({anoReferencia})</span>
              </h3>
              <p className="text-xs text-slate-500">
                Detalhamento mês a mês extraído diretamente das transações do Extrato Financeiro
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-emerald-800">
                <span className="w-3 h-3 rounded-xs bg-[#2d5a32] inline-block" /> Receitas
              </span>
              <span className="flex items-center gap-1.5 text-rose-700">
                <span className="w-3 h-3 rounded-xs bg-rose-600 inline-block" /> Despesas
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataEvolucaoMensal} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <XAxis dataKey="mes" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatarMoeda(value),
                    name === 'Receita' ? 'Receita' : name === 'Despesa' ? 'Despesa' : 'Lucro'
                  ]}
                  labelFormatter={(label) => `Mês: ${label}/${anoReferencia}`}
                />
                <Bar dataKey="Receita" fill="#2d5a32" name="Receita (R$)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesa" fill="#dc2626" name="Despesa (R$)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Origem das Receitas por Categoria */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b pb-3">
            <h3 className="font-bold text-[#1c3220] text-base flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-[#2d5a32]" />
              <span>Receitas por Categoria ({anoReferencia})</span>
            </h3>
            <p className="text-xs text-slate-500">Distribuição de entradas faturadas no ano selecionado</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataPieCategoria}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {dataPieCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatarMoeda(value)} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Faturamento por Condomínio no Extrato */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b pb-3">
            <h3 className="font-bold text-[#1c3220] text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#2d5a32]" />
              <span>Receita por Condomínio ({anoReferencia})</span>
            </h3>
            <p className="text-xs text-slate-500">Total de recebimentos faturados por cliente no extrato</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataBarCondominios}>
                <XAxis dataKey="nome" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `R$ ${v}`} />
                <Tooltip
                  formatter={(value: number) => [formatarMoeda(value), 'Faturamento']}
                  labelFormatter={(name, payload) => payload[0]?.payload?.nomeCompleto || name}
                />
                <Bar dataKey="faturamento" fill="#166534" name="Faturamento (R$)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed DRE Table (Demonstrativo do Resultado do Exercício) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#2d5a32]" />
              <h3 className="font-bold text-[#1c3220] text-base">
                DRE - Demonstrativo do Resultado do Exercício ({anoReferencia})
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Demonstrativo consolidado das movimentações do Extrato Financeiro
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => gerarPDFDRE('download')}
              className="px-4 py-2 bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Baixar DRE em PDF ({anoReferencia})</span>
            </button>

            <button
              onClick={handleImprimirDRE}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir DRE ({anoReferencia})</span>
            </button>
          </div>
        </div>

        {/* CONTROLE DE SELEÇÃO DE MESES PARA O DRE */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#2d5a32]" />
              <span className="text-xs font-bold text-slate-800">Filtrar Meses do DRE ({anoReferencia}):</span>
              <span className="bg-[#2d5a32] text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                {textoPeriodo}
              </span>
            </div>

            {/* Atalhos Rápidos de Período */}
            <div className="flex flex-wrap items-center gap-1 text-[11px]">
              <button
                type="button"
                onClick={selecionarTodosMeses}
                className={`px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer ${
                  mesesSelecionados.length === 12
                    ? 'bg-[#2d5a32] text-white border-[#2d5a32]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Ano Todo
              </button>
              <button
                type="button"
                onClick={selecionarPrimeiroSemestre}
                className="px-2.5 py-1 rounded-lg font-bold border bg-white text-slate-700 border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                1º Sem (Jan-Jun)
              </button>
              <button
                type="button"
                onClick={selecionarSegundoSemestre}
                className="px-2.5 py-1 rounded-lg font-bold border bg-white text-slate-700 border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                2º Sem (Jul-Dez)
              </button>
              <button
                type="button"
                onClick={() => selecionarTrimestre(1)}
                className="px-2 py-1 rounded-lg font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Q1
              </button>
              <button
                type="button"
                onClick={() => selecionarTrimestre(2)}
                className="px-2 py-1 rounded-lg font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Q2
              </button>
              <button
                type="button"
                onClick={() => selecionarTrimestre(3)}
                className="px-2 py-1 rounded-lg font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Q3
              </button>
              <button
                type="button"
                onClick={() => selecionarTrimestre(4)}
                className="px-2 py-1 rounded-lg font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Q4
              </button>
            </div>
          </div>

          {/* Grid de Meses Interativos (Jan a Dez) */}
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5 pt-1">
            {LISTA_MESES.map((m) => {
              const selected = isMesSelecionado(m.num);
              return (
                <button
                  key={m.num}
                  type="button"
                  onClick={() => toggleMes(m.num)}
                  className={`py-1.5 px-1 rounded-lg font-bold text-xs text-center border transition-all cursor-pointer ${
                    selected
                      ? 'bg-[#2d5a32] text-white border-[#2d5a32] shadow-xs scale-102'
                      : 'bg-white text-slate-400 border-slate-200 hover:text-slate-700 hover:border-slate-300'
                  }`}
                  title={`${m.nome} / ${anoReferencia} (${selected ? 'Selecionado' : 'Clique para selecionar'})`}
                >
                  {m.sigla}
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8faf6] border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <th className="p-3">Categoria / Descrição DRE</th>
                <th className="p-3">Tipo</th>
                <th className="p-3 text-right">Valor Total ({anoReferencia} - {textoPeriodo})</th>
                <th className="p-3 text-right">% da Receita Bruta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {/* Receitas Breakdown Header */}
              <tr className="bg-emerald-50/50 font-bold text-emerald-950">
                <td colSpan={4} className="p-2.5 text-xs">
                  (+) RECEITA BRUTA OPERACIONAL (ENTRADAS NO EXTRATO)
                </td>
              </tr>
              {Object.keys(dreCategoriasReceita).length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-3 text-slate-400 italic">
                    Nenhuma entrada registrada para o ano de {anoReferencia}.
                  </td>
                </tr>
              ) : (
                Object.entries(dreCategoriasReceita).map(([cat, val]: [string, number]) => {
                  const pct = receitaTotalAno > 0 ? (val / receitaTotalAno) * 100 : 0;
                  return (
                    <tr key={`rec-${cat}`} className="hover:bg-slate-50">
                      <td className="p-3 pl-6 text-slate-800">{cat}</td>
                      <td className="p-3">
                        <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-md">
                          Entrada
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">
                        {formatarMoeda(val)}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-600">
                        {pct.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })
              )}
              {/* Total Receitas Row */}
              <tr className="bg-emerald-100/60 font-black text-emerald-900 border-t border-b border-emerald-200">
                <td className="p-3 pl-6">(=) TOTAL DE RECEITAS BRUTAS</td>
                <td className="p-3">Entradas</td>
                <td className="p-3 text-right font-mono text-sm text-emerald-800">
                  {formatarMoeda(receitaTotalAno)}
                </td>
                <td className="p-3 text-right font-mono text-sm">100.0%</td>
              </tr>

              {/* Despesas Breakdown Header */}
              <tr className="bg-rose-50/50 font-bold text-rose-950">
                <td colSpan={4} className="p-2.5 text-xs pt-4">
                  (-) CUSTOS & DESPESAS OPERACIONAIS (SAÍDAS NO EXTRATO)
                </td>
              </tr>
              {Object.keys(dreCategoriasDespesa).length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-3 text-slate-400 italic">
                    Nenhuma saída registrada para o ano de {anoReferencia}.
                  </td>
                </tr>
              ) : (
                Object.entries(dreCategoriasDespesa).map(([cat, val]: [string, number]) => {
                  const pct = receitaTotalAno > 0 ? (val / receitaTotalAno) * 100 : 0;
                  return (
                    <tr key={`desp-${cat}`} className="hover:bg-slate-50">
                      <td className="p-3 pl-6 text-slate-800">{cat}</td>
                      <td className="p-3">
                        <span className="bg-rose-100 text-rose-800 font-bold text-[10px] px-2 py-0.5 rounded-md">
                          Saída
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-rose-600">
                        - {formatarMoeda(val)}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-600">
                        {pct.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })
              )}
              {/* Total Despesas Row */}
              <tr className="bg-rose-100/60 font-black text-rose-900 border-t border-b border-rose-200">
                <td className="p-3 pl-6">(=) TOTAL DE DESPESAS OPERACIONAIS</td>
                <td className="p-3">Saídas</td>
                <td className="p-3 text-right font-mono text-sm text-rose-800">
                  - {formatarMoeda(despesaTotalAno)}
                </td>
                <td className="p-3 text-right font-mono text-sm">
                  {receitaTotalAno > 0 ? ((despesaTotalAno / receitaTotalAno) * 100).toFixed(1) : 0}%
                </td>
              </tr>

              {/* Final Result / Net Profit Row */}
              <tr className="bg-[#122215] text-white font-black text-sm border-t-2 border-emerald-600">
                <td className="p-3.5 pl-6">
                  (=) RESULTADO LÍQUIDO DO EXERCÍCIO ({anoReferencia})
                </td>
                <td className="p-3.5">
                  <span className="bg-emerald-700 text-white font-bold text-[10px] px-2 py-0.5 rounded-md">
                    Balanço Líquido
                  </span>
                </td>
                <td className={`p-3.5 text-right font-mono text-base ${lucroLiquidoAno >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {formatarMoeda(lucroLiquidoAno)}
                </td>
                <td className="p-3.5 text-right font-mono text-emerald-200">
                  {margemLucroAno.toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
