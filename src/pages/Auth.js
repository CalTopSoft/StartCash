import { authService } from '../services/auth.service.js';
import { toast } from '../components/Toast.js';
import { validateEmail } from '../utility/helpers.js';
import { FIELD_LIMITS, validateRequiredText } from '../utility/validation.js';

const AUTH_STYLE_ID = 'auth-premium-animated';

function injectAuthStyles() {
  if (document.getElementById(AUTH_STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = AUTH_STYLE_ID;
  s.textContent = `

/* ═══════════════════════════════════════════════════
   PREMIUM ANIMATIONS & KEYFRAMES
═══════════════════════════════════════════════════ */
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-20px) rotate(2deg); }
  50% { transform: translateY(-10px) rotate(-1deg); }
  75% { transform: translateY(-25px) rotate(1deg); }
}

@keyframes float-delayed {
  0%, 100% { transform: translateY(0px) scale(1); }
  33% { transform: translateY(-30px) scale(1.05); }
  66% { transform: translateY(-15px) scale(0.95); }
}

@keyframes pulse-ring {
  0% { transform: scale(0.8); opacity: 0.5; }
  100% { transform: scale(2); opacity: 0; }
}

@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes morph {
  0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
  50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
}

@keyframes glow {
  0%, 100% { filter: brightness(1) saturate(1); }
  50% { filter: brightness(1.3) saturate(1.2); }
}

@keyframes slide-up-fade {
  from { opacity: 0; transform: translateY(40px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes slide-right-fade {
  from { opacity: 0; transform: translateX(-50px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes shake-subtle {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px) rotate(-1deg); }
  75% { transform: translateX(8px) rotate(1deg); }
}

@keyframes bounce-dot {
  0%, 80%, 100% { transform: translateY(0) scale(1); }
  40% { transform: translateY(-12px) scale(1.2); }
}

@keyframes rotate-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes counter-bounce {
  0% { transform: translateY(-20px); opacity: 0; }
  50% { transform: translateY(5px); }
  100% { transform: translateY(0); opacity: 1; }
}

@keyframes border-flow {
  0% { background-position: 0% 50%; }
  100% { background-position: 400% 50%; }
}

@keyframes particle-float {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
}

@keyframes ticker-slide {
  0% { transform: translateX(100%); opacity: 0; }
  10% { opacity: 1; transform: translateX(0); }
  90% { opacity: 1; transform: translateX(0); }
  100% { transform: translateX(-100%); opacity: 0; }
}

@keyframes authFadeOut {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.98); }
}

.auth-exit {
  animation: authFadeOut 0.3s ease forwards;
}

/* ══════════════════════════════════════════════════
   ROOT & BASE
═══════════════════════════════════════════════════ */
#authRoot {
  height: 100vh;
  width: 100vw;
  display: flex;
  background: var(--bg);
  font-family: var(--font);
  overflow: hidden;
  position: fixed;
  inset: 0;
  z-index: 9999;
}

/* Animated gradient background */
#authRoot::before {
  content: '';
  position: fixed;
  inset: -50%;
  background: 
    radial-gradient(circle at 20% 30%, var(--accent-glow) 0%, transparent 40%),
    radial-gradient(circle at 80% 70%, rgba(36,176,127,0.15) 0%, transparent 40%),
    radial-gradient(circle at 50% 50%, rgba(255,209,102,0.08) 0%, transparent 50%);
  animation: gradient-shift 20s ease infinite;
  background-size: 200% 200%;
  pointer-events: none;
  z-index: 0;
}

/* Grid pattern overlay */
#authRoot::after {
  content: '';
  position: fixed;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
  z-index: 1;
  mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
}

/* ══════════════════════════════════════════════════
   LEFT PANEL - COMPACT NO SCROLL (SIN GLOW)
═══════════════════════════════════════════════════ */
.al {
  flex: 0 0 50%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, var(--surface) 0%, rgba(255,255,255,0.02) 100%);
  border-right: 1px solid var(--border);
  position: relative;
  overflow: hidden;
  z-index: 2;
  backdrop-filter: blur(20px);
  /* Anula el glow SOLO en este panel */
  --accent-glow: transparent !important;
}

/* Animated mesh gradient - SIN GLOW en panel izquierdo */
.al::before {
  content: '';
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(circle at 30% 20%, transparent 0%, transparent 50%),
    radial-gradient(circle at 70% 80%, transparent 0%, transparent 50%);
  animation: gradient-shift 15s ease infinite;
  background-size: 200% 200%;
  pointer-events: none;
}

/* Floating orbs - OCULTAS en panel izquierdo */
.al-orb {
  display: none !important;
}

/* Particle system - SIN GLOW */
.al-particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
}

.al-particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: var(--accent);
  border-radius: 50%;
  opacity: 0.3;
  box-shadow: none !important;
}

.al-inner {
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 32px 40px;
  overflow: hidden;
  justify-content: space-between;
}

/* Brand - SIN animación de glow */
.al-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  animation: slide-right-fade 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.al-brand-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  /* Sin glow ni animación pulse */
  box-shadow: none !important;
  animation: none !important;
}

.al-brand-icon::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent, rgba(255,255,255,0.3));
  animation: shimmer 3s linear infinite;
  background-size: 1000px 100%;
}

.al-brand-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 14px;
  position: relative;
  z-index: 1;
}

.al-brand-fallback {
  color: white;
  font-weight: 900;
  font-size: 28px;
  position: relative;
  z-index: 1;
  display: none;
}

.al-brand-name {
  font-size: 24px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--text), var(--accent2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

/* Hero section - compact */
.al-hero {
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: slide-up-fade 0.8s ease 0.2s both;
}

.al-headline {
  font-size: clamp(28px, 3.5vw, 42px);
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.5px;
}

.al-headline-line {
  display: block;
}

.al-headline em {
  font-style: normal;
  background: linear-gradient(135deg, var(--accent), var(--accent2), var(--yellow));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  background-size: 200% 200%;
  animation: gradient-shift 5s ease infinite;
}

.al-tagline {
  font-size: 15px;
  color: var(--text2);
  line-height: 1.6;
  max-width: 780px;
  animation: slide-up-fade 0.8s ease 0.3s both;
}

.highlight-red {
  color: var(--red);
  font-weight: 600;
  position: relative;
  display: inline-block;
}

.highlight-green {
  color: var(--green);
  font-weight: 600;
}

.highlight-accent {
  color: var(--accent2);
  font-weight: 600;
}

.highlight-glow {
  text-shadow: 0 0 8px currentColor;
}

/* Feature cards - compact */
.al-features {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  animation: slide-up-fade 0.8s ease 0.4s both;
}

.al-feat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  padding: 16px 12px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border);
  border-radius: 14px;
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: scale-in 0.5s ease both;
  position: relative;
  overflow: hidden;
}

.al-feat::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  border-radius: inherit;
}

.al-feat:nth-child(1) { animation-delay: 0.5s; }
.al-feat:nth-child(2) { animation-delay: 0.6s; }
.al-feat:nth-child(3) { animation-delay: 0.7s; }
.al-feat:nth-child(4) { animation-delay: 0.8s; }
.al-feat:nth-child(5) { animation-delay: 0.9s; }
.al-feat:nth-child(6) { animation-delay: 1.0s; }

.al-feat:nth-child(1)::before { background: radial-gradient(circle at center, rgba(99,102,241,0.15), transparent 70%); }
.al-feat:nth-child(2)::before { background: radial-gradient(circle at center, rgba(139,92,246,0.15), transparent 70%); }
.al-feat:nth-child(3)::before { background: radial-gradient(circle at center, rgba(16,185,129,0.15), transparent 70%); }
.al-feat:nth-child(4)::before { background: radial-gradient(circle at center, rgba(255,209,102,0.15), transparent 70%); }
.al-feat:nth-child(5)::before { background: radial-gradient(circle at center, rgba(239,68,68,0.15), transparent 70%); }
.al-feat:nth-child(6)::before { background: radial-gradient(circle at center, rgba(6,182,212,0.15), transparent 70%); }

.al-feat:hover {
  transform: translateY(-4px) scale(1.03);
  border-color: var(--accent);
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

.al-feat:hover::before {
  opacity: 1;
}

.al-feat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  position: relative;
  z-index: 1;
}

.al-feat-icon svg {
  width: 20px;
  height: 20px;
  color: white;
}

/* Colores individuales para cada icono */
.al-feat:nth-child(1) .al-feat-icon { background: linear-gradient(135deg, #6366f1, #818cf8); box-shadow: 0 4px 15px rgba(99,102,241,0.3); }
.al-feat:nth-child(2) .al-feat-icon { background: linear-gradient(135deg, #8b5cf6, #a78bfa); box-shadow: 0 4px 15px rgba(139,92,246,0.3); }
.al-feat:nth-child(3) .al-feat-icon { background: linear-gradient(135deg, #10b981, #34d399); box-shadow: 0 4px 15px rgba(16,185,129,0.3); }
.al-feat:nth-child(4) .al-feat-icon { background: linear-gradient(135deg, #f59e0b, #fbbf24); box-shadow: 0 4px 15px rgba(245,158,11,0.3); }
.al-feat:nth-child(5) .al-feat-icon { background: linear-gradient(135deg, #ef4444, #f87171); box-shadow: 0 4px 15px rgba(239,68,68,0.3); }
.al-feat:nth-child(6) .al-feat-icon { background: linear-gradient(135deg, #06b6d4, #22d3ee); box-shadow: 0 4px 15px rgba(6,182,212,0.3); }

.al-feat-text {
  font-size: 12px;
  color: var(--text2);
  font-weight: 500;
  line-height: 1.4;
  position: relative;
  z-index: 1;
}

/* Stats section - compact */
.al-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  animation: slide-up-fade 0.8s ease 0.8s both;
}

.al-stat {
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px 12px;
  text-align: center;
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
}

.al-stat::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}

.al-stat:hover {
  transform: translateY(-3px);
  border-color: var(--accent);
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
}

.al-stat:hover::before {
  opacity: 1;
}

.al-stat-val {
  font-family: var(--mono);
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 4px;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: counter-bounce 0.6s ease both;
}

.al-stat-lbl {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text3);
  font-weight: 600;
}

/* Live ticker - compact */
.al-ticker {
  background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  backdrop-filter: blur(10px);
  animation: slide-up-fade 0.8s ease 1s both;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.al-ticker::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, var(--accent), var(--accent2));
  animation: border-flow 2s linear infinite;
  background-size: 100% 400%;
}

.al-ticker-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--green);
  flex-shrink: 0;
  box-shadow: 0 0 12px var(--green);
  animation: bounce-dot 2s ease-in-out infinite;
  position: relative;
}

.al-ticker-dot::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 2px solid var(--green);
  animation: pulse-ring 2s ease-out infinite;
}

.al-ticker-text {
  font-size: 12px;
  color: var(--text2);
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.al-ticker-amount {
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 800;
  color: var(--green);
  flex-shrink: 0;
  text-shadow: 0 0 12px rgba(36,176,127,0.5);
}

/* ═══════════════════════════════════════════════════
   RIGHT PANEL - PREMIUM FORM (CON GLOW NORMAL)
═══════════════════════════════════════════════════ */
.ar {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: var(--bg);
  position: relative;
  z-index: 2;
  height: 100vh;
}

/* Animated background glow - MANTIENE GLOW en panel derecho */
.ar::before {
  content: '';
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.4;
  animation: pulse-ring 4s ease-out infinite;
  pointer-events: none;
}

.ar-wrap {
  width: 100%;
  max-width: 440px;
  position: relative;
  z-index: 3;
  animation: slide-up-fade 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
}

/* Card container with glass effect */
.ar-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 40px;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 25px 50px -12px rgba(0,0,0,0.5),
    inset 0 1px 0 rgba(255,255,255,0.05);
  position: relative;
  overflow: hidden;
}

.ar-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
}

.ar-header {
  text-align: center;
  margin-bottom: 32px;
}

.ar-title {
  font-size: 28px;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 8px;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, var(--text), var(--accent2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.ar-subtitle {
  font-size: 14px;
  color: var(--text3);
}

/* Form fields premium */
.af-field {
  margin-bottom: 18px;
  position: relative;
}

.af-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--text3);
  margin-bottom: 8px;
  transition: color 0.3s;
}

.af-wrap {
  position: relative;
}

.af-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text3);
  transition: all 0.3s;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.af-icon svg {
  width: 18px;
  height: 18px;
  stroke-width: 2;
}

.af-input {
  width: 100%;
  padding: 14px 14px 14px 44px;
  background: rgba(255,255,255,0.03);
  border: 2px solid var(--border);
  border-radius: 12px;
  color: var(--text);
  font-size: 14px;
  font-family: var(--font);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  outline: none;
}

.af-input::placeholder {
  color: var(--text3);
  opacity: 0.6;
}

.af-input:focus {
  border-color: var(--accent);
  background: rgba(255,255,255,0.05);
  box-shadow: 
    0 0 0 4px var(--accent-glow),
    0 8px 32px rgba(0,0,0,0.2);
  transform: translateY(-1px);
}

.af-input:focus + .af-icon {
  color: var(--accent);
  transform: translateY(-50%) scale(1.1);
}

.af-input.error {
  border-color: var(--red);
  animation: shake-subtle 0.5s ease;
}

.af-input.has-pass {
  padding-right: 44px;
}

.af-eye {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text3);
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: all 0.3s;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.af-eye svg {
  width: 18px;
  height: 18px;
  stroke-width: 2;
}

.af-eye:hover {
  color: var(--accent);
  background: rgba(255,255,255,0.05);
  transform: translateY(-50%) scale(1.1);
}

.af-error {
  font-size: 12px;
  color: var(--red);
  margin-top: 6px;
  display: none;
  align-items: center;
  gap: 6px;
  animation: slide-up-fade 0.3s ease;
}

.af-error.show {
  display: flex;
}

.af-error svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* Forgot password */
.af-forgot {
  text-align: right;
  margin: -4px 0 20px;
}

.af-link {
  font-size: 13px;
  color: var(--accent);
  text-decoration: none;
  font-weight: 600;
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font);
  position: relative;
  padding: 4px 0;
  transition: all 0.3s;
}

.af-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--accent), var(--accent2));
  transition: width 0.3s;
}

.af-link:hover {
  color: var(--accent2);
}

.af-link:hover::after {
  width: 100%;
}

/* Submit button premium */
.af-btn {
  width: 100%;
  padding: 16px;
  margin-top: 4px;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  font-family: var(--font);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 
    0 8px 32px var(--accent-glow),
    inset 0 1px 0 rgba(255,255,255,0.2);
  letter-spacing: 0.3px;
}

.af-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transition: left 0.6s;
}

.af-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--accent2), var(--accent));
  opacity: 0;
  transition: opacity 0.3s;
  border-radius: inherit;
}

.af-btn:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.01);
  box-shadow: 
    0 16px 48px var(--accent-glow),
    inset 0 1px 0 rgba(255,255,255,0.3);
}

.af-btn:hover::before {
  left: 100%;
}

.af-btn:hover::after {
  opacity: 1;
}

.af-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.99);
}

.af-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.af-btn.loading {
  color: transparent;
}

.af-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: rotate-slow 0.8s linear infinite;
  display: none;
}

.af-btn.loading .af-spinner {
  display: block;
}

/* Alert */
.af-alert {
  padding: 14px 16px;
  background: rgba(255,107,107,0.1);
  border: 1px solid rgba(255,107,107,0.3);
  border-radius: 10px;
  color: var(--red);
  font-size: 13px;
  display: none;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
  animation: slide-up-fade 0.3s ease;
  backdrop-filter: blur(10px);
}

.af-alert.show {
  display: flex;
}

.af-alert-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
}

.af-alert-icon svg {
  width: 100%;
  height: 100%;
}

/* Divider */
.af-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0;
  color: var(--text3);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.af-divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border), transparent);
}

/* Footer */
.af-footer {
  text-align: center;
  margin-top: 20px;
  color: var(--text3);
  font-size: 14px;
}

.af-footer .af-link {
  font-weight: 700;
  margin-left: 4px;
}

.af-secure {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 18px;
  font-size: 11px;
  color: var(--text3);
  opacity: 0.7;
}

.af-secure svg {
  width: 12px;
  height: 12px;
}

/* Shake animation for errors */
.af-shake {
  animation: shake-subtle 0.5s ease;
}

/* ═══════════════════════════════════════════════════
   MOBILE - PREMIUM RESPONSIVE (ARREGLADO)
═══════════════════════════════════════════════════ */
@media (max-width: 1024px) {
  .al {
    flex: 0 0 45%;
  }
  
  .al-inner {
    padding: 28px 32px;
  }
}

@media (max-width: 768px) {
  #authRoot {
    display: block;
    height: 100vh;
    min-height: 100vh;
    overflow: hidden; /* Bloquea TODO scroll */
    position: fixed; /* Fija la pantalla */
    width: 100%;
    top: 0;
    left: 0;
  }

  .al {
    display: none !important;
  }

  .ar {
    min-height: 100vh;
    height: auto;
    padding: 0;
    align-items: center; /* Centrado vertical */
    justify-content: center; /* Centrado horizontal */
    display: flex;
    position: relative;
  }

  .ar::before {
    display: block;
    width: 300px;
    height: 300px;
    opacity: 0.3;
    pointer-events: none;
  }

  .ar-wrap {
    width: 100%;
    max-width: 400px; /* Ancho máximo para que no se estire */
    min-height: auto; /* Quita min-height que causaba problemas */
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 40px 24px; /* Padding reducido */
    position: relative;
    z-index: 10;
  }

  /* Mobile brand */
  .ar-mobile-brand {
    display: flex !important;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 28px;
    animation: slide-up-fade 0.6s ease both;
  }

  .ar-mobile-brand-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 24px var(--accent-glow);
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }

  .ar-mobile-brand-icon::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, transparent, rgba(255,255,255,0.3));
  }

  .ar-mobile-brand-icon img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 14px;
    position: relative;
    z-index: 1;
  }

  .ar-mobile-brand-fallback {
    color: white;
    font-weight: 900;
    font-size: 28px;
    position: relative;
    z-index: 1;
    display: none;
  }

  .ar-mobile-brand-name {
    font-size: 22px;
    font-weight: 800;
    background: linear-gradient(135deg, var(--text), var(--accent2));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .ar-card {
    padding: 32px 24px;
    border-radius: 24px;
    width: 100%;
    box-sizing: border-box;
  }

  .ar-title {
    font-size: 26px;
  }

  .af-btn {
    padding: 16px;
    font-size: 15px;
  }

  .af-input {
    padding: 14px 14px 14px 44px;
    font-size: 16px; /* Previene zoom en iOS */
  }
}

@media (min-width: 769px) {
  .ar-mobile-brand {
    display: none !important;
  }
}

@media (max-width: 480px) {
  .ar-wrap {
    padding: 32px 20px; /* Padding más reducido en pantallas muy pequeñas */
  }

  .ar-card {
    padding: 28px 20px;
    border-radius: 20px;
  }

  .ar-title {
    font-size: 24px;
  }

  .al-stat-val {
    font-size: 20px;
  }
  
  .ar-mobile-brand-icon {
    width: 44px;
    height: 44px;
  }
  
  .ar-mobile-brand-name {
    font-size: 20px;
  }
}

/* Colores específicos para cada estadística */
.stat-clients {
  font-family: var(--mono);
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 4px;
  color: #818cf8;
  animation: counter-bounce 0.6s ease both;
}

.stat-paid {
  font-family: var(--mono);
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 4px;
  color: #34d399;
  animation: counter-bounce 0.6s ease both;
}

.stat-loans {
  font-family: var(--mono);
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 4px;
  color: #fbbf24;
  animation: counter-bounce 0.6s ease both;
}

/* GIF Container - Premium */
.al-gif-container {
  position: absolute;
  top: -20px;
  right: 40px;
  width: 280px;
  height: 160px;
  overflow: hidden;
  animation: slide-right-fade 0.8s ease 0.6s both, float 6s ease-in-out infinite;
  z-index: 2;
  backdrop-filter: blur(10px);
}

.al-gif-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 16px;
  filter: brightness(1.1) saturate(1.2);
  transition: transform 0.3s ease;
}

.al-gif-container:hover {
  transform: translateY(-4px) scale(1.02);
}

.al-gif-container:hover img {
  transform: scale(1.05);
}

/* Responsive para el GIF */
@media (max-width: 1200px) {
  .al-gif-container {
    width: 240px;
    height: 140px;
    top: 28px;
    right: 32px;
  }
}

@media (max-width: 1024px) {
  .al-gif-container {
    display: none;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;
  document.head.appendChild(s);
}

/* ═══════════════════════════════════════════════════
   SVG ICONS
═══════════════════════════════════════════════════ */
const Icons = {
  logo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px;"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
  file: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
};

/* ═══════════════════════════════════════════════════
   LEFT PANEL WITH PARTICLES
═══════════════════════════════════════════════════ */
function buildLeft() {
  const particles = Array.from({ length: 15 }, (_, i) => {
    const size = 2 + Math.random() * 4;
    const top = Math.random() * 100;
    const left = Math.random() * 100;
    const delay = Math.random() * 5;
    const duration = 3 + Math.random() * 4;
    const tx = (Math.random() - 0.5) * 150;
    const ty = (Math.random() - 0.5) * 150;
    
    return `<div class="al-particle" style="
      width: ${size}px;
      height: ${size}px;
      top: ${top}%;
      left: ${left}%;
      --tx: ${tx}px;
      --ty: ${ty}px;
      animation: particle-float ${duration}s ease-in-out ${delay}s infinite;
      background: ${i % 3 === 0 ? 'var(--accent)' : i % 3 === 1 ? 'var(--accent2)' : 'var(--yellow)'};
    "></div>`;
  }).join('');

  return `
    <div class="al">
      <div class="al-particles">${particles}</div>

      <div class="al-inner">
        <!-- Brand -->
        <div class="al-brand">
          <div class="al-brand-icon">
            <img src="src/assets/icons/logo.png" alt="StartCash"
              onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
            />
            <div class="al-brand-fallback">S</div>
          </div>
          <span class="al-brand-name">StartCash</span>
        </div>

        <!-- Hero -->
        <div class="al-hero" style="position: relative;">
          <h1 class="al-headline">
            <span class="al-headline-line">Gestiona tus</span>
            <span class="al-headline-line">préstamos <em>con</em></span>
            <span class="al-headline-line"><em>precisión.</em></span>
          </h1>
          
          <p class="al-tagline" style="line-height: 1.8; font-size: 14px;">
            <span style="color: var(--text2);">La plataforma integral que convierte</span>
            <span style="color: var(--red); font-weight: 800; font-size: 15px;">Caos financiero</span>
            <span style="color: var(--text2);"> en </span>
            <span style="color: var(--green); font-weight: 800; font-size: 15px;">Claridad</span>,
            <span style="color: var(--green); font-weight: 700;">Control total</span><span style="color: var(--text2);">,</span><br>
            <span style="color: var(--accent2); font-weight: 600;"> Informes ejecutables</span>
            <span style="color: var(--text2);"> y alertas que anticipan</span>
            <span style="color:rgba(33, 211, 224, 0.84); font-weight: 700; border-bottom: 2px solid var(--accent); padding-bottom: 2px;">
              tus próximos pasos
            </span><span style="color: var(--text2);">.</span>
          </p>

          <!-- GIF Container -->
          <div class="al-gif-container">
            <img src="src/assets/icons/resource-auth.gif" alt="StartCash Demo" 
              onerror="this.style.display='none'; this.parentElement.style.display='none';"
            />
          </div>

          <div class="al-features">
            <div class="al-feat">
              <div class="al-feat-icon">${Icons.chart}</div>
              <span class="al-feat-text">Historial de pagos en tiempo real</span>
            </div>
            <div class="al-feat">
              <div class="al-feat-icon">${Icons.file}</div>
              <span class="al-feat-text">Reportes y comprobantes descargables</span>
            </div>
            <div class="al-feat">
              <div class="al-feat-icon">${Icons.bell}</div>
              <span class="al-feat-text">Alertas de vencimiento automáticas</span>
            </div>
            <div class="al-feat">
              <div class="al-feat-icon">${Icons.shield}</div>
              <span class="al-feat-text">Seguridad y encriptación avanzada</span>
            </div>
            <div class="al-feat">
              <div class="al-feat-icon">${Icons.clock}</div>
              <span class="al-feat-text">Control de plazos y fechas</span>
            </div>
            <div class="al-feat">
              <div class="al-feat-icon">${Icons.check}</div>
              <span class="al-feat-text">Confirmaciones instantáneas</span>
            </div>
          </div>
        </div>

        <!-- Bottom section -->
        <div>
          <!-- Stats -->
          <div class="al-stats">
            <div class="al-stat">
              <div class="stat-clients" id="stat-clients">0</div>
              <div class="al-stat-lbl">Clientes</div>
            </div>
            <div class="al-stat">
              <div class="stat-paid" id="stat-paid">$0</div>
              <div class="al-stat-lbl">Cobrado hoy</div>
            </div>
            <div class="al-stat">
              <div class="stat-loans" id="stat-loans">0</div>
              <div class="al-stat-lbl">Préstamos</div>
            </div>
          </div>

          <!-- Live Ticker -->
          <div class="al-ticker" id="ticker" style="margin-top: 12px;">
            <div class="al-ticker-dot"></div>
            <span class="al-ticker-text" id="ticker-text">Pago recibido · Carlos M.</span>
            <span class="al-ticker-amount" id="ticker-amount">+$240</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ═══════════════════════════════════════════════════
   FIELD BUILDER
═══════════════════════════════════════════════════ */
function buildField({ id, label, type = 'text', placeholder, icon, required = false, isPass = false }) {
  return `
    <div class="af-field">
      <label class="af-label" for="${id}">
        ${label}${required ? '<span style="color:var(--red);margin-left:2px">*</span>' : ''}
      </label>
      <div class="af-wrap">
        <input 
          type="${type}" 
          id="${id}" 
          class="af-input${isPass ? ' has-pass' : ''}"
          placeholder="${placeholder}"
          autocomplete="${id === 'email' ? 'email' : id === 'password' ? 'current-password' : 'name'}"
        />
        <span class="af-icon">${Icons[icon] || ''}</span>
        ${isPass ? `
          <button type="button" class="af-eye" data-target="${id}" aria-label="Toggle password">
            ${Icons.eyeOff}
          </button>
        ` : ''}
      </div>
      <div class="af-error" id="error-${id}">
        ${Icons.alert}
        <span></span>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════════════
   MOBILE BRAND
═══════════════════════════════════════════════════ */
function mobileBrand() {
  return `
    <div class="ar-mobile-brand">
      <div class="ar-mobile-brand-icon">
        <img src="src/assets/icons/logo.png" alt="StartCash"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
        />
        <div class="ar-mobile-brand-fallback">S</div>
      </div>
      <span class="ar-mobile-brand-name">StartCash</span>
    </div>
  `;
}

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
function showError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(`error-${fieldId}`);
  
  if (input) {
    input.classList.add('error');
    input.addEventListener('input', () => {
      input.classList.remove('error');
      if (errorEl) errorEl.classList.remove('show');
    }, { once: true });
  }
  
  if (errorEl) {
    errorEl.querySelector('span').textContent = message;
    errorEl.classList.add('show');
  }
}

