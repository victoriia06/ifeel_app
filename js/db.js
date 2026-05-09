let db;

function getDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      try { db.transaction(['entries'], 'readonly'); resolve(db); return; }
      catch (e) { db = null; }
    }
    const r = indexedDB.open('JournalApp10', 2);
    r.onupgradeneeded = function(e) {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('entries')) d.createObjectStore('entries', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('metadata')) d.createObjectStore('metadata', { keyPath: 'date' });
    };
    r.onsuccess = function(e) { db = e.target.result; db.onclose = function() { db = null; }; resolve(db); };
    r.onerror = function(e) { reject(e.target.error); };
  });
}

async function saveEntry(entry) {
  const d = await getDB();
  return new Promise((resolve, reject) => {
    const t = d.transaction(['entries', 'metadata'], 'readwrite');
    t.objectStore('entries').put(entry);
    t.objectStore('metadata').put({ date: entry.date, lastMood: entry.mood });
    t.oncomplete = () => resolve();
    t.onerror = (e) => reject(e.target.error);
  });
}

async function getAllEntries() {
  const d = await getDB();
  return new Promise((resolve) => {
    d.transaction(['entries'], 'readonly').objectStore('entries').getAll().onsuccess = function(e) { resolve(e.target.result); };
  });
}

async function getEntryById(id) {
  const d = await getDB();
  return new Promise((resolve) => {
    d.transaction(['entries'], 'readonly').objectStore('entries').get(id).onsuccess = function(e) { resolve(e.target.result || null); };
  });
}

async function deleteEntryById(id) {
  const d = await getDB();
  return new Promise((resolve, reject) => {
    const t = d.transaction(['entries', 'metadata'], 'readwrite');
    t.objectStore('entries').delete(id);
    t.oncomplete = () => resolve();
    t.onerror = (e) => reject(e.target.error);
  });
}

async function loadCalendarMoods() {
  const d = await getDB();
  return new Promise((resolve) => {
    const r = d.transaction(['metadata'], 'readonly').objectStore('metadata').getAll();
    r.onsuccess = function() {
      r.result.forEach(item => { currentCalendarEntries[item.date] = item.lastMood; });
      if (typeof renderCalendar === 'function') renderCalendar();
      resolve();
    };
  });
}

async function clearAllData() {
  const entries = await getAllEntries();
  for (const entry of entries) { await deleteEntryById(entry.id); }
  const d = await getDB();
  await new Promise((resolve) => {
    const t = d.transaction(['metadata'], 'readwrite');
    t.objectStore('metadata').clear().onsuccess = resolve;
  });
}