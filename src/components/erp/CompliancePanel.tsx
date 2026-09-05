import React, { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

interface Laudo {
  id: number;
  condominio_id: number;
  condominio_nome: string;
  tipo_laudo: string;
  data_emissao: string;
  data_vencimento: string;
  status: string;
}

export const CompliancePanel: React.FC = () => {
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/compliance_laudos')
      .then(res => res.json())
      .then(data => {
        setLaudos(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao buscar compliance_laudos", err);
        setLoading(false);
      });
  }, []);

  const getDiasParaVencer = (dataVencimento: string) => {
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    const difMs = vencimento.getTime() - hoje.getTime();
    return Math.ceil(difMs / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return <div className="p-4 text-slate-500 text-sm">Carregando laudos de compliance...</div>;
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-[#1c3220] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Compliance e Laudos Técnicos</span>
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="p-3 font-bold">Condomínio</th>
              <th className="p-3 font-bold">Tipo de Laudo</th>
              <th className="p-3 font-bold">Data Emissão</th>
              <th className="p-3 font-bold">Vencimento</th>
              <th className="p-3 font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {laudos.map(laudo => {
              const dias = getDiasParaVencer(laudo.data_vencimento);
              const isCritico = dias <= 30;

              return (
                <tr key={laudo.id} className={`hover:bg-slate-50 ${isCritico ? 'bg-rose-50/50' : ''}`}>
                  <td className="p-3 font-semibold text-slate-800">{laudo.condominio_nome}</td>
                  <td className="p-3 font-bold text-slate-700">{laudo.tipo_laudo}</td>
                  <td className="p-3 font-mono text-slate-500">{laudo.data_emissao}</td>
                  <td className={`p-3 font-mono font-bold ${isCritico ? 'text-rose-600' : 'text-slate-700'}`}>
                    {laudo.data_vencimento}
                    {isCritico && <span className="ml-2 text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full">Vence em {dias} dias</span>}
                  </td>
                  <td className="p-3">
                    {isCritico ? (
                      <span className="flex items-center gap-1 text-rose-600 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" /> Atenção
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" /> OK
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {laudos.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-500">Nenhum laudo cadastrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
