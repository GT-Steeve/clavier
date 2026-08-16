const canvas = document.getElementById('jeu');
const ctx = canvas.getContext('2d');
const canvasWrapper = document.querySelector('.canvas-wrapper');
const scoreEl = document.getElementById('score');
const viesEl = document.getElementById('vies');
const cycleEl = document.getElementById('cycle');
const meteoresEl = document.getElementById('meteores');
const ecranDebut = document.getElementById('ecran-debut');
const ecranCycle = document.getElementById('ecran-cycle');
const cycleTermineEl = document.getElementById('cycle-termine');
const ecranDifficulte = document.getElementById('ecran-difficulte');
const choixDifficulteEl = document.getElementById('choix-difficulte');
const ecranFin = document.getElementById('ecran-fin');
const titreFinEl = document.getElementById('titre-fin');
const scoreFinalEl = document.getElementById('score-final');
const btnJouer = document.getElementById('btn-jouer');
const btnContinuerOui = document.getElementById('btn-continuer-oui');
const btnContinuerNon = document.getElementById('btn-continuer-non');
const btnRejouer = document.getElementById('btn-rejouer');

let LARGEUR = 0;
let HAUTEUR = 0;
let SOL_Y = 0;
let CANON_X = 0;
let CANON_Y = 0;

function redimensionnerCanvas() {
  const dpr = window.devicePixelRatio || 1;
  LARGEUR = Math.floor(canvasWrapper.clientWidth);
  HAUTEUR = Math.floor(canvasWrapper.clientHeight);
  canvas.width = LARGEUR * dpr;
  canvas.height = HAUTEUR * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  SOL_Y = HAUTEUR - 40;
  CANON_X = LARGEUR / 2;
  CANON_Y = SOL_Y;

  // garde les rochers existants dans les nouvelles limites
  roches.forEach(r => {
    r.x = Math.min(r.x, LARGEUR - r.rayon);
  });

  if (!jeuActif) dessiner();
}

const mots = [
  'lune', 'mars', 'venus', 'soleil', 'comete', 'astre', 'orbite',
  'cosmos', 'galaxie', 'planete', 'etoile', 'fusee', 'cratere',
  'gravite', 'satellite', 'meteore', 'nebuleuse', 'asteroide',
  'espace', 'impact', 'jupiter', 'saturne', 'neptune', 'mercure',
  'uranus', 'pluton', 'choc', 'danger', 'roche', 'poussiere'
];

// Chaque cycle définit sa fréquence d'apparition des météores (intervalSpawn, en ms)
// et le nombre de météores à faire apparaître avant de passer au cycle suivant.
// "actif: false" permet de préparer un cycle sans l'inclure dans la rotation de jeu.
const cycles = [
  { nom: 'Facile', intervalSpawn: 5000, nombreMeteores: 5, actif: true },
  { nom: 'Moyen', intervalSpawn: 2500, nombreMeteores: 10, actif: true },
  { nom: 'Difficile', intervalSpawn: 1500, nombreMeteores: 5, actif: true },
  { nom: 'Très difficile', intervalSpawn: 1500, nombreMeteores: 15, actif: false }
];

let roches = [];
let projectiles = [];
let particules = [];
let cible = null;
let score = 0;
let vies = 3;
let jeuActif = false;
let dernierSpawn = 0;
let intervalSpawn = cycles[0].intervalSpawn;
let vitesseBase = 40;
let dernierFrame = 0;
let cycleIndex = 0;
let meteoresRestantsCycle = 0;
let attenteFinCycle = false;
let finExplosionsTimestamp = null;
const DELAI_CHOIX_CONTINUER = 1500;

function premierCycleActif() {
  const i = cycles.findIndex(c => c.actif);
  return i === -1 ? 0 : i;
}

