const changeNameButton = document.getElementById('change-name-button');

if (changeNameButton) {
  changeNameButton.addEventListener('click', () => {
    const currentName = document.getElementById('discord-username')?.textContent || '';
    const newName = prompt('Enter your new display name:', currentName);

    if (newName && newName.trim()) {
      const name = newName.trim();
      const usernameElement = document.getElementById('discord-username');

      if (usernameElement) usernameElement.textContent = name;

      localStorage.setItem('paradox-display-name', name);
    }
  });
}
