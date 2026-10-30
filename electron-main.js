const { app, BrowserWindow, shell, ipcMain } = require('electron');
const http = require('http');
const crypto = require('crypto');
const path = require('path');
const { CLIENT_ID, REDIRECT_URI } = require('./discord-login');

let win;
let loginServer;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 720,
    title: 'Project RIFT',
    backgroundColor: '#101010',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('launcher/index.html');
}

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

        const userResponse = await fetch('https://discord.com/api/users/@me', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });

        const user = await userResponse.json();
        if (!userResponse.ok) throw new Error('Could not retrieve Discord profile.');

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h2>Discord connected! You can return to Project RIFT.</h2>');

        win?.webContents.send('discord-login-success', {
          username: user.username,
          global_name: user.global_name || user.username,
          avatar: user.avatar || null
        });

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

    loginServer.once('error', (error) => {
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
      } catch (error) {
        if (loginServer) loginServer.close();
        loginServer = null;
        reject(new Error('לא ניתן לפתוח את הדפדפן.'));
      }
    });
  });
});

app.whenReady().then(createWindow);
