/**
 * Retorna HTML de un avatar: foto si existe, iniciales si no
 */
export function avatarHTML(name = '', avatarBase64 = null, size = 36, fontSize = 14) {
    if (avatarBase64) {
      const src = avatarBase64.startsWith('data:') 
        ? avatarBase64 
        : `data:image/jpeg;base64,${avatarBase64}`;
      return `<img src="${src}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;flex-shrink:0;" alt="${name}"/>`;
    }
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
    return `<div class="user-avatar" style="width:${size}px;height:${size}px;font-size:${fontSize}px;flex-shrink:0;">${initials}</div>`;
  }
  
  /**
   * Abre el file picker y retorna base64 o null si cancela
   * Valida tipo y tamaño (max 1MB)
   */
  export function pickAvatar() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png';
      input.onchange = () => {
        const file = input.files[0];
        if (!file) return resolve(null);
        if (file.size > 1_048_576) {
          alert('La imagen debe ser menor a 1MB');
          return resolve(null);
        }
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result); // data:image/...;base64,...
        reader.readAsDataURL(file);
      };
      input.click();
    });
  }