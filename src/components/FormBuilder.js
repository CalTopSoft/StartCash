import { icons } from './Icons.js';

export function inputGroup({
  id,
  label,
  type = 'text',
  placeholder = '',
  required = false,
  icon = null,
  value = '',
  min,
  max,
  step,
  minLength,
  maxLength,
  pattern,
  inputMode,
}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'input-group';

  const hasIcon = !!icon;
  wrapper.innerHTML = `
    <label class="input-label" for="${id}">${label}${required ? ' *' : ''}</label>
    <div class="input-wrapper${hasIcon ? ' has-icon' : ''}${type === 'password' ? ' has-toggle' : ''}">
      ${hasIcon ? `<span class="input-icon">${icons[icon] || ''}</span>` : ''}
      <input
        class="input-field"
        style="${hasIcon ? 'padding-left:36px;' : ''}"
        id="${id}"
        name="${id}"
        type="${type}"
        placeholder="${placeholder}"
        value="${value}"
        ${required ? 'required' : ''}
        ${min !== undefined ? `min="${min}"` : ''}
        ${max !== undefined ? `max="${max}"` : ''}
        ${step !== undefined ? `step="${step}"` : ''}
        ${minLength !== undefined ? `minlength="${minLength}"` : ''}
        ${maxLength !== undefined ? `maxlength="${maxLength}"` : ''}
        ${pattern ? `pattern="${pattern}"` : ''}
        ${inputMode ? `inputmode="${inputMode}"` : ''}
        autocomplete="off"
      />
      ${type === 'password' ? `<button type="button" class="input-toggle" data-for="${id}" tabindex="-1">${icons.eye}</button>` : ''}
    </div>
    <span class="input-error" id="${id}-error" style="display:none;"></span>
  `;

  if (type === 'password') {
    const toggle = wrapper.querySelector('.input-toggle');
    let visible = false;
    toggle.onclick = () => {
      visible = !visible;
      const input = wrapper.querySelector(`#${id}`);
      input.type = visible ? 'text' : 'password';
      toggle.innerHTML = visible ? icons.eyeOff : icons.eye;
    };
  }

  return wrapper;
}

export function selectGroup({ id, label, required = false, options = [], value = '' }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'input-group';
  wrapper.innerHTML = `
    <label class="input-label" for="${id}">${label}${required ? ' *' : ''}</label>
    <div class="select-wrapper">
      <select class="select-field" id="${id}" name="${id}" ${required ? 'required' : ''}>
        <option value="" disabled ${!value ? 'selected' : ''}>Seleccionar...</option>
        ${options.map(o => `<option value="${o.value}" ${o.value == value ? 'selected' : ''}>${o.label}</option>`).join('')}
      </select>
    </div>
    <span class="input-error" id="${id}-error" style="display:none;"></span>
  `;
  return wrapper;
}

export function showFieldError(id, message) {
  const el = document.getElementById(`${id}-error`);
  const input = document.getElementById(id);
  if (el) { el.textContent = message; el.style.display = 'block'; }
  if (input) input.classList.add('error');
}

export function clearFieldErrors(...ids) {
  ids.forEach(id => {
    const el = document.getElementById(`${id}-error`);
    const input = document.getElementById(id);
    if (el) { el.textContent = ''; el.style.display = 'none'; }
    if (input) input.classList.remove('error');
  });
}

export function getFormData(form) {
  const fd = new FormData(form);
  const obj = {};
  fd.forEach((v, k) => { obj[k] = v.trim(); });
  return obj;
}
