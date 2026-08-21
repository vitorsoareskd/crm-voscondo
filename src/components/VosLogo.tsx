import React from 'react';

interface VosLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'header';
  onDarkBg?: boolean;
}

export const VosLogo: React.FC<VosLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'header',
  onDarkBg = false
}) => {
  const textSizes = {
    sm: { vos: 'text-lg', condo: 'text-[10px]' },
    md: { vos: 'text-2xl', condo: 'text-xs' },
    lg: { vos: 'text-3xl', condo: 'text-sm' },
    xl: { vos: 'text-4xl', condo: 'text-base' }
  };

  const ts = textSizes[size] || textSizes.md;

  return (
    <div className={`flex flex-col justify-center ${className}`}>
      <div className="flex items-baseline gap-2 leading-none">
        <span
          className={`${ts.vos} font-black tracking-wider ${
            onDarkBg ? 'text-white' : 'text-[#1c5222]'
          }`}
        >
          VOS
        </span>
        <span
          className={`${ts.condo} font-bold tracking-[0.25em] uppercase ${
            onDarkBg ? 'text-emerald-300' : 'text-[#2a3c2c]'
          }`}
        >
          CONDOMÍNIOS
        </span>
      </div>
      <p
        className={`text-[11px] font-medium italic mt-1 ${
          onDarkBg ? 'text-emerald-200/80' : 'text-slate-500'
        }`}
      >
        Raízes sólidas e gestão moderna para seu condomínio.
      </p>
    </div>
  );
};
