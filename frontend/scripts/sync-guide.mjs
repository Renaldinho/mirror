import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';

// Keep the root TXT as the source of truth for both the desktop and kiosk guide.
const source = new URL('../../PI-INSTRUCTIONS.txt', import.meta.url);
copyFileSync(source,
  new URL('../public/PI-INSTRUCTIONS.txt', import.meta.url));

// Embed help in the UI too: reading it must not depend on a second HTTP request.
const module = new URL('../src/app/dashboard/pi-instructions.generated.ts', import.meta.url);
const contents = '// Generated from PI-INSTRUCTIONS.txt. Edit the root TXT instead.\n'
  + `export const PI_INSTRUCTIONS = ${JSON.stringify(readFileSync(source, 'utf8'))};\n`;
if (!existsSync(module) || readFileSync(module, 'utf8') !== contents) writeFileSync(module, contents);
