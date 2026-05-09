const realToday = new Date();
const realTodayDate = realToday.getDate();
const realTodayMonth = realToday.getMonth();
const realTodayYear = realToday.getFullYear();

let selectedDay = realTodayDate;
let currentMonth = realTodayMonth;
let currentYear = realTodayYear;
let dayManuallySelected = false;
let currentCalendarEntries = {};

const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const monthShortNames = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
const moodColors = { happy: 'mood-happy', good: 'mood-good', normal: 'mood-normal', sad: 'mood-sad', bad: 'mood-bad' };

function getDateString(day, month, year) {
  return `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

function getSelectedDateString() {
  return getDateString(selectedDay, currentMonth, currentYear);
}

function isCurrentMonthAndYear() {
  return currentMonth === realTodayMonth && currentYear === realTodayYear;
}

function populateYearSelect() {
  const yearSelect = document.getElementById('yearSelect');
  yearSelect.innerHTML = '';
  for (let y = realTodayYear - 10; y <= realTodayYear + 10; y++) {
    const o = document.createElement('option');
    o.value = y; o.textContent = y;
    if (y === currentYear) o.selected = true;
    yearSelect.appendChild(o);
  }
}

function updateDateSelectors() {
  document.getElementById('monthSelect').value = currentMonth;
  const yearSelect = document.getElementById('yearSelect');
  const yo = yearSelect.querySelector(`option[value="${currentYear}"]`);
  if (yo) yearSelect.value = currentYear;
  else { populateYearSelect(); yearSelect.value = currentYear; }
  if (isCurrentMonthAndYear() && dayManuallySelected) {
    selectedDay = realTodayDate;
    dayManuallySelected = false;
    updateDayDisplay();
  }
}

function updateDayDisplay() {
  document.getElementById('currentDayDisplay').textContent = selectedDay;
}

function renderCalendar() {
  document.getElementById('calendarMonthTitle').textContent = `${monthNames[currentMonth]} ${currentYear}`;
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
  
  if (selectedDay > daysInMonth) { selectedDay = daysInMonth; updateDayDisplay(); }
  
  const daysGrid = document.getElementById('calendarDaysGrid');
  let html = '';
  for (let i = firstDay - 1; i >= 0; i--) html += `<div class="day muted">${prevMonthDays - i}</div>`;
  
  for (let d = 1; d <= daysInMonth; d++) {
    let classes = ['day'];
    const dateStr = getDateString(d, currentMonth, currentYear);
    const mood = currentCalendarEntries[dateStr];
    
    if (d === selectedDay) {
      classes.push('selected');
      if (mood && moodColors[mood]) classes.push(moodColors[mood]);
    } else {
      if (d === realTodayDate && isCurrentMonthAndYear()) classes.push('today-highlight');
      if (mood && moodColors[mood]) classes.push(moodColors[mood]);
    }
    html += `<div class="${classes.join(' ')}" data-day="${d}">${d}</div>`;
  }
  
  const totalCells = firstDay + daysInMonth;
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let d = 1; d <= remainingCells; d++) html += `<div class="day muted">${d}</div>`;
  
  daysGrid.innerHTML = html;
  daysGrid.querySelectorAll('.day:not(.muted)').forEach(dayEl => {
    dayEl.addEventListener('click', function() {
      selectedDay = parseInt(this.getAttribute('data-day'), 10);
      dayManuallySelected = true;
      updateDayDisplay();
      renderCalendar();
    });
  });
}

function goToPrevMonth() {
  if (currentMonth === 0) { currentMonth = 11; currentYear--; }
  else { currentMonth--; }
  updateDateSelectors();
  renderCalendar();
}

function goToNextMonth() {
  if (currentMonth === 11) { currentMonth = 0; currentYear++; }
  else { currentMonth++; }
  updateDateSelectors();
  renderCalendar();
}

function initCalendar() {
  document.getElementById('prevMonthBtn').addEventListener('click', goToPrevMonth);
  document.getElementById('nextMonthBtn').addEventListener('click', goToNextMonth);
  document.getElementById('monthSelect').addEventListener('change', () => {
    currentMonth = parseInt(document.getElementById('monthSelect').value, 10);
    updateDateSelectors();
    renderCalendar();
  });
  document.getElementById('yearSelect').addEventListener('change', () => {
    currentYear = parseInt(document.getElementById('yearSelect').value, 10);
    updateDateSelectors();
    renderCalendar();
  });
  
  populateYearSelect();
  updateDateSelectors();
  updateDayDisplay();
  renderCalendar();
}