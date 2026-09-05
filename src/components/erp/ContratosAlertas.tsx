import React, { useEffect, useState } from 'react';
import { FileText, Bell, AlertCircle } from 'lucide-react';
import { formatarMoeda } from '../../utils/pricingEngine';

interface Contrato {
  id: number;
  condominio_id: number;
  valor_honorarios: number;
  data_vencimento: string;
  meses_vigencia: number;
}

export const ContratosAlertas: React.FC = () => {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/contratos')
      .then(res => res.json())
      .then(data => {
        setContratos(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao buscar contratos", err);
        setLoading(false);
      });
  }, []);

  // Calcula a diferença em meses entre hoje e a data de vencimento
  const getMesesParaVencer = (dataVencimento: string) => {
    const hoje = new Date();
    const venc = new Date(dataVencimento);
    const diffTime = venc.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 30);
  };

  if (loading) {
    return <div className="p-4 text-slate-500 text-sm">Carregando contratos...</div>;
  }

  const contratosComAlerta = contratos.filter(c => {
    const meses = getMesesParaVencer(c.data_vencimento);
    return meses === 1 || meses === 2; // Alerta de 1 ou 2 meses
  });

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-[#1c3220] flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-600" />
          <span>Gestão e Alertas de Contratos</span>
        </h3>
        {contratosComAlerta.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold animate-pulse">
            <Bell className="w-4 h-4" />
            {contratosComAlerta.length} Contrato(s) próximo(s) do vencimento
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contratos.map(contrato => {
          const mesesRestantes = getMesesParaVencer(contrato.data_vencimento);
          const isAlerta = mesesRestantes === 1 || mesesRestantes === 2;

          return (
            <div key={contrato.id} className={`p-4 rounded-xl border ${isAlerta ? 'border-amber-400 bg-amber-50/30' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold text-slate-800 text-sm">Contrato #{contrato.id}</div>
                {isAlerta && (
                  <span className="flex items-center gap-1 text-[10px] bg-amber-200 text-amber-900 px-2 py-1 rounded font-bold uppercase tracking-wider">
                    <AlertCircle className="w-3 h-3" /> Aviso Renovação
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-600 mb-1">
                Condomínio ID: <span className="font-bold">{contrato.condominio_id}</span>
              </div>
              <div className="text-xs text-slate-600 mb-3">
                Honorários: <span className="font-bold text-emerald-700">{formatarMoeda(contrato.valor_honorarios)}</span>
              </div>
              
              <div className="flex justify-between items-end border-t border-slate-200 pt-3">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Vencimento</div>
                  <div className={`font-mono text-sm font-bold ${isAlerta ? 'text-amber-700' : 'text-slate-700'}`}>
                    {contrato.data_vencimento}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Faltam</div>
                  <div className={`font-bold text-xs ${isAlerta ? 'text-amber-700' : 'text-slate-700'}`}>
                    {mesesRestantes > 0 ? `${mesesRestantes} meses` : 'Vencido/Este mês'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {contratos.length === 0 && (
        <div className="p-4 text-center text-slate-500 border border-dashed border-slate-300 rounded-xl">
          Nenhum contrato cadastrado.
        </div>
      )}
    </div>
  );
};
