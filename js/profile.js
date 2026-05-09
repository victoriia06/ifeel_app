const USER_NAME_KEY = 'journalUserName';

function loadUserName() {
  const saved = localStorage.getItem(USER_NAME_KEY);
  if (saved) { window.userName = saved; }
  updateUserNameDisplay();
}

function saveUserName(name) {
  window.userName = name;
  localStorage.setItem(USER_NAME_KEY, name);
  updateUserNameDisplay();
}

function updateUserNameDisplay() {
  const d = document.getElementById('userNameDisplay');
  if (d) d.textContent = window.userName || 'Ваше имя';
}

function initProfile() {
  document.getElementById('editProfileBtn').addEventListener('click', function() {
    document.getElementById('userNameDisplay').style.display = 'none';
    document.getElementById('userNameEdit').style.display = 'block';
    document.getElementById('nameInput').value = window.userName || '';
    document.getElementById('nameInput').focus();
  });
  
  document.getElementById('cancelNameBtn').addEventListener('click', function() {
    document.getElementById('userNameDisplay').style.display = 'block';
    document.getElementById('userNameEdit').style.display = 'none';
  });
  
  document.getElementById('saveNameBtn').addEventListener('click', function() {
    const n = document.getElementById('nameInput').value.trim();
    if (!n) { showToast('Введите имя', 'error'); return; }
    saveUserName(n);
    document.getElementById('userNameDisplay').style.display = 'block';
    document.getElementById('userNameEdit').style.display = 'none';
    showToast('Имя сохранено');
  });
  
  document.getElementById('nameInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') document.getElementById('saveNameBtn').click();
  });
}