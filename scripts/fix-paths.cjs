/**
 * scripts/fix-paths.cjs — Moab Springs Ranch
 *
 * Post-build: 
 *   1. Restores image paths Vite strips during processing
 *   2. Restores .html extensions to internal links (for IIS/Windows server)
 *   3. Removes flat image copies from dist/images/ root
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const DIST    = path.resolve(process.cwd(), 'dist');
const IMG_DIR = path.join(DIST, 'images');

// ── Step 1: Build path map ──────────────────────────────────────────────
const pathMap = {};
fs.readdirSync(IMG_DIR, { withFileTypes: true })
  .filter(function(e) { return e.isDirectory(); })
  .forEach(function(sub) {
    fs.readdirSync(path.join(IMG_DIR, sub.name), { withFileTypes: true })
      .filter(function(f) {
        return f.isFile() && /\.(webp|jpg|jpeg|png|gif|svg|ico)$/i.test(f.name);
      })
      .forEach(function(f) {
        pathMap[f.name] = '/images/' + sub.name + '/' + f.name;
      });
  });

console.log('\nfix-paths: ' + Object.keys(pathMap).length + ' images mapped');

// ── Step 2: Fix all HTML files ──────────────────────────────────────────
var htmlFiles = fs.readdirSync(DIST).filter(function(f) { return f.endsWith('.html'); });
var totalImgs = 0;
var totalLinks = 0;

// Pages that map to .html filenames
var pageNames = ['rooms','unit','about','amenities','gallery',
                 'exploremoab','contact','policies','resortcam'];

htmlFiles.forEach(function(file) {
  var fp   = path.join(DIST, file);
  var html = fs.readFileSync(fp, 'utf-8');

  // Fix image src paths
  html = html.replace(
    /src="\/([^"/]+\.(webp|jpg|jpeg|png|gif|svg|ico))"/gi,
    function(m, name) {
      if (pathMap[name]) { totalImgs++; return 'src="' + pathMap[name] + '"'; }
      return m;
    }
  );

  // Fix background url paths
  html = html.replace(
    /url\('\/([^'/]+\.(webp|jpg|jpeg|png|gif|svg|ico))'\)/gi,
    function(m, name) {
      if (pathMap[name]) { totalImgs++; return "url('" + pathMap[name] + "')"; }
      return m;
    }
  );

  // Restore .html to internal page links including anchors:
  // /rooms → /lodging
  // /rooms#bungalows → /lodging#bungalows
  html = html.replace(
    /href="\/([a-z0-9-]+)(#[^"]*)?"/g,
    function(m, page, anchor) {
      if (pageNames.indexOf(page) !== -1) {
        totalLinks++;
        return 'href="/' + page + '.html' + (anchor || '') + '"';
      }
      return m;
    }
  );

  fs.writeFileSync(fp, html, 'utf-8');
});

console.log('fix-paths: restored ' + totalImgs + ' image paths, ' + totalLinks + ' links (.html)\n');

// ── Step 3: Remove flat image copies ───────────────────────────────────
var removed = 0;
fs.readdirSync(IMG_DIR, { withFileTypes: true })
  .filter(function(e) {
    return e.isFile() && /\.(webp|jpg|jpeg|png|gif|svg|ico)$/i.test(e.name);
  })
  .forEach(function(e) {
    fs.unlinkSync(path.join(IMG_DIR, e.name));
    removed++;
  });

if (removed > 0) console.log('fix-paths: removed ' + removed + ' flat copies from dist/images/');
