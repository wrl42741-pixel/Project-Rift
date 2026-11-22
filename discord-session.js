const { app, safeStorage } = require('electron');
const fs = require('fs');
const path = require('path');

const sessionPath = path.join(app.getPath('userData'), 'discord-session.enc');

function saveSession(data) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Encryption unavailable');
  }

  const encrypted = safeStorage.encryptString(JSON.stringify(data));
  fs.writeFileSync(sessionPath, encrypted);
}

function loadSession() {
  try {
    if (!safeStorage.isEncryptionAvailable()) return null;

    const encrypted = fs.readFileSync(sessionPath);
    const decrypted = safeStorage.decryptString(encrypted);
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

function clearSession() {
  try {
    fs.unlinkSync(sessionPath);
  } catch {}
}

module.exports = { saveSession, loadSession, clearSession };
