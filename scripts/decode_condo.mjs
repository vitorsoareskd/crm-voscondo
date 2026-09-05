import fs from 'fs';
import path from 'path';

const chromeDir = 'C:/Users/vitor/AppData/Local/Google/Chrome/User Data/Default/Local Storage/leveldb';
const buf = fs.readFileSync(path.join(chromeDir, '012501.ldb'));

// Search for utf-16 buffer matching "COND-101"
const needle = Buffer.from('COND-101', 'utf16le');
const idx = buf.indexOf(needle);

console.log('Found COND-101 utf-16 at offset:', idx);
if (idx !== -1) {
  // Extract 2000 bytes before and after
  const slice = buf.subarray(idx - 100, idx + 3500);
  const text = slice.toString('utf16le');
  console.log('Decoded UTF-16 text:');
  console.log(text);
}
