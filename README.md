# andreekessler.com

https://andreekessler.com/

## Project Structure

```
andreekessler.com/
├── src/
│   ├── content/          # HTML source files and templates
│   │   ├── _headContent.html  # Head template
│   │   ├── _header.html       # Header template
│   │   ├── index.html         # Main page
│   │   ├── styles.css         # Tailwind CSS source
│   │   └── *.html            # Other pages
│   ├── generate.js       # HTML generator script
│   └── copy-static.js    # Static files copy script
├── static/              # Static assets
│   ├── images/          # Image files
│   ├── videos/          # Video files
│   ├── scripts.js       # JavaScript
│   └── *.png, *.ico     # Favicons
└── build/              # Generated output (gitignored)
    ├── *.html          # Generated HTML files
    ├── styles.css      # Generated CSS
    ├── images/         # Copied images
    └── ...             # Other static files
```

## Development

### Install Dependencies
```bash
npm install
```

### Build the Site
```bash
npm run generate
# or
npm run build
```

This will:
1. Copy static files from `static/` to `build/`
2. Generate HTML files from `src/content/` to `build/`
3. Compile Tailwind CSS from `src/content/styles.css` to `build/styles.css`

### Watch Mode
```bash
npm start
```

This watches for changes in `src/` and `static/` directories and rebuilds automatically.

## Scripts

- `npm run generate` - Build the entire site
- `npm run build` - Alias for generate
- `npm run copy:static` - Copy static files only
- `npm run generate:html` - Generate HTML files only
- `npm run generate:css` - Generate CSS only
- `npm start` - Watch mode with auto-rebuild
