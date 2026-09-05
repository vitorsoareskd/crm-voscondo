import { spawn } from 'child_process';
import os from 'os';

const PORT = 3000;

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

console.log('\n=============================================================');
console.log('⚡ INICIANDO TÚNEL PÚBLICO CLOUDFLARE (ALTA VELOCIDADE & 5G)');
console.log('=============================================================');
console.log(`📡 Porta Local Alvo: ${PORT}`);
console.log(`📶 Acesso na Mesma Rede Wi-Fi: http://${getLocalIP()}:${PORT}`);
console.log('🔄 Conectando à rede global da Cloudflare (sem senhas e sem erro 503)...\n');

const child = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', [
  '--yes',
  'cloudflared',
  'tunnel',
  '--url',
  `http://localhost:${PORT}`
], {
  stdio: ['ignore', 'pipe', 'pipe']
});

child.stderr.on('data', (data) => {
  const text = data.toString();
  const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match) {
    console.log('=============================================================');
    console.log('✅ TÚNEL CONECTADO E DISPONÍVEL PÚBLICO (5G / 4G / WI-FI)!');
    console.log('=============================================================');
    console.log(`🔗 Link de Acesso Direto:`);
    console.log(`👉 \x1b[32m\x1b[1m${match[0]}\x1b[0m`);
    console.log('\n💡 Dica: Não requer senha nem cadastro! Basta abrir no celular.');
    console.log('=============================================================\n');
  }
});

child.on('close', (code) => {
  console.log(`Túnel encerrado (código ${code}). Reiniciando em 5 segundos...`);
  setTimeout(() => {
    import('./tunnel.js');
  }, 5000);
});
