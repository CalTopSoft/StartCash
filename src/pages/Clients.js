import { createLayout } from '../components/Layout.js';
import { clientService } from '../services/client.service.js';
import { createModal, confirmDialog } from '../components/Modal.js';
import { inputGroup, showFieldError, clearFieldErrors } from '../components/FormBuilder.js';
import { icons } from '../components/Icons.js';
import { toast } from '../components/Toast.js';
import { validateEmail, debounce } from '../utility/helpers.js';

let allClients = [];

export async function renderClients() {
  document.body.innerHTML = '';
  const container = createLayout('clients', 'Clientes');
  container.innerHTML = `<div style="text-align:center;padding:60px 0;"><span class="spinner spinner-dark"></span></div>`;

  try {
    allClients = await clientService.list();
    renderClientsList(container, allClients);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${icons.alert} ${err.message}</div>`;
  }
}

function renderClientsList(container, clients) {
  container.innerHTML = `
<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;">
      <div>
        <h1 class="page-title">Clientes</h1>
        <p class="page-subtitle">${clients.length} clientes registrados</p>
      </div>
      <button class="btn btn-primary" id="newClientBtn" style="white-space:nowrap;flex-shrink:0;">${icons.plus} Nuevo cliente</button>
    </div>

    <div class="card">
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;">
        <div class="search-bar" style="max-width:100%;">
          ${icons.search}
          <input type="text" placeholder="Buscar por nombre, correo o telefono..." id="clientSearch"/>
        </div>
        </div>
      <div class="table-wrapper">
        <table class="clients-table">
      <thead>
        <tr>
          <th class="col-desktop">Nombre</th>
          <th class="col-desktop">Correo</th>
          <th class="col-desktop">Telefono</th>
          <th class="col-desktop">Direccion</th>
          <th class="col-desktop">Editar</th>
          <th class="col-desktop">Borrar</th>
          <th class="col-mobile" style="width:100%;">
            <div style="display:flex;align-items:center;">
              <span style="flex:1;">Clientes</span>
              <span style="width:60px;text-align:center;font-size:11px;font-weight:600;letter-spacing:0.06em;color:var(--text3);">EDITAR</span>
              <span style="width:60px;text-align:center;font-size:11px;font-weight:600;letter-spacing:0.06em;color:var(--text3);">BORRAR</span>
            </div>
          </th>
        </tr>
      </thead>
          <tbody id="clientsBody"></tbody>
        </table>
      </div>
      <div id="emptyClients" class="empty-state" style="display:none;">
        <div class="empty-state-icon">${icons.clients}</div>
        <div class="empty-state-title">Sin clientes</div>
        <div class="empty-state-desc">Agrega tu primer cliente para comenzar</div>
        <button class="btn btn-primary" id="emptyNewBtn">${icons.plus} Nuevo cliente</button>
      </div>
    </div>
  `;

  const tbody = container.querySelector('#clientsBody');
  const emptyState = container.querySelector('#emptyClients');

  function renderRows(data) {
    tbody.innerHTML = '';
    if (!data.length) {
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';
    data.forEach(client => {
      const shortName = client.name.length > 10 ? client.name.slice(0, 10) + '…' : client.name;
      const avatarHTML = client.avatar
        ? `<img src="${client.avatar.startsWith('data:') ? client.avatar : `data:image/jpeg;base64,${client.avatar}`}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0;"/>`
        : `<div class="user-avatar" style="width:32px;height:32px;font-size:12px;">${client.name.slice(0,2).toUpperCase()}</div>`;
    
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <!-- DESKTOP: tabla normal -->
        <td class="col-desktop">
          <div style="display:flex;align-items:center;gap:10px;">
            ${avatarHTML}
            <span class="td-primary">${client.name}</span>
          </div>
        </td>
        <td class="col-desktop">${client.email || '—'}</td>
        <td class="col-desktop">${client.phone || '—'}</td>
        <td class="col-desktop">${client.address || '—'}</td>
        <td class="col-desktop" style="text-align:center;">
          <button class="btn btn-ghost btn-icon" data-action="edit" data-id="${client._id}" title="Editar">${icons.edit}</button>
        </td>
        <td class="col-desktop" style="text-align:center;">
          <button class="btn btn-ghost btn-icon" style="color:var(--red);" data-action="delete" data-id="${client._id}" title="Eliminar">${icons.trash}</button>
        </td>
    
        <!-- MOBILE: fila única con todo -->
        <td class="col-mobile" colspan="5">
          <div style="display:flex;align-items:center;">
            ${avatarHTML}
            <span class="td-primary" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-left:10px;">${shortName}</span>
        <button data-action="edit" data-id="${client._id}" style="width:60px;height:34px;flex-shrink:0;background:none;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text2);border-radius:var(--radius-sm);transition:background 200ms;">
          ${icons.edit}
        </button>
        <button data-action="delete" data-id="${client._id}" style="width:60px;height:34px;flex-shrink:0;background:none;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--red);border-radius:var(--radius-sm);transition:background 200ms;">
          ${icons.trash}
        </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  renderRows(allClients);

  const search = container.querySelector('#clientSearch');
  search.oninput = debounce(() => {
    const q = search.value.toLowerCase();
    const filtered = allClients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
    );
    renderRows(filtered);
  }, 250);

  const openModal = (client = null) => clientModal(client, async () => {
    allClients = await clientService.list();
    renderClientsList(container, allClients);
  });

  container.querySelector('#newClientBtn').onclick = () => openModal();
  container.querySelector('#emptyNewBtn')?.addEventListener('click', () => openModal());

  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const client = allClients.find(c => c._id === id);
    if (btn.dataset.action === 'edit') openModal(client);
    if (btn.dataset.action === 'delete') {
      confirmDialog(`¿Eliminar al cliente <strong>${client.name}</strong>? Esta accion no se puede deshacer.`, async () => {
        try {
          await clientService.delete(id);
          toast.success('Cliente eliminado');
          allClients = await clientService.list();
          renderClientsList(container, allClients);
        } catch (err) {
          toast.error(err.message);
        }
      });
    }
  });
}

function clientModal(client, onSave) {
  const isEdit = !!client;
  let currentAvatar = client?.avatar || null;

  const content = document.createElement('div');
  content.className = 'form-grid';
  content.style.gap = '12px';

  // Avatar picker
  const avatarRow = document.createElement('div');
  avatarRow.style.cssText = 'display:flex;align-items:center;gap:14px;margin-bottom:4px;';

  function avatarRowHTML() {
    return `
      <div style="width:48px;height:48px;border-radius:50%;overflow:hidden;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:#fff;flex-shrink:0;">
        ${currentAvatar
          ? `<img src="${currentAvatar.startsWith('data:') ? currentAvatar : `data:image/jpeg;base64,${currentAvatar}`}" style="width:100%;height:100%;object-fit:cover;"/>`
          : (client?.name || '?').slice(0,2).toUpperCase()
        }
      </div>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:500;color:var(--text);margin-bottom:6px;">Foto de perfil</div>
        <div style="display:flex;gap:8px;">
          <button type="button" class="btn btn-secondary btn-sm" id="clientPickAvatar" style="flex:1;">Subir foto</button>
          ${currentAvatar ? `<button type="button" class="btn btn-danger btn-sm" id="clientRemoveAvatar" style="flex:1;">Quitar</button>` : ''}
        </div>
      </div>
    `;
  }

  avatarRow.innerHTML = avatarRowHTML();

  function bindAvatarEvents() {
    avatarRow.querySelector('#clientPickAvatar')?.addEventListener('click', async () => {
      const { pickAvatar } = await import('../utility/avatar.js');
      const base64 = await pickAvatar();
      if (!base64) return;
      currentAvatar = base64;
      avatarRow.innerHTML = avatarRowHTML();
      bindAvatarEvents();
    });
    avatarRow.querySelector('#clientRemoveAvatar')?.addEventListener('click', () => {
      currentAvatar = null;
      avatarRow.innerHTML = avatarRowHTML();
      bindAvatarEvents();
    });
  }
  bindAvatarEvents();

  // Campos del formulario
  const formWrap = document.createElement('div');
  formWrap.className = 'form-grid';
  formWrap.style.gap = '14px';
  formWrap.appendChild(avatarRow);
  formWrap.appendChild(inputGroup({ id: 'cName',    label: 'Nombre completo',      required: true, icon: 'user',     value: client?.name    || '', placeholder: 'Nombre del cliente' }));
  formWrap.appendChild(inputGroup({ id: 'cEmail',   label: 'Correo electronico',   type: 'email',  icon: 'mail',     value: client?.email   || '', placeholder: 'opcional' }));
  formWrap.appendChild(inputGroup({ id: 'cPhone',   label: 'Telefono',                             icon: 'phone',    value: client?.phone   || '', placeholder: 'opcional' }));
  formWrap.appendChild(inputGroup({ id: 'cAddress', label: 'Direccion',                            icon: 'location', value: client?.address || '', placeholder: 'opcional' }));

  if (!isEdit) {
    // Sección 1
    const sec1 = document.createElement('div');
    sec1.style.cssText = 'padding:14px;background:var(--green-bg);border:1px solid rgba(34,211,160,0.25);border-radius:var(--radius-sm);';    sec1.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <div style="width:22px;height:22px;border-radius:50%;background:var(--green);display:flex;align-items:center;justify-content:center;flex-shrink:0;line-height:1;">
          <span style="font-size:11px;font-weight:700;color:#fff;line-height:1;">1</span>
        </div>
        <span style="font-size:13px;font-weight:600;color:var(--text);">Agregar con ID de cuenta</span>
      </div>
      <div style="display:flex;gap:8px;align-items:stretch;">
        <input id="publicIdInput" class="input-field" placeholder="Ej: 482910" maxlength="6"
          style="font-family:var(--mono);letter-spacing:0.08em;font-size:12px;font-weight:600;text-align:center;flex:1;padding:10px 12px;"/>
        <button type="button" class="btn btn-secondary btn-sm" id="lookupBtn" style="white-space:nowrap;flex-shrink:0;">
          ${icons.search} Buscar
        </button>
      </div>
      <div id="lookupResult" style="margin-top:8px;display:none;"></div>
    `;
    content.appendChild(sec1);

    // Divisor
    const divisor = document.createElement('div');
    divisor.style.cssText = 'display:flex;align-items:center;gap:10px;';
    divisor.innerHTML = `
      <div style="flex:1;height:1px;background:var(--border);"></div>
      <span style="font-size:11px;font-weight:600;color:var(--text3);letter-spacing:0.08em;">O</span>
      <div style="flex:1;height:1px;background:var(--border);"></div>
    `;
    content.appendChild(divisor);

    // Sección 2 con formulario dentro
    const sec2 = document.createElement('div');
    sec2.style.cssText = 'padding:14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);';    sec2.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
      <div style="width:22px;height:22px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;flex-shrink:0;line-height:1;">
        <span style="font-size:11px;font-weight:700;color:#fff;line-height:1;">2</span>
      </div>
        <span style="font-size:13px;font-weight:600;color:var(--text);">Crear cliente manualmente</span>
      </div>
    `;
    sec2.appendChild(formWrap);
    content.appendChild(sec2);

    // Lógica búsqueda por ID
    let linkedPublicId = null;

    sec1.querySelector('#lookupBtn').onclick = async () => {
      const pid = document.getElementById('publicIdInput').value.trim();
      const resultEl = sec1.querySelector('#lookupResult');

      if (!/^\d{6}$/.test(pid)) {
        resultEl.style.display = 'block';
        resultEl.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--red-bg);border-radius:var(--radius-sm);">
            <svg width="14" height="14" fill="none" stroke="var(--red)" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01"/></svg>
            <span style="color:var(--red);font-size:13px;">Ingresa 6 dígitos</span>
          </div>`;
        return;
      }

      const btn = sec1.querySelector('#lookupBtn');
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner spinner-dark"></span>`;

      try {
        const data = await clientService.lookupByPublicId(pid);
        linkedPublicId = pid;

        const avatarHTML = data.avatar
  ? `<img src="${data.avatar.startsWith('data:') ? data.avatar : `data:image/jpeg;base64,${data.avatar}`}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0;"/>`
  : `<div class="user-avatar" style="width:32px;height:32px;font-size:12px;flex-shrink:0;">${data.name.slice(0,2).toUpperCase()}</div>`;

  resultEl.style.display = 'block';
  resultEl.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px;background:var(--surface);border:1px solid rgba(34,211,160,0.25);border-radius:var(--radius-sm);margin-top:8px;text-align:center;">
      ${avatarHTML}
      <span style="font-weight:600;color:var(--text);font-size:12px;width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${data.name}</span>
      <button type="button" class="btn btn-primary btn-sm" id="addLinkedBtn" style="width:100%;">
        ${icons.plus} Agregar
      </button>
    </div>
  `;

        resultEl.querySelector('#addLinkedBtn').onclick = async () => {
          const addBtn = resultEl.querySelector('#addLinkedBtn');
          addBtn.disabled = true;
          addBtn.innerHTML = `<span class="spinner"></span>`;
          try {
            await clientService.addByPublicId(linkedPublicId);
            toast.success('Cliente agregado');
            modalClose();
            onSave();
          } catch (err) {
            toast.error(err.message);
            addBtn.disabled = false;
            addBtn.innerHTML = `${icons.plus} Agregar`;
          }
        };

      } catch (err) {
        linkedPublicId = null;
        resultEl.style.display = 'block';
        resultEl.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--red-bg);border-radius:var(--radius-sm);">
            <svg width="14" height="14" fill="none" stroke="var(--red)" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01"/></svg>
            <span style="color:var(--red);font-size:13px;">${err.message}</span>
          </div>`;
      } finally {
        btn.disabled = false;
        btn.innerHTML = `${icons.search} Buscar`;
      }
    };

  } else {
    content.appendChild(formWrap);
  }

  // Footer
  const footer = document.createElement('div');
  footer.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-danger';
  cancelBtn.style.cssText = 'width:100%;justify-content:center;';
  cancelBtn.textContent = 'Cancelar';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary';
  saveBtn.style.cssText = 'width:100%;justify-content:center;';
  saveBtn.textContent = isEdit ? 'Guardar cambios' : 'Crear cliente';

  footer.appendChild(cancelBtn);
  footer.appendChild(saveBtn);

  const { close: modalClose } = createModal({
    title: isEdit ? 'Editar cliente' : 'Nuevo cliente',
    content,
    footer,
  });

  cancelBtn.onclick = modalClose;

  saveBtn.onclick = async () => {
    clearFieldErrors('cName', 'cEmail');
    const name    = document.getElementById('cName').value.trim();
    const email   = document.getElementById('cEmail').value.trim();
    const phone   = document.getElementById('cPhone').value.trim();
    const address = document.getElementById('cAddress').value.trim();
    let valid = true;

    if (!name || name.length < 2) { showFieldError('cName', 'El nombre debe tener al menos 2 caracteres'); valid = false; }
    if (email && !validateEmail(email)) { showFieldError('cEmail', 'Correo invalido'); valid = false; }
    if (!valid) return;

    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="spinner"></span>`;

    try {
      const data = { name, avatar: currentAvatar };
      if (email)   data.email   = email;
      if (phone)   data.phone   = phone;
      if (address) data.address = address;

      if (isEdit) {
        await clientService.update(client._id, data);
        toast.success('Cliente actualizado');
      } else {
        await clientService.create(data);
        toast.success('Cliente creado');
      }
      modalClose();
      onSave();
    } catch (err) {
      toast.error(err.message);
      saveBtn.disabled = false;
      saveBtn.textContent = isEdit ? 'Guardar cambios' : 'Crear cliente';
    }
  };
}