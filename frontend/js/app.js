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

function formatDateColombia(isoDate) {
  const [y, m, d] = isoDate.split('-');
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${parseInt(d)} de ${meses[parseInt(m)-1]} de ${y}`;
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
  inicio: document.getElementById('section-inicio'),
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
        '<tr><td colspan="6" class="empty-msg">No hay embolses para este lote</td></tr>';
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
        <td>
          <button class="btn-icon edit" data-embolse-id="${r.id}" data-cantidad="${r.cantidad}" data-observacion="${esc(r.observacion) || ''}" title="Editar">&#9998;</button>
          <button class="btn-icon delete" data-embolse-id="${r.id}" title="Eliminar">&#128465;</button>
        </td>
      </tr>`
      )
      .join('');
    attachEmbolseActionListeners();
  } catch (err) {
    showToast('Error al cargar embolses: ' + err.message, true);
  }
}

function attachEmbolseActionListeners() {
  document.querySelectorAll('#tbody-embolse .btn-icon.edit').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.embolseId;
      const cantidad = btn.dataset.cantidad;
      const observacion = btn.dataset.observacion;
      document.getElementById('embolse-edit-id').value = id;
      document.getElementById('embolse-edit-cantidad').value = cantidad;
      document.getElementById('embolse-edit-observacion').value = observacion;
      document.getElementById('modal-embolse-edit').classList.remove('hidden');
    });
  });
  document.querySelectorAll('#tbody-embolse .btn-icon.delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.embolseId;
      if (!confirm('¿Eliminar este embolse?')) return;
      try {
        await apiFetch(`/embolse/${id}`, { method: 'DELETE' });
        showToast('Embolse eliminado');
        const lote_id = parseInt(embolseFiltro.value);
        if (lote_id) loadEmbolseTable(lote_id);
      } catch (err) {
        showToast('Error al eliminar embolse: ' + err.message, true);
      }
    });
  });
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
let cosechaColorSelected = null;

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

async function loadColoresDisponibles() {
  const lote_id = parseInt(cosechaLote.value);
  const fecha = cosechaFecha.value;
  const container = document.getElementById('cosecha-colores-container');
  const btnsContainer = document.getElementById('cosecha-colores-btns');
  if (!lote_id || !fecha) {
    container.style.display = 'none';
    return;
  }
  try {
    const data = await apiFetch(`/cosecha/colores-disponibles?fecha=${fecha}`);
    btnsContainer.innerHTML = data.colores
      .map(
        (c) =>
          `<button type="button" class="color-btn" data-color="${c}" style="background:${colorHex(c)};border:3px solid transparent;width:70px;height:70px;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;margin:6px;font-weight:bold;font-size:11px;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,0.6)">${nombreColor(c)}</button>`
      )
      .join('');
    container.style.display = 'block';
    cosechaColorSelected = null;
    btnsContainer.querySelectorAll('.color-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        btnsContainer.querySelectorAll('.color-btn').forEach((b) => (b.style.borderColor = 'transparent'));
        btn.style.borderColor = '#000';
        cosechaColorSelected = btn.dataset.color;
      });
    });
  } catch (err) {
    container.style.display = 'none';
    showToast('Error al cargar colores: ' + err.message, true);
  }
}

cosechaLote.addEventListener('change', () => {
  actualizarDescuentoRecobro();
  loadColoresDisponibles();
});
cosechaFecha.addEventListener('change', () => {
  actualizarDescuentoRecobro();
  loadColoresDisponibles();
});

