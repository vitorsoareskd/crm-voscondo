import fs from 'fs';
import path from 'path';

const chromeDir = 'C:/Users/vitor/AppData/Local/Google/Chrome/User Data/Default/Local Storage/leveldb';

function extractLocalhostData() {
  const files = fs.readdirSync(chromeDir);
  for (const file of files) {
    if (file.endsWith('.ldb') || file.endsWith('.log')) {
      const fullPath = path.join(chromeDir, file);
      const buf = fs.readFileSync(fullPath);
      const str = buf.toString('latin1');
      
      let pos = 0;
      while ((pos = str.indexOf('localhost:3000', pos)) !== -1) {
        console.log(`\n======================================================`);
        console.log(`File: ${file} at offset ${pos}`);
        console.log(`======================================================`);
        const slice = str.substring(Math.max(0, pos - 100), Math.min(str.length, pos + 2500));
        console.log(slice);
        pos += 14;
      }
    }
  }
}

extractLocalhostData();
