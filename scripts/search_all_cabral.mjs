import fs from 'fs';
import path from 'path';

const chromeDir = 'C:/Users/vitor/AppData/Local/Google/Chrome/User Data/Default/Local Storage/leveldb';
const files = fs.readdirSync(chromeDir);

for (const file of files) {
  if (file.endsWith('.ldb') || file.endsWith('.log')) {
    const buf = fs.readFileSync(path.join(chromeDir, file));
    const str = buf.toString('latin1');
    let pos = 0;
    while ((pos = str.indexOf('Cabral Cruz', pos)) !== -1) {
      console.log(`Found in ${file} at ${pos}`);
      pos += 12;
    }
  }
}
