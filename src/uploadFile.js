const fs = require('fs');
const os = require('os');
const path = require('path');

function sanitizeFilename(name, fallback) {
  const raw = path.basename(String(name || ''));
  const safe = raw.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+/, '');
  return safe || fallback;
}

function extensionFromMimeType(mimeType) {
  const map = {
    'text/plain': '.txt',
    'text/csv': '.csv',
    'application/json': '.json',
    'application/pdf': '.pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
  };

  return map[String(mimeType || '').toLowerCase()] || '';
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid data URL format');
  }

  return {
    mimeType: match[1],
    data: Buffer.from(match[2], 'base64'),
  };
}

function saveUploadedFile({ dataUrl, name, defaultExtension = '.bin', tempSubdir = 'copilot-office-files' }) {
  if (!dataUrl) {
    throw new Error('Missing file data');
  }

  const { mimeType, data } = parseDataUrl(dataUrl);
  const tempDir = path.join(os.tmpdir(), tempSubdir);

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const safeName = sanitizeFilename(name, `upload-${Date.now()}`);
  const ext = path.extname(safeName) || extensionFromMimeType(mimeType) || defaultExtension;
  const base = path.basename(safeName, path.extname(safeName));
  let finalName = `${base}${ext}`;
  let filePath = path.join(tempDir, finalName);
  let suffix = 1;

  while (fs.existsSync(filePath)) {
    finalName = `${base}-${suffix}${ext}`;
    filePath = path.join(tempDir, finalName);
    suffix += 1;
  }

  fs.writeFileSync(filePath, data);

  return { path: filePath, name: finalName, mimeType };
}

module.exports = { saveUploadedFile };