formCosecha.addEventListener('submit', async (e) => {
  e.preventDefault();
  const lote_id = parseInt(cosechaLote.value);
  const fecha = cosechaFecha.value;
  const cantidad = parseInt(cosechaCantidad.value);
  const color_cinta = cosechaColorSelected;
  const observacion =
    document.getElementById('cosecha-observacion').value.trim() || null;
  if (!lote_id || !fecha || !cantidad || !color_cinta) {
    if (!color_cinta) showToast('Debe seleccionar un color de cinta', true);
    return;
  }
  try {
    await apiFetch('/cosecha', {
      method: 'POST',
      body: JSON.stringify({ lote_id, fecha, cantidad, color_cinta, observacion }),
    });
    showToast('Cosecha registrada exitosamente');
    formCosecha.reset();
    document.getElementById('cosecha-fecha').value = todayStr();
    document.getElementById('cosecha-colores-container').style.display = 'none';
    cosechaColorSelected = null;
    cosechaFiltro.value = lote_id;
    loadCosechaTable(lote_id);
    await actualizarDescuentoRecobro();
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
        '<tr><td colspan="6" class="empty-msg">No hay cosechas para este lote</td></tr>';
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
        <td>
          <button class="btn-icon edit" data-cosecha-id="${r.id}" data-cantidad="${r.cantidad}" data-observacion="${esc(r.observacion) || ''}" title="Editar">&#9998;</button>
          <button class="btn-icon delete" data-cosecha-id="${r.id}" title="Eliminar">&#128465;</button>
        </td>
      </tr>`
      )
      .join('');
    attachCosechaActionListeners();
  } catch (err) {
    showToast('Error al cargar cosechas: ' + err.message, true);
  }
}

function attachCosechaActionListeners() {
  document.querySelectorAll('#tbody-cosecha .btn-icon.edit').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.cosechaId;
      const cantidad = btn.dataset.cantidad;
      const observacion = btn.dataset.observacion;
      document.getElementById('cosecha-edit-id').value = id;
      document.getElementById('cosecha-edit-cantidad').value = cantidad;
      document.getElementById('cosecha-edit-observacion').value = observacion;
      document.getElementById('modal-cosecha-edit').classList.remove('hidden');
    });
  });
  document.querySelectorAll('#tbody-cosecha .btn-icon.delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.cosechaId;
      if (!confirm('¿Eliminar esta cosecha?')) return;
      try {
        await apiFetch(`/cosecha/${id}`, { method: 'DELETE' });
        showToast('Cosecha eliminada');
        const lote_id = parseInt(cosechaFiltro.value);
        if (lote_id) loadCosechaTable(lote_id);
      } catch (err) {
        showToast('Error al eliminar cosecha: ' + err.message, true);
      }
    });
  });
}

/* ---- Edit Modals ---- */
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

document.getElementById('embolse-edit-cancel').addEventListener('click', () => closeModal('modal-embolse-edit'));
document.getElementById('cosecha-edit-cancel').addEventListener('click', () => closeModal('modal-cosecha-edit'));

document.querySelectorAll('.modal-backdrop').forEach((bd) => {
  bd.addEventListener('click', () => {
    bd.parentElement.classList.add('hidden');
  });
});

document.getElementById('form-embolse-edit').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = parseInt(document.getElementById('embolse-edit-id').value);
  const cantidad = parseInt(document.getElementById('embolse-edit-cantidad').value);
  const observacion = document.getElementById('embolse-edit-observacion').value.trim() || null;
  try {
    await apiFetch(`/embolse/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ cantidad, observacion }),
    });
    showToast('Embolse actualizado');
    closeModal('modal-embolse-edit');
    const lote_id = parseInt(embolseFiltro.value);
    if (lote_id) loadEmbolseTable(lote_id);
  } catch (err) {
    showToast('Error al actualizar embolse: ' + err.message, true);
  }
});

