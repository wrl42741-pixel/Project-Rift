
const settingsPanel = document.getElementById('settings-panel');

document.querySelectorAll('.nav-item').forEach(item=>item.addEventListener('click',e=>{
e.preventDefault();
document.querySelectorAll('.nav-item').forEach(link=>link.classList.remove('active'));
item.classList.add('active');
const isSettings = item.dataset.page === 'Settings';
document.body.classList.toggle('settings-open', isSettings);
if (settingsPanel) settingsPanel.style.display = isSettings ? 'block' : 'none';
}));

const settingsBack = document.getElementById('settings-back');
if (settingsBack) settingsBack.addEventListener('click',()=>{
document.body.classList.remove('settings-open');
if (settingsPanel) settingsPanel.style.display = 'none';
document.querySelectorAll('.nav-item').forEach(link=>link.classList.remove('active'));
document.querySelector('[data-page="Home"]').classList.add('active');
});


const settingsAvatar = document.getElementById('settings-avatar');
const settingsUsername = document.getElementById('settings-username');
if (settingsAvatar && document.getElementById('discord-avatar')) {
  settingsAvatar.src = document.getElementById('discord-avatar').src;
}
if (settingsUsername && document.getElementById('discord-username')) {
  const syncProfile = () => {
    settingsUsername.textContent = document.getElementById('discord-username').textContent || 'Your Discord Account';
    settingsAvatar.src = document.getElementById('discord-avatar').src;
  };
  syncProfile();
  if (window.discordAuth) window.discordAuth.onSuccess(syncProfile);
}
document.querySelectorAll('[data-build]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-build]').forEach(b => b.classList.remove('selected'));
  button.classList.add('selected');
}));
document.querySelectorAll('[data-resolution]').forEach(button => button.addEventListener('click', () => {
  const select = document.getElementById('resolution-select');
  if (button.dataset.resolution === 'restore') select.value = '1920x1080';
  if (button.dataset.resolution === 'known') select.value = '1920x1080';
  if (button.dataset.resolution === 'custom' || button.dataset.resolution === 'custom2') select.value = '1600x900';
}));
document.getElementById('fov-slider').addEventListener('input', event => {
  document.getElementById('fov-value').textContent = event.target.value + 'F';
});
document.getElementById('apply-settings').addEventListener('click', () => {
  document.getElementById('settings-message').textContent = 'Settings selected.';
});

const discordButton = document.getElementById('discordLogin');
const loginScreen = document.getElementById('login-screen');
const loginStatus = document.getElementById('login-status');

if (discordButton) {
  discordButton.addEventListener('click', async (event) => {
    event.preventDefault();
    discordButton.textContent = 'Opening Discord...';
    discordButton.disabled = true;
    loginStatus.textContent = 'Complete sign-in in your browser.';
    try {
      await window.discordAuth.login();
    } catch (error) {
      discordButton.textContent = 'Continue with Discord';
      discordButton.disabled = false;
      loginStatus.textContent = error.message || 'Could not start Discord login.';
    }
  });
}

if (window.discordAuth) {
  window.discordAuth.onSuccess(user => {
    const heading = document.querySelector('.login-title');
    const subtitle = document.querySelector('.login-sub');
    if (heading) heading.textContent = 'Welcome, ' + (user.global_name || user.username) + '!';
    if (subtitle) subtitle.textContent = 'Discord connected successfully';
    if (loginScreen) loginScreen.style.display = 'none';
    const userBox = document.getElementById('discord-user');
    const userName = document.getElementById('discord-username');
    const avatar = document.getElementById('discord-avatar');
    if (userName) userName.textContent = user.global_name || user.username;
    if (avatar) avatar.src = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
      : `https://cdn.discordapp.com/embed/avatars/0.png`;
    if (userBox) userBox.style.display = 'flex';
  });

  window.discordAuth.onError(message => {
    if (loginStatus) loginStatus.textContent = message;
    if (discordButton) {
      discordButton.textContent = 'Continue with Discord';
      discordButton.disabled = false;
    }
  });
}
