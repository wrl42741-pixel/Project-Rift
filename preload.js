const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('discordAuth', {
  login: () => ipcRenderer.invoke('discord-login-start'),
  onSuccess: (callback) => {
    ipcRenderer.on('discord-login-success', (_event, user) => callback(user));
  },
  onError: (callback) => {
    ipcRenderer.on('discord-login-error', (_event, message) => callback(message));
  }
});
