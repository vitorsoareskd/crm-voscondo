import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, KeyRound, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';


interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    
    if (cleanEmail === 'adm@voscondo.com' && password === '@Vitor0717') {
      // Mock login sucessful
      sessionStorage.setItem('vos_user_email', 'adm@voscondo.com');
      setIsLoading(false);
      onLoginSuccess();
    } else {
      setIsLoading(false);
      setError('E-mail ou senha incorretos. Por favor, verifique suas credenciais.');
    }
  };

  const fillDemoCredentials = () => {
    setEmail('adm@voscondo.com');
    setPassword('@Vitor0717');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#122b17] text-white flex items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans">
      {/* Main Split Layout Container */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center z-10 my-auto">
        
        {/* Left Side: Brand Identity (No logo, opaque dark green background) */}
        <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left px-4">
          {/* Typography Branding */}
          <div className="space-y-2">
            <div className="inline-block px-3 py-1 bg-emerald-900/60 border border-emerald-700/50 rounded-full text-emerald-300 text-xs font-semibold tracking-widest uppercase mb-2">
              SISTEMA ADMINISTRATIVO VOS
            </div>
            <h1 className="text-5xl sm:text-6xl font-black text-white tracking-wider font-sans">
              VOS
            </h1>
            <p className="text-xl sm:text-2xl font-bold text-emerald-300 tracking-[0.35em] uppercase">
              CONDOMÍNIOS
            </p>
            <p className="text-base sm:text-lg font-serif italic text-emerald-100/90 pt-4 max-w-md font-medium leading-relaxed">
              Raízes sólidas e gestão moderna para seu condomínio.
            </p>
          </div>
        </div>

        {/* Right Side: Lock Screen Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="bg-[#1b3d22] border-2 border-[#2f6338] rounded-3xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
            {/* Top Shield Header */}
            <div className="flex items-start gap-4 mb-6 pb-5 border-b border-[#2d5d36]">
              <div className="p-3 bg-emerald-900/80 text-emerald-300 rounded-2xl border border-emerald-600/50 shrink-0 shadow-xs">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Tela de Bloqueio
                </h2>
                <p className="text-xs text-emerald-200/80 mt-1 font-medium">
                  Identifique-se para acessar o CRM, ERP e Saúde VOS
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-5 p-3.5 bg-rose-900/60 border border-rose-500/50 rounded-2xl text-xs text-rose-100 flex items-start gap-2.5 animate-shake font-medium">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-emerald-200/90 uppercase tracking-wider">
                  E-MAIL DE ACESSO
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="adm@voscondo.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-[#0f2413] border border-[#2d5e37] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl text-sm text-white placeholder-emerald-600/70 focus:outline-none transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-emerald-200/90 uppercase tracking-wider">
                  SENHA
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-11 pr-12 py-3.5 bg-[#0f2413] border border-[#2d5e37] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl text-sm text-white placeholder-emerald-600/70 focus:outline-none transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-emerald-400/80 hover:text-emerald-200 transition-colors cursor-pointer"
                    title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group mt-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar no Sistema</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              {/* Auto Fill Link */}
              <div className="pt-3 border-t border-[#2d5d36] text-center">
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="text-xs text-emerald-300 hover:text-emerald-100 font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Preencher credenciais de Administrador</span>
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* Footer copyright */}
      <div className="absolute bottom-3 left-0 right-0 text-center text-[11px] text-emerald-300/60 font-medium pointer-events-none">
        © 2026 VOS CONDO ADMINISTRADORA LTDA • CNPJ 66.072.162/0001-43
      </div>
    </div>
  );
};
