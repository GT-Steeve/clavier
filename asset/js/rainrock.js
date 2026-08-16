const canvas = document.getElementById('jeu');
const ctx = canvas.getContext('2d');
const canvasWrapper = document.querySelector('.canvas-wrapper');
const hudEl = document.getElementById('hud');
const scoreEl = document.getElementById('score');
const viesEl = document.getElementById('vies');
const cycleEl = document.getElementById('cycle');
const meteoresEl = document.getElementById('meteores');
const ecranTitre = document.getElementById('ecran-titre');
const motMenuEl = document.getElementById('mot-menu');
const ecranPopupMenu = document.getElementById('ecran-popup-menu');
const motEntrainementEl = document.getElementById('mot-entrainement');
const ecranDebut = document.getElementById('ecran-debut');
const motCommencerEl = document.getElementById('mot-commencer');
const ecranCycle = document.getElementById('ecran-cycle');
const cycleTermineEl = document.getElementById('cycle-termine');
const motOuiEl = document.getElementById('mot-oui');
const motNonEl = document.getElementById('mot-non');
const ecranDifficulte = document.getElementById('ecran-difficulte');
const choixDifficulteEl = document.getElementById('choix-difficulte');
const ecranFin = document.getElementById('ecran-fin');
const titreFinEl = document.getElementById('titre-fin');
const scoreFinalEl = document.getElementById('score-final');
const motRejouerOuiEl = document.getElementById('mot-rejouer-oui');
const motRejouerNonEl = document.getElementById('mot-rejouer-non');

// --- Sons (synthétisés via Web Audio API, aucun fichier audio à charger) ---
let contexteAudio = null;

function obtenirContexteAudio() {
  if (!contexteAudio) {
    const AudioContextClasse = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClasse) return null;
    contexteAudio = new AudioContextClasse();
  }
  if (contexteAudio.state === 'suspended') contexteAudio.resume();
  return contexteAudio;
}