function demarrerCycle(index) {
  cycleIndex = index;
  const cycle = cycles[cycleIndex];
  intervalSpawn = cycle.intervalSpawn;
  meteoresRestantsCycle = cycle.nombreMeteores;
  attenteFinCycle = false;
  finExplosionsTimestamp = null;
  cycleEl.textContent = cycle.nom;
  majMeteoresHUD();
}

// Affiche météores restants (non apparus + encore en jeu) / total du cycle en cours
function majMeteoresHUD() {
  const total = cycles[cycleIndex].nombreMeteores;
  const restant = meteoresRestantsCycle + roches.length;
  meteoresEl.textContent = `${restant} / ${total}`;
}

function motAleatoire() {
  const dispo = mots.filter(m => !roches.some(r => r.mot === m));
  const liste = dispo.length ? dispo : mots;
  return liste[Math.floor(Math.random() * liste.length)];
}

function creerRoche() {
  const mot = motAleatoire();
  const rayon = 24 + mot.length * 1.5;
  const x = rayon + Math.random() * (LARGEUR - rayon * 2);
  roches.push({
    mot,
    x,
    y: -rayon,
    rayon,
    vitesse: vitesseBase + Math.random() * 20,
    tapees: 0,
    flash: 0
  });
}

function demarrer() {
  redimensionnerCanvas();
  roches = [];
  projectiles = [];
  particules = [];
  cible = null;
  score = 0;
  vies = 3;
  jeuActif = true;
  vitesseBase = 40;
  demarrerCycle(premierCycleActif());

  scoreEl.textContent = score;
  viesEl.textContent = vies;
  ecranDebut.style.display = 'none';
  ecranCycle.style.display = 'none';
  ecranDifficulte.style.display = 'none';
  ecranFin.style.display = 'none';

  const maintenant = performance.now();
  dernierSpawn = maintenant;
  dernierFrame = maintenant;
  requestAnimationFrame(boucle);
}

function finDeJeu(titre = '💥 Base détruite !') {
  jeuActif = false;
  titreFinEl.textContent = titre;
  scoreFinalEl.textContent = score;
  ecranFin.style.display = 'flex';
}

// Pause le jeu entre deux cycles et demande si on continue
function finCycle() {
  jeuActif = false;
  cycleTermineEl.textContent = cycles[cycleIndex].nom;
  ecranCycle.style.display = 'flex';
}

function boucle(t) {
  if (!jeuActif) return;
  const dt = Math.min((t - dernierFrame) / 1000, 0.05);
  dernierFrame = t;

  if (meteoresRestantsCycle > 0 && t - dernierSpawn > intervalSpawn) {
    creerRoche();
    dernierSpawn = t;
    vitesseBase = Math.min(140, vitesseBase + 2);

    meteoresRestantsCycle--;
    if (meteoresRestantsCycle <= 0) attenteFinCycle = true;
  }

  maj(dt);
  majMeteoresHUD();
  dessiner();

  if (!jeuActif) return; // finDeJeu() a pu être déclenché pendant maj() (perte de la dernière vie)

  // Une fois le dernier météore du cycle traité, on attend la fin de son
  // animation d'explosion puis un court délai avant de proposer de continuer.
  if (attenteFinCycle && roches.length === 0 && particules.length === 0) {
    if (finExplosionsTimestamp === null) finExplosionsTimestamp = t;
    if (t - finExplosionsTimestamp >= DELAI_CHOIX_CONTINUER) {
      finCycle();
      return;
    }
  }

  requestAnimationFrame(boucle);
}

// Point d'impact sur le bord du rocher, du côté qui fait face au canon
// (plutôt que le centre où se trouve le mot) pour un effet de tir crédible.
function pointImpact(roche) {
  const dx = CANON_X - roche.x;
  const dy = CANON_Y - roche.y;
  const dist = Math.hypot(dx, dy) || 1;
  return {
    x: roche.x + (dx / dist) * roche.rayon,
    y: roche.y + (dy / dist) * roche.rayon
  };
}

