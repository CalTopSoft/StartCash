import { authService } from '../services/auth.service.js';
import { inputGroup, showFieldError, clearFieldErrors } from '../components/FormBuilder.js';
import { icons } from '../components/Icons.js';
import { toast } from '../components/Toast.js';
import { validateEmail } from '../utility/helpers.js';

export function renderLogin(onSuccess) {
  document.body.innerHTML = '';

  const page = document.createElement('div');
  page.className = 'auth-page';

  page.innerHTML = `
    <div class="auth-bg">
      <div class="auth-bg-circle"></div>
      <div class="auth-bg-circle"></div>
    </div>
    <div class="auth-card">
      <div class="auth-logo">
        <div class="auth-logo-icon">
          ${icons.creditCard.replace(/width="\d+"/, 'width="22"').replace(/height="\d+"/, 'height="22"').replace('stroke="currentColor"', 'stroke="#fff"')}
        </div>
        <div>
          <div class="sidebar-logo-text"></div>
          <div class="sidebar-logo-sub">Gestion de prestamos</div>
        </div>
      </div>
      <h1 class="auth-title">Bienvenido</h1>
      <p class="auth-subtitle">Inicia sesion para continuar</p>
      <div id="authError" class="alert alert-error" style="display:none;margin-bottom:16px;">
        <span style="flex-shrink:0;">${icons.alert}</span>
        <span id="authErrorMsg"></span>
      </div>
      <form id="loginForm" novalidate>
        <div class="form-grid" style="gap:16px;">
          <div id="emailGroup"></div>
          <div id="passwordGroup"></div>
        </div>
        <button type="submit" class="btn btn-primary btn-full" style="margin-top:24px;" id="loginBtn">
          Iniciar sesion
        </button>
      </form>
      <div class="auth-switch">
        No tienes cuenta? <a id="switchToRegister">Registrarse</a>
      </div>
    </div>
  `;

  document.body.appendChild(page);

  const emailGroup = inputGroup({ id: 'email', label: 'Correo electronico', type: 'email', placeholder: 'tu@correo.com', required: true, icon: 'mail' });
  const passGroup = inputGroup({ id: 'password', label: 'Contrasena', type: 'password', placeholder: 'Minimo 6 caracteres', required: true, icon: 'lock' });

  page.querySelector('#emailGroup').replaceWith(emailGroup);
  page.querySelector('#passwordGroup').replaceWith(passGroup);

  page.querySelector('#switchToRegister').onclick = (e) => {
    e.preventDefault();
    renderRegister(onSuccess);
  };

  const form = page.querySelector('#loginForm');
  const btn = page.querySelector('#loginBtn');
  const errBox = page.querySelector('#authError');
  const errMsg = page.querySelector('#authErrorMsg');

  form.onsubmit = async (e) => {
    e.preventDefault();
    clearFieldErrors('email', 'password');
    errBox.style.display = 'none';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    let valid = true;

    if (!email) { showFieldError('email', 'El correo es requerido'); valid = false; }
    else if (!validateEmail(email)) { showFieldError('email', 'Correo invalido'); valid = false; }
    if (!password) { showFieldError('password', 'La contrasena es requerida'); valid = false; }

    if (!valid) return;

    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Iniciando sesion...`;

    try {
      await authService.login(email, password);
      toast.success('Sesion iniciada correctamente');
      onSuccess();
    } catch (err) {
      errMsg.textContent = err.message;
      errBox.style.display = 'flex';
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Iniciar sesion';
    }
  };
}

export function renderRegister(onSuccess) {
  document.body.innerHTML = '';

  const page = document.createElement('div');
  page.className = 'auth-page';

  page.innerHTML = `
    <div class="auth-bg">
      <div class="auth-bg-circle"></div>
      <div class="auth-bg-circle"></div>
    </div>
    <div class="auth-card">
      <div class="auth-logo">
        <div class="auth-logo-icon">
          ${icons.creditCard.replace(/width="\d+"/, 'width="22"').replace(/height="\d+"/, 'height="22"').replace('stroke="currentColor"', 'stroke="#fff"')}
        </div>
        <div>
          <div class="sidebar-logo-text"></div>
          <div class="sidebar-logo-sub">Gestion de prestamos</div>
        </div>
      </div>
      <h1 class="auth-title">Crear cuenta</h1>
      <p class="auth-subtitle">Registra tu nueva cuenta</p>
      <div id="authError" class="alert alert-error" style="display:none;margin-bottom:16px;">
        <span style="flex-shrink:0;">${icons.alert}</span>
        <span id="authErrorMsg"></span>
      </div>
      <form id="registerForm" novalidate>
        <div class="form-grid" style="gap:16px;">
          <div id="nameGroup"></div>
          <div id="emailGroup"></div>
          <div id="passwordGroup"></div>
        </div>
        <button type="submit" class="btn btn-primary btn-full" style="margin-top:24px;" id="registerBtn">
          Crear cuenta
        </button>
      </form>
      <div class="auth-switch">
        Ya tienes cuenta? <a id="switchToLogin">Iniciar sesion</a>
      </div>
    </div>
  `;

  document.body.appendChild(page);

  page.querySelector('#nameGroup').replaceWith(inputGroup({ id: 'name', label: 'Nombre completo', type: 'text', placeholder: 'Tu nombre', required: true, icon: 'user' }));
  page.querySelector('#emailGroup').replaceWith(inputGroup({ id: 'email', label: 'Correo electronico', type: 'email', placeholder: 'tu@correo.com', required: true, icon: 'mail' }));
  page.querySelector('#passwordGroup').replaceWith(inputGroup({ id: 'password', label: 'Contrasena', type: 'password', placeholder: 'Minimo 6 caracteres', required: true, icon: 'lock' }));

  page.querySelector('#switchToLogin').onclick = (e) => {
    e.preventDefault();
    renderLogin(onSuccess);
  };

  const form = page.querySelector('#registerForm');
  const btn = page.querySelector('#registerBtn');
  const errBox = page.querySelector('#authError');
  const errMsg = page.querySelector('#authErrorMsg');

  form.onsubmit = async (e) => {
    e.preventDefault();
    clearFieldErrors('name', 'email', 'password');
    errBox.style.display = 'none';

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    let valid = true;

    if (!name || name.length < 2) { showFieldError('name', 'El nombre debe tener al menos 2 caracteres'); valid = false; }
    if (!email) { showFieldError('email', 'El correo es requerido'); valid = false; }
    else if (!validateEmail(email)) { showFieldError('email', 'Correo invalido'); valid = false; }
    if (!password || password.length < 6) { showFieldError('password', 'La contrasena debe tener al menos 6 caracteres'); valid = false; }

    if (!valid) return;

    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Creando cuenta...`;

    try {
      await authService.register(name, email, password);
      toast.success('Cuenta creada correctamente');
      onSuccess();
    } catch (err) {
      errMsg.textContent = err.message;
      errBox.style.display = 'flex';
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Crear cuenta';
    }
  };
}
