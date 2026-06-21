import { cpSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = resolve(__dirname, '../node_modules/kuromoji/dict');
const dest = resolve(__dirname, '../public/dict');

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log('kuromoji dict copied to public/dict');
