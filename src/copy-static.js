import fs from 'node:fs';
import path from 'node:path';

const STATIC_PATH = path.join(import.meta.dirname, '..', 'static');
const OUTPUT_PATH = path.join(import.meta.dirname, '..', 'build');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_PATH)) {
  fs.mkdirSync(OUTPUT_PATH, { recursive: true });
}

copyStatic();

function copyStatic() {
  copyDirectory(STATIC_PATH, OUTPUT_PATH);
  console.log('Static files copied to build directory');
}

function copyDirectory(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${destPath}`);
    }
  }
}