function maj(dt) {
  roches.forEach(r => {
    r.y += r.vitesse * dt;
    if (r.flash > 0) r.flash = Math.max(0, r.flash - dt * 4);
  });

  for (let i = roches.length - 1; i >= 0; i--) {
    const r = roches[i];
    if (r.y - r.rayon >= SOL_Y) {
      if (cible === r) cible = null;
      roches.splice(i, 1);
      perdreVie();
    }
  }

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.t += dt / p.duree;
    if (p.t >= 1) {
      if (p.motComplet) {
        exploser(p.roche.x, p.roche.y, true);
        const idx = roches.indexOf(p.roche);
        if (idx !== -1) roches.splice(idx, 1);
        if (cible === p.roche) cible = null;
        score += p.roche.mot.length * 10;
        scoreEl.textContent = score;
      } else {
        const impact = pointImpact(p.roche);
        const angleSurface = Math.atan2(impact.y - p.roche.y, impact.x - p.roche.x);
        exploser(impact.x, impact.y, false, angleSurface, Math.PI);
        p.roche.flash = 1;
      }
      projectiles.splice(i, 1);
    }
  }

  for (let i = particules.length - 1; i >= 0; i--) {
    const pa = particules[i];
    pa.x += pa.vx * dt;
    pa.y += pa.vy * dt;
    pa.vie -= dt;
    if (pa.vie <= 0) particules.splice(i, 1);
  }
}

function perdreVie() {
  vies--;
  viesEl.textContent = vies;
  if (vies <= 0) finDeJeu();
}

// grande: grosse explosion radiale (destruction). Sinon petit impact d'étincelles/
// éclats de roche, projetés vers l'extérieur autour de angleBase (surface touchée).
function exploser(x, y, grande = true, angleBase = null, spread = Math.PI * 2) {
  const nombre = grande ? 14 : 6;
  const couleursImpact = ['#ffffff', '#f4d35e', '#c9c2b3'];
  for (let i = 0; i < nombre; i++) {
    const angle = angleBase === null
      ? Math.random() * Math.PI * 2
      : angleBase + (Math.random() - 0.5) * spread;
    const vitesse = (grande ? 60 : 40) + Math.random() * (grande ? 90 : 60);
    particules.push({
      x,
      y,
      vx: Math.cos(angle) * vitesse,
      vy: Math.sin(angle) * vitesse,
      vie: (grande ? 0.5 : 0.15) + Math.random() * (grande ? 0.3 : 0.1),
      vieMax: grande ? 0.8 : 0.25,
      couleur: grande
        ? (Math.random() > 0.5 ? '#ff9f43' : '#ffd166')
        : couleursImpact[Math.floor(Math.random() * couleursImpact.length)]
    });
  }
}

// Tire vers la cible à chaque lettre correcte tapée ; seul le tir qui
// complète le mot (motComplet) détruit réellement le rocher.
function tirer(roche, motComplet) {
  projectiles.push({
    roche,
    motComplet,
    departX: CANON_X,
    departY: CANON_Y - 20,
    t: 0,
    duree: 0.18
  });
}

