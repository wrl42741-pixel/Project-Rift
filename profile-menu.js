const profileButton = document.getElementById('profile-button');
const profileMenu = document.getElementById('profile-menu');

if (profileButton && profileMenu) {
  profileButton.addEventListener('click', event => {
    event.preventDefault();
    profileMenu.style.display = profileMenu.style.display === 'none' ? 'block' : 'none';
  });

  document.addEventListener('click', event => {
    if (!profileButton.contains(event.target) && !profileMenu.contains(event.target)) {
      profileMenu.style.display = 'none';
    }
  });
}