function clearErrors() {
  document.querySelectorAll('.af-input').forEach(input => {
    input.classList.remove('error');
  });
  document.querySelectorAll('.af-error').forEach(error => {
    error.classList.remove('show');
  });
}

function initPasswordToggle(container) {
  container.querySelectorAll('.af-eye').forEach(btn => {
    btn.addEventListener('click', function() {
      const targetId = this.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;
      
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      this.innerHTML = isPassword ? Icons.eye : Icons.eyeOff;
    });
  });
}

/* ═══════════════════════════════════════════════════
   ANIMATED COUNTERS
═══════════════════════════════════════════════════ */
function animateCounters() {
  function countUp(element, end, prefix = '', suffix = '', duration = 1500) {
    if (!element) return;
    
    const start = performance.now();
    const step = (timestamp) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(easeOut * end);
      element.textContent = prefix + current.toLocaleString() + suffix;
      
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    
    requestAnimationFrame(step);
  }

  setTimeout(() => {
    countUp(document.getElementById('stat-clients'), 148, '', '', 1200);
    countUp(document.getElementById('stat-paid'), 4820, '$', '', 1400);
    countUp(document.getElementById('stat-loans'), 37, '', '', 1000);
  }, 600);
}

/* ═══════════════════════════════════════════════════
   LIVE TICKER
═══════════════════════════════════════════════════ */
function initTicker() {
  const messages = [
    { text: 'Pago recibido · Carlos M.', amount: '+$240', icon: 'chart', iconColor: 'var(--green)' },
    { text: 'Pago recibido · Ana R.', amount: '+$560', icon: 'chart', iconColor: 'var(--green)' },
    { text: 'Nuevo cliente · Lucía M.', amount: '+1', icon: 'user', iconColor: 'var(--accent2)' },
    { text: 'Tasa de cumplimiento', amount: '94%', icon: 'check', iconColor: 'var(--green)' },
    { text: 'Crédito otorgado · Fernando D.', amount: '$950', icon: 'money', iconColor: 'var(--yellow)' },
    { text: 'Pago parcial · Luis P.', amount: '+$120', icon: 'chart', iconColor: 'var(--yellow)' },
    { text: 'Cliente registrado · Andrés P.', amount: '+1', icon: 'user', iconColor: 'var(--accent2)' },
    { text: 'Préstamo creado · María G.', amount: '$1,800', icon: 'money', iconColor: 'var(--yellow)' },
    { text: 'Pago completo · Sofía L.', amount: '+$950', icon: 'check', iconColor: 'var(--green)' },
    { text: 'Vencimiento próximo · Ana R.', amount: '1 día', icon: 'alert', iconColor: 'var(--red)' },
  ];

  let index = 0;
  const ticker = document.getElementById('ticker');
  const textEl = document.getElementById('ticker-text');
  const amountEl = document.getElementById('ticker-amount');

  if (!textEl || !amountEl || !ticker) return;

  let iconContainer = ticker.querySelector('.al-ticker-icon');
  if (!iconContainer) {
    iconContainer = document.createElement('span');
    iconContainer.className = 'al-ticker-icon';
    iconContainer.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;flex-shrink:0;';
    ticker.insertBefore(iconContainer, ticker.firstChild);
  }

  const update = () => {
    index = (index + 1) % messages.length;
    const msg = messages[index];
    
    ticker.style.opacity = '0';
    ticker.style.transform = 'translateX(-20px)';
    
    setTimeout(() => {
      textEl.textContent = msg.text;
      amountEl.textContent = msg.amount;
      
      const iconSvg = Icons[msg.icon];
      if (iconSvg) {
        iconContainer.innerHTML = iconSvg;
        const svg = iconContainer.querySelector('svg');
        if (svg) {
          svg.style.width = '18px';
          svg.style.height = '18px';
          svg.style.color = msg.iconColor;
          svg.style.stroke = msg.iconColor;
        }
      }
      
      ticker.style.opacity = '1';
      ticker.style.transform = 'translateX(0)';
    }, 300);
  };

  const firstMsg = messages[0];
  const firstIcon = Icons[firstMsg.icon];
  if (firstIcon) {
    iconContainer.innerHTML = firstIcon;
    const svg = iconContainer.querySelector('svg');
    if (svg) {
      svg.style.width = '18px';
      svg.style.height = '18px';
      svg.style.color = firstMsg.iconColor;
      svg.style.stroke = firstMsg.iconColor;
    }
  }

  setInterval(update, 3500);
}

