import fs from 'fs';
import path from 'path';

const chromeDir = 'C:/Users/vitor/AppData/Local/Google/Chrome/User Data/Default/Local Storage/leveldb';
const logFile = path.join(chromeDir, '012504.log');

if (fs.existsSync(logFile)) {
  const buf = fs.readFileSync(logFile);
  const str = buf.toString('latin1');
  console.log(`012504.log length: ${buf.length}`);
  
  // Search for condominios or Cabral
  let pos = 0;
  while ((pos = str.indexOf('Cabral', pos)) !== -1) {
    console.log(`\n--- Match at ${pos} ---`);
    console.log(str.substring(Math.max(0, pos - 200), Math.min(str.length, pos + 1000)));
    pos += 6;
  }
} else {
  console.log('012504.log does not exist');
}
