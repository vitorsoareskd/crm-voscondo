import fs from 'fs';
import path from 'path';

const chromeDir = 'C:/Users/vitor/AppData/Local/Google/Chrome/User Data/Default/Local Storage/leveldb';
const buf = fs.readFileSync(path.join(chromeDir, '012501.ldb'));
const str = buf.toString('latin1');

let idx = 0;
while ((idx = str.indexOf('vos_condominios', idx)) !== -1) {
  console.log(`--- Match at ${idx} ---`);
  console.log(str.substring(Math.max(0, idx - 50), idx + 2000));
  idx += 16;
}