/* ══════════════════════════════════════════════════
   RENDER LOGIN
═══════════════════════════════════════════════════ */
export function renderLogin(onSuccess) {
  const existing = document.getElementById('authRoot');

  if (existing) {
    existing.classList.add('auth-exit');
    existing.offsetHeight;
    requestAnimationFrame(() => {
      setTimeout(() => {
        existing.remove();
        _createLogin(onSuccess);
      }, 300);
    });
    return; // ← 🔥 AGREGA ESTO PARA QUE NO SIGA EJECUTANDO
  }

  _createLogin(onSuccess);
}

function _createLogin(onSuccess) {

  injectAuthStyles();

  const root = document.createElement('div');
  root.id = 'authRoot';

  root.innerHTML = `
    ${buildLeft()}
    
    <div class="ar">
      <div class="ar-wrap">
        ${mobileBrand()}
        
        <div class="ar-card">
          <div class="ar-header">
            <h2 class="ar-title">Bienvenido de vuelta</h2>
            <p class="ar-subtitle">Ingresa tus credenciales para continuar</p>
          </div>

          <div class="af-alert" id="alert">
            <span class="af-alert-icon">${Icons.alert}</span>
            <span id="alert-msg"></span>
          </div>

          <form id="form" novalidate>
            ${buildField({
              id: 'email',
              label: 'Correo electrónico',
              type: 'email',
              placeholder: 'tu@email.com',
              icon: 'mail',
              required: true
            })}

            ${buildField({
              id: 'password',
              label: 'Contraseña',
              type: 'password',
              placeholder: '••••••••',
              icon: 'lock',
              required: true,
              isPass: true
            })}

            <div class="af-forgot">
              <button type="button" class="af-link" id="forgot-btn">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button type="submit" class="af-btn" id="submit-btn">
              Iniciar sesión
              <span class="af-spinner"></span>
            </button>
          </form>

          <div class="af-divider">
            <span class="af-divider-line"></span>
            <span>o continúa con</span>
            <span class="af-divider-line"></span>
          </div>

          <div class="af-footer">
            ¿No tienes cuenta?
            <button type="button" class="af-link" id="switch-register">
              Regístrate aquí
            </button>
          </div>

          <div class="af-secure">
            ${Icons.shield}
            <span>Conexión segura y cifrada</span>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  // 🔥 TODO TU LÓGICA ORIGINAL SIN CAMBIOS
  initPasswordToggle(root);
  animateCounters();
  initTicker();

  document.getElementById('forgot-btn').addEventListener('click', () => {
    toast.info('Recuperación de contraseña disponible próximamente');
  });

  document.getElementById('switch-register').addEventListener('click', () => {
    renderRegister(onSuccess);
  });

  const form = document.getElementById('form');
  const submitBtn = document.getElementById('submit-btn');
  const alert = document.getElementById('alert');
  const alertMsg = document.getElementById('alert-msg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    alert.classList.remove('show');

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    let isValid = true;

    if (!email) {
      showError('email', 'El correo es requerido');
      isValid = false;
    } else if (!validateEmail(email)) {
      showError('email', 'Ingresa un correo válido');
      isValid = false;
    } else if (email.length > FIELD_LIMITS.email.max) {
      showError('email', `Máximo ${FIELD_LIMITS.email.max} caracteres`);
      isValid = false;
    }

    const passError = validateRequiredText(password, FIELD_LIMITS.password, 'La contraseña');
    if (passError) {
      showError('password', passError);
      isValid = false;
    }

    if (!isValid) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="af-spinner"></span> Iniciando...`;

    try {
      await authService.login(email, password);

      toast.success('¡Bienvenido de vuelta! 🎉');

      // 🔥 MISMA IDEA DE TRANSICIÓN SIN ROMPER TU FLUJO
      root.classList.add('auth-exit');

      setTimeout(() => onSuccess(), 300);

    } catch (error) {
      alertMsg.textContent = error.message || 'Error al iniciar sesión';
      alert.classList.add('show');

      form.classList.add('af-shake');
      setTimeout(() => form.classList.remove('af-shake'), 500);

      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        Iniciar sesión
        <span class="af-spinner"></span>
      `;
    }
  });
}

/* ═══════════════════════════════════════════════════
   RENDER REGISTER
═══════════════════════════════════════════════════ */
export function renderRegister(onSuccess) {
  const existing = document.getElementById('authRoot');

  // 🔥 SOLO AÑADIDO: transición segura
  if (existing) {
    existing.classList.add('auth-exit');

    setTimeout(() => {
      existing.remove();
      _createRegister(onSuccess);
    }, 300);

    return;
  }

  _createRegister(onSuccess);
}

function _createRegister(onSuccess) {
  injectAuthStyles();

  const root = document.createElement('div');
  root.id = 'authRoot';

  root.innerHTML = `
    ${buildLeft()}
    
    <div class="ar">
      <div class="ar-wrap">
        ${mobileBrand()}
        
        <div class="ar-card">
          <div class="ar-header">
            <h2 class="ar-title">Crea tu cuenta</h2>
            <p class="ar-subtitle">Comienza a gestionar tus préstamos hoy</p>
          </div>

          <div class="af-alert" id="alert">
            <span class="af-alert-icon">${Icons.alert}</span>
            <span id="alert-msg"></span>
          </div>

          <form id="form" novalidate>
            ${buildField({
              id: 'name',
              label: 'Nombre completo',
              type: 'text',
              placeholder: 'Juan Pérez',
              icon: 'user',
              required: true
            })}

            ${buildField({
              id: 'email',
              label: 'Correo electrónico',
              type: 'email',
              placeholder: 'tu@email.com',
              icon: 'mail',
              required: true
            })}

            ${buildField({
              id: 'password',
              label: 'Contraseña',
              type: 'password',
              placeholder: 'Mínimo 6 caracteres',
              icon: 'lock',
              required: true,
              isPass: true
            })}

            <button type="submit" class="af-btn" id="submit-btn">
              Crear cuenta
              <span class="af-spinner"></span>
            </button>
          </form>

          <div class="af-divider">
            <span class="af-divider-line"></span>
            <span>o usa tu cuenta existente</span>
            <span class="af-divider-line"></span>
          </div>

          <div class="af-footer">
            ¿Ya tienes cuenta?
            <button type="button" class="af-link" id="switch-login">
              Inicia sesión
            </button>
          </div>

          <div class="af-secure">
            ${Icons.shield}
            <span>Conexión segura y cifrada</span>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  // 🔥 TU LÓGICA ORIGINAL intacta
  initPasswordToggle(root);
  animateCounters();
  initTicker();

  document.getElementById('switch-login').addEventListener('click', () => {
    renderLogin(onSuccess);
  });

  const form = document.getElementById('form');
  const submitBtn = document.getElementById('submit-btn');
  const alert = document.getElementById('alert');
  const alertMsg = document.getElementById('alert-msg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    alert.classList.remove('show');

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    let isValid = true;

    const nameError = validateRequiredText(name, FIELD_LIMITS.name, 'El nombre');
    if (nameError) {
      showError('name', nameError);
      isValid = false;
    }

    if (!email) {
      showError('email', 'El correo es requerido');
      isValid = false;
    } else if (!validateEmail(email)) {
      showError('email', 'Ingresa un correo válido');
      isValid = false;
    } else if (email.length > FIELD_LIMITS.email.max) {
      showError('email', `Máximo ${FIELD_LIMITS.email.max} caracteres`);
      isValid = false;
    }

    const passError = validateRequiredText(password, FIELD_LIMITS.password, 'La contraseña');
    if (passError) {
      showError('password', passError);
      isValid = false;
    }

    if (!isValid) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="af-spinner"></span> Creando cuenta...`;

    try {
      await authService.register(name, email, password);

      toast.success('¡Cuenta creada exitosamente! 🎉');

      // 🔥 misma transición que login (consistencia UX)
      root.classList.add('auth-exit');

      setTimeout(() => onSuccess(), 300);

    } catch (error) {
      alertMsg.textContent = error.message || 'Error al crear la cuenta';
      alert.classList.add('show');

      form.classList.add('af-shake');
      setTimeout(() => form.classList.remove('af-shake'), 500);

      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        Crear cuenta
        <span class="af-spinner"></span>
      `;
    }
  });
}
