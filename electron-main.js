const { app, BrowserWindow, shell, ipcMain, safeStorage } = require('electron');
const http = require('http');
const crypto = require('crypto');
const path = require('path');
const { CLIENT_ID, REDIRECT_URI } = require('./discord-login');
const { saveSession, loadSession, clearSession } = require('./discord-session');

let win;
let loginServer;
let discordUser = null;
let restoringSession = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1280,
    minHeight: 800,
    title: 'Project PARADOX',
    backgroundColor: '#101010',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('launcher/index.html');
}

async function fetchDiscordUser(accessToken) {
  const response = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) throw new Error('Discord session invalid');

  const user = await response.json();

  return {
    id: user.id,
    username: user.username,
    global_name: user.global_name || user.username,
    avatar: user.avatar || null
  };
}

async function restoreSession() {
  if (restoringSession) return restoringSession;

  restoringSession = (async () => {
    const saved = loadSession();
    if (!saved || !saved.refresh_token) return null;

    try {
      let accessToken = saved.access_token;

      if (!saved.expires_at || Date.now() >= saved.expires_at) {
        const body = new URLSearchParams({
          client_id: CLIENT_ID,
          grant_type: 'refresh_token',
          refresh_token: saved.refresh_token
        });

        const response = await fetch('https://discord.com/api/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body
        });

        const tokenData = await response.json();
        if (!response.ok) throw new Error('Refresh failed');

        saved.access_token = tokenData.access_token;
        saved.refresh_token = tokenData.refresh_token || saved.refresh_token;
        saved.expires_at = Date.now() + (tokenData.expires_in || 3600) * 1000;
        saveSession(saved);
        accessToken = saved.access_token;
      }

      discordUser = await fetchDiscordUser(accessToken);
      return discordUser;
    } catch {
      clearSession();
      discordUser = null;
      return null;
    }
  })();

  return restoringSession;
}

ipcMain.handle('discord-user-get', async () => {
  await restoreSession();
  return discordUser;
});

ipcMain.handle('discord-logout', () => {
  clearSession();
  discordUser = null;
  win?.webContents.send('discord-logout');
  return { success: true };
});

ipcMain.handle('discord-login-start', async () => {
  if (loginServer) throw new Error('התחברות כבר בתהליך.');

  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  const state = crypto.randomBytes(16).toString('hex');

  return new Promise((resolve, reject) => {
    loginServer = http.createServer(async (req, res) => {
      const url = new URL(req.url, REDIRECT_URI);

      if (url.pathname !== '/callback') {
        res.writeHead(404).end('Not found');
        return;
      }

      if (url.searchParams.get('state') !== state) {
        res.writeHead(400).end('Invalid state');
        loginServer.close();
        loginServer = null;
        reject(new Error('בדיקת האבטחה נכשלה.'));
        return;
      }

      const code = url.searchParams.get('code');
      if (!code) {
        res.writeHead(400).end('Missing code');
        loginServer.close();
        loginServer = null;
        reject(new Error('לא התקבל קוד מדיסקורד.'));
        return;
      }

      try {
        const body = new URLSearchParams({
          client_id: CLIENT_ID,
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
          code_verifier: verifier
        });

        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body
        });

        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) throw new Error('Discord token exchange failed.');

        const user = await fetchDiscordUser(tokenData.access_token);

        const session = {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: Date.now() + (tokenData.expires_in || 3600) * 1000
        };

        if (session.refresh_token) {
          saveSession(session);
        }

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h2>Discord connected! You can return to Project PARADOX.</h2>');

        discordUser = user;
        win?.webContents.send('discord-login-success', discordUser);

        resolve({ started: true });
      } catch (error) {
        res.writeHead(500).end('Discord login failed. Return to the app and try again.');
        win?.webContents.send('discord-login-error', 'ההתחברות לדיסקורד נכשלה. נסה שוב.');
        reject(error);
      } finally {
        if (loginServer) loginServer.close();
        loginServer = null;
      }
    });

    loginServer.once('error', () => {
      loginServer = null;
      reject(new Error('לא ניתן לפתוח את כתובת ההתחברות המקומית.'));
    });

    loginServer.listen(42813, '127.0.0.1', async () => {
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        scope: 'identify',
        code_challenge: challenge,
        code_challenge_method: 'S256',
        state
      });

      try {
        await shell.openExternal(`https://discord.com/oauth2/authorize?${params}`);
      } catch {
        if (loginServer) loginServer.close();
        loginServer = null;
        reject(new Error('לא ניתן לפתוח את הדפדפן.'));
      }
    });
  });
});

app.whenReady().then(createWindow);
