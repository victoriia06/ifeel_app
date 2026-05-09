let chartPeriod = 'week';
let chartOffset = 0;

const moodMiniSVGs = {
  happy: '<svg viewBox="0 0 24 24" fill="none" stroke="#00A63E" stroke-width="1.8" width="18" height="18"><circle cx="12" cy="12" r="10"/><path d="M8 15s1.5 2 4 2 4-2 4-2"/><path d="M9 10h.01"/><path d="M15 10h.01"/></svg>',
  good: '<svg viewBox="0 0 24 24" fill="none" stroke="#8CAB00" stroke-width="1.8" width="18" height="18"><circle cx="12" cy="12" r="10"/><path d="M8 15c1 .8 2.5 1.2 4 1.2s3-.4 4-1.2"/><path d="M9 10h.01"/><path d="M15 10h.01"/></svg>',
  normal: '<svg viewBox="0 0 24 24" fill="none" stroke="#F0B400" stroke-width="1.8" width="18" height="18"><circle cx="12" cy="12" r="10"/><path d="M8 15h8"/><path d="M9 10h.01"/><path d="M15 10h.01"/></svg>',
  sad: '<svg viewBox="0 0 24 24" fill="none" stroke="#E46A00" stroke-width="1.8" width="18" height="18"><circle cx="12" cy="12" r="10"/><path d="M8 16s1.5-2 4-2 4 2 4 2"/><path d="M9 10h.01"/><path d="M15 10h.01"/></svg>',
  bad: '<svg viewBox="0 0 24 24" fill="none" stroke="#E00000" stroke-width="1.8" width="18" height="18"><circle cx="12" cy="12" r="10"/><path d="M8 16s1.5-2 4-2 4 2 4 2"/><path d="M9 10h.01"/><path d="M15 10h.01"/></svg>'
};

const moodScores = { happy: 5, good: 4, normal: 3, sad: 2, bad: 1 };
const moodNames = { happy: 'Счастливое', good: 'Хорошее', normal: 'Нейтральное', sad: 'Грустное', bad: 'Плохое' };

function getSelectedMood(container) {
  const b = container.querySelector('.mood-btn.active');
  return b ? b.getAttribute('data-mood') : null;
}

