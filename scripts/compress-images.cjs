/**
 * scripts/compress-images.js — Moab Springs Ranch
 * Compresses images in dist/images/ after Vite build.
 * Uses sharp (CommonJS compatible).
 */

'use strict';

const sharp    = require('sharp');
const fs       = require('fs');
const path     = require('path');

const DIST_IMAGES = path.join(process.cwd(), 'dist', 'images');

const QUALITY_MAP = {
  'home':        80,
  'about':       80,
  'amenities':   80,
  'contact':     80,
  'exploremoab': 78,
  'gallery':     75,
  'rooms':       78,
  'unit':        78,
  'policies':    80,
  'common':      82,
};

function getFiles(dir) {
  var results = [];
  try {
    var entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach(function(e) {
      var full = path.join(dir, e.name);
      if (e.isDirectory()) {
        results = results.concat(getFiles(full));
      } else if (/\.(webp|jpg|jpeg|png)$/i.test(e.name)) {
        results.push(full);
      }
    });
  } catch(e) {}
  return results;
}

function getQuality(filePath) {
  var parts  = filePath.replace(/\\/g, '/').split('/');
  var idx    = parts.indexOf('images');
  var folder = idx >= 0 ? parts[idx + 1] : '';
  return QUALITY_MAP[folder] || 78;
}

async function run() {
  var files = getFiles(DIST_IMAGES);
  var saved = 0;
  var processed = 0;

  for (var i = 0; i < files.length; i++) {
    var file    = files[i];
    var ext     = path.extname(file).toLowerCase();
    var before  = fs.statSync(file).size;
    var quality = getQuality(file);

    try {
      var s = sharp(file);
      if (ext === '.jpg' || ext === '.jpeg') {
        s = s.jpeg({ quality: quality, progressive: true });
      } else if (ext === '.png') {
        s = s.png({ quality: quality, compressionLevel: 9 });
      } else if (ext === '.webp') {
        s = s.webp({ quality: quality });
      } else {
        continue;
      }

      var buffer = await s.toBuffer();
      var after  = buffer.length;

      if (after < before) {
        fs.writeFileSync(file, buffer);
        var saving = Math.round((1 - after / before) * 100);
        console.log('  \u2705 ' + path.basename(file) + ': ' +
          Math.round(before / 1024) + 'KB \u2192 ' +
          Math.round(after / 1024) + 'KB (-' + saving + '%)');
        saved += (before - after);
      } else {
        console.log('  \u23ED  ' + path.basename(file) + ': already optimal (' + Math.round(before / 1024) + 'KB)');
      }
      processed++;
    } catch(err) {
      console.warn('  \u26A0\uFE0F  ' + path.basename(file) + ': skipped \u2014 ' + err.message);
    }
  }

  console.log('\n\u2705 Images compressed: ' + processed + ' files, ' + Math.round(saved / 1024) + 'KB saved total');
}

run().catch(function(e) { console.error(e); process.exit(1); });
