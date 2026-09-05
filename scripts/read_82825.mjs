import fs from 'fs';
import path from 'path';

const chromeDir = 'C:/Users/vitor/AppData/Local/Google/Chrome/User Data/Default/Local Storage/leveldb';
const buf = fs.readFileSync(path.join(chromeDir, '012501.ldb'));
const str = buf.toString('latin1');

console.log('=== AT 82825 ===');
console.log(str.substring(82000, 84000));

console.log('=== AT 85861 ===');
console.log(str.substring(85500, 87500));