document.getElementById('form-cosecha-edit').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = parseInt(document.getElementById('cosecha-edit-id').value);
  const cantidad = parseInt(document.getElementById('cosecha-edit-cantidad').value);
  const observacion = document.getElementById('cosecha-edit-observacion').value.trim() || null;
  try {
    await apiFetch(`/cosecha/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ cantidad, observacion }),
    });
    showToast('Cosecha actualizada');
    closeModal('modal-cosecha-edit');
    const lote_id = parseInt(cosechaFiltro.value);
    if (lote_id) loadCosechaTable(lote_id);
  } catch (err) {
    showToast('Error al actualizar cosecha: ' + err.message, true);
  }
});

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

function nombreColor(code) {
  const map = {
    BL: 'Blanco',
    AZ: 'Azul',
    RO: 'Rojo',
    CA: 'Cafe',
    NE: 'Negro',
    NA: 'Naranja',
    VE: 'Verde',
    AM: 'Amarillo',
  };
  return map[code?.toUpperCase()] || code || '—';
}

/* ---- Dashboard / Inicio ---- */
async function loadDashboard() {
  try {
    const data = await apiFetch('/dashboard/hoy');
    document.getElementById('inicio-fecha').textContent =
      formatDateColombia(data.fecha_consultada);
    document.getElementById('inicio-semana').textContent = data.numero_semana;
    const embDot = document.getElementById('inicio-embolse-dot');
    embDot.style.background = colorHex(data.color_embolse_hoy);
    document.getElementById('inicio-embolse-label').textContent =
      nombreColor(data.color_embolse_hoy);
    const coloresSpan = document.getElementById('inicio-cosecha-colores');
    coloresSpan.innerHTML = data.colores_cosecha_hoy
      .map(
        (c) =>
          `<span class="color-dot" style="background:${colorHex(c)}"></span> ${nombreColor(c)}`
      )
      .join(', ');
    const container = document.getElementById('inicio-detalle-cosecha');
    container.innerHTML = data.detalle_cosecha
      .filter((d) => d.lotes.length > 0)
      .map(
        (d) => `
      <div class="card">
        <h3><span class="color-dot" style="background:${colorHex(d.color)}"></span> Cosecha Color: ${nombreColor(d.color)}</h3>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Lote</th><th>Cantidad</th></tr>
            </thead>
            <tbody>
              ${d.lotes.map((l) => `<tr><td>${esc(l.lote_nombre)}</td><td>${l.total_embolse}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`
      )
      .join('');
    if (container.innerHTML === '') {
      container.innerHTML =
        '<div class="card"><p class="empty-msg">No hay cosecha programada para hoy</p></div>';
    }
  } catch (err) {
    showToast('Error al cargar dashboard: ' + err.message, true);
  }
}

/* ---- Inventario Proyectado ---- */
async function loadInventario() {
  const tbody = document.getElementById('tbody-inventario');
  try {
    const data = await apiFetch('/dashboard/inventario');
    if (data.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="3" class="empty-msg">Sin datos de inventario proyectado</td></tr>';
      return;
    }
    tbody.innerHTML = data
      .map(
        (s) => `
      ${s.colores
        .map(
          (c) => `
        <tr>
          <td>Semana ${s.semana}</td>
          <td><span class="color-dot" style="background:${colorHex(c.color)}"></span> ${nombreColor(c.color)}</td>
          <td>${c.total_embolse}</td>
        </tr>`
        )
        .join('')}`
      )
      .join('');
  } catch (err) {
    tbody.innerHTML =
      '<tr><td colspan="3" class="empty-msg">Error al cargar inventario proyectado</td></tr>';
    showToast('Error al cargar inventario proyectado: ' + err.message, true);
  }
}

/* ---- Alertas de Recobro ---- */
async function loadAlertas() {
  const container = document.getElementById('alertas-container');
  try {
    const data = await apiFetch('/dashboard/alertas');
    if (data.length === 0) {
      container.innerHTML = '<p class="empty-msg">No hay alertas de recobro</p>';
      return;
    }
    container.innerHTML = data
      .map(
        (a) => `
      <div class="alerta alerta-${a.nivel_alerta === 'crítico' ? 'critico' : 'advertencia'}">
        <div class="alerta-header">
          <span class="alerta-icon">${a.nivel_alerta === 'crítico' ? '&#9888;' : '&#9888;'}</span>
          <span class="alerta-lote">${esc(a.lote_nombre)}</span>
          <span class="alerta-nivel">${a.nivel_alerta.toUpperCase()}</span>
        </div>
        <div class="alerta-body">
          <span>Recobro: <strong>${a.recobro}%</strong></span>
        </div>
      </div>`
      )
      .join('');
  } catch (err) {
    container.innerHTML = '<p class="empty-msg">Error al cargar alertas</p>';
    showToast('Error al cargar alertas: ' + err.message, true);
  }
}

/* ---- Init ---- */
async function init() {
  document.getElementById('embolse-filtro-lote').dataset.placeholder =
    'Seleccionar lote para ver embolses...';
  document.getElementById('cosecha-filtro-lote').dataset.placeholder =
    'Seleccionar lote para ver cosechas...';
  await Promise.all([loadLoteSelects(), loadDashboard(), loadInventario(), loadAlertas()]);
  await loadLotesTable();
}

init();
