import fs from 'node:fs';
import path from 'node:path';

const INPUT_PATH = path.join(import.meta.dirname, 'content');
const OUTPUT_PATH = path.join(import.meta.dirname, '..', 'build');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_PATH)) {
  fs.mkdirSync(OUTPUT_PATH, { recursive: true });
}

generate();

function generate() {
  const inputFiles = fs.readdirSync(INPUT_PATH);

  inputFiles.forEach((file) => {
    if (file.startsWith('_')) {
      return;
    }

    const inputFilePath = path.join(INPUT_PATH, file);
    const outputFilePath = path.join(OUTPUT_PATH, file);

    const content = fs.readFileSync(inputFilePath, 'utf-8');
    const transformedContent = content.replace(/{{{([^}]+)}}}/g, (_, templatePath) => {
      const inputDirname = path.dirname(inputFilePath);
      const templateContent = fs.readFileSync(
        path.join(inputDirname, templatePath.trim()),
        'utf-8',
      );

      return templateContent;
    });

    fs.writeFileSync(outputFilePath, transformedContent, 'utf-8');
    console.log(`Generated: ${outputFilePath}`);
  });
}