function creerBufferBruit(ctxAudio, duree) {
  const taille = Math.floor(ctxAudio.sampleRate * duree);
  const buffer = ctxAudio.createBuffer(1, taille, ctxAudio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < taille; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

// Tir du canon : bip bref et aigu qui redescend, à chaque lettre correcte tapée.
function jouerSonTir() {
  const ctxAudio = obtenirContexteAudio();
  if (!ctxAudio) return;
  const debut = ctxAudio.currentTime;
  const duree = 0.1;

  const osc = ctxAudio.createOscillator();
  const gain = ctxAudio.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(900, debut);
  osc.frequency.exponentialRampToValueAtTime(220, debut + duree);
  gain.gain.setValueAtTime(0.12, debut);
  gain.gain.exponentialRampToValueAtTime(0.001, debut + duree);
  osc.connect(gain);
  gain.connect(ctxAudio.destination);
  osc.start(debut);
  osc.stop(debut + duree);
}

// Explosion générique (bruit filtré + tonalité grave descendante) : les deux sons
// de destruction (tir complet vs impact au sol) réutilisent ce gabarit avec des
// réglages différents pour bien se distinguer à l'oreille.
function jouerExplosion({ duree, frequenceFiltre, frequenceOsc, volume }) {
  const ctxAudio = obtenirContexteAudio();
  if (!ctxAudio) return;
  const debut = ctxAudio.currentTime;

  const bruit = ctxAudio.createBufferSource();
  bruit.buffer = creerBufferBruit(ctxAudio, duree);
  const filtre = ctxAudio.createBiquadFilter();
  filtre.type = 'lowpass';
  filtre.frequency.setValueAtTime(frequenceFiltre, debut);
  const gainBruit = ctxAudio.createGain();
  gainBruit.gain.setValueAtTime(volume, debut);
  gainBruit.gain.exponentialRampToValueAtTime(0.001, debut + duree);
  bruit.connect(filtre);
  filtre.connect(gainBruit);
  gainBruit.connect(ctxAudio.destination);
  bruit.start(debut);
  bruit.stop(debut + duree);

  const osc = ctxAudio.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(frequenceOsc, debut);
  osc.frequency.exponentialRampToValueAtTime(frequenceOsc * 0.3, debut + duree);
  const gainOsc = ctxAudio.createGain();
  gainOsc.gain.setValueAtTime(volume * 0.8, debut);
  gainOsc.gain.exponentialRampToValueAtTime(0.001, debut + duree);
  osc.connect(gainOsc);
  gainOsc.connect(ctxAudio.destination);
  osc.start(debut);
  osc.stop(debut + duree);
}

// Météore détruit par un tir complet : son net, vif et aigu.
function jouerSonExplosionTir() {
  jouerExplosion({ duree: 0.35, frequenceFiltre: 3500, frequenceOsc: 180, volume: 0.22 });
}

// Météore qui touche le sol : son plus sourd et étouffé, distinct du précédent.
function jouerSonImpactSol() {
  jouerExplosion({ duree: 0.25, frequenceFiltre: 800, frequenceOsc: 80, volume: 0.2 });
}

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
let secousse = 0;
let vaguesTerminees = 0;
const DELAI_CHOIX_CONTINUER = 1500;

// Le tout premier météore d'une partie réelle arrive plus tôt (0.5s) et tombe
// plus lentement, histoire de laisser le temps de s'installer. Les suivants
// respectent le rythme normal du cycle.
let premiereMeteoreLancee = false;
const DELAI_PREMIER_METEORE = 500;
const VITESSE_PREMIER_METEORE = 20;

// Écran titre : un rocher détruit automatiquement par une IA, en fond, tant que
// le visiteur n'a pas tapé les mots de passage (MENU, ENTRAINEMENT, COMMENCER).
let modeDemo = true;
let demoDernierAppui = 0;
const DEMO_INTERVAL_APPUI = 450;

const MOT_MENU = 'MENU';
const MOT_ENTRAINEMENT = 'ENTRAINEMENT';
const MOT_COMMENCER = 'COMMENCER';

// Vrai tant que le menu principal est affiché : sert à repousser le retour
// automatique à la démo tant que le visiteur tape.
let dansPopupMenu = false;

// Si le menu reste affiché sans qu'aucune touche ne soit pressée pendant ce
// délai, on referme le menu et on revient à l'écran titre (démo + MENU).
const DELAI_INACTIVITE_MENU = 30000;
let inactiviteTimeout = null;

// Mot actuellement à taper au clavier pour naviguer entre les écrans (démo/menus).
let motPromptActuel = '';
let progresPrompt = 0;
let elementPromptActuel = null;
let onPromptComplete = null;
let promptClignotant = false;

function rendreMotSurligne(element, mot, progres, clignotant) {
  const tape = mot.slice(0, progres);
  const reste = mot.slice(progres);
  const clignote = clignotant && progres === 0 ? ' clignote' : '';
  element.innerHTML = `<span class="mot-tape">${tape}</span><span class="mot-reste${clignote}">${reste}</span>`;
}

// clignotant : seul le mot MENU de l'écran titre doit clignoter, pas les choix du menu.
function demarrerPrompt(mot, element, callback, clignotant = false) {
  motPromptActuel = mot;
  progresPrompt = 0;
  elementPromptActuel = element;
  onPromptComplete = callback;
  promptClignotant = clignotant;
  rendreMotSurligne(element, mot, 0, clignotant);
}

function traiterLettrePrompt(lettre) {
  if (!motPromptActuel) return;
  const attendue = motPromptActuel[progresPrompt].toLowerCase();
  if (lettre.toLowerCase() !== attendue) return;

  progresPrompt++;
  rendreMotSurligne(elementPromptActuel, motPromptActuel, progresPrompt, promptClignotant);

  if (progresPrompt >= motPromptActuel.length) {
    const callback = onPromptComplete;
    motPromptActuel = '';
    onPromptComplete = null;
    elementPromptActuel = null;
    if (callback) callback();
  }
}

// Choix binaire au clavier (ex: OUI / NON) : aucun mot n'est présélectionné,
// la première lettre tapée détermine lequel des candidats devient la cible
// (même principe que le ciblage des météores par première lettre).
let promptCandidats = [];
let promptCibleChoix = null;
let progresPromptChoix = 0;
let onChoixComplete = null;

function demarrerChoixPrompt(candidats, callback) {
  promptCandidats = candidats;
  promptCibleChoix = null;
  progresPromptChoix = 0;
  onChoixComplete = callback;
  candidats.forEach(c => rendreMotSurligne(c.element, c.mot, 0, false));
}

function traiterLettreChoix(touche) {
  const lettre = touche.toLowerCase();

  if (!promptCibleChoix) {
    const trouve = promptCandidats.find(c => c.mot[0].toLowerCase() === lettre);
    if (!trouve) return;
    promptCibleChoix = trouve;
  }

  const attendue = promptCibleChoix.mot[progresPromptChoix].toLowerCase();
  if (lettre !== attendue) return;

  progresPromptChoix++;
  rendreMotSurligne(promptCibleChoix.element, promptCibleChoix.mot, progresPromptChoix, false);

  if (progresPromptChoix >= promptCibleChoix.mot.length) {
    const choix = promptCibleChoix.mot;
    const callback = onChoixComplete;
    promptCandidats = [];
    promptCibleChoix = null;
    onChoixComplete = null;
    if (callback) callback(choix);
  }
}

// Construit dans `conteneur` un élément "bouton-menu" tapable au clavier pour
// chaque mot fourni, prêt à être passé à demarrerChoixPrompt(candidats, callback).
// Toute la navigation de ce fichier se fait au clavier, jamais à la souris :
// c'est le point de passage à utiliser pour n'importe quel futur écran de choix.
function construireChoixClavier(conteneur, mots) {
  conteneur.innerHTML = '';
  return mots.map(mot => {
    const element = document.createElement('div');
    element.className = 'bouton-menu';
    conteneur.appendChild(element);
    return { mot, element };
  });
}

function premierCycleActif() {
  const i = cycles.findIndex(c => c.actif);
  return i === -1 ? 0 : i;
}

// Utilisé uniquement par la démo, qui boucle indéfiniment sur les cycles actifs.
function prochainCycleActif(depuis) {
  for (let n = 1; n <= cycles.length; n++) {
    const i = (depuis + n) % cycles.length;
    if (cycles[i].actif) return i;
  }
  return depuis;
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

function creerRoche(vitesseOverride = null) {
  const mot = motAleatoire();
  const rayon = 24 + mot.length * 1.5;
  const x = rayon + Math.random() * (LARGEUR - rayon * 2);
  roches.push({
    mot,
    x,
    y: -rayon,
    rayon,
    vitesse: vitesseOverride !== null ? vitesseOverride : vitesseBase + Math.random() * 20,
    tapees: 0,
    flash: 0
  });
}

// Lance la vraie partie (appelé une fois COMMENCER tapé, ou via Rejouer/choix de difficulté).
// indexCycleDepart : permet de démarrer la vague 1 sur la difficulté choisie
// plutôt que toujours sur "Facile" (voir lancerAvecChoixDifficulte).
function demarrer(indexCycleDepart = premierCycleActif()) {
  redimensionnerCanvas();
  roches = [];
  projectiles = [];
  particules = [];
  cible = null;
  score = 0;
  vies = 3;
  jeuActif = true;
  modeDemo = false;
  vitesseBase = 40;
  secousse = 0;
  vaguesTerminees = 0;
  premiereMeteoreLancee = false;
  demarrerCycle(indexCycleDepart);

  scoreEl.textContent = score;
  viesEl.textContent = vies;
  hudEl.style.display = 'flex';
  ecranTitre.style.display = 'none';
  ecranPopupMenu.style.display = 'none';
  ecranDebut.style.display = 'none';
  ecranCycle.style.display = 'none';
  ecranDifficulte.style.display = 'none';
  ecranFin.style.display = 'none';

  const maintenant = performance.now();
  dernierSpawn = maintenant;
  dernierFrame = maintenant;
  requestAnimationFrame(boucle);
}

// Lance l'écran titre : la partie tourne en fond, jouée par une IA, HUD masqué.
function demarrerDemo() {
  redimensionnerCanvas();
  roches = [];
  projectiles = [];
  particules = [];
  cible = null;
  jeuActif = true;
  modeDemo = true;
  vitesseBase = 40;
  secousse = 0;
  demarrerCycle(premierCycleActif());

  hudEl.style.display = 'none';

  const maintenant = performance.now();
  dernierSpawn = maintenant;
  dernierFrame = maintenant;
  demoDernierAppui = maintenant;
  requestAnimationFrame(boucle);
}

// Vrai lorsque l'écran de difficulté sert à choisir la difficulté de départ
// (avant la vague 1), plutôt qu'à enchaîner sur la vague suivante.
let choixDifficulteInitial = false;

// Mode Entraînement : avant même la vague 1, on laisse choisir la difficulté de départ.
function lancerAvecChoixDifficulte() {
  choixDifficulteInitial = true;
  ecranDebut.style.display = 'none';
  afficherChoixDifficulte();
}

// Base détruite : demande "Rejouer ?" au clavier (OUI relance, NON retourne au menu).
function finDeJeu(titre = '💥 Base détruite !') {
  jeuActif = false;
  titreFinEl.textContent = titre;
  scoreFinalEl.textContent = score;
  ecranFin.style.display = 'flex';

  demarrerChoixPrompt(
    [
      { mot: 'OUI', element: motRejouerOuiEl },
      { mot: 'NON', element: motRejouerNonEl }
    ],
    (choix) => {
      ecranFin.style.display = 'none';
      if (choix === 'OUI') {
        demarrer();
      } else {
        retournerAuMenuPrincipal();
      }
    }
  );
}

// Referme l'écran de fin de partie et relance la démo + le menu d'accueil.
function retournerAuMenuPrincipal() {
  ecranFin.style.display = 'none';
  demarrerDemo();
  lancerSequenceMenu();
}

// Pause le jeu entre deux vagues et demande (au clavier : OUI / NON) si on continue
function finCycle() {
  jeuActif = false;
  vaguesTerminees++;
  cycleTermineEl.textContent = `🎯 Vague ${vaguesTerminees} terminée !`;
  ecranCycle.style.display = 'flex';

  demarrerChoixPrompt(
    [
      { mot: 'OUI', element: motOuiEl },
      { mot: 'NON', element: motNonEl }
    ],
    (choix) => {
      ecranCycle.style.display = 'none';
      if (choix === 'OUI') {
        afficherChoixDifficulte();
      } else {
        retournerAuMenuPrincipal();
      }
    }
  );
}

// IA de démo : "tape" la lettre attendue à intervalle régulier, en visant
// toujours le rocher le plus urgent (le plus bas) quand aucune cible n'est fixée.
function boucleDemoIA(t) {
  if (t - demoDernierAppui < DEMO_INTERVAL_APPUI) return;
  demoDernierAppui = t;

  let lettre = null;
  if (cible) {
    lettre = cible.mot[cible.tapees];
  } else if (roches.length > 0) {
    const urgent = [...roches].sort((a, b) => b.y - a.y)[0];
    lettre = urgent.mot[0];
  }
  if (lettre) traiterLettreMeteore(lettre);
}

function boucle(t) {
  if (!jeuActif) return;
  const dt = Math.min((t - dernierFrame) / 1000, 0.05);
  dernierFrame = t;

  const premierMeteoreDeLaPartie = !premiereMeteoreLancee && !modeDemo;
  const attenteSpawn = premierMeteoreDeLaPartie ? DELAI_PREMIER_METEORE : intervalSpawn;

  if (meteoresRestantsCycle > 0 && t - dernierSpawn > attenteSpawn) {
    creerRoche(premierMeteoreDeLaPartie ? VITESSE_PREMIER_METEORE : null);
    premiereMeteoreLancee = true;
    dernierSpawn = t;
    vitesseBase = Math.min(140, vitesseBase + 2);

    meteoresRestantsCycle--;
    if (meteoresRestantsCycle <= 0) attenteFinCycle = true;
  }

  if (modeDemo) boucleDemoIA(t);

  maj(dt);
  majMeteoresHUD();
  dessiner();

  if (!jeuActif) return; // finDeJeu() a pu être déclenché pendant maj() (perte de la dernière vie)

  if (attenteFinCycle && roches.length === 0 && particules.length === 0) {
    if (modeDemo) {
      // La démo tourne en boucle indéfiniment, sans écran de pause.
      demarrerCycle(prochainCycleActif(cycleIndex));
    } else {
      // Une fois le dernier météore du cycle traité, on attend la fin de son
      // animation d'explosion puis un court délai avant de proposer de continuer.
      if (finExplosionsTimestamp === null) finExplosionsTimestamp = t;
      if (t - finExplosionsTimestamp >= DELAI_CHOIX_CONTINUER) {
        finCycle();
        return;
      }
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

  if (secousse > 0) secousse = Math.max(0, secousse - dt * 4);

  for (let i = roches.length - 1; i >= 0; i--) {
    const r = roches[i];
    if (r.y + r.rayon >= SOL_Y) {
      if (cible === r) cible = null;
      impactSol(r);
      if (!modeDemo) jouerSonImpactSol();
      roches.splice(i, 1);
      if (!modeDemo) perdreVie();
    }
  }

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.t += dt / p.duree;
    if (p.t >= 1) {
      if (p.motComplet) {
        exploser(p.roche.x, p.roche.y, true);
        if (!modeDemo) jouerSonExplosionTir();
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

// Nuage de poussière au point de contact réel du météore avec le sol
// (largeur du rocher au niveau du sol), pas au centre où était le mot.
function impactSol(r) {
  const nombre = 12;
  const couleurs = ['#8a7a63', '#5c5040', '#a89678'];
  for (let i = 0; i < nombre; i++) {
    const angle = -Math.PI * Math.random(); // hémisphère supérieure (loin du sol)
    const vitesse = 40 + Math.random() * 70;
    particules.push({
      x: r.x + (Math.random() - 0.5) * r.rayon * 1.4,
      y: SOL_Y,
      vx: Math.cos(angle) * vitesse,
      vy: Math.sin(angle) * vitesse * 0.6,
      vie: 0.3 + Math.random() * 0.25,
      vieMax: 0.55,
      couleur: couleurs[Math.floor(Math.random() * couleurs.length)]
    });
  }
  secousse = 1;
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
  ctx.save();
  if (secousse > 0) {
    ctx.translate((Math.random() - 0.5) * 10 * secousse, (Math.random() - 0.5) * 10 * secousse);
  }

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

  ctx.restore();
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

// Logique de ciblage/tir sur les météores, partagée entre le vrai clavier
// (pendant une partie) et l'IA qui joue la démo en arrière-plan.
function traiterLettreMeteore(lettre) {
  if (cible) {
    const attendue = cible.mot[cible.tapees];
    if (lettre === attendue) {
      cible.tapees++;
      const motComplet = cible.tapees >= cible.mot.length;
      tirer(cible, motComplet);
      if (!modeDemo) jouerSonTir();
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
  if (!modeDemo) jouerSonTir();
  if (motComplet) cible = null;
}

window.addEventListener('keydown', (e) => {
  if (e.key.length !== 1) return;

  // Débloque le contexte audio dès la 1ère touche pressée (contrainte des
  // navigateurs : le son ne peut démarrer que suite à une interaction).
  obtenirContexteAudio();

  if (dansPopupMenu) {
    // Toute frappe pendant le menu repousse le retour automatique à la démo
    planifierRetourDemo();
  }

  if (promptCandidats.length) {
    // Choix binaire au clavier (ex: écran "Continuer ? OUI / NON")
    traiterLettreChoix(e.key);
  } else if (motPromptActuel) {
    // Navigation clavier dans les écrans démo/menus (MENU, ENTRAINEMENT, COMMENCER)
    traiterLettrePrompt(e.key);
  } else if (!modeDemo && jeuActif) {
    // Partie réelle en cours : la frappe vise/détruit les météores
    traiterLettreMeteore(e.key.toLowerCase());
  }
});

// Construit une fois les éléments à taper au clavier pour choisir la difficulté,
// à partir des cycles actifs (ex: FACILE, MOYEN, DIFFICILE).
const candidatsDifficulte = construireChoixClavier(
  choixDifficulteEl,
  cycles.filter(c => c.actif).map(c => c.nom.toUpperCase())
);

function afficherChoixDifficulte() {
  ecranDifficulte.style.display = 'flex';
  demarrerChoixPrompt(candidatsDifficulte, (choixMot) => {
    ecranDifficulte.style.display = 'none';
    const index = cycles.findIndex(c => c.nom.toUpperCase() === choixMot);

    if (choixDifficulteInitial) {
      // La vague 1 démarre directement sur la difficulté choisie
      choixDifficulteInitial = false;
      demarrer(index);
      return;
    }

    demarrerCycle(index);
    jeuActif = true;
    const maintenant = performance.now();
    dernierSpawn = maintenant;
    dernierFrame = maintenant;
    requestAnimationFrame(boucle);
  });
}

let redimTimeout = null;
window.addEventListener('resize', () => {
  clearTimeout(redimTimeout);
  redimTimeout = setTimeout(redimensionnerCanvas, 150);
});

function annulerRetourDemo() {
  clearTimeout(inactiviteTimeout);
  inactiviteTimeout = null;
}

function planifierRetourDemo() {
  clearTimeout(inactiviteTimeout);
  inactiviteTimeout = setTimeout(retournerAuTitre, DELAI_INACTIVITE_MENU);
}

// Referme le menu et revient à l'écran titre (la démo, elle, n'a jamais cessé
// de tourner en fond) : il faudra retaper MENU pour le rouvrir.
function retournerAuTitre() {
  annulerRetourDemo();
  dansPopupMenu = false;
  ecranPopupMenu.style.display = 'none';
  lancerSequenceMenu();
}

// Démarre l'écran titre (démo jouée par une IA) puis enchaîne les invites
// clavier MENU -> ENTRAINEMENT -> COMMENCER avant de lancer la vraie partie.
function lancerSequenceMenu() {
  ecranTitre.style.display = 'flex';
  demarrerPrompt(MOT_MENU, motMenuEl, () => {
    ecranTitre.style.display = 'none';
    ecranPopupMenu.style.display = 'flex';
    dansPopupMenu = true;
    planifierRetourDemo();

    demarrerPrompt(MOT_ENTRAINEMENT, motEntrainementEl, () => {
      dansPopupMenu = false;
      annulerRetourDemo();
      ecranPopupMenu.style.display = 'none';
      ecranDebut.style.display = 'flex';
      demarrerPrompt(MOT_COMMENCER, motCommencerEl, lancerAvecChoixDifficulte);
    });
  }, true);
}

demarrerDemo();
lancerSequenceMenu();
