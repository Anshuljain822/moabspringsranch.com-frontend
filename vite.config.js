import { defineConfig }                        from 'vite';
import { resolve }                             from 'path';
import { readFileSync, readdirSync,
         statSync, unlinkSync }                from 'fs';
import compression                             from 'vite-plugin-compression';
import { viteStaticCopy }                      from 'vite-plugin-static-copy';

// ── CSS sitewide — edit here only ───────────────────────────────────────
const CSS_LINKS = `
  <link rel="stylesheet" href="/css/bootstrap.min.css">
  <link rel="stylesheet" href="/css/style.css">
  <link rel="stylesheet" href="/css/responsive.css">
  <link rel="stylesheet" href="/css/owl.carousel.min.css">
  <link rel="icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="48x48" href="/favicon.png">`;

// ── JS sitewide — edit here only ────────────────────────────────────────
const SCRIPT_TAGS = `
  <script src="/js/jquery.min.js"></script>
  <script src="/js/bootstrap.bundle.min.js" defer></script>
  <script src="/js/owl.carousel.js" defer></script>
  <script src="/js/custom.js" defer></script>`;

const HOME_PAGE = 'index.html';

// ── Main plugin: inject includes + CSS + JS ──────────────────────────────
// Uses TWO transform passes:
//   pass 1 (pre)  — inject header/footer HTML includes
//   pass 2 (post) — inject CSS links and script tags
//   This order matters: Vite rewrites <head> between pre and post,
//   so CSS must be injected in post to survive Vite's own processing.
function injectAll() {
  return {
    name: 'inject-all',

    // Pass 1 (pre): inject header + footer HTML
    // CSS_PLACEHOLDER and SCRIPTS_PLACEHOLDER stay as-is for pass 2
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const filename = ctx.filename ? ctx.filename.split(/[\\/]/).pop() : '';
        const isHome   = filename === HOME_PAGE || filename === '';
        const header   = readFileSync(
          isHome ? './includes/header.html' : './includes/header-inner.html',
          'utf-8'
        );
        const footer   = readFileSync('./includes/footer.html', 'utf-8');

        return html
          .replace(/<!--\s*HEADER_PLACEHOLDER\s*-->/g, header)
          .replace(/<!--\s*FOOTER_PLACEHOLDER\s*-->/g,  footer);
      }
    }
  };
}

// Pass 2 (post): inject CSS before </head> and JS before </body>
// Runs AFTER Vite has finished all its own head processing
function injectAssetsPost() {
  return {
    name: 'inject-assets-post',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        // Replace CSS_PLACEHOLDER with actual links
        // Also inject before </head> as fallback if placeholder is gone
        let result = html;

        if (result.includes('<!-- CSS_PLACEHOLDER -->')) {
          result = result.replace(/<!--\s*CSS_PLACEHOLDER\s*-->/g, CSS_LINKS);
        } else {
          // Vite removed the placeholder — inject before </head>
          result = result.replace('</head>', `${CSS_LINKS}\n</head>`);
        }

        if (result.includes('<!-- SCRIPTS_PLACEHOLDER -->')) {
          result = result.replace(/<!--\s*SCRIPTS_PLACEHOLDER\s*-->/g, SCRIPT_TAGS);
        } else {
          // Inject before </body> as fallback
          result = result.replace('</body>', `${SCRIPT_TAGS}\n</body>`);
        }

        return result;
      }
    }
  };
}

// ── Plugin: delete flat Rollup copies from dist root ────────────────────
function cleanFlatAssets() {
  return {
    name: 'clean-flat-assets',
    closeBundle() {
      const distDir = resolve(process.cwd(), 'dist');
      try {
        for (const entry of readdirSync(distDir)) {
          const fullPath = `${distDir}/${entry}`;
          if (statSync(fullPath).isFile()) {
            // Keep only HTML, txt, xml, ico, png, web.config at dist root
            if (!/\.(html|txt|xml|ico|png)$/.test(entry) && entry !== 'web.config') {
              unlinkSync(fullPath);
            }
          }
        }
      } catch(e) {}
    }
  };
}

export default defineConfig({
  root: '.',
  publicDir: false,

  plugins: [
    injectAll(),
    injectAssetsPost(),

    viteStaticCopy({
      targets: [
        { src: 'css/*',       dest: 'css'    },
        { src: 'js/*',        dest: 'js'     },
        { src: 'fonts/*',     dest: 'fonts'  },
        { src: 'images/**/*', dest: 'images' },
        { src: 'favicon.ico', dest: '.'      },
        { src: 'favicon.png', dest: '.'      },
        { src: 'robots.txt',  dest: '.'      },
        { src: 'sitemap.xml', dest: '.'      },
        { src: 'web.config',  dest: '.'      },
      ]
    }),

    cleanFlatAssets(),

    compression({ algorithm: 'gzip',          ext: '.gz', threshold: 1024, deleteOriginFile: false, filter: /\.(js|css|woff2?|ttf|otf|svg)$/i }),
    compression({ algorithm: 'brotliCompress', ext: '.br', threshold: 1024, deleteOriginFile: false, filter: /\.(js|css|woff2?|ttf|otf|svg)$/i }),
  ],

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    assetsInlineLimit: 0,

    rollupOptions: {
      input: {
        index:       resolve(__dirname, 'index.html'),
        lodging:       resolve(__dirname, 'lodging.html'),
        unit:        resolve(__dirname, 'unit.html'),
        theranch:       resolve(__dirname, 'the-ranch.html'),
        ranchfeatures:   resolve(__dirname, 'ranch-features.html'),
        gallery:     resolve(__dirname, 'gallery.html'),
        exploremoab: resolve(__dirname, 'explore-moab.html'),
        contact:     resolve(__dirname, 'contact.html'),
        faq:    resolve(__dirname, 'faq.html'),
        webcam:   resolve(__dirname, 'webcam.html'),
      },
      output: {
        assetFileNames: '[name][extname]',
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
      },
    },

    chunkSizeWarningLimit: 500,
  },

  server: {
    port: 5173,
    open: true,
    rewrites: [{ from: /^\/([a-z0-9-]+)$/, to: (ctx) => `/${ctx.match[1]}.html` }],
  },

  preview: {
    port: 4173,
    rewrites: [{ from: /^\/([a-z0-9-]+)$/, to: (ctx) => `/${ctx.match[1]}.html` }],
  }
});
