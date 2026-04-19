import { authService } from '../services/auth.service.js';
import { inputGroup, showFieldError, clearFieldErrors } from '../components/FormBuilder.js';
import { icons } from '../components/Icons.js';
import { toast } from '../components/Toast.js';
import { validateEmail } from '../utility/helpers.js';

const AUTH_STYLE_ID = 'auth-centering-style';

/**
 * Estilo mejorado con variables CSS para modo claro/oscuro
 */
function injectAuthCenteringStyle() {
  if (document.getElementById(AUTH_STYLE_ID)) return;
  
  const style = document.createElement('style');
  style.id = AUTH_STYLE_ID;
  style.textContent = `
    /* ==================== VARIABLES CSS ==================== */
    .auth-page {
      --bg-gradient-start: var(--bg-primary, #0a0a0a);
      --bg-gradient-end: var(--bg-secondary, #1a1a2e);
      --card-bg: var(--surface-primary, rgba(255, 255, 255, 0.05));
      --card-border: var(--border-color, rgba(250, 204, 21, 0.1));
      --text-primary: var(--text-primary, #ffffff);
      --text-secondary: var(--text-secondary, #94a3b8);
      --accent-color: var(--accent-primary, #facc15);
      --accent-hover: var(--accent-hover, #eab308);
      --error-bg: var(--error-bg, rgba(239, 68, 68, 0.1));
      --error-border: var(--error-border, rgba(239, 68, 68, 0.3));
      --error-text: var(--error-text, #f87171);
      --shadow-color: var(--shadow-color, rgba(0, 0, 0, 0.3));
      --glow-color: var(--accent-primary, rgba(250, 204, 21, 0.3));
    }

    /* ==================== ANIMACIONES ==================== */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes floatMoney {
      0% {
        transform: translateY(120vh) rotate(0deg) scale(0.5);
        opacity: 0;
      }
      10% {
        opacity: 0.15;
      }
      90% {
        opacity: 0.15;
      }
      100% {
        transform: translateY(-50vh) rotate(720deg) scale(1);
        opacity: 0;
      }
    }

    @keyframes pulseGlow {
      0%, 100% {
        box-shadow: 0 0 15px var(--glow-color);
      }
      50% {
        box-shadow: 0 0 25px var(--glow-color);
      }
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
      20%, 40%, 60%, 80% { transform: translateX(2px); }
    }

    /* ==================== PÁGINA PRINCIPAL ==================== */
    .auth-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 16px;
      box-sizing: border-box;
      position: relative;
      background: linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%);
      overflow: hidden;
    }

    /* ==================== TARJETA PRINCIPAL ==================== */
    .auth-card {
      width: 100%;
      max-width: 400px;
      margin: 0 auto;
      z-index: 2;
      animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      background: var(--card-bg);
      backdrop-filter: blur(10px);
      border-radius: 28px;
      padding: 28px 24px;
      box-shadow: 0 20px 35px var(--shadow-color),
                  0 0 0 1px var(--card-border);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .auth-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 25px 40px var(--shadow-color),
                  0 0 0 2px var(--card-border);
    }

    /* ==================== LOGO REDONDO ==================== */
.auth-logo-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  gap: 14px;
}

.logo-circle {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-color) 0%, var(--accent-hover) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  box-shadow: 0 8px 25px var(--glow-color);
  animation: pulseGlow 2s ease-in-out infinite;
  transition: transform 0.3s ease;
  overflow: visible;
  padding: 10px;
  box-sizing: border-box;
  flex-shrink: 0;
}

.logo-circle:hover {
  transform: scale(1.05);
}

.logo-image {
  width: 70px;
  height: 70px;
  object-fit: contain;
  border-radius: 50%;
  display: block;
  /* filter: brightness(0) invert(1); */
}

    .logo-text-container {
      text-align: center;
    }

    .logo-main-text {
      font-size: 1.6rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, var(--accent-color) 0%, var(--accent-hover) 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      margin-bottom: 2px;
    }

    .logo-sub-text {
      font-size: 0.8rem;
      color: var(--text-secondary);
      letter-spacing: 0.3px;
    }

    /* ==================== TEXTOS ==================== */
    .auth-title {
      text-align: center;
      margin-bottom: 8px;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .auth-subtitle {
      text-align: center;
      margin-bottom: 24px;
      color: var(--text-secondary);
      font-size: 0.85rem;
    }

    /* ==================== FORMULARIO ==================== */
    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 20px;
    }



    /* ==================== BOTÓN MEJORADO ==================== */
/* ==================== BOTÓN MEJORADO ==================== */
.btn-primary {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); /* ← Morado StartCash */
  border: none;
  padding: 12px 20px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #ffffff;  /* ← Texto blanco para contraste */
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.btn-primary:hover::before {
  left: 100%;
}

.btn-primary:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); /* ← Morado más oscuro al hover */
  box-shadow: 0 8px 25px rgba(124, 58, 237, 0.4); /* ← Glow morado */
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

    /* ==================== ENLACES ==================== */
    .auth-link {
      color: var(--accent-color);
      text-decoration: none;
      font-weight: 600;
      position: relative;
      transition: all 0.3s ease;
      cursor: pointer;
      font-size: 0.85rem;
    }

    .auth-link::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 0;
      height: 2px;
      background: linear-gradient(90deg, var(--accent-color), var(--accent-hover));
      transition: width 0.3s ease;
    }

    .auth-link:hover::after {
      width: 100%;
    }

    .auth-link:hover {
      color: var(--accent-hover);
    }

    /* ==================== FONDO CON ÍCONOS SVG ==================== */
    .auth-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      z-index: 0;
      pointer-events: none;
    }

    .money-particle {
      position: absolute;
      opacity: 0;
      animation: floatMoney linear infinite;
      user-select: none;
      filter: drop-shadow(0 4px 8px var(--glow-color));
      transition: filter 0.3s ease;
    }

    .money-particle svg {
      width: 100%;
      height: 100%;
      stroke: var(--accent-color);
      fill: none;
    }

    /* ==================== CÍRCULOS DECORATIVOS ==================== */
    .auth-bg-circle {
      position: absolute;
      border-radius: 50%;
      background: radial-gradient(circle, var(--glow-color) 0%, transparent 70%);
      animation: floatMoney 20s ease-in-out infinite;
    }

    .auth-bg-circle:nth-child(1) {
      width: 250px;
      height: 250px;
      top: -125px;
      left: -125px;
      animation-duration: 25s;
    }

    .auth-bg-circle:nth-child(2) {
      width: 350px;
      height: 350px;
      bottom: -175px;
      right: -175px;
      animation-duration: 30s;
      animation-delay: -5s;
    }

    /* ==================== SPINNER ==================== */
    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(26, 26, 46, 0.3);
      border-top-color: #1a1a2e;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      margin-right: 8px;
      vertical-align: middle;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ==================== ALERTA ==================== */
    .alert-error {
      background: var(--error-bg);
      backdrop-filter: blur(10px);
      border: 1px solid var(--error-border);
      border-radius: 10px;
      padding: 10px 14px;
      color: var(--error-text);
      display: flex;
      align-items: center;
      gap: 10px;
      animation: fadeInUp 0.3s ease;
      font-size: 0.85rem;
      margin-bottom: 16px !important;
    }

    /* ==================== RESPONSIVE MÓVIL ==================== */
    @media (max-width: 640px) {
      .auth-card {
        padding: 20px 18px;
        max-width: 95%;
      }

      .logo-circle {
        width: 75px;
        height: 75px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--accent-color) 0%, var(--accent-hover) 100%);
        padding: 8px;
        overflow: visible;
      }

      .logo-image {
        width: 55px;
        height: 55px;
        object-fit: contain;
        /* border-radius: 50%; */
      }

      .logo-main-text {
        font-size: 1.4rem;
      }

      .logo-sub-text {
        font-size: 0.75rem;
      }

      .auth-title {
        font-size: 1.3rem;
        margin-bottom: 6px;
      }

      .auth-subtitle {
        font-size: 0.8rem;
        margin-bottom: 20px;
      }

      .form-grid {
        gap: 14px;
        margin-bottom: 18px;
      }

      .btn-primary {
        padding: 11px 18px;
        font-size: 0.9rem;
      }

      .auth-link {
        font-size: 0.8rem;
      }

      .auth-logo-wrapper {
        margin-bottom: 16px;
        gap: 10px;
      }
    }

    /* Ajustes para pantallas muy pequeñas */
    @media (max-width: 480px) {
      .auth-card {
        padding: 18px 16px;
      }
      .logo-circle {
        width: 70px;
        height: 70px;
      }

      .logo-image {
        width: 48px;
        height: 48px;
        border-radius: 50%;
      }

      .logo-main-text {
        font-size: 1.3rem;
      }

      .auth-title {
        font-size: 1.2rem;
      }

      .form-grid {
        gap: 12px;
      }
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Partículas con iconos SVG
 */
function createMoneyParticlesHTML() {
  const svgIcons = [
    icons.creditCard,
    icons.wallet,
    icons.coin,
    icons.money
  ].filter(Boolean);
  
  let html = '';
  
  for (let i = 0; i < 20; i++) {
    const iconSvg = svgIcons[Math.floor(Math.random() * svgIcons.length)];
    const sizedSvg = iconSvg
      .replace(/width="\d+"/, 'width="100%"')
      .replace(/height="\d+"/, 'height="100%"')
      .replace(/stroke="currentColor"/, `stroke="var(--accent-color)"`);
    
    const left = (Math.random() * 98).toFixed(1);
    const duration = (12 + Math.random() * 20).toFixed(1);
    const delay = (-Math.random() * 30).toFixed(1);
    const size = (16 + Math.random() * 24).toFixed(0);
    
    html += `
      <div class="money-particle"
           style="left: ${left}%;
                  animation-duration: ${duration}s;
                  animation-delay: ${delay}s;
                  width: ${size}px;
                  height: ${size}px;">
        ${sizedSvg}
      </div>`;
  }
  return html;
}

/**
 * Logo redondo con imagen PNG
 */
function createLogoHTML() {
  return `
    <div class="auth-logo-wrapper">
      <div class="logo-circle" id="logoCircle">
        <img src="src/assets/icons/logo.png" 
             class="logo-image" 
             alt="StartCash"
             onerror="this.style.display='none';document.getElementById('logoFallback').style.display='flex'"
        />
        <div id="logoFallback" class="logo-fallback" style="display:none;align-items:center;justify-content:center;">
          ${icons.wallet}
        </div>
      </div>
      <div class="logo-text-container">
        <div class="logo-main-text">StartCash</div>
        <div class="logo-sub-text">Gestión de préstamos</div>
      </div>
    </div>
  `;
}

/* ====================== RENDER LOGIN ====================== */
export function renderLogin(onSuccess) {
  document.body.innerHTML = '';
  const page = document.createElement('div');
  page.className = 'auth-page';
  page.innerHTML = `
    <div class="auth-bg">
      ${createMoneyParticlesHTML()}
      <div class="auth-bg-circle"></div>
      <div class="auth-bg-circle"></div>
    </div>
    <div class="auth-card">
      ${createLogoHTML()}
      <h1 class="auth-title">¡Bienvenido!</h1>
      <p class="auth-subtitle">Inicia sesión para continuar</p>
      <div id="authError" class="alert-error" style="display:none;">
        <span style="flex-shrink:0;">${icons.alert}</span>
        <span id="authErrorMsg"></span>
      </div>
      <form id="loginForm" novalidate>
        <div class="form-grid">
          <div id="emailGroup"></div>
          <div id="passwordGroup"></div>
        </div>
        <div style="text-align:right;margin:6px 0 18px;">
          <a href="#" id="forgotPasswordLink" class="auth-link">
            ¿Olvidaste tu contraseña?
          </a>
        </div>
        <button type="submit" class="btn-primary" id="loginBtn">
          Iniciar sesión
        </button>
      </form>
      <div style="text-align:center;margin-top:20px;color:var(--text-secondary);font-size:0.85rem;">
        ¿No tienes cuenta?
        <a id="switchToRegister" class="auth-link">Regístrate</a>
      </div>
    </div>
  `;
  
  injectAuthCenteringStyle();
  document.body.appendChild(page);
  
  // Crear campos
  const emailGroup = inputGroup({ 
    id: 'email', 
    label: 'Correo electrónico', 
    type: 'email', 
    placeholder: 'tu@correo.com', 
    required: true, 
    icon: 'mail'
  });
  
  const passGroup = inputGroup({ 
    id: 'password', 
    label: 'Contraseña', 
    type: 'password', 
    placeholder: 'Mínimo 6 caracteres', 
    required: true, 
    icon: 'lock'
  });
  
  page.querySelector('#emailGroup')?.replaceWith(emailGroup);
  page.querySelector('#passwordGroup')?.replaceWith(passGroup);
  
  // Event listeners
  page.querySelector('#switchToRegister')?.addEventListener('click', (e) => {
    e.preventDefault();
    renderRegister(onSuccess);
  });
  
  page.querySelector('#forgotPasswordLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    toast.info('La recuperación de contraseña estará disponible muy pronto');
  });
  
  // Manejo del formulario
  const form = page.querySelector('#loginForm');
  const btn = page.querySelector('#loginBtn');
  const errBox = page.querySelector('#authError');
  const errMsg = page.querySelector('#authErrorMsg');
  
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldErrors('email', 'password');
    if (errBox) errBox.style.display = 'none';
    
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    
    let valid = true;
    if (!email) { 
      showFieldError('email', 'El correo es requerido'); 
      valid = false; 
    } else if (!validateEmail(email)) { 
      showFieldError('email', 'Correo inválido'); 
      valid = false; 
    }
    
    if (!password) { 
      showFieldError('password', 'La contraseña es requerida'); 
      valid = false; 
    }
    
    if (!valid) return;
    
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span> Iniciando...`;
    
    try {
      await authService.login(email, password);
      toast.success('¡Sesión iniciada correctamente!');
      onSuccess();
    } catch (err) {
      errMsg.textContent = err.message || 'Error al iniciar sesión';
      if (errBox) errBox.style.display = 'flex';
      form.style.animation = 'shake 0.3s ease';
      setTimeout(() => { form.style.animation = ''; }, 300);
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });
}

