function getRecordsWord(count) {
  const d = count % 10, dd = count % 100;
  if (dd >= 11 && dd <= 19) return 'записей';
  if (d === 1) return 'запись';
  if (d >= 2 && d <= 4) return 'записи';
  return 'записей';
}

async function exportEntries() {
  const entries = await getAllEntries();
  if (entries.length === 0) { showToast('Нет записей для экспорта', 'error'); return; }
  
  const data = {
    app: 'JournalApp',
    version: 1,
    exportDate: new Date().toISOString(),
    userName: (typeof userName !== 'undefined') ? userName : '',
    entries: entries.map(e => ({
      date: e.date, mood: e.mood, text: e.text || '',
      activities: e.activities || [], createdAt: e.createdAt
    }))
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `journal-backup-${new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '')}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  showToast('Экспорт выполнен');
}

function importEntries() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json';
  input.onchange = async function(e) {
    const file = e.target.files[0]; if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.entries || !Array.isArray(data.entries)) { showToast('Неверный формат файла', 'error'); return; }
      
      if (data.userName && data.userName.trim()) {
        window.userName = data.userName.trim();
        localStorage.setItem(USER_NAME_KEY, window.userName);
        updateUserNameDisplay();
      }
      
      const existingEntries = await getAllEntries();
      const existingDates = new Set(existingEntries.map(e => e.date + '_' + e.createdAt));
      let imported = 0, skipped = 0;
      
      for (const entry of data.entries) {
        if (!entry.date || !entry.mood) continue;
        const key = entry.date + '_' + (entry.createdAt || '');
        if (existingDates.has(key)) { skipped++; continue; }
        await saveEntry({
          id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
          date: entry.date, mood: entry.mood,
          text: entry.text || '', activities: entry.activities || [],
          createdAt: entry.createdAt || new Date().toISOString()
        });
        imported++;
      }
      
      let msg = `Привет, ${window.userName || 'пользователь'}! Добавлено: ${imported} ${getRecordsWord(imported)}`;
      if (skipped > 0) msg += ` (пропущено: ${skipped})`;
      showToast(msg);
      loadCalendarMoods();
    } catch (err) { showToast('Ошибка чтения файла', 'error'); }
  };
  input.click();
}

async function deleteAllData() {
  if (!await showModalWithMessage('Вы уверены, что хотите удалить ВСЕ данные? Это действие нельзя отменить.')) return;
  try {
    await clearAllData();
    window.userName = '';
    localStorage.removeItem(USER_NAME_KEY);
    updateUserNameDisplay();
    if (typeof currentCalendarEntries !== 'undefined') currentCalendarEntries = {};
    if (typeof renderCalendar === 'function') renderCalendar();
    showToast('Все данные удалены');
  } catch (e) { showToast('Ошибка при удалении', 'error'); }
}

function initImportExport() {
  document.getElementById('exportBtn').addEventListener('click', exportEntries);
  document.getElementById('importBtn').addEventListener('click', importEntries);
  document.getElementById('deleteAllBtn').addEventListener('click', deleteAllData);
}