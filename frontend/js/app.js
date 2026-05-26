const API = 'http://127.0.0.1:8000';

const toast = document.getElementById('toast');
let toastTimer = null;

function showToast(msg, isError = false) {
  toast.textContent = msg;
  toast.classList.remove('hidden', 'error');
  if (isError) toast.classList.add('error');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3000);
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

async function apiFetch(path, options = {}) {
  const url = `${API}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };
  const res = await fetch(url, config);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Error ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

/* ---- Navigation ---- */
const navBtns = document.querySelectorAll('.nav-btn');
const sections = {
  lotes: document.getElementById('section-lotes'),
  embolse: document.getElementById('section-embolse'),
  cosecha: document.getElementById('section-cosecha'),
};

navBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    navBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    Object.keys(sections).forEach((k) =>
      sections[k].classList.toggle('active', k === btn.dataset.section)
    );
  });
});

/* ---- Shared: populate lot selects ---- */
async function loadLoteSelects() {
  try {
    const lotes = await apiFetch('/lotes');
    const selects = [
      document.getElementById('embolse-lote'),
      document.getElementById('embolse-filtro-lote'),
      document.getElementById('cosecha-lote'),
      document.getElementById('cosecha-filtro-lote'),
    ];
    selects.forEach((sel) => {
      const current = sel.value;
      sel.innerHTML = sel.dataset.placeholder
        ? `<option value="">${sel.dataset.placeholder}</option>`
        : '<option value="">Seleccionar lote...</option>';
      lotes.forEach((l) => {
        const opt = document.createElement('option');
        opt.value = l.id;
        opt.textContent = `${l.nombre} (${l.supervisor})`;
        sel.appendChild(opt);
      });
      if (current) sel.value = current;
    });
  } catch (err) {
    showToast('Error al cargar lotes: ' + err.message, true);
  }
}

/* ---- Lotes ---- */
const formLote = document.getElementById('form-lote');
const tbodyLotes = document.getElementById('tbody-lotes');

formLote.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = document.getElementById('lote-nombre').value.trim();
  const supervisor = document.getElementById('lote-supervisor').value.trim();
  if (!nombre || !supervisor) return;
  try {
    await apiFetch('/lotes', {
      method: 'POST',
      body: JSON.stringify({ nombre, supervisor }),
    });
    showToast('Lote creado exitosamente');
    formLote.reset();
    loadLotesTable();
    loadLoteSelects();
  } catch (err) {
    showToast('Error al crear lote: ' + err.message, true);
  }
});

async function loadLotesTable() {
  try {
    const lotes = await apiFetch('/lotes');
    if (lotes.length === 0) {
      tbodyLotes.innerHTML =
        '<tr><td colspan="5" class="empty-msg">No hay lotes registrados</td></tr>';
      return;
    }
    tbodyLotes.innerHTML = lotes
      .map(
        (l) => `
      <tr>
        <td>${l.id}</td>
        <td>${esc(l.nombre)}</td>
        <td>${esc(l.supervisor)}</td>
        <td>${l.activo ? 'Sí' : 'No'}</td>
        <td>${fmtDate(l.created_at)}</td>
      </tr>`
      )
      .join('');
  } catch (err) {
    showToast('Error al cargar lotes: ' + err.message, true);
  }
}

/* ---- Embolse ---- */
const formEmbolse = document.getElementById('form-embolse');
const tbodyEmbolse = document.getElementById('tbody-embolse');
const embolseFiltro = document.getElementById('embolse-filtro-lote');

document.getElementById('embolse-fecha').value = todayStr();

formEmbolse.addEventListener('submit', async (e) => {
  e.preventDefault();
  const lote_id = parseInt(document.getElementById('embolse-lote').value);
  const fecha = document.getElementById('embolse-fecha').value;
  const cantidad = parseInt(document.getElementById('embolse-cantidad').value);
  const observacion =
    document.getElementById('embolse-observacion').value.trim() || null;
  if (!lote_id || !fecha || !cantidad) return;
  try {
    await apiFetch('/embolse', {
      method: 'POST',
      body: JSON.stringify({ lote_id, fecha, cantidad, observacion }),
    });
    showToast('Embolse registrado exitosamente');
    formEmbolse.reset();
    document.getElementById('embolse-fecha').value = todayStr();
    embolseFiltro.value = lote_id;
    loadEmbolseTable(lote_id);
  } catch (err) {
    showToast('Error al registrar embolse: ' + err.message, true);
  }
});

embolseFiltro.addEventListener('change', () => {
  const id = embolseFiltro.value;
  if (id) loadEmbolseTable(parseInt(id));
  else tbodyEmbolse.innerHTML = '';
});

async function loadEmbolseTable(lote_id) {
  try {
    const rows = await apiFetch(`/embolse/${lote_id}`);
    if (rows.length === 0) {
      tbodyEmbolse.innerHTML =
        '<tr><td colspan="5" class="empty-msg">No hay embolses para este lote</td></tr>';
      return;
    }
    tbodyEmbolse.innerHTML = rows
      .map(
        (r) => `
      <tr>
        <td>${r.id}</td>
        <td>${r.fecha}</td>
        <td><span class="color-badge" style="background:${colorHex(r.color_cinta)};display:inline-block;width:14px;height:14px;border-radius:50%;vertical-align:middle;margin-right:6px;border:1px solid var(--border)"></span>${esc(r.color_cinta)}</td>
        <td>${r.cantidad}</td>
        <td>${esc(r.observacion) || '—'}</td>
      </tr>`
      )
      .join('');
  } catch (err) {
    showToast('Error al cargar embolses: ' + err.message, true);
  }
}

/* ---- Cosecha ---- */
const formCosecha = document.getElementById('form-cosecha');
const tbodyCosecha = document.getElementById('tbody-cosecha');
const cosechaFiltro = document.getElementById('cosecha-filtro-lote');
const cosechaInfo = document.getElementById('cosecha-info');
const cosechaDescuento = document.getElementById('cosecha-descuento');
const cosechaRecobro = document.getElementById('cosecha-recobro');

document.getElementById('cosecha-fecha').value = todayStr();

let cosechaLote = document.getElementById('cosecha-lote');
let cosechaFecha = document.getElementById('cosecha-fecha');
let cosechaCantidad = document.getElementById('cosecha-cantidad');

async function actualizarDescuentoRecobro() {
  const lote_id = parseInt(cosechaLote.value);
  const fecha = cosechaFecha.value;
  if (!lote_id || !fecha) {
    cosechaInfo.classList.add('hidden');
    return;
  }
  try {
    const [d, r] = await Promise.all([
      apiFetch(`/cosecha/${lote_id}/descuento?fecha=${fecha}`),
      apiFetch(`/cosecha/${lote_id}/recobro?fecha=${fecha}`),
    ]);
    if (d.descuento === null && r.recobro === null) {
      cosechaInfo.classList.add('hidden');
      return;
    }
    cosechaDescuento.textContent = d.descuento !== null ? d.descuento : '—';
    cosechaRecobro.textContent = r.recobro !== null ? `${r.recobro}%` : '—';
    cosechaInfo.classList.remove('hidden');
  } catch {
    cosechaInfo.classList.add('hidden');
  }
}

cosechaLote.addEventListener('change', actualizarDescuentoRecobro);
cosechaFecha.addEventListener('change', actualizarDescuentoRecobro);

formCosecha.addEventListener('submit', async (e) => {
  e.preventDefault();
  const lote_id = parseInt(cosechaLote.value);
  const fecha = cosechaFecha.value;
  const cantidad = parseInt(cosechaCantidad.value);
  const observacion =
    document.getElementById('cosecha-observacion').value.trim() || null;
  if (!lote_id || !fecha || !cantidad) return;
  try {
    await apiFetch('/cosecha', {
      method: 'POST',
      body: JSON.stringify({ lote_id, fecha, cantidad, observacion }),
    });
    showToast('Cosecha registrada exitosamente');
    formCosecha.reset();
    document.getElementById('cosecha-fecha').value = todayStr();
    cosechaInfo.classList.add('hidden');
    cosechaFiltro.value = lote_id;
    loadCosechaTable(lote_id);
  } catch (err) {
    showToast('Error al registrar cosecha: ' + err.message, true);
  }
});

cosechaFiltro.addEventListener('change', () => {
  const id = cosechaFiltro.value;
  if (id) loadCosechaTable(parseInt(id));
  else tbodyCosecha.innerHTML = '';
});

async function loadCosechaTable(lote_id) {
  try {
    const rows = await apiFetch(`/cosecha/${lote_id}`);
    if (rows.length === 0) {
      tbodyCosecha.innerHTML =
        '<tr><td colspan="5" class="empty-msg">No hay cosechas para este lote</td></tr>';
      return;
    }
    tbodyCosecha.innerHTML = rows
      .map(
        (r) => `
      <tr>
        <td>${r.id}</td>
        <td>${r.fecha}</td>
        <td><span class="color-badge" style="background:${colorHex(r.color_cinta)};display:inline-block;width:14px;height:14px;border-radius:50%;vertical-align:middle;margin-right:6px;border:1px solid var(--border)"></span>${esc(r.color_cinta)}</td>
        <td>${r.cantidad}</td>
        <td>${esc(r.observacion) || '—'}</td>
      </tr>`
      )
      .join('');
  } catch (err) {
    showToast('Error al cargar cosechas: ' + err.message, true);
  }
}

/* ---- Helpers ---- */
function esc(s) {
  if (s === null || s === undefined) return '';
  const d = document.createElement('div');
  d.textContent = String(s);
  return d.innerHTML;
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function colorHex(code) {
  const map = {
    BL: '#f8fafc',
    AZ: '#3b82f6',
    RO: '#ef4444',
    CA: '#8B4513',
    NE: '#1e293b',
    NA: '#f97316',
    VE: '#22c55e',
    AM: '#ffd700',
  };
  return map[code?.toUpperCase()] || '#6b7280';
}

/* ---- Init ---- */
async function init() {
  document.getElementById('embolse-filtro-lote').dataset.placeholder =
    'Seleccionar lote para ver embolses...';
  document.getElementById('cosecha-filtro-lote').dataset.placeholder =
    'Seleccionar lote para ver cosechas...';
  await loadLoteSelects();
  await loadLotesTable();
}

init();
