// Empêche le clic droit (menu contextuel)
document.addEventListener('contextmenu', e => e.preventDefault());

// Empêche le copier, couper et coller
document.addEventListener('copy', e => e.preventDefault());
document.addEventListener('cut', e => e.preventDefault());
document.addEventListener('paste', e => e.preventDefault());

// Empêche les raccourcis clavier Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A
document.addEventListener('keydown', e => {
  if (e.ctrlKey && ['c', 'v', 'x', 'a'].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }
});