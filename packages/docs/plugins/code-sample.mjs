import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const samplesDir = resolve(__dirname, '../src/code-samples');

function visit(node, type, fn) {
  if (node.type === type) fn(node);
  if (node.children) for (const c of node.children) visit(c, type, fn);
}

export function codeSampleRemarkPlugin() {
  return (tree) => {
    visit(tree, 'code', (node) => {
      if (!node.meta) return;
      const sampleMatch = node.meta.match(/code-sample="([^"]+)"/);
      if (!sampleMatch) return;
      const filePath = resolve(samplesDir, sampleMatch[1] + '.ts');
      let content;
      try { content = readFileSync(filePath, 'utf-8'); }
      catch { return; }
      const segMatch = node.meta.match(/segment="([^"]+)"/);
      if (segMatch) {
        const name = segMatch[1];
        const start = `// @code-block-start: ${name}`;
        const end = `// @code-block-end: ${name}`;
        const si = content.indexOf(start);
        const ei = content.indexOf(end);
        if (si >= 0 && ei >= 0) {
          node.value = content.slice(si + start.length, ei).trim();
        }
      } else {
        node.value = content.trim();
      }
    });
  };
}