async function loadAnalytics() {
  const entries = await getAllEntries();
  
  document.getElementById('statTotalEntries').textContent = entries.length;
  const uniqueDays = new Set(entries.map(e => e.date));
  document.getElementById('statTotalDays').textContent = uniqueDays.size;
  
  // Стрик
  let streak = 0;
  const checkDate = new Date();
  const dateSet = new Set(entries.map(e => e.date));
  while (dateSet.has(checkDate.toISOString().slice(0, 10))) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
  document.getElementById('statStreak').textContent = `${streak} 🔥`;
  
  // Распределение настроений
  const moodCounts = { happy: 0, good: 0, normal: 0, sad: 0, bad: 0 };
  entries.forEach(e => { if (moodCounts[e.mood] !== undefined) moodCounts[e.mood]++; });
  const maxCount = Math.max(...Object.values(moodCounts), 1);
  
  document.getElementById('moodBars').innerHTML = ['happy','good','normal','sad','bad'].map(mood => {
    const colors = { happy: '#00A63E', good: '#8CAB00', normal: '#F0B400', sad: '#E46A00', bad: '#E00000' };
    const fills = { happy: 'happy-fill', good: 'good-fill', normal: 'normal-fill', sad: 'sad-fill', bad: 'bad-fill' };
    return `<div class="mood-bar-row">
      <div class="mood-bar-svg">${moodMiniSVGs[mood]}</div>
      <div class="mood-bar-track"><div class="mood-bar-fill ${fills[mood]}" style="width:${moodCounts[mood]/maxCount*100}%"></div></div>
      <span class="mood-bar-count">${moodCounts[mood]}</span>
    </div>`;
  }).join('');
  
  // Частое настроение
  let totalScore = 0, scoredEntries = 0;
  entries.forEach(e => { if (moodScores[e.mood]) { totalScore += moodScores[e.mood]; scoredEntries++; } });
  const avgScore = scoredEntries > 0 ? totalScore / scoredEntries : 0;
  let topMood = 'normal', topMoodName = 'Нейтральное';
  const maxMoodCount = Math.max(...Object.values(moodCounts));
  const topMoods = Object.entries(moodCounts).filter(([k,v]) => v === maxMoodCount);
  if (scoredEntries > 0 && topMoods.length > 1) {
    topMood = Object.entries(moodScores).sort((a,b) => Math.abs(a[1]-avgScore) - Math.abs(b[1]-avgScore))[0][0];
    topMoodName = moodNames[topMood];
  } else if (maxMoodCount > 0) { topMood = topMoods[0][0]; topMoodName = moodNames[topMood]; }
  document.getElementById('statTopMood').textContent = scoredEntries > 0 ? topMoodName : '—';
  document.getElementById('popularMoodIcon').innerHTML = scoredEntries > 0 ? moodMiniSVGs[topMood] : moodMiniSVGs['normal'];
  
  // Топ активностей
  const actCounts = {};
  entries.forEach(e => { if (e.activities) e.activities.forEach(a => { actCounts[a] = (actCounts[a] || 0) + 1; }); });
  const topActs = Object.entries(actCounts).sort((a,b) => b[1] - a[1]).slice(0, 6);
  document.getElementById('activitiesStats').innerHTML = topActs.length > 0
    ? topActs.map(([act,count]) => `<div class="act-stat-item"><span class="act-stat-count">${count}</span> ${act}</div>`).join('')
    : '<div class="act-empty">Нет данных</div>';
  
  // Последние записи
  const recent = entries.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);
  document.getElementById('recentList').innerHTML = recent.length > 0
    ? recent.map(e => {
        const [y,m,d] = e.date.split('-');
        const months = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
        const timeStr = e.createdAt ? formatTime(e.createdAt) : '';
        return `<div class="recent-item"><div class="recent-mood-svg">${e.mood ? moodMiniSVGs[e.mood] : ''}</div><span class="recent-date">${d} ${months[parseInt(m)-1]} ${y}${timeStr ? ` <span class="recent-time">${timeStr}</span>` : ''}</span><span class="recent-text">${e.text || ''}</span></div>`;
      }).join('')
    : '<div class="recent-empty">Нет записей</div>';
  
  // График динамики
  renderDynamicChart(entries);
}

function getWeekStart(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1));
  return d;
}