/* ====================== RENDER REGISTER ====================== */
export function renderRegister(onSuccess) {
  document.body.innerHTML = '';
  const page = document.createElement('div');
  page.className = 'auth-page';
  page.innerHTML = `
    <div class="auth-bg">
      ${createMoneyParticlesHTML()}
      <div class="auth-bg-circle"></div>
      <div class="auth-bg-circle"></div>
    </div>
    <div class="auth-card">
      ${createLogoHTML()}
      <h1 class="auth-title">Crear cuenta</h1>
      <p class="auth-subtitle">Regístrate para comenzar</p>
      <div id="authError" class="alert-error" style="display:none;">
        <span style="flex-shrink:0;">${icons.alert}</span>
        <span id="authErrorMsg"></span>
      </div>
      <form id="registerForm" novalidate>
        <div class="form-grid">
          <div id="nameGroup"></div>
          <div id="emailGroup"></div>
          <div id="passwordGroup"></div>
        </div>
        <button type="submit" class="btn-primary" id="registerBtn">
          Crear cuenta
        </button>
      </form>
      <div style="text-align:center;margin-top:20px;color:var(--text-secondary);font-size:0.85rem;">
        ¿Ya tienes cuenta?
        <a id="switchToLogin" class="auth-link">Inicia sesión</a>
      </div>
    </div>
  `;
  
  injectAuthCenteringStyle();
  document.body.appendChild(page);
  
  // Crear campos
  page.querySelector('#nameGroup')?.replaceWith(inputGroup({ 
    id: 'name', 
    label: 'Nombre completo', 
    type: 'text', 
    placeholder: 'Tu nombre', 
    required: true, 
    icon: 'user'
  }));
  
  page.querySelector('#emailGroup')?.replaceWith(inputGroup({ 
    id: 'email', 
    label: 'Correo electrónico', 
    type: 'email', 
    placeholder: 'tu@correo.com', 
    required: true, 
    icon: 'mail'
  }));
  
  page.querySelector('#passwordGroup')?.replaceWith(inputGroup({ 
    id: 'password', 
    label: 'Contraseña', 
    type: 'password', 
    placeholder: 'Mínimo 6 caracteres', 
    required: true, 
    icon: 'lock'
  }));
  
  // Event listeners
  page.querySelector('#switchToLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    renderLogin(onSuccess);
  });
  
  // Manejo del formulario
  const form = page.querySelector('#registerForm');
  const btn = page.querySelector('#registerBtn');
  const errBox = page.querySelector('#authError');
  const errMsg = page.querySelector('#authErrorMsg');
  
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldErrors('name', 'email', 'password');
    if (errBox) errBox.style.display = 'none';
    
    const name = document.getElementById('name')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    
    let valid = true;
    if (!name || name.length < 2) { 
      showFieldError('name', 'El nombre debe tener al menos 2 caracteres'); 
      valid = false; 
    }
    if (!email) { 
      showFieldError('email', 'El correo es requerido'); 
      valid = false; 
    } else if (!validateEmail(email)) { 
      showFieldError('email', 'Correo inválido'); 
      valid = false; 
    }
    if (!password || password.length < 6) { 
      showFieldError('password', 'La contraseña debe tener al menos 6 caracteres'); 
      valid = false; 
    }
    
    if (!valid) return;
    
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span> Creando...`;
    
    try {
      await authService.register(name, email, password);
      toast.success('¡Cuenta creada correctamente!');
      onSuccess();
    } catch (err) {
      errMsg.textContent = err.message || 'Error al crear la cuenta';
      if (errBox) errBox.style.display = 'flex';
      form.style.animation = 'shake 0.3s ease';
      setTimeout(() => { form.style.animation = ''; }, 300);
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });
}
