const logoutButton = document.getElementById('logout-button');

if (logoutButton && window.discordAuth) {
  logoutButton.addEventListener('click', async () => {
    try {
      await window.discordAuth.logout();
      if (profileMenu) profileMenu.style.display = 'none';
      if (loginScreen) loginScreen.style.display = 'flex';
      const status = document.getElementById('loginStatus');
      if (status) status.textContent = '';
    } catch (error) {
      console.error('Logout failed', error);
    }
  });
}