function renderDynamicChart(entries) {
  const container = document.getElementById('dynamicChart');
  const label = document.getElementById('chartPeriodLabel');
  const today = new Date();
  let allDays, periodLabel;
  
  if (chartPeriod === 'week') {
    const currentMonday = getWeekStart(today);
    const baseMonday = new Date(currentMonday); baseMonday.setDate(baseMonday.getDate() + chartOffset * 7);
    const baseSunday = new Date(baseMonday); baseSunday.setDate(baseMonday.getDate() + 6);
    allDays = [];
    for (let d = new Date(baseMonday); d <= baseSunday; d.setDate(d.getDate() + 1)) { allDays.push(d.toISOString().slice(0, 10)); }
    periodLabel = `${baseMonday.getDate()} ${monthShortNames[baseMonday.getMonth()]} – ${baseSunday.getDate()} ${monthShortNames[baseSunday.getMonth()]} ${baseSunday.getFullYear()}`;
  } else {
    const baseDate = new Date(today.getFullYear(), today.getMonth() + chartOffset, 1);
    const lastDay = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
    allDays = [];
    for (let d = new Date(baseDate); d <= lastDay; d.setDate(d.getDate() + 1)) { allDays.push(d.toISOString().slice(0, 10)); }
    periodLabel = `${monthNames[baseDate.getMonth()]} ${baseDate.getFullYear()}`;
  }
  
  label.textContent = periodLabel;
  if (allDays.length === 0) { container.innerHTML = '<div class="act-empty">Нет данных</div>'; return; }
  
  const dayData = {};
  allDays.forEach(d => { dayData[d] = { scores: [], moods: [] }; });
  entries.forEach(e => {
    if (dayData[e.date] && moodScores[e.mood]) {
      dayData[e.date].scores.push(moodScores[e.mood]);
      dayData[e.date].moods.push(e.mood);
    }
  });
  
  const hasData = Object.values(dayData).some(d => d.scores.length > 0);
  if (!hasData) { container.innerHTML = '<div class="act-empty">Нет данных за этот период</div>'; return; }
  
  const margin = { top: 30, right: 15, bottom: 45, left: 42 };
  const svgWidth = 340, svgHeight = 180;
  const chartWidth = svgWidth - margin.left - margin.right;
  const chartHeight = svgHeight - margin.top - margin.bottom;
  const dayWidth = chartWidth / allDays.length;
  const getY = (score) => margin.top + chartHeight - ((score - 1) / 4) * chartHeight;
  const getX = (i) => margin.left + i * dayWidth + dayWidth / 2;
  
  let pathPoints = [];
  allDays.forEach((d, i) => {
    const scores = dayData[d].scores;
    if (scores.length > 0) {
      pathPoints.push({ x: getX(i), y: getY(scores.reduce((a,b) => a + b, 0) / scores.length), date: d });
    }
  });
  
  let pathD = pathPoints.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ',' + p.y).join(' ');
  
  let circles = pathPoints.map(p => {
    const dayEntries = entries.filter(e => e.date === p.date).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const lastMood = dayEntries.length > 0 ? dayEntries[0].mood : 'normal';
    const colors = { happy: '#67c79c', good: '#bdd36d', normal: '#f1cd5e', sad: '#f0a050', bad: '#f16f73' };
    return `<circle cx="${p.x}" cy="${p.y}" r="5" fill="${colors[lastMood]}" stroke="white" stroke-width="2"/>`;
  }).join('');
  
  const yLabels = [5, 4, 3, 2, 1];
  const yMoods = ['happy', 'good', 'normal', 'sad', 'bad'];
  const yAxisHTML = yLabels.map((v, i) => {
    const y = getY(v);
    return `<g><line x1="${margin.left}" y1="${y}" x2="${svgWidth - margin.right}" y2="${y}" stroke="#f0f0f0" stroke-width="1" stroke-dasharray="4"/><g transform="translate(5,${y - 9})">${moodMiniSVGs[yMoods[i]]}</g></g>`;
  }).join('');
  
  const xLabelsHTML = allDays.map((d, i) => {
    if (allDays.length > 14 && i % 3 !== 0) return '';
    return `<text x="${getX(i)}" y="${svgHeight - 10}" text-anchor="middle" font-size="10" fill="#8f8f8f">${parseInt(d.slice(8))}</text>`;
  }).join('');
  
  container.innerHTML = `<svg width="100%" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
    ${yAxisHTML}
    <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${svgHeight - margin.bottom + 5}" stroke="#d0d0d0" stroke-width="1"/>
    <line x1="${margin.left}" y1="${svgHeight - margin.bottom + 5}" x2="${svgWidth - margin.right}" y2="${svgHeight - margin.bottom + 5}" stroke="#d0d0d0" stroke-width="1"/>
    <path d="${pathD}" fill="none" stroke="#8f6bff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${circles}
    ${xLabelsHTML}
  </svg>`;
}

function initAnalytics() {
  document.getElementById('periodWeek').addEventListener('click', function() {
    chartPeriod = 'week'; chartOffset = 0;
    this.classList.add('active'); document.getElementById('periodMonth').classList.remove('active');
    loadAnalytics();
  });
  document.getElementById('periodMonth').addEventListener('click', function() {
    chartPeriod = 'month'; chartOffset = 0;
    this.classList.add('active'); document.getElementById('periodWeek').classList.remove('active');
    loadAnalytics();
  });
  document.getElementById('chartPrevBtn').addEventListener('click', function() { chartOffset--; loadAnalytics(); });
  document.getElementById('chartNextBtn').addEventListener('click', function() { chartOffset++; loadAnalytics(); });
}