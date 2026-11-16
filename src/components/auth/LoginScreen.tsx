import React, { useState } from 'react';
import { UserProfile, UserRole } from '../../types';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Building2, UserCheck, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { signInAnonymously } from 'firebase/auth';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const MOCK_PROFILES: Record<UserRole, UserProfile> = {
  vos_adm: {
    uid: 'adm-01',
    nome: 'Vitor Soares (VOS Adm)',
    email: 'adm@voscondo.com',
    role: 'vos_adm',
    whatsapp: '5541933000513',
  },
  sindico: {
    uid: 'sind-01',
    nome: 'Natalia (Síndica - Cabral Cruz)',
    email: 'residencialcabralcruz@gmail.com',
    role: 'sindico',
    condominioId: 'COND-101',
    condominioNome: 'Residencial Cabral Cruz',
    whatsapp: '5541998508290',
    vagaVinculada: 'G1-01',
  },
  morador: {
    uid: 'mor-01',
    nome: 'Morador - Residencial Cabral Cruz',
    email: 'morador@cabralcruz.com.br',
    role: 'morador',
    condominioId: 'COND-101',
    condominioNome: 'Residencial Cabral Cruz',
    unidade: 'Unidade Residencial',
    whatsapp: '5541998508290',
    vagaVinculada: 'G1-01',
  },
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('vos_adm');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    if (role === 'vos_adm') {
      setEmail('adm@voscondo.com');
    } else if (role === 'sindico') {
      setEmail('residencialcabralcruz@gmail.com');
    } else {
      setEmail('morador@cabralcruz.com.br');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    // Se for VOS Adm e digitou senha incorreta (quando não está vazia), valida a senha padrão @Vitor0717
    if (
      selectedRole === 'vos_adm' &&
      password.trim() !== '' &&
      password !== '@Vitor0717' &&
      password !== '123456'
    ) {
      setIsLoading(false);
      setError('Senha incorreta para VOS Adm. Use a credencial oficial ou clique em Preencher Credenciais.');
      return;
    }

    try {
      await signInAnonymously(auth).catch(() => {});
    } catch (err) {
      console.warn('Firebase Auth notice:', err);
    }

    const baseProfile = MOCK_PROFILES[selectedRole];
    const finalProfile: UserProfile = {
      ...baseProfile,
      email: cleanEmail || baseProfile.email,
    };

    sessionStorage.setItem('vos_user_email', finalProfile.email);
    sessionStorage.setItem('vos_user_role', finalProfile.role);
    setIsLoading(false);
    onLoginSuccess(finalProfile);
  };

  const fillDemoCredentials = () => {
    if (selectedRole === 'vos_adm') {
      setEmail('adm@voscondo.com');
      setPassword('@Vitor0717');
    } else if (selectedRole === 'sindico') {
      setEmail('residencialcabralcruz@gmail.com');
      setPassword('123456');
    } else {
      setEmail('morador@cabralcruz.com.br');
      setPassword('123456');
    }
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#122b17] text-white flex items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center z-10 my-auto">
        {/* Left Side: Brand Identity */}
        <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left px-4">
          <div className="space-y-2">
            <div className="inline-block px-3 py-1 bg-emerald-900/60 border border-emerald-700/50 rounded-full text-emerald-300 text-xs font-semibold tracking-widest uppercase mb-2">
              PLATAFORMA MULTI-PERFIL VOS
            </div>
            <h1 className="text-5xl sm:text-6xl font-black text-white tracking-wider font-sans">
              VOS
            </h1>
            <p className="text-xl sm:text-2xl font-bold text-emerald-300 tracking-[0.35em] uppercase">
              CONDOMÍNIOS
            </p>
            <p className="text-base sm:text-lg font-serif italic text-emerald-100/90 pt-4 max-w-md font-medium leading-relaxed">
              Plataforma Integrada de Gestão Comercial (CRM), Operação Condominial (ERP), Chatbot e Saúde VOS.
            </p>
          </div>
        </div>

        {/* Right Side: Lock Screen Card with RBAC Role Selector */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="bg-[#1b3d22] border-2 border-[#2f6338] rounded-3xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
            {/* Top Shield Header */}
            <div className="flex items-start gap-4 mb-5 pb-4 border-b border-[#2d5d36]">
              <div className="p-3 bg-emerald-900/80 text-emerald-300 rounded-2xl border border-emerald-600/50 shrink-0 shadow-xs">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  Acesso ao Sistema
                </h2>
                <p className="text-xs text-emerald-200/80 mt-0.5 font-medium">
                  Selecione seu perfil de acesso (RBAC)
                </p>
              </div>
            </div>

            {/* Seletor de Perfil de Entrada (VOS Adm, Síndico, Morador) */}
            <div className="grid grid-cols-3 gap-2 mb-5 bg-[#0f2413] p-1.5 rounded-2xl border border-[#2d5e37]">
              <button
                type="button"
                onClick={() => handleRoleChange('vos_adm')}
                className={`flex flex-col items-center py-2.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedRole === 'vos_adm'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-emerald-200/70 hover:text-white hover:bg-[#19381f]'
                }`}
              >
                <ShieldCheck className="w-4 h-4 mb-1" />
                <span>VOS Adm</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('sindico')}
                className={`flex flex-col items-center py-2.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedRole === 'sindico'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-emerald-200/70 hover:text-white hover:bg-[#19381f]'
                }`}
              >
                <Building2 className="w-4 h-4 mb-1" />
                <span>Síndico</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('morador')}
                className={`flex flex-col items-center py-2.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedRole === 'morador'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-emerald-200/70 hover:text-white hover:bg-[#19381f]'
                }`}
              >
                <UserCheck className="w-4 h-4 mb-1" />
                <span>Morador</span>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3.5 bg-rose-900/60 border border-rose-500/50 rounded-2xl text-xs text-rose-100 flex items-start gap-2.5 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-emerald-200/90 uppercase tracking-wider">
                  E-MAIL DE ACESSO ({selectedRole.toUpperCase()})
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={MOCK_PROFILES[selectedRole].email}
                    className="w-full pl-11 pr-4 py-3 bg-[#0f2413] border border-[#2d5e37] focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 rounded-2xl text-sm text-white placeholder-emerald-600/70 focus:outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-emerald-200/90 uppercase tracking-wider">
                  SENHA
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-11 pr-12 py-3 bg-[#0f2413] border border-[#2d5e37] focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 rounded-2xl text-sm text-white placeholder-emerald-600/70 focus:outline-none transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-emerald-400/80 hover:text-emerald-200 transition-colors cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 group mt-2"
              >
                {isLoading ? (
                  <span>Autenticando...</span>
                ) : (
                  <>
                    <span>Entrar como {selectedRole === 'vos_adm' ? 'VOS Adm' : selectedRole === 'sindico' ? 'Síndico' : 'Morador'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="pt-3 border-t border-[#2d5d36] text-center">
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="text-xs text-emerald-300 hover:text-amber-300 font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Preencher credenciais do perfil selecionado</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="absolute bottom-3 left-0 right-0 text-center text-[11px] text-emerald-300/60 font-medium pointer-events-none">
        © 2026 VOS CONDO ADMINISTRADORA LTDA • CNPJ 66.072.162/0001-43
      </div>
    </div>
  );
};
