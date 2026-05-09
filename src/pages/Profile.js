import { createLayout } from '../components/Layout.js';
import { authService } from '../services/auth.service.js';
import { createModal } from '../components/Modal.js';
import { inputGroup, showFieldError, clearFieldErrors } from '../components/FormBuilder.js';
import { icons } from '../components/Icons.js';
import { toast } from '../components/Toast.js';
import { api } from '../api/client.js';
import { pickAvatar } from '../utility/avatar.js';
import { FIELD_LIMITS, validateOptionalText, validateRequiredText } from '../utility/validation.js';

export async function renderProfile() {
  document.body.innerHTML = '';
  const container = createLayout('profile', 'Mi perfil');

  container.innerHTML = `<div style="text-align:center;padding:60px 0;"><span class="spinner spinner-dark"></span></div>`;

  let user;
  try {
    user = await api.get('/auth/profile');
    authService._saveUser({ ...authService.getUser(), ...user });
  } catch {
    user = authService.getUser();
  }

  let pendingAvatar = user.avatar || null;
  let avatarChanged = false;

  function getAvatarSrc(av) {
    if (!av) return null;
    return av.startsWith('data:') ? av : `data:image/jpeg;base64,${av}`;
  }

  function render() {
    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Mi perfil</h1>
          <p class="page-subtitle">Administra tu informacion personal</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;max-width:860px;align-items:start;">

        <!-- ═══ TARJETA IZQUIERDA ═══ -->
        <div class="card" style="padding:0;overflow:hidden;">

          <!-- Banda superior -->
          <div style="height:72px;background:linear-gradient(135deg,var(--accent) 0%,#9c8fff 100%);position:relative;">
            <div style="position:absolute;inset:0;opacity:0.15;background:repeating-linear-gradient(45deg,#fff 0px,#fff 1px,transparent 1px,transparent 8px);"></div>
          </div>

          <!-- Contenido -->
          <div style="display:flex;flex-direction:column;align-items:center;padding:0 20px 24px;margin-top:-48px;text-align:center;">

            <!-- Avatar -->
            <div id="avatarWrap" style="position:relative;width:96px;height:96px;cursor:pointer;margin-bottom:12px;" title="Cambiar foto">
              <div style="width:96px;height:96px;border-radius:50%;overflow:hidden;border:4px solid var(--surface);background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:700;color:#fff;box-shadow:0 4px 20px rgba(0,0,0,0.35);">
                ${pendingAvatar
                  ? `<img src="${getAvatarSrc(pendingAvatar)}" style="width:100%;height:100%;object-fit:cover;"/>`
                  : `<span>${user.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}</span>`
                }
              </div>
              <div style="position:absolute;inset:0;border-radius:50%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;" id="avatarOverlay">
                <svg width="20" height="20" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3"/></svg>
              </div>
              ${avatarChanged ? `<div style="position:absolute;top:0;right:2px;width:13px;height:13px;border-radius:50%;background:var(--yellow);border:2px solid var(--surface);" title="Sin guardar"></div>` : ''}
            </div>

            <!-- Nombre / email -->
            <div style="font-size:17px;font-weight:700;color:var(--text);line-height:1.3;">${user.name}</div>
            <div style="font-size:13px;color:var(--text3);margin-top:3px;">${user.email}</div>

            <!-- Badge rol -->
            <div style="margin-top:8px;display:inline-flex;align-items:center;gap:5px;padding:3px 10px;background:var(--accent-glow);border:1px solid rgba(108,99,255,0.3);border-radius:20px;">
              <svg width="10" height="10" fill="var(--accent)" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span style="font-size:11px;font-weight:600;color:var(--accent2);letter-spacing:0.04em;">Administrador</span>
            </div>

            <!-- ID Público -->
            ${user.publicId ? `
              <div style="margin-top:14px;width:100%;display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);gap:6px;">
                <div style="display:flex;flex-direction:column;align-items:flex-start;gap:1px;">
                  <span style="font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--text3);">ID público</span>
                  <span style="font-family:var(--mono);font-size:18px;font-weight:700;color:var(--accent);letter-spacing:0.14em;">${user.publicId}</span>
                </div>
                <button id="copyIdBtn" title="Copiar ID" style="flex-shrink:0;width:30px;height:30px;border-radius:var(--radius-sm);background:var(--surface);border:1px solid var(--border);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text3);transition:all 200ms;">
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                </button>
              </div>
              <p style="font-size:11px;color:var(--text3);margin-top:5px;line-height:1.5;text-align:center;">
                Comparte este ID para que otros te agreguen como cliente
              </p>
            ` : ''}

            <!-- Separador -->
            <div style="width:100%;height:1px;background:var(--border);margin:14px 0;"></div>

            <!-- Botones -->
            <div style="width:100%;display:flex;flex-direction:column;gap:8px;">
              <button class="btn btn-secondary btn-sm" id="pickAvatarBtn" style="width:100%;">
                ${icons.edit} Cambiar foto
              </button>
              ${pendingAvatar ? `
                <button class="btn btn-danger btn-sm" id="removeAvatarBtn" style="width:100%;">
                  ${icons.trash} Quitar foto
                </button>
              ` : ''}
              <div style="height:1px;background:var(--border);margin:2px 0;"></div>
              <button class="btn btn-secondary btn-sm" id="changePassBtn" style="width:100%;">
                ${icons.lock} Cambiar contraseña
              </button>
            </div>

          </div>
        </div>

        <!-- ═══ TARJETA DERECHA ═══ -->
        <div class="card">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:22px;">
            <div style="width:36px;height:36px;border-radius:var(--radius-sm);background:var(--accent-glow);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              ${icons.user}
            </div>
            <div>
              <div class="card-title">Editar informacion</div>
              <div class="card-subtitle">Actualiza tu nombre y correo</div>
            </div>
          </div>

          <div class="form-grid" style="gap:16px;">
            <div id="nameField"></div>
            <div id="emailField"></div>
            <div id="phoneField"></div>
            <div id="addressField"></div>
          </div>

          <div style="margin-top:16px;padding:11px 14px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border);display:flex;align-items:center;gap:10px;">
            <svg width="14" height="14" fill="none" stroke="var(--text3)" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 16v-4m0-4h.01"/></svg>
            <span style="font-size:12px;color:var(--text3);line-height:1.5;">El avatar se guarda junto con los demas cambios al presionar <strong style="color:var(--text2);">Guardar cambios</strong></span>
          </div>

          <button class="btn btn-primary" style="margin-top:14px;width:100%;" id="saveProfileBtn">
            ${icons.check} Guardar cambios
          </button>
        </div>

      </div>
    `;

    // Inputs
    container.querySelector('#nameField').replaceWith(
      inputGroup({
        id: 'pName',
        label: 'Nombre completo',
        icon: 'user',
        value: user.name || '',
        required: true,
        minLength: FIELD_LIMITS.name.min,
        maxLength: FIELD_LIMITS.name.max,
      })
    );
    container.querySelector('#emailField').replaceWith(
      inputGroup({
        id: 'pEmail',
        label: 'Correo electronico',
        type: 'email',
        icon: 'mail',
        value: user.email || '',
        required: true,
        maxLength: FIELD_LIMITS.email.max,
      })
    );
    container.querySelector('#phoneField').replaceWith(
      inputGroup({
        id: 'pPhone',
        label: 'Telefono',
        icon: 'phone',
        value: user.phone || '',
        placeholder: 'opcional',
        maxLength: FIELD_LIMITS.phone.max,
        inputMode: 'tel',
      })
    );
    container.querySelector('#addressField').replaceWith(
      inputGroup({
        id: 'pAddress',
        label: 'Direccion',
        icon: 'location',
        value: user.address || '',
        placeholder: 'opcional',
        maxLength: FIELD_LIMITS.address.max,
      })
    );

    // Hover avatar
    const wrap = container.querySelector('#avatarWrap');
    const overlay = container.querySelector('#avatarOverlay');
    wrap.onmouseenter = () => overlay.style.opacity = '1';
    wrap.onmouseleave = () => overlay.style.opacity = '0';
    wrap.onclick = () => container.querySelector('#pickAvatarBtn').click();

    // Cambiar foto
    container.querySelector('#pickAvatarBtn').onclick = async () => {
      const base64 = await pickAvatar();
      if (!base64) return;
      pendingAvatar = base64;
      avatarChanged = true;
      render();
    };

    // Quitar foto
    container.querySelector('#removeAvatarBtn')?.addEventListener('click', () => {
      pendingAvatar = null;
      avatarChanged = true;
      render();
    });

    // Copiar publicId
    const copyBtn = container.querySelector('#copyIdBtn');
    if (copyBtn) {
      copyBtn.onmouseenter = () => {
        if (copyBtn.dataset.copied) return;
        copyBtn.style.background = 'var(--accent-glow)';
        copyBtn.style.borderColor = 'var(--accent)';
        copyBtn.style.color = 'var(--accent2)';
      };
      copyBtn.onmouseleave = () => {
        if (copyBtn.dataset.copied) return;
        copyBtn.style.background = 'var(--surface)';
        copyBtn.style.borderColor = 'var(--border)';
        copyBtn.style.color = 'var(--text3)';
      };
      copyBtn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(user.publicId);
          copyBtn.dataset.copied = 'true';
          copyBtn.style.background = 'var(--green-bg)';
          copyBtn.style.borderColor = 'rgba(34,211,160,0.4)';
          copyBtn.style.color = 'var(--green)';
          copyBtn.innerHTML = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`;
          setTimeout(() => {
            delete copyBtn.dataset.copied;
            copyBtn.style.background = 'var(--surface)';
            copyBtn.style.borderColor = 'var(--border)';
            copyBtn.style.color = 'var(--text3)';
            copyBtn.innerHTML = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path stroke-linecap="round" stroke-linejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`;
          }, 1800);
        } catch {
          toast.info('Copia manualmente: ' + user.publicId);
        }
      };
    }

    // Guardar cambios
    container.querySelector('#saveProfileBtn').onclick = async () => {
      clearFieldErrors('pName', 'pEmail', 'pPhone', 'pAddress');
      const name    = document.getElementById('pName').value.trim();
      const email   = document.getElementById('pEmail').value.trim();
      const phone   = document.getElementById('pPhone').value.trim();
      const address = document.getElementById('pAddress').value.trim();
      let valid = true;
      const nameErr = validateRequiredText(name, FIELD_LIMITS.name, 'El nombre');
      if (nameErr) { showFieldError('pName', nameErr); valid = false; }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showFieldError('pEmail', 'Correo invalido'); valid = false; }
      else if (email.length > FIELD_LIMITS.email.max) { showFieldError('pEmail', `Correo demasiado largo (max ${FIELD_LIMITS.email.max})`); valid = false; }
      const phoneErr = validateOptionalText(phone, FIELD_LIMITS.phone, 'El telefono');
      if (phoneErr) { showFieldError('pPhone', phoneErr); valid = false; }
      const addressErr = validateOptionalText(address, FIELD_LIMITS.address, 'La direccion');
      if (addressErr) { showFieldError('pAddress', addressErr); valid = false; }
      if (!valid) return;

      const btn = container.querySelector('#saveProfileBtn');
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> Guardando...`;

      try {
        console.log('Guardando:', { name, email, phone, address });
        const updated = await api.put('/auth/profile', { name, email, phone, address });
        if (avatarChanged) await api.put('/auth/avatar', { avatar: pendingAvatar });
        
        user = { ...user, name: updated.name, email: updated.email, phone: updated.phone, address: updated.address, avatar: pendingAvatar };
        avatarChanged = false;
        authService._saveUser(user);
        window.dispatchEvent(new CustomEvent('userUpdated'));

        toast.success('Perfil guardado');
        render();
      } catch (err) {
        toast.error(err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = `${icons.check} Guardar cambios`;
      }
    };

    // Abrir modal contraseña SOLO al click
    container.querySelector('#changePassBtn').onclick = () => openPasswordModal();
  }

  // Llamar render UNA sola vez al final
  render();
}

// Modal contraseña — función separada, NO se llama sola
function openPasswordModal() {
  const content = document.createElement('div');
  content.className = 'form-grid';
  content.style.gap = '16px';
  content.appendChild(inputGroup({
    id: 'pCurPass',
    label: 'Contrasena actual',
    type: 'password',
    icon: 'lock',
    required: true,
    minLength: FIELD_LIMITS.password.min,
    maxLength: FIELD_LIMITS.password.max,
  }));
  content.appendChild(inputGroup({
    id: 'pNewPass',
    label: 'Nueva contrasena',
    type: 'password',
    icon: 'lock',
    required: true,
    placeholder: 'Minimo 6 caracteres',
    minLength: FIELD_LIMITS.password.min,
    maxLength: FIELD_LIMITS.password.max,
  }));
  content.appendChild(inputGroup({
    id: 'pConfPass',
    label: 'Confirmar nueva contrasena',
    type: 'password',
    icon: 'lock',
    required: true,
    minLength: FIELD_LIMITS.password.min,
    maxLength: FIELD_LIMITS.password.max,
  }));

  const footer = document.createElement('div');
  footer.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-danger';
  cancelBtn.style.cssText = 'width:100%;justify-content:center;';
  cancelBtn.textContent = 'Cancelar';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary';
  saveBtn.style.cssText = 'width:100%;justify-content:center;';
  saveBtn.textContent = 'Actualizar';

  footer.appendChild(cancelBtn);
  footer.appendChild(saveBtn);

  const { close } = createModal({ title: 'Cambiar contraseña', content, footer });
  cancelBtn.onclick = close;

  saveBtn.onclick = async () => {
    clearFieldErrors('pCurPass', 'pNewPass', 'pConfPass');
    const curP  = document.getElementById('pCurPass').value;
    const newP  = document.getElementById('pNewPass').value;
    const confP = document.getElementById('pConfPass').value;
    let valid = true;
    const curErr = validateRequiredText(curP, FIELD_LIMITS.password, 'La contrasena actual');
    if (curErr) { showFieldError('pCurPass', curErr); valid = false; }
    const newErr = validateRequiredText(newP, FIELD_LIMITS.password, 'La nueva contrasena');
    if (newErr) { showFieldError('pNewPass', newErr); valid = false; }
    if (newP !== confP) { showFieldError('pConfPass', 'Las contraseñas no coinciden'); valid = false; }
    if (!valid) return;

    saveBtn.disabled = true;
    cancelBtn.disabled = true;
    saveBtn.innerHTML = `<span class="spinner"></span>`;
    try {
      await api.put('/auth/password', { currentPassword: curP, newPassword: newP });
      toast.success('Contraseña actualizada');
      close();
    } catch (err) {
      toast.error(err.message);
      saveBtn.disabled = false;
      cancelBtn.disabled = false;
      saveBtn.textContent = 'Actualizar';
    }
  };
}
