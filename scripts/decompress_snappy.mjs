import fs from 'fs';
import SnappyJS from 'snappyjs';

const buf = fs.readFileSync('C:/Users/vitor/AppData/Local/Google/Chrome/User Data/Default/Local Storage/leveldb/012501.ldb');

// In LevelDB, blocks are variable size (typically 4KB-64KB) terminated by 1 byte compression type (0x01 = snappy) + 4 byte CRC
// Let's scan for snappy blocks by attempting decompression at candidate block headers or scanning
console.log('Searching and decompressing snappy blocks in 012501.ldb...');

for (let i = 0; i < buf.length - 100; i++) {
  // Check if uncompressed length varint could start here
  // Only try if near our known match (e.g. between 70000 and 100000 or full scan)
  if (i >= 70000 && i <= 95000) {
    try {
      const decompressed = SnappyJS.uncompress(buf.subarray(i, Math.min(buf.length, i + 32768)));
      const str = decompressed.toString('utf8');
      const str16 = decompressed.toString('utf16le');
      if (str.includes('COND-101') || str.includes('Cabral Cruz') || str16.includes('COND-101') || str16.includes('Cabral Cruz')) {
        console.log(`\n🎉 SUCCESS! Decompressed block at offset ${i}!`);
        if (str.includes('Cabral Cruz')) console.log('UTF-8:\n', str);
        if (str16.includes('Cabral Cruz')) console.log('UTF-16:\n', str16);
      }
    } catch (e) {
      // not a valid snappy block start
    }
  }
}
