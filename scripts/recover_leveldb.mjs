import fs from 'fs';
import path from 'path';

const chromeDir = 'C:/Users/vitor/AppData/Local/Google/Chrome/User Data/Default/Local Storage/leveldb';
const edgeDir = 'C:/Users/vitor/AppData/Local/Microsoft/Edge/User Data/Default/Local Storage/leveldb';

function searchDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.ldb') || file.endsWith('.log')) {
      const fullPath = path.join(dir, file);
      try {
        const buf = fs.readFileSync(fullPath);
        // Search for string patterns
        const str = buf.toString('latin1');
        
        // Search for vos_condominios
        let idx = 0;
        while ((idx = str.indexOf('vos_condominios', idx)) !== -1) {
          console.log(`\n=== Found 'vos_condominios' in ${file} at offset ${idx} ===`);
          // Extract a chunk around it
          const chunk = str.substring(idx, idx + 4000);
          // Look for JSON array
          const jsonStart = chunk.indexOf('[');
          if (jsonStart !== -1) {
            let depth = 0;
            let jsonEnd = -1;
            for (let i = jsonStart; i < chunk.length; i++) {
              if (chunk[i] === '[') depth++;
              else if (chunk[i] === ']') {
                depth--;
                if (depth === 0) {
                  jsonEnd = i;
                  break;
                }
              }
            }
            if (jsonEnd !== -1) {
              const candidate = chunk.substring(jsonStart, jsonEnd + 1);
              console.log('Candidate JSON:');
              console.log(candidate);
            } else {
              console.log('Raw chunk:\n', chunk.substring(0, 500));
            }
          }
          idx += 15;
        }

        // Also search for specific keywords like "sindicoResponsavel" or "mensalidadeCalculada"
        let idx2 = 0;
        while ((idx2 = str.indexOf('mensalidadeCalculada', idx2)) !== -1) {
          console.log(`\n=== Found 'mensalidadeCalculada' in ${file} at offset ${idx2} ===`);
          const start = Math.max(0, idx2 - 300);
          const end = Math.min(str.length, idx2 + 500);
          console.log(str.substring(start, end));
          idx2 += 25;
        }

      } catch (e) {
        console.error(`Error reading ${file}:`, e.message);
      }
    }
  }
}

console.log('--- SEARCHING CHROME LEVELDB ---');
searchDirectory(chromeDir);

console.log('\n--- SEARCHING EDGE LEVELDB ---');
searchDirectory(edgeDir);
