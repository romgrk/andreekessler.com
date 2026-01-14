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
  const layoutTemplate = fs.readFileSync(path.join(INPUT_PATH, '_layout.html'), 'utf-8');
  processDirectory(INPUT_PATH, OUTPUT_PATH, layoutTemplate);
}

function processDirectory(inputDir, outputDir, layoutTemplate) {
  const entries = fs.readdirSync(inputDir, { withFileTypes: true });
  const isRootContentDir = inputDir === INPUT_PATH;

  entries.forEach((entry) => {
    // In root content directory, skip all files starting with _
    // In subdirectories, only skip _ files that don't start with _p_
    if (isRootContentDir && entry.name.startsWith('_')) {
      return;
    }
    if (!isRootContentDir && entry.name.startsWith('_') && !entry.name.startsWith('_p_')) {
      return;
    }

    const inputPath = path.join(inputDir, entry.name);
    const outputPath = path.join(outputDir, entry.name);

    if (entry.isDirectory()) {
      // Create output directory and process recursively
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }
      processDirectory(inputPath, outputPath, layoutTemplate);
    } else if (entry.name.endsWith('.html')) {
      // Process HTML file
      let content = fs.readFileSync(inputPath, 'utf-8');

      // If content doesn't start with <!doctype html>, wrap it in layout
      if (!content.trim().startsWith('<!doctype html>')) {
        content = layoutTemplate.replace('{{{ CONTENT }}}', content);
      }

      // Process all template includes
      const transformedContent = content.replace(/{{{([^}]+)}}}/g, (_, templatePath) => {
        // Look for templates in the INPUT_PATH root (where _layout.html, _header.html are)
        const templateContent = fs.readFileSync(
          path.join(INPUT_PATH, templatePath.trim()),
          'utf-8',
        );

        return templateContent;
      });

      fs.writeFileSync(outputPath, transformedContent, 'utf-8');
      console.log(`Generated: ${outputPath}`);
    }
  });
}
