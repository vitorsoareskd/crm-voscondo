import fs from 'fs';
import path from 'path';

const buf = fs.readFileSync('C:/Users/vitor/AppData/Local/Google/Chrome/User Data/Default/Local Storage/leveldb/012501.ldb');
const slice = buf.subarray(83000, 85000);

// Filter printable ascii characters
let reconstructed = '';
for (let i = 0; i < slice.length; i++) {
  const byte = slice[i];
  if (byte >= 32 && byte <= 126) {
    reconstructed += String.fromCharCode(byte);
  } else if (byte === 0) {
    // skip null bytes of utf-16
  } else {
    reconstructed += ' ';
  }
}

console.log(reconstructed);