function dessiner() {
  const degrade = ctx.createLinearGradient(0, 0, 0, HAUTEUR);
  degrade.addColorStop(0, '#0b1237');
  degrade.addColorStop(1, '#1b2a6b');
  ctx.fillStyle = degrade;
  ctx.fillRect(0, 0, LARGEUR, HAUTEUR);

  ctx.fillStyle = '#2d3b55';
  ctx.fillRect(0, SOL_Y, LARGEUR, HAUTEUR - SOL_Y);

  roches.forEach(dessinerRoche);
  dessinerCanon();

  projectiles.forEach(p => {
    const impact = p.motComplet ? p.roche : pointImpact(p.roche);
    const x = p.departX + (impact.x - p.departX) * p.t;
    const y = p.departY + (impact.y - p.departY) * p.t;
    ctx.beginPath();
    ctx.fillStyle = '#ffe066';
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  particules.forEach(pa => {
    ctx.globalAlpha = Math.max(pa.vie / pa.vieMax, 0);
    ctx.fillStyle = pa.couleur;
    ctx.beginPath();
    ctx.arc(pa.x, pa.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function dessinerRoche(r) {
  ctx.beginPath();
  ctx.fillStyle = r === cible ? '#8a5a3c' : '#5a4634';
  ctx.strokeStyle = '#2e2318';
  ctx.lineWidth = 2;
  ctx.arc(r.x, r.y, r.rayon, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Flash blanc bref quand un tir touche le rocher, pour lire l'impact sur sa surface
  if (r.flash > 0) {
    ctx.globalAlpha = r.flash * 0.6;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.rayon, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const tapee = r.mot.slice(0, r.tapees);
  const reste = r.mot.slice(r.tapees);
  const largeurTapee = ctx.measureText(tapee).width;
  const largeurReste = ctx.measureText(reste).width;
  const debutX = r.x - (largeurTapee + largeurReste) / 2;

  ctx.fillStyle = '#7CFC00';
  ctx.fillText(tapee, debutX, r.y);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(reste, debutX + largeurTapee, r.y);
}

function dessinerCanon() {
  let angle = -Math.PI / 2;
  if (cible) {
    angle = Math.atan2(cible.y - CANON_Y, cible.x - CANON_X);
  }

  ctx.save();
  ctx.translate(CANON_X, CANON_Y);

  ctx.fillStyle = '#3f5170';
  ctx.beginPath();
  ctx.arc(0, 0, 22, Math.PI, 0);
  ctx.fill();

  ctx.rotate(angle + Math.PI / 2);
  ctx.fillStyle = '#8892b0';
  ctx.fillRect(-6, -40, 12, 40);

  ctx.restore();
}

window.addEventListener('keydown', (e) => {
  if (!jeuActif) return;
  if (e.key.length !== 1) return;

  const lettre = e.key.toLowerCase();

  if (cible) {
    const attendue = cible.mot[cible.tapees];
    if (lettre === attendue) {
      cible.tapees++;
      const motComplet = cible.tapees >= cible.mot.length;
      tirer(cible, motComplet);
      if (motComplet) cible = null;
    }
    return;
  }

  const candidats = roches.filter(r => r.mot[0] === lettre);
  if (candidats.length === 0) return;

  candidats.sort((a, b) => b.y - a.y);
  cible = candidats[0];
  cible.tapees = 1;
  const motComplet = cible.tapees >= cible.mot.length;
  tirer(cible, motComplet);
  if (motComplet) cible = null;
});

btnJouer.addEventListener('click', demarrer);
btnRejouer.addEventListener('click', demarrer);

// Construit une fois les boutons de choix de difficulté à partir des cycles actifs
cycles.forEach((cycle, index) => {
  if (!cycle.actif) return;
  const bouton = document.createElement('button');
  bouton.textContent = cycle.nom;
  bouton.addEventListener('click', () => {
    ecranDifficulte.style.display = 'none';
    demarrerCycle(index);

    jeuActif = true;
    const maintenant = performance.now();
    dernierSpawn = maintenant;
    dernierFrame = maintenant;
    requestAnimationFrame(boucle);
  });
  choixDifficulteEl.appendChild(bouton);
});

btnContinuerOui.addEventListener('click', () => {
  ecranCycle.style.display = 'none';
  ecranDifficulte.style.display = 'flex';
});

btnContinuerNon.addEventListener('click', () => {
  ecranCycle.style.display = 'none';
  finDeJeu('🏁 Partie terminée !');
});

let redimTimeout = null;
window.addEventListener('resize', () => {
  clearTimeout(redimTimeout);
  redimTimeout = setTimeout(redimensionnerCanvas, 150);
});

redimensionnerCanvas();
