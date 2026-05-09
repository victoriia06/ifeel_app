const activityOptions = ['Бег','Учёба','Работа','Спорт','Чтение','Прогулка','Готовка','Уборка','Встреча с друзьями','Кино'];

async function loadEditEntry(idOrDateStr) {
  let entry = await getEntryById(idOrDateStr);
  let dateStr = idOrDateStr;
  if (entry) { dateStr = entry.date; }
  
  const [y, m, d] = dateStr.split('-');
  const months = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
  let headerText = `${d} ${months[parseInt(m)-1]} ${y}`;
  if (entry && entry.createdAt) { headerText += ' · ' + formatTime(entry.createdAt); }
  document.getElementById('editDateDisplay').textContent = headerText;
  
  document.getElementById('editMoodContainer').innerHTML = document.getElementById('moodContainer').innerHTML;
  document.getElementById('editActivitiesContainer').innerHTML = `
    <div class="selected-activities" id="editSelectedActivities"><span class="placeholder-tag">Выберите активности...</span></div>
    <div class="activities-dropdown" id="editActivitiesDropdown" style="display:none">
      ${activityOptions.map(a => `<label class="activity-option"><input type="checkbox" value="${a}"><span></span>${a}</label>`).join('')}
    </div>`;
  
  const moodContainer = document.getElementById('editMoodContainer');
  const journalBox = document.getElementById('editJournalBox');
  const activitiesContainer = document.getElementById('editActivitiesContainer');
  const selAct = document.getElementById('editSelectedActivities');
  const actDropdown = document.getElementById('editActivitiesDropdown');
  const cbs = actDropdown.querySelectorAll('input[type="checkbox"]');
  
  moodContainer.querySelectorAll('.mood-btn').forEach(btn => {
    btn.classList.toggle('active', entry && btn.getAttribute('data-mood') === entry.mood);
    btn.onclick = function() {
      const wasActive = this.classList.contains('active');
      moodContainer.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
      if (!wasActive) this.classList.add('active');
    };
  });
  
  journalBox.value = entry ? (entry.text || '') : '';
  
  let activities = entry && entry.activities ? [...entry.activities] : [];
  
  function updateDisp() {
    if (activities.length === 0) {
      selAct.innerHTML = '<span class="placeholder-tag">Выберите активности...</span>';
    } else {
      selAct.innerHTML = activities.map(a => `<div class="activity-tag">${a}<div class="remove-tag" data-activity="${a}">✕</div></div>`).join('');
      selAct.querySelectorAll('.remove-tag').forEach(b => {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          activities = activities.filter(x => x !== b.getAttribute('data-activity'));
          updateDisp();
          cbs.forEach(cb => { if (cb.value === b.getAttribute('data-activity')) cb.checked = false; });
        });
      });
    }
  }
  
  updateDisp();
  cbs.forEach(cb => { cb.checked = activities.includes(cb.value); });
  
  activitiesContainer.onclick = function(e) {
    if (e.target.closest('.remove-tag')) return;
    const isOpen = actDropdown.style.display === 'block';
    actDropdown.style.display = isOpen ? 'none' : 'block';
    activitiesContainer.classList.toggle('open', !isOpen);
  };
  
  document.addEventListener('click', function closeED(e) {
    if (!activitiesContainer.contains(e.target)) {
      actDropdown.style.display = 'none';
      activitiesContainer.classList.remove('open');
    }
  });
  
  cbs.forEach(cb => {
    cb.onchange = function() {
      if (this.checked) { if (!activities.includes(this.value)) activities.push(this.value); }
      else { activities = activities.filter(a => a !== this.value); }
      updateDisp();
    };
  });
  
  selAct.addEventListener('wheel', function(e) {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); selAct.scrollLeft += e.deltaY; }
  }, { passive: false });
  
  document.getElementById('editSaveBtn').onclick = async function() {
    const mood = getSelectedMood(moodContainer);
    if (!mood) { showToast('Выберите эмоцию', 'error'); return; }
    await saveEntry({
      id: entry ? entry.id : Date.now().toString(),
      date: dateStr,
      mood,
      text: journalBox.value,
      activities,
      createdAt: entry ? entry.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    showScreen('diary');
    showToast('Изменения сохранены');
  };
  
  document.getElementById('editDeleteBtn').onclick = async function() {
    if (await showModalWithMessage('Вы уверены, что хотите удалить эту запись?')) {
      if (entry) await deleteEntryById(entry.id);
      showScreen('diary');
      showToast('Запись удалена');
    }
  };
}