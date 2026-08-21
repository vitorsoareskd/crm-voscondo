import React from 'react';
import { Cpu, RefreshCw, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Inadimplente, Condominio } from '../../types';
import { InadimplenciaSection } from '../erp/InadimplenciaSection';

interface UcondoApiSectionProps {
  inadimplentes: Inadimplente[];
  setInadimplentes: React.Dispatch<React.SetStateAction<Inadimplente[]>>;
  condominios: Condominio[];
}

export const UcondoApiSection: React.FC<UcondoApiSectionProps> = ({
  inadimplentes,
  setInadimplentes,
  condominios
}) => {
  return (
    <div className="space-y-6">
      {/* Header Banner Ucondo API */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Cpu className="w-5 h-5 text-[#2d5a32]" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#1c3220] flex items-center gap-2">
                <span>Integração API</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
                  Módulo de Inadimplência
                </span>
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão automatizada de cobrança, extrato de inadimplentes e sincronização via API Ucondo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Sincronizado com Ucondo
          </span>
        </div>
      </div>

      {/* Inadimplência Section Component */}
      <InadimplenciaSection
        inadimplentes={inadimplentes}
        setInadimplentes={setInadimplentes}
        condominios={condominios}
      />
    </div>
  );
};
