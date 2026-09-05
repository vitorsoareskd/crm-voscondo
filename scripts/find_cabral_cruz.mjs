import fs from 'fs';
import path from 'path';

const chromeDir = 'C:/Users/vitor/AppData/Local/Google/Chrome/User Data/Default/Local Storage/leveldb';
const files = fs.readdirSync(chromeDir);

for (const file of files) {
  if (file.endsWith('.ldb') || file.endsWith('.log')) {
    const buf = fs.readFileSync(path.join(chromeDir, file));
    const str = buf.toString('utf-8', 0, buf.length); // Try utf-8
    const strLatin = buf.toString('latin1');
    
    let pos = 0;
    while ((pos = strLatin.indexOf('Cabral Cruz', pos)) !== -1) {
      console.log(`\n======================================================`);
      console.log(`Found 'Cabral Cruz' in ${file} at position ${pos}`);
      console.log(`======================================================`);
      const start = Math.max(0, pos - 500);
      const end = Math.min(strLatin.length, pos + 1500);
      console.log(strLatin.substring(start, end));
      pos += 12;
    }
  }
}
