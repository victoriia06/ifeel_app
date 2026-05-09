const screens = {
  main: document.getElementById('mainScreen'),
  menu: document.getElementById('menuScreen'),
  diary: document.getElementById('diaryScreen'),
  edit: document.getElementById('editScreen'),
  analytics: document.getElementById('analyticsScreen')
};

let modalResolve = null;

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast ' + type + ' show';
  setTimeout(() => { toast.className = 'toast'; }, 2000);
}

function showModal() {
  return new Promise((resolve) => {
    modalResolve = resolve;
    document.getElementById('modalOverlay').classList.add('show');
  });
}

function showModalWithMessage(message) {
  document.getElementById('modalMessage').textContent = message;
  return showModal();
}

document.getElementById('modalCancel').addEventListener('click', () => {
  document.getElementById('modalOverlay').classList.remove('show');
  if (modalResolve) { modalResolve(false); modalResolve = null; }
});

document.getElementById('modalConfirm').addEventListener('click', () => {
  document.getElementById('modalOverlay').classList.remove('show');
  if (modalResolve) { modalResolve(true); modalResolve = null; }
});

function showScreen(screenName, param = null) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  
  if (screenName === 'main') {
    screens.main.classList.add('active');
    if (param) {
      const [y, m, d] = param.split('-').map(Number);
      currentYear = y; currentMonth = m - 1; selectedDay = d; dayManuallySelected = true;
      updateDateSelectors(); updateDayDisplay(); renderCalendar();
    } else { loadCalendarMoods(); }
  } else if (screenName === 'menu') { screens.menu.classList.add('active'); }
  else if (screenName === 'diary') { screens.diary.classList.add('active'); loadDiaryEntries(); }
  else if (screenName === 'edit') { screens.edit.classList.add('active'); loadEditEntry(param); }
  else if (screenName === 'analytics') { screens.analytics.classList.add('active'); loadAnalytics(); }
}

// Инициализация настроений на главном экране
function initMoods() {
  const moodContainer = document.getElementById('moodContainer');
  let selectedMood = null;
  
  function selectMood(moodType) { selectedMood = moodType; updateButtons(); }
  function updateButtons() {
    moodContainer.querySelectorAll('.mood-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mood') === selectedMood);
    });
  }
  window.getSelectedMood = function(container) {
    const b = (container || moodContainer).querySelector('.mood-btn.active');
    return b ? b.getAttribute('data-mood') : null;
  };
  window.selectMood = selectMood;
  
  moodContainer.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      selectMood(selectedMood === this.getAttribute('data-mood') ? null : this.getAttribute('data-mood'));
    });
  });
}

// Инициализация активностей на главном экране
function initActivities() {
  const container = document.getElementById('activitiesContainer');
  const selAct = document.getElementById('selectedActivities');
  const dropdown = document.getElementById('activitiesDropdown');
  const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
  let selectedList = [];
  
  function updateDisplay() {
    if (selectedList.length === 0) {
      selAct.innerHTML = '<span class="placeholder-tag">Выберите активности...</span>';
    } else {
      selAct.innerHTML = selectedList.map(a => `<div class="activity-tag">${a}<div class="remove-tag" data-activity="${a}">✕</div></div>`).join('');
      selAct.querySelectorAll('.remove-tag').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          selectedList = selectedList.filter(x => x !== btn.getAttribute('data-activity'));
          checkboxes.forEach(cb => { if (cb.value === btn.getAttribute('data-activity')) cb.checked = false; });
          updateDisplay();
        });
      });
    }
  }
  
  window.getSelectedActivities = () => selectedList;
  window.setSelectedActivities = (arr) => { selectedList = arr; updateDisplay(); };
  window.clearActivities = () => { selectedList = []; updateDisplay(); checkboxes.forEach(cb => cb.checked = false); };
  
  selAct.addEventListener('wheel', function(e) {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); selAct.scrollLeft += e.deltaY; }
  }, { passive: false });
  
  container.addEventListener('click', function(e) {
    if (e.target.closest('.remove-tag')) return;
    const isOpen = dropdown.style.display === 'block';
    dropdown.style.display = isOpen ? 'none' : 'block';
    container.classList.toggle('open', !isOpen);
  });
  
  document.addEventListener('click', function(e) {
    if (!container.contains(e.target)) { dropdown.style.display = 'none'; container.classList.remove('open'); }
  });
  
  checkboxes.forEach(cb => {
    cb.addEventListener('change', function() {
      if (this.checked) { if (!selectedList.includes(this.value)) selectedList.push(this.value); }
      else { selectedList = selectedList.filter(a => a !== this.value); }
      updateDisplay();
    });
  });
}

// Инициализация кнопки Сохранить на главном экране
function initMainSave() {
  document.getElementById('mainSaveBtn').addEventListener('click', async function() {
    const mood = window.getSelectedMood();
    if (!mood) { showToast('Выберите эмоцию', 'error'); return; }
    const dateStr = getSelectedDateString();
    await saveEntry({
      id: Date.now().toString(),
      date: dateStr,
      mood,
      text: document.querySelector('#mainScreen .journal-box').value,
      activities: [...window.getSelectedActivities()],
      createdAt: new Date().toISOString()
    });
    currentCalendarEntries[dateStr] = mood;
    renderCalendar();
    showToast('Запись сохранена');
    // Очистка полей
    window.selectMood(null);
    document.querySelector('#mainScreen .journal-box').value = '';
    window.clearActivities();
  });
}

// Инициализация навигации
function initNavigation() {
  document.getElementById('menuBtn').addEventListener('click', () => showScreen('menu'));
  document.getElementById('backBtn').addEventListener('click', () => showScreen('main'));
  document.getElementById('diaryMenuBtn').addEventListener('click', () => showScreen('diary'));
  document.getElementById('diaryBackBtn').addEventListener('click', () => showScreen('menu'));
  document.getElementById('editBackBtn').addEventListener('click', () => showScreen('diary'));
  document.getElementById('analyticsMenuBtn').addEventListener('click', () => showScreen('analytics'));
  document.getElementById('analyticsBackBtn').addEventListener('click', () => showScreen('menu'));
  document.getElementById('settingsMenuBtn').addEventListener('click', () => {showToast('Временно недоступно', 'error');});
}

// Запуск приложения
async function init() {
  await getDB();
  loadUserName();
  initCalendar();
  initMoods();
  initActivities();
  initMainSave();
  initNavigation();
  initProfile();
  initImportExport();
  initAnalytics();
  await loadCalendarMoods();
  renderCalendar();
}

document.addEventListener('DOMContentLoaded', init);