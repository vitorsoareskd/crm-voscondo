import fs from 'fs';
import readline from 'readline';

const logPath = 'C:/Users/vitor/.gemini/antigravity/brain/b7f1601b-d240-4356-839a-7e21567ddb07/.system_generated/logs/transcript.jsonl';

async function searchLog() {
  if (!fs.existsSync(logPath)) {
    console.log('Log not found');
    return;
  }
  const rl = readline.createInterface({
    input: fs.createReadStream(logPath)
  });

  const foundCondos = new Set();
  const userMessages = [];

  for await (const line of rl) {
    if (line.includes('"type":"USER_INPUT"')) {
      try {
        const parsed = JSON.parse(line);
        userMessages.push(parsed.content || '');
      } catch (e) {}
    }
    if (line.includes('Residencial') || line.includes('Condomínio') || line.includes('Edifício') || line.includes('Cabral Cruz')) {
      const matches = line.match(/(Condomínio [A-Za-z0-9À-ÿ\s]+|Residencial [A-Za-z0-9À-ÿ\s]+|Edifício [A-Za-z0-9À-ÿ\s]+)/g);
      if (matches) {
        matches.forEach(m => {
          if (m.length < 50) foundCondos.add(m.trim());
        });
      }
    }
  }

  console.log('--- Condominios Found in History ---');
  console.log([...foundCondos]);
  console.log('\n--- User Messages ---');
  userMessages.forEach((msg, i) => console.log(`[${i}] ${msg.substring(0, 100)}`));
}

searchLog();
