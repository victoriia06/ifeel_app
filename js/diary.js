const moodSVGs = {
  happy: '<svg viewBox="0 0 24 24" fill="none" stroke="#00A63E" stroke-width="1.8" width="28" height="28"><circle cx="12" cy="12" r="10"/><path d="M8 15s1.5 2 4 2 4-2 4-2"/><path d="M9 10h.01"/><path d="M15 10h.01"/></svg>',
  good: '<svg viewBox="0 0 24 24" fill="none" stroke="#8CAB00" stroke-width="1.8" width="28" height="28"><circle cx="12" cy="12" r="10"/><path d="M8 15c1 .8 2.5 1.2 4 1.2s3-.4 4-1.2"/><path d="M9 10h.01"/><path d="M15 10h.01"/></svg>',
  normal: '<svg viewBox="0 0 24 24" fill="none" stroke="#F0B400" stroke-width="1.8" width="28" height="28"><circle cx="12" cy="12" r="10"/><path d="M8 15h8"/><path d="M9 10h.01"/><path d="M15 10h.01"/></svg>',
  sad: '<svg viewBox="0 0 24 24" fill="none" stroke="#E46A00" stroke-width="1.8" width="28" height="28"><circle cx="12" cy="12" r="10"/><path d="M8 16s1.5-2 4-2 4 2 4 2"/><path d="M9 10h.01"/><path d="M15 10h.01"/></svg>',
  bad: '<svg viewBox="0 0 24 24" fill="none" stroke="#E00000" stroke-width="1.8" width="28" height="28"><circle cx="12" cy="12" r="10"/><path d="M8 16s1.5-2 4-2 4 2 4 2"/><path d="M9 10h.01"/><path d="M15 10h.01"/></svg>'
};

function formatTime(isoString) {
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

async function loadDiaryEntries() {
  const list = document.getElementById('diaryList');
  let entries = await getAllEntries();
  
  if (entries.length === 0) {
    list.innerHTML = '<div class="diary-empty">Нет записей</div>';
    return;
  }
  
  entries.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  
  list.innerHTML = entries.map(entry => {
    const hasText = entry.text && entry.text.trim().length > 0;
    const preview = hasText ? entry.text.substring(0, 40) + (entry.text.length > 40 ? '...' : '') : '';
    const moodSVG = entry.mood ? moodSVGs[entry.mood] || '' : '';
    const tags = entry.activities && entry.activities.length > 0
      ? `<div class="diary-tags">${entry.activities.slice(0,3).map(a => `<span class="diary-tag">${a}</span>`).join('')}${entry.activities.length > 3 ? `<span class="diary-tag">+${entry.activities.length-3}</span>` : ''}</div>`
      : '';
    const [y, m, d] = entry.date.split('-');
    const months = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
    return `<div class="diary-entry" data-id="${entry.id}">
      <div class="diary-entry-left">
        <div class="diary-mood-svg">${moodSVG}</div>
        <div class="diary-info">
          <div class="diary-date-line">
            <span class="diary-date">${d} ${months[parseInt(m)-1]} ${y}</span>
            ${entry.createdAt ? `<span class="diary-time">${formatTime(entry.createdAt)}</span>` : ''}
          </div>
          ${hasText ? `<div class="diary-preview">${preview}</div>` : ''}
          ${tags}
        </div>
      </div>
      <button class="diary-edit-btn" data-id="${entry.id}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
    </div>`;
  }).join('');
  
  list.querySelectorAll('.diary-entry').forEach(e => {
    e.addEventListener('click', function(ev) {
      if (ev.target.closest('.diary-edit-btn')) return;
      showScreen('edit', this.getAttribute('data-id'));
    });
  });
  list.querySelectorAll('.diary-edit-btn').forEach(b => {
    b.addEventListener('click', function(ev) {
      ev.stopPropagation();
      showScreen('edit', this.getAttribute('data-id'));
    });
  });
}