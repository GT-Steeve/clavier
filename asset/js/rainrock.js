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
const ecranClavier = document.getElementById('ecran-clavier');
const motAzertyEl = document.getElementById('mot-azerty');
const motQwertyEl = document.getElementById('mot-qwerty');
const indicateurClavierEl = document.getElementById('indicateur-clavier');
const ecranPopupMenu = document.getElementById('ecran-popup-menu');
const motAventureEl = document.getElementById('mot-aventure');
const motSurvieEl = document.getElementById('mot-survie');
const motEntrainementEl = document.getElementById('mot-entrainement');
const ecranProgression = document.getElementById('ecran-progression');
const titreProgressionEl = document.getElementById('titre-progression');
const carteAventureEl = document.getElementById('carte-aventure');
const motSuiteAventureEl = document.getElementById('mot-suite-aventure');
const indiceSuiteAventureEl = document.getElementById('indice-suite-aventure');
const ecranDebut = document.getElementById('ecran-debut');
const motCommencerEl = document.getElementById('mot-commencer');
const ecranCycle = document.getElementById('ecran-cycle');
const cycleTermineEl = document.getElementById('cycle-termine');
const motOuiEl = document.getElementById('mot-oui');
const motNonEl = document.getElementById('mot-non');
const ecranDifficulte = document.getElementById('ecran-difficulte');
const choixDifficulteEl = document.getElementById('choix-difficulte');
const motMajusculeEl = document.getElementById('mot-majuscule');
const ecranTutoMajuscule = document.getElementById('ecran-tuto-majuscule');
const motContinuerMajusculeEl = document.getElementById('mot-continuer-majuscule');
const exemplesMajusculeEl = document.getElementById('exemples-majuscule');
const motAltEl = document.getElementById('mot-alt');
const ecranTutoAlt = document.getElementById('ecran-tuto-alt');
const motContinuerAltEl = document.getElementById('mot-continuer-alt');
const exemplesAltEl = document.getElementById('exemples-alt');
const motSpeciaux1El = document.getElementById('mot-speciaux1');
const ecranTutoSpeciaux1 = document.getElementById('ecran-tuto-speciaux1');
const motContinuerSpeciaux1El = document.getElementById('mot-continuer-speciaux1');
const exemplesSpeciaux1El = document.getElementById('exemples-speciaux1');
const motSpeciaux2El = document.getElementById('mot-speciaux2');
const ecranTutoSpeciaux2 = document.getElementById('ecran-tuto-speciaux2');
const motContinuerSpeciaux2El = document.getElementById('mot-continuer-speciaux2');
const exemplesSpeciaux2El = document.getElementById('exemples-speciaux2');
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

// Niveau tuto MAJUSCULE de l'Entraînement (voir afficherTutoMajuscule) : moitié en
// CAPITALES (s'écrit avec Verr. Maj) et moitié avec seule l'initiale en majuscule
// (s'écrit en maintenant Shift), pour pratiquer les deux méthodes.
const tableauM = [
  'LUNE', 'Mars', 'VENUS', 'Soleil', 'COMETE',
  'Astre', 'ORBITE', 'Cosmos', 'GALAXIE', 'Planete'
];

// Niveau tuto ALT de l'Entraînement (voir afficherTutoAlt) : les caractères spéciaux
// qui s'écrivent avec AltGr, un par comète. ~ et ` (AltGr+2/7) sont exclus : ce sont des
// touches mortes AZERTY qui ne se reconnaissent pas de façon fiable au clavier de tous
// les visiteurs (voir conversation).
const tableauA = ['#', '{', '[', '|', '\\', '^', '@', ']', '}', '¤', '€'];

// Niveaux tuto SPECIAUX1 (sans touche spéciale) / SPECIAUX2 (Shift + la même touche)
// de l'Entraînement : le reste du clavier AZERTY, un caractère par comète.
const tableauS1 = ['&', 'é', '"', "'", '(', '-', 'è', '_', 'ç', 'à', ')', '=', '^', '$', '*', 'ù', '!', ',', ';', ':'];
const tableauS2 = ['°', '+', '¨', '£', 'µ', '%', '§', '/', '.', '?'];

// Paires touche de base -> résultat avec Shift, pour les exemples du tuto SPECIAUX2 :
// les touches de tableauS1 dont le Shift donne un caractère spécial (pas un chiffre).
const PAIRES_SPECIAUX2 = [
  [')', '°'], ['=', '+'], ['^', '¨'], ['$', '£'], ['*', 'µ'],
  ['ù', '%'], ['!', '§'], [',', '?'], [';', '.'], [':', '/']
];

// Équivalents QWERTY des thèmes SPECIAUX1/SPECIAUX2 (voir modeClavier) : le QWERTY n'a
// pas de couche AltGr comme l'AZERTY, donc pas d'équivalent au thème ALT (voir
// afficherChoixDifficulte). Son rang de chiffres donne directement les chiffres (pas des
// caractères spéciaux, contrairement à l'AZERTY) : les symboles associés (!@#...) ne
// s'obtiennent qu'avec Shift, d'où leur présence dans SPECIAUX2 plutôt que SPECIAUX1.
const tableauS1Qwerty = ['-', '=', '[', ']', '\\', ';', "'", ',', '.', '/', '`'];
const PAIRES_SPECIAUX2_QWERTY = [
  ['-', '_'], ['=', '+'], ['[', '{'], [']', '}'], ['\\', '|'], [';', ':'], ["'", '"'],
  [',', '<'], ['.', '>'], ['/', '?'], ['`', '~'],
  ['1', '!'], ['2', '@'], ['3', '#'], ['4', '$'], ['5', '%'],
  ['6', '^'], ['7', '&'], ['8', '*'], ['9', '('], ['0', ')']
];
const tableauS2Qwerty = PAIRES_SPECIAUX2_QWERTY.map(([, resultat]) => resultat);

// Sélectionnent les données SPECIAUX1/2 actives selon modeClavier (voir
// construireExemplesSpeciaux1/2, lancerNiveauSpeciaux1/2, et les écouteurs
// keydown/keyup dédiés plus bas).
function tableauSpeciaux1Actif() {
  return modeClavier === 'azerty' ? tableauS1 : tableauS1Qwerty;
}
function pairesSpeciaux2Actives() {
  return modeClavier === 'azerty' ? PAIRES_SPECIAUX2 : PAIRES_SPECIAUX2_QWERTY;
}
function tableauSpeciaux2Actif() {
  return modeClavier === 'azerty' ? tableauS2 : tableauS2Qwerty;
}

// Deux touches mortes AZERTY (première pression sans effet visible : e.key vaut 'Dead',
// en attente d'une touche suivante pour "libérer" le caractère) : AltGr+9 (^, thème ALT)
// et la touche ^ ¨ dédiée, sans AltGr (^ sans Shift, ¨ avec Shift ; thèmes SPECIAUX1/2).
// On les reconnaît directement via la touche physique (e.code, stable même quand
// e.key vaut 'Dead') pour ne pas obliger à taper une touche de plus. Le QWERTY standard
// n'a pas de touche morte dans nos tableaux (même ` / ~), donc rien à résoudre pour lui.
function caractereReel(e) {
  if (e.key !== 'Dead') return e.key;
  if (modeClavier !== 'azerty') return null;
  if (e.code === 'Digit9') return '^';
  if (e.code === 'BracketLeft') return e.shiftKey ? '¨' : '^';
  return null;
}

// Mots du mode Aventure : un tableau par étape, à remplir/corriger à la main.
// Convention de nommage : tableauN = Niveau N, tableauNn = le tuto qui suit
// le Niveau N (ex. tableau1n = tuto "Shift + MAJ" entre Niveau 1 et Niveau 2).
// En mode Aventure, les mots sont piochés dans l'ordre de ces tableaux (voir
// motAleatoire), donc l'ordre des mots ici est l'ordre dans lequel ils tombent.
const tableau1 = [
  'ecole', 'devoir', 'professeur', 'brevet', 'stylo', 'livre',
  'cahier', 'crayon', 'gomme', 'sonnerie', 'trousse', 'classe',
  'tableau', 'bureau', 'chaise', 'cours', 'examen', 'question',
  'surligneur', 'exercice', 'note', 'anglais', 'espagnol', 'histoire'
];

const tableau1n = ['Mars2', 'Vega1', 'Orion3', 'Terre7', 'Nova5', 'Astre9', 'Zeta4', 'Rex6', 'Ori8', 'Lyra0'];

const tableau2 = [
  'Mars42', 'Vega17', 'Comete3', 'Astro99', 'Nova21', 'Terre88',
  'Zeta56', 'Etoile7', 'Orion14', 'Rex2000', 'Lyra33', 'Vesta45'
];

const tableau2n = ['ch@t', 'cl[é]', 'vi{e}', 'or|an', 'an~ée', '^haut', 'r#1', 'vu%2', 'ok$3', '€uro'];

const tableau3 = [
  '@#123', '[{}]', '~^`|', 'é&è', 'ç"@', '#1$2', '§',
  '€£¤', '?!;:', '(-_-)', 'a[1]', 'µ', '75%'
];

const tableau3n = ['bête', 'forêt', 'être', 'fenêtre', 'pêche', 'tête', 'même', 'arrêt', 'fête', 'crêpe'];

const tableau4 = [
  'bête', 'énorme', 'naïve', 'Noël3', 'café€', 'forêt7', 'île42',
  'Müller', 'déjà$', 'ça£va', 'Écran9', 'coûte%'
];

// Mode Survie : pioche au hasard dans les 4 tableaux niveau réunis (voir demarrerSurvie).
const motsSurvie = [...tableau1, ...tableau2, ...tableau3, ...tableau4];

// Progression du mode Aventure (voir v1/aventure.png) : Niveau 1 -> Tuto -> Niveau 2
// -> Tuto -> Niveau 3 -> Tuto -> Niveau 4. Chaque étape définit son rythme d'apparition
// (intervalSpawn) et son tableau de mots, et ne compte qu'un seul cycle (contrairement
// aux cycles classiques Facile/Moyen/Difficile/Survie qui peuvent s'enchaîner plusieurs
// fois) : le nombre de météores du cycle est le nombre de mots du tableau de l'étape
// (voir demarrerCycle/majMeteoresHUD), donc l'étape fait défiler tout son vocabulaire
// une fois puis passe directement à l'étape suivante.
const ETAPES_AVENTURE = [
  {
    type: 'niveau',
    nom: 'Niveau 1',
    intervalSpawn: 2500,
    mots: tableau1
  },
  {
    type: 'tuto',
    nom: 'Tuto',
    theme: 'Shift + MAJ',
    indice: 'Maintenez Shift pour écrire les majuscules.',
    intervalSpawn: 5000,
    mots: tableau1n
  },
  {
    type: 'niveau',
    nom: 'Niveau 2',
    intervalSpawn: 2500,
    mots: tableau2
  },
  {
    type: 'tuto',
    nom: 'Tuto',
    theme: 'ALT',
    indice: 'Utilisez AltGr pour écrire les symboles spéciaux (@ # [ ] { } ~ ^).',
    intervalSpawn: 5000,
    mots: tableau2n
  },
  {
    type: 'niveau',
    nom: 'Niveau 3',
    intervalSpawn: 2500,
    mots: tableau3
  },
  {
    type: 'tuto',
    nom: 'Tuto',
    theme: 'Accent',
    indice: 'Les lettres accentuées se tapent avec les touches mortes ( ^ ¨ ` ).',
    intervalSpawn: 5000,
    mots: tableau3n
  },
  {
    type: 'niveau',
    nom: 'Niveau 4',
    intervalSpawn: 1500,
    mots: tableau4
  }
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

// Niveau tuto MAJUSCULE de l'Entraînement (voir afficherTutoMajuscule/lancerNiveauMajuscule) :
// un seul passage sur tout tableauM, comme une étape de l'Aventure (nombreMeteoresCycle
// s'appuie sur cycle.mots quand il est présent).
const cycleMajuscule = { nom: 'Majuscule', intervalSpawn: 4000, mots: tableauM };

// Niveau tuto ALT de l'Entraînement (voir afficherTutoAlt/lancerNiveauAlt) : un seul
// passage sur tout tableauA.
const cycleAlt = { nom: 'Alt', intervalSpawn: 4000, mots: tableauA };

// Niveaux tuto SPECIAUX1/SPECIAUX2 de l'Entraînement : un seul passage sur tout
// tableauS1, respectivement tableauS2 (voir afficherTutoSpeciaux1/2).
const cycleSpeciaux1 = { nom: 'Spéciaux1', intervalSpawn: 3000, mots: tableauS1 };
const cycleSpeciaux2 = { nom: 'Spéciaux2', intervalSpawn: 3000, mots: tableauS2 };

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
let cycleActuel = cycles[0];
let meteoresRestantsCycle = 0;
let attenteFinCycle = false;
let finExplosionsTimestamp = null;
let secousse = 0;
let vaguesTerminees = 0;
const DELAI_CHOIX_CONTINUER = 1500;

// Liste de mots actuellement utilisée pour les météores : la liste générique par
// défaut, remplacée par le thème de l'étape en cours pendant le mode Aventure.
let motsActuels = mots;

// Mode Aventure : progression fixe à travers ETAPES_AVENTURE (voir plus haut).
let modeAventureActif = false;
let etapeAventureIndex = 0;

// Mode Survie : cycles infinis de difficulté tirée au sort (voir demarrerSurvie).
let modeSurvieActif = false;
let cycleSurvieCompte = 0;

// Thème MAJUSCULE de l'écran de difficulté (mode Entraînement) : au lieu de choisir
// une difficulté, affiche un tuto (voir afficherTutoMajuscule) puis lance un niveau
// dédié sur tableauM, où la casse compte (comme en Aventure/Survie).
let modeMajusculeNiveauActif = false;
const MOT_MAJUSCULE = 'MAJUSCULE';
const MOT_CONTINUER = 'CONTINUER';

// Thème ALT de l'écran de difficulté (mode Entraînement) : même principe que MAJUSCULE,
// mais pour les caractères spéciaux qui s'écrivent avec AltGr (voir afficherTutoAlt).
// Pas besoin d'un flag de casse ici : tableauA ne contient que des symboles, insensibles
// à toLowerCase().
const MOT_ALT = 'ALT';

// Thèmes SPECIAUX1/SPECIAUX2 de l'écran de difficulté : le reste du clavier AZERTY,
// sans touche spéciale pour SPECIAUX1, avec Shift pour SPECIAUX2 (voir afficherTutoSpeciaux1/2).
const MOT_SPECIAUX1 = 'SPECIAUX1';
const MOT_SPECIAUX2 = 'SPECIAUX2';

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
const MOT_AVENTURE = 'AVENTURE';
const MOT_SURVIE = 'SURVIE';
const MOT_ENTRAINEMENT = 'ENTRAINEMENT';
const MOT_COMMENCER = 'COMMENCER';
const MOT_AZERTY = 'AZERTY';
const MOT_QWERTY = 'QWERTY';

// Disposition clavier du joueur, redemandée à chaque passage par MENU (voir
// lancerSequenceMenu/afficherChoixClavier) : conditionne le thème ALT (AZERTY
// seulement, voir afficherChoixDifficulte) et le contenu des thèmes SPECIAUX1/SPECIAUX2
// (voir tableauSpeciaux1Actif/pairesSpeciaux2Actives), ainsi que la résolution des
// touches mortes dans caractereReel.
let modeClavier = 'azerty';

function majIndicateurClavier() {
  indicateurClavierEl.textContent = modeClavier.toUpperCase();
}

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

// Choix au clavier entre plusieurs mots (ex: OUI / NON, ou FACILE / MOYEN / DIFFICILE
// / MAJUSCULE) : aucun mot n'est présélectionné, chaque lettre tapée filtre les
// candidats encore compatibles avec ce qui a été tapé jusqu'ici (comme un préfixe).
// Gère le cas où plusieurs candidats partagent la même lettre de départ (ex: MOYEN
// et MAJUSCULE commencent tous les deux par M) : la cible ne se fige que lorsqu'il
// ne reste plus qu'un seul candidat compatible avec le préfixe tapé.
let promptCandidats = [];
let candidatsChoixRestants = [];
let progresPromptChoix = 0;
let onChoixComplete = null;

function demarrerChoixPrompt(candidats, callback) {
  promptCandidats = candidats;
  candidatsChoixRestants = candidats;
  progresPromptChoix = 0;
  onChoixComplete = callback;
  candidats.forEach(c => rendreMotSurligne(c.element, c.mot, 0, false));
}

function traiterLettreChoix(touche) {
  const lettre = touche.toLowerCase();

  const correspondants = candidatsChoixRestants.filter(
    c => (c.mot[progresPromptChoix] || '').toLowerCase() === lettre
  );
  if (correspondants.length === 0) return;

  progresPromptChoix++;
  correspondants.forEach(c => rendreMotSurligne(c.element, c.mot, progresPromptChoix, false));
  // Les candidats qui viennent de sortir de la course reprennent leur affichage vierge.
  candidatsChoixRestants
    .filter(c => !correspondants.includes(c))
    .forEach(c => rendreMotSurligne(c.element, c.mot, 0, false));
  candidatsChoixRestants = correspondants;

  if (correspondants.length === 1 && progresPromptChoix >= correspondants[0].mot.length) {
    const choix = correspondants[0].mot;
    const callback = onChoixComplete;
    promptCandidats = [];
    candidatsChoixRestants = [];
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

// Nombre de météores d'un cycle : pour une étape Aventure (qui a un tableau `mots`),
// c'est la longueur de ce tableau (une vague = tout le vocabulaire de l'étape une
// fois) ; pour un cycle classique (Facile/Moyen/Difficile/Survie), c'est nombreMeteores.
function nombreMeteoresCycle(cycle) {
  return cycle.mots ? cycle.mots.length : cycle.nombreMeteores;
}

// cycleOuIndex : soit un index dans `cycles` (Entraînement/démo), soit directement
// un objet {nom, intervalSpawn, ...} comme une étape d'ETAPES_AVENTURE ou un cycle
// de Survie (voir nombreMeteoresCycle pour comment le nombre de météores en découle).
function demarrerCycle(cycleOuIndex) {
  const estIndex = typeof cycleOuIndex === 'number';
  cycleIndex = estIndex ? cycleOuIndex : -1;
  cycleActuel = estIndex ? cycles[cycleOuIndex] : cycleOuIndex;
  intervalSpawn = cycleActuel.intervalSpawn;
  meteoresRestantsCycle = nombreMeteoresCycle(cycleActuel);
  attenteFinCycle = false;
  finExplosionsTimestamp = null;
  cycleEl.textContent = cycleActuel.nom;
  majMeteoresHUD();
}

// Affiche météores restants (non apparus + encore en jeu) / total du cycle en cours
function majMeteoresHUD() {
  const total = nombreMeteoresCycle(cycleActuel);
  const restant = meteoresRestantsCycle + roches.length;
  meteoresEl.textContent = `${restant} / ${total}`;
}

// En mode Aventure, avance dans le tableau de mots de l'étape (tableau1, tableau1n, ...)
// dans l'ordre d'index plutôt qu'au hasard, pour permettre un vocabulaire écrit à la
// main. Remis à zéro à chaque nouvelle étape par lancerEtapeAventure(). Comme une vague
// compte exactement autant de météores que le tableau a de mots (voir nombreMeteoresCycle),
// chaque vague fait défiler le tableau une fois dans l'ordre ; le modulo ne sert qu'à
// repartir du début au fil des vagues suivantes de la même étape.
let indexMotAventure = 0;

function motAleatoire() {
  if (modeAventureActif) {
    const mot = motsActuels[indexMotAventure % motsActuels.length];
    indexMotAventure++;
    return mot;
  }

  const dispo = motsActuels.filter(m => !roches.some(r => r.mot === m));
  const liste = dispo.length ? dispo : motsActuels;
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
  modeAventureActif = false;
  modeSurvieActif = false;
  modeMajusculeNiveauActif = indexCycleDepart === cycleMajuscule;
  // Les niveaux tuto (Majuscule, Alt...) portent leur propre vocabulaire dans .mots,
  // comme une étape de l'Aventure ; sinon on reste sur le vocabulaire générique.
  motsActuels = (typeof indexCycleDepart !== 'number' && indexCycleDepart.mots) ? indexCycleDepart.mots : mots;
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
  modeAventureActif = false;
  modeSurvieActif = false;
  motsActuels = mots;
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

// --- Mode Survie : cycles infinis, difficulté tirée au sort à chaque cycle parmi
// Facile/Moyen/Difficile, sauf tous les 5 cycles (5, 10, 15, ...) où le cycle est
// toujours "Très difficile" (palier). Les mots sont piochés au hasard dans motsSurvie
// (les 4 tableaux niveau de l'Aventure réunis). Pas d'écran "Continuer ?" entre deux
// cycles : ça enchaîne directement, la partie ne s'arrête qu'à la perte de la dernière vie.

// Choisit le prochain cycle de la Survie : palier "Très difficile" tous les 5 cycles,
// sinon tirage au sort parmi les cycles normaux actifs (Facile/Moyen/Difficile).
function prochainCycleSurvie() {
  cycleSurvieCompte++;
  if (cycleSurvieCompte % 5 === 0) {
    return cycles.find(c => c.nom === 'Très difficile');
  }
  const normaux = cycles.filter(c => c.actif);
  return normaux[Math.floor(Math.random() * normaux.length)];
}

// Point d'entrée du mode Survie (SURVIE choisi au menu).
function demarrerSurvie() {
  redimensionnerCanvas();
  roches = [];
  projectiles = [];
  particules = [];
  cible = null;
  score = 0;
  vies = 3;
  jeuActif = true;
  modeDemo = false;
  modeAventureActif = false;
  modeSurvieActif = true;
  motsActuels = motsSurvie;
  vitesseBase = 40;
  secousse = 0;
  vaguesTerminees = 0;
  premiereMeteoreLancee = false;
  cycleSurvieCompte = 0;
  demarrerCycle(prochainCycleSurvie());

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

// Appelé à la place de finCycle() en mode Survie : enchaîne directement sur un
// nouveau cycle de difficulté tirée au sort, sans écran de pause.
function finCycleSurvie() {
  vaguesTerminees++;
  demarrerCycle(prochainCycleSurvie());
  jeuActif = true;
  const maintenant = performance.now();
  dernierSpawn = maintenant;
  dernierFrame = maintenant;
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

// --- Mode Aventure : progression fixe à travers ETAPES_AVENTURE, visualisée par
// une carte (rectangles verts = niveaux, ronds bleus = étapes tuto), comme aventure.png.

// Construit une fois la carte de progression à partir d'ETAPES_AVENTURE.
function construireCarteAventure() {
  carteAventureEl.innerHTML = '';
  ETAPES_AVENTURE.forEach((etape, i) => {
    if (i > 0) {
      const connecteur = document.createElement('div');
      connecteur.className = 'etape-connecteur';
      carteAventureEl.appendChild(connecteur);
    }

    const wrapper = document.createElement('div');
    wrapper.className = `etape-carte etape-numero-${i}`;

    if (etape.type === 'niveau') {
      const boite = document.createElement('div');
      boite.className = 'etape-niveau';
      boite.textContent = etape.nom;
      wrapper.appendChild(boite);
    } else {
      const theme = document.createElement('div');
      theme.className = 'etape-theme';
      theme.textContent = etape.theme;
      const rond = document.createElement('div');
      rond.className = 'etape-tuto';
      wrapper.appendChild(theme);
      wrapper.appendChild(rond);
    }

    carteAventureEl.appendChild(wrapper);
  });
}
construireCarteAventure();

// Affiche la carte de progression (étape courante mise en évidence, étapes passées
// grisées) avec une invite clavier pour continuer. `complet` = toute l'Aventure est
// terminée (dernière étape franchie) : affiche un message de victoire et ramène au menu.
function afficherProgressionAventure(callback, complet = false) {
  ETAPES_AVENTURE.forEach((etape, i) => {
    const wrapper = carteAventureEl.querySelector(`.etape-numero-${i}`);
    wrapper.classList.toggle('etape-complete', complet || i < etapeAventureIndex);
    wrapper.classList.toggle('etape-active', !complet && i === etapeAventureIndex);
    if (!complet && i === etapeAventureIndex) {
      wrapper.scrollIntoView({ inline: 'center', block: 'nearest' });
    }
  });

  if (complet) {
    titreProgressionEl.textContent = '🏆 Aventure terminée !';
    indiceSuiteAventureEl.textContent = '';
  } else {
    const etape = ETAPES_AVENTURE[etapeAventureIndex];
    titreProgressionEl.textContent = `Prochaine étape : ${etape.nom}${etape.theme ? ' (' + etape.theme + ')' : ''}`;
    indiceSuiteAventureEl.textContent = etape.indice || '';
  }

  ecranProgression.style.display = 'flex';
  demarrerPrompt(complet ? MOT_MENU : MOT_COMMENCER, motSuiteAventureEl, () => {
    ecranProgression.style.display = 'none';
    callback();
  });
}

// Point d'entrée du mode Aventure (COMMENCER tapé après avoir choisi AVENTURE au menu).
function demarrerAventure() {
  modeAventureActif = true;
  modeSurvieActif = false;
  etapeAventureIndex = 0;
  score = 0;
  vies = 3;
  vaguesTerminees = 0;
  scoreEl.textContent = score;
  viesEl.textContent = vies;
  premiereMeteoreLancee = false;

  ecranTitre.style.display = 'none';
  ecranPopupMenu.style.display = 'none';
  afficherProgressionAventure(lancerEtapeAventure);
}

// Lance (ou relance) l'étape en cours d'ETAPES_AVENTURE : réinitialise l'arène de
// jeu mais conserve score/vies, qui persistent sur toute la durée de l'Aventure.
function lancerEtapeAventure() {
  redimensionnerCanvas();
  const etape = ETAPES_AVENTURE[etapeAventureIndex];
  motsActuels = etape.mots;
  indexMotAventure = 0;

  roches = [];
  projectiles = [];
  particules = [];
  cible = null;
  jeuActif = true;
  modeDemo = false;
  vitesseBase = 40;
  secousse = 0;
  demarrerCycle(etape);

  hudEl.style.display = 'flex';
  ecranProgression.style.display = 'none';
  ecranFin.style.display = 'none';

  const maintenant = performance.now();
  dernierSpawn = maintenant;
  dernierFrame = maintenant;
  requestAnimationFrame(boucle);
}

// Appelé à la place de finCycle() en mode Aventure : chaque étape ne compte qu'un
// seul cycle, donc on passe directement à l'étape suivante et on affiche la carte
// de progression (ou l'écran de victoire si c'était la dernière étape).
function finVagueAventure() {
  jeuActif = false;
  etapeAventureIndex++;

  if (etapeAventureIndex >= ETAPES_AVENTURE.length) {
    afficherProgressionAventure(retournerAuMenuPrincipal, true);
    return;
  }

  afficherProgressionAventure(lancerEtapeAventure);
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
        if (modeAventureActif) demarrerAventure();
        else if (modeSurvieActif) demarrerSurvie();
        else demarrer();
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
        if (modeAventureActif) {
          finVagueAventure();
        } else if (modeSurvieActif) {
          finCycleSurvie();
        } else {
          finCycle();
        }
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

// Retour visuel du tuto MAJUSCULE (voir construireExemplesMajuscule) : Shift ('Shift',
// longueur > 1) et les lettres de LETTRES_EXEMPLES_MAJUSCULE ne passent jamais le filtre
// e.key.length !== 1 ci-dessous, d'où ces écouteurs dédiés. e.key (plutôt que e.code)
// sert à repérer la lettre pressée : ça reste correct quelle que soit la disposition
// clavier (AZERTY...).
window.addEventListener('keydown', (e) => {
  if (e.key === 'Shift') {
    document.querySelectorAll('.touche-shift').forEach(el => el.classList.add('touche-maintenue'));
    return;
  }

  const lettre = LETTRES_EXEMPLES_MAJUSCULE.find(l => e.key.toUpperCase() === l);
  if (!lettre) return;

  document.querySelectorAll(`.touche-lettre[data-lettre="${lettre}"]`).forEach(el => el.classList.add('touche-maintenue'));

  if (e.key === lettre) {
    // Majuscule effectivement obtenue (Shift ou Verr. Maj + lettre) : affiche le résultat après le "=".
    const resultatEl = exemplesMajusculeEl.querySelector(`.resultat-majuscule[data-lettre="${lettre}"]`);
    if (resultatEl) resultatEl.textContent = lettre;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'Shift') {
    document.querySelectorAll('.touche-shift').forEach(el => el.classList.remove('touche-maintenue'));
    return;
  }

  const lettre = LETTRES_EXEMPLES_MAJUSCULE.find(l => e.key.toUpperCase() === l);
  if (!lettre) return;
  document.querySelectorAll(`.touche-lettre[data-lettre="${lettre}"]`).forEach(el => el.classList.remove('touche-maintenue'));
});

// Retour visuel du tuto ALT (voir construireExemplesAlt), même principe que le tuto
// MAJUSCULE ci-dessus mais pour AltGr + un caractère de tableauA. caractereReel()
// résout la touche morte AZERTY ^ (voir plus haut). Comparaison sur el.dataset
// (pas de sélecteur CSS avec la valeur du caractère) : certains caractères de tableauA
// (ex: \) casseraient un sélecteur `[data-caractere="${touche}"]`.
window.addEventListener('keydown', (e) => {
  if (e.key === 'AltGraph') {
    document.querySelectorAll('.touche-altgr').forEach(el => el.classList.add('touche-maintenue'));
    return;
  }

  const touche = caractereReel(e);
  if (!touche || !tableauA.includes(touche)) return;

  document.querySelectorAll('.touche-caractere-alt').forEach(el => {
    if (el.dataset.caractere === touche) el.classList.add('touche-maintenue');
  });
  // Caractère effectivement obtenu (AltGr + touche) : affiche le résultat après le "=".
  document.querySelectorAll('.resultat-alt').forEach(el => {
    if (el.dataset.caractere === touche) el.textContent = touche;
  });
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'AltGraph') {
    document.querySelectorAll('.touche-altgr').forEach(el => el.classList.remove('touche-maintenue'));
    return;
  }

  const touche = caractereReel(e);
  if (!touche || !tableauA.includes(touche)) return;
  document.querySelectorAll('.touche-caractere-alt').forEach(el => {
    if (el.dataset.caractere === touche) el.classList.remove('touche-maintenue');
  });
});

// Retour visuel du tuto SPECIAUX1 (voir construireExemplesSpeciaux1) : pas de touche
// spéciale à surveiller, juste un flash sur la touche pressée pour confirmer la frappe.
// tableauSpeciaux1Actif() suit modeClavier (AZERTY ou QWERTY).
window.addEventListener('keydown', (e) => {
  const touche = caractereReel(e);
  if (!touche || !tableauSpeciaux1Actif().includes(touche)) return;
  document.querySelectorAll('.touche-caractere-speciaux1').forEach(el => {
    if (el.dataset.caractere === touche) el.classList.add('touche-maintenue');
  });
});

window.addEventListener('keyup', (e) => {
  const touche = caractereReel(e);
  if (!touche || !tableauSpeciaux1Actif().includes(touche)) return;
  document.querySelectorAll('.touche-caractere-speciaux1').forEach(el => {
    if (el.dataset.caractere === touche) el.classList.remove('touche-maintenue');
  });
});

// Retour visuel du tuto SPECIAUX2 (voir construireExemplesSpeciaux2), même principe que
// le tuto MAJUSCULE (la touche SHIFT elle-même pulse déjà via .touche-shift, voir plus
// haut) : chaque paire touche/résultat de pairesSpeciaux2Actives() (AZERTY ou QWERTY
// selon modeClavier) est reconnue sur sa touche de base (pressée sans Shift) comme sur
// son résultat (pressée avec Shift, qui déclenche aussi l'affichage après le "=").
window.addEventListener('keydown', (e) => {
  const touche = caractereReel(e);
  if (!touche) return;
  const paire = pairesSpeciaux2Actives().find(([base, resultat]) => touche === base || touche === resultat);
  if (!paire) return;
  const [base, resultat] = paire;

  document.querySelectorAll('.touche-caractere-speciaux2').forEach(el => {
    if (el.dataset.caractere === base) el.classList.add('touche-maintenue');
  });
  if (touche === resultat) {
    document.querySelectorAll('.resultat-alt').forEach(el => {
      if (el.dataset.caractere === base) el.textContent = resultat;
    });
  }
});

window.addEventListener('keyup', (e) => {
  const touche = caractereReel(e);
  if (!touche) return;
  const paire = pairesSpeciaux2Actives().find(([base, resultat]) => touche === base || touche === resultat);
  if (!paire) return;
  document.querySelectorAll('.touche-caractere-speciaux2').forEach(el => {
    if (el.dataset.caractere === paire[0]) el.classList.remove('touche-maintenue');
  });
});

window.addEventListener('keydown', (e) => {
  // caractereReel() résout la touche morte AZERTY ^ (niveau tuto ALT) : sans ça,
  // e.key vaut 'Dead' sur sa première frappe et cette comète serait impossible à
  // détruire (filtrée par la vérification de longueur juste en dessous).
  const touche = caractereReel(e);
  if (!touche || touche.length !== 1) return;

  // Débloque le contexte audio dès la 1ère touche pressée (contrainte des
  // navigateurs : le son ne peut démarrer que suite à une interaction).
  obtenirContexteAudio();

  if (dansPopupMenu) {
    // Toute frappe pendant le menu repousse le retour automatique à la démo
    planifierRetourDemo();
  }

  if (promptCandidats.length) {
    // Choix binaire au clavier (ex: écran "Continuer ? OUI / NON")
    traiterLettreChoix(touche);
  } else if (motPromptActuel) {
    // Navigation clavier dans les écrans démo/menus (MENU, ENTRAINEMENT, COMMENCER)
    traiterLettrePrompt(touche);
  } else if (!modeDemo && jeuActif) {
    // Partie réelle en cours : la frappe vise/détruit les météores.
    // En Aventure, en Survie et sur le niveau tuto MAJUSCULE, la casse compte
    // (mots contenant des majuscules) ; sur le reste de l'Entraînement, tout est
    // en minuscules donc on reste insensible à la casse.
    traiterLettreMeteore((modeAventureActif || modeSurvieActif || modeMajusculeNiveauActif) ? touche : touche.toLowerCase());
  }
});

// Construit une fois les éléments à taper au clavier pour choisir la difficulté,
// à partir des cycles actifs (ex: FACILE, MOYEN, DIFFICILE).
const candidatsDifficulte = construireChoixClavier(
  choixDifficulteEl,
  cycles.filter(c => c.actif).map(c => c.nom.toUpperCase())
);

// Boutons MAJUSCULE, ALT, SPECIAUX1 et SPECIAUX2 (thèmes de l'écran de difficulté) :
// contrairement aux candidats de difficulté, ils ne lancent pas directement un niveau
// mais ouvrent leur tuto (voir afficherChoixDifficulte / afficherTutoXxx). SPECIAUX1 et
// SPECIAUX2 ne partagent que leur préfixe "SPECIAUX" : demarrerChoixPrompt les distingue
// par la dernière lettre tapée (voir traiterLettreChoix, plus haut).
const candidatMajuscule = { mot: MOT_MAJUSCULE, element: motMajusculeEl };
const candidatAlt = { mot: MOT_ALT, element: motAltEl };
const candidatSpeciaux1 = { mot: MOT_SPECIAUX1, element: motSpeciaux1El };
const candidatSpeciaux2 = { mot: MOT_SPECIAUX2, element: motSpeciaux2El };

function afficherChoixDifficulte() {
  ecranDifficulte.style.display = 'flex';
  // Le thème ALT (caractères AltGr) n'a pas d'équivalent QWERTY standard : bouton masqué
  // et retiré des candidats tapables pour ce mode (voir modeClavier).
  const surAzerty = modeClavier === 'azerty';
  motAltEl.style.display = surAzerty ? '' : 'none';
  const candidatsThemes = surAzerty
    ? [candidatMajuscule, candidatAlt, candidatSpeciaux1, candidatSpeciaux2]
    : [candidatMajuscule, candidatSpeciaux1, candidatSpeciaux2];
  const candidats = [...candidatsDifficulte, ...candidatsThemes];
  demarrerChoixPrompt(candidats, (choixMot) => {
    if (choixMot === MOT_MAJUSCULE) {
      afficherTutoMajuscule();
      return;
    }
    if (choixMot === MOT_ALT) {
      afficherTutoAlt();
      return;
    }
    if (choixMot === MOT_SPECIAUX1) {
      afficherTutoSpeciaux1();
      return;
    }
    if (choixMot === MOT_SPECIAUX2) {
      afficherTutoSpeciaux2();
      return;
    }

    ecranDifficulte.style.display = 'none';
    const index = cycles.findIndex(c => c.nom.toUpperCase() === choixMot);

    if (choixDifficulteInitial) {
      // La vague 1 démarre directement sur la difficulté choisie
      choixDifficulteInitial = false;
      demarrer(index);
      return;
    }

    // Repasse en minuscules/insensible à la casse au cas où le cycle précédent
    // était le niveau tuto MAJUSCULE (voir lancerNiveauMajuscule).
    modeMajusculeNiveauActif = false;
    motsActuels = mots;
    demarrerCycle(index);
    jeuActif = true;
    const maintenant = performance.now();
    dernierSpawn = maintenant;
    dernierFrame = maintenant;
    requestAnimationFrame(boucle);
  });
}

// Échappe un caractère avant de l'insérer dans un data-attribute ou le contenu d'un
// template HTML (voir ligneExempleMajuscule/Alt/Speciaux2, construireExemplesSpeciaux1) :
// un caractère brut comme " casserait l'attribut data-caractere="${caractere}" en
// refermant la valeur en plein milieu (c'est ce qui rendait " introuvable dans SPECIAUX1).
function echapperHtml(caractere) {
  return caractere.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 6 exemples SHIFT + lettre affichés dans le tuto (voir afficherTutoMajuscule), en deux
// colonnes égales de 3 : I/A/Z à gauche, C/H/W à droite. Les bordures des touches
// SHIFT/lettre pulsent (classe touche-maintenue, voir les écouteurs keydown/keyup sur
// 'Shift' plus bas) tant que la vraie touche est maintenue, et la lettre obtenue
// s'affiche après le "=" dès que la majuscule est effectivement tapée.
const COLONNES_EXEMPLES_MAJUSCULE = [
  ['I', 'A', 'Z'],
  ['C', 'H', 'W']
];
const LETTRES_EXEMPLES_MAJUSCULE = COLONNES_EXEMPLES_MAJUSCULE.flat();

function ligneExempleMajuscule(lettre) {
  const echappee = echapperHtml(lettre);
  return `
    <div class="exemple-majuscule">
      <span class="touche touche-shift">⇧<br>SHIFT</span>
      <span class="touche-plus">+</span>
      <span class="touche touche-lettre" data-lettre="${echappee}">${echappee}</span>
      <span class="touche-egal">=</span>
      <span class="resultat-majuscule" data-lettre="${echappee}"></span>
    </div>
  `;
}

function construireExemplesMajuscule() {
  exemplesMajusculeEl.innerHTML = COLONNES_EXEMPLES_MAJUSCULE.map(colonne => `
    <div class="colonne-exemples-majuscule">
      ${colonne.map(ligneExempleMajuscule).join('')}
    </div>
  `).join('');
}

// Tuto MAJUSCULE : petit schéma clavier (Shift / Verr. Maj) + explication, avant de
// lancer le niveau dédié (tableauM). Se ferme en tapant CONTINUER, comme les autres
// écrans de passage.
function afficherTutoMajuscule() {
  ecranDifficulte.style.display = 'none';
  ecranTutoMajuscule.style.display = 'flex';
  construireExemplesMajuscule();
  demarrerPrompt(MOT_CONTINUER, motContinuerMajusculeEl, () => {
    ecranTutoMajuscule.style.display = 'none';
    lancerNiveauMajuscule();
  });
}

// Lance le niveau tuto MAJUSCULE (un seul passage sur tableauM, casse sensible).
// Comme afficherChoixDifficulte, gère aussi bien le tout premier niveau de la
// partie (choixDifficulteInitial) que l'enchaînement après une vague précédente.
function lancerNiveauMajuscule() {
  if (choixDifficulteInitial) {
    choixDifficulteInitial = false;
    demarrer(cycleMajuscule);
    return;
  }

  modeMajusculeNiveauActif = true;
  motsActuels = tableauM;
  demarrerCycle(cycleMajuscule);
  jeuActif = true;
  const maintenant = performance.now();
  dernierSpawn = maintenant;
  dernierFrame = maintenant;
  requestAnimationFrame(boucle);
}

// 11 exemples ALT GR + caractère (tout tableauA) affichés dans le tuto ALT (voir
// afficherTutoAlt), répartis en 3 colonnes à peu près égales. Même principe que les
// exemples MAJUSCULE : bordure qui pulse tant que la touche est maintenue (classe
// touche-maintenue, voir les écouteurs keydown/keyup sur 'AltGraph' plus haut), et
// caractère obtenu affiché après le "=" une fois AltGr + la touche effectivement tapés.
const COLONNES_EXEMPLES_ALT = [
  tableauA.slice(0, 4),
  tableauA.slice(4, 8),
  tableauA.slice(8)
];

function ligneExempleAlt(caractere) {
  const echappee = echapperHtml(caractere);
  return `
    <div class="exemple-alt">
      <span class="touche touche-altgr">⎇<br>ALT GR</span>
      <span class="touche-plus">+</span>
      <span class="touche touche-caractere-alt" data-caractere="${echappee}">${echappee}</span>
      <span class="touche-egal">=</span>
      <span class="resultat-alt" data-caractere="${echappee}"></span>
    </div>
  `;
}

function construireExemplesAlt() {
  exemplesAltEl.innerHTML = COLONNES_EXEMPLES_ALT.map(colonne => `
    <div class="colonne-exemples-alt">
      ${colonne.map(ligneExempleAlt).join('')}
    </div>
  `).join('');
}

// Tuto ALT : petit schéma clavier (AltGr) + explication, avant de lancer le niveau
// dédié (tableauA). Se ferme en tapant CONTINUER, comme les autres écrans de passage.
function afficherTutoAlt() {
  ecranDifficulte.style.display = 'none';
  ecranTutoAlt.style.display = 'flex';
  construireExemplesAlt();
  demarrerPrompt(MOT_CONTINUER, motContinuerAltEl, () => {
    ecranTutoAlt.style.display = 'none';
    lancerNiveauAlt();
  });
}

// Lance le niveau tuto ALT (un seul passage sur tableauA). Comme afficherChoixDifficulte,
// gère aussi bien le tout premier niveau de la partie (choixDifficulteInitial) que
// l'enchaînement après une vague précédente.
function lancerNiveauAlt() {
  if (choixDifficulteInitial) {
    choixDifficulteInitial = false;
    demarrer(cycleAlt);
    return;
  }

  modeMajusculeNiveauActif = false;
  motsActuels = tableauA;
  demarrerCycle(cycleAlt);
  jeuActif = true;
  const maintenant = performance.now();
  dernierSpawn = maintenant;
  dernierFrame = maintenant;
  requestAnimationFrame(boucle);
}

// tableauS1 affiché en vrac dans le tuto SPECIAUX1 (voir afficherTutoSpeciaux1) : pas de
// combinaison de touches, juste les caractères eux-mêmes qui flashent en jaune quand on
// les tape (classe touche-maintenue, voir les écouteurs keydown/keyup plus haut).
function construireExemplesSpeciaux1() {
  exemplesSpeciaux1El.innerHTML = tableauSpeciaux1Actif().map(caractere => {
    const echappee = echapperHtml(caractere);
    return `<span class="touche touche-caractere-speciaux1" data-caractere="${echappee}">${echappee}</span>`;
  }).join('');
}

// Tuto SPECIAUX1 : la liste des caractères, sans schéma clavier (aucune touche spéciale
// à maintenir). Se ferme en tapant CONTINUER, comme les autres écrans de passage.
function afficherTutoSpeciaux1() {
  ecranDifficulte.style.display = 'none';
  ecranTutoSpeciaux1.style.display = 'flex';
  construireExemplesSpeciaux1();
  demarrerPrompt(MOT_CONTINUER, motContinuerSpeciaux1El, () => {
    ecranTutoSpeciaux1.style.display = 'none';
    lancerNiveauSpeciaux1();
  });
}

// Lance le niveau tuto SPECIAUX1 (un seul passage sur tableauS1). Comme
// afficherChoixDifficulte, gère aussi bien le tout premier niveau de la partie
// (choixDifficulteInitial) que l'enchaînement après une vague précédente.
function lancerNiveauSpeciaux1() {
  cycleSpeciaux1.mots = tableauSpeciaux1Actif();

  if (choixDifficulteInitial) {
    choixDifficulteInitial = false;
    demarrer(cycleSpeciaux1);
    return;
  }

  modeMajusculeNiveauActif = false;
  motsActuels = cycleSpeciaux1.mots;
  demarrerCycle(cycleSpeciaux1);
  jeuActif = true;
  const maintenant = performance.now();
  dernierSpawn = maintenant;
  dernierFrame = maintenant;
  requestAnimationFrame(boucle);
}

// Exemples SHIFT + touche de base affichés dans le tuto SPECIAUX2 (voir
// afficherTutoSpeciaux2 ; 10 paires en AZERTY, 21 en QWERTY). Même principe que les
// exemples MAJUSCULE : bordure qui pulse tant que la touche est maintenue, et résultat
// affiché après le "=" une fois Shift + la touche effectivement tapés (voir les
// écouteurs keydown/keyup dédiés plus haut).
// Répartit les paires actives (10 en AZERTY, 21 en QWERTY, voir pairesSpeciaux2Actives)
// en colonnes égales : 2x5 en AZERTY, 3x7 en QWERTY.
function colonnesExemplesSpeciaux2() {
  const paires = pairesSpeciaux2Actives();
  return modeClavier === 'azerty'
    ? [paires.slice(0, 5), paires.slice(5)]
    : [paires.slice(0, 7), paires.slice(7, 14), paires.slice(14)];
}

function ligneExempleSpeciaux2([base, resultat]) {
  const baseEchappee = echapperHtml(base);
  return `
    <div class="exemple-alt">
      <span class="touche touche-shift">⇧<br>SHIFT</span>
      <span class="touche-plus">+</span>
      <span class="touche touche-caractere-speciaux2" data-caractere="${baseEchappee}">${baseEchappee}</span>
      <span class="touche-egal">=</span>
      <span class="resultat-alt" data-caractere="${baseEchappee}"></span>
    </div>
  `;
}

function construireExemplesSpeciaux2() {
  exemplesSpeciaux2El.innerHTML = colonnesExemplesSpeciaux2().map(colonne => `
    <div class="colonne-exemples-speciaux2">
      ${colonne.map(ligneExempleSpeciaux2).join('')}
    </div>
  `).join('');
}

// Tuto SPECIAUX2 : petit schéma clavier (Shift, sans Verr. Maj qui n'affecte pas la
// ponctuation) + explication, avant de lancer le niveau dédié (tableauS2). Se ferme en
// tapant CONTINUER, comme les autres écrans de passage.
function afficherTutoSpeciaux2() {
  ecranDifficulte.style.display = 'none';
  ecranTutoSpeciaux2.style.display = 'flex';
  construireExemplesSpeciaux2();
  demarrerPrompt(MOT_CONTINUER, motContinuerSpeciaux2El, () => {
    ecranTutoSpeciaux2.style.display = 'none';
    lancerNiveauSpeciaux2();
  });
}

// Lance le niveau tuto SPECIAUX2 (un seul passage sur tableauS2). Comme
// afficherChoixDifficulte, gère aussi bien le tout premier niveau de la partie
// (choixDifficulteInitial) que l'enchaînement après une vague précédente.
function lancerNiveauSpeciaux2() {
  cycleSpeciaux2.mots = tableauSpeciaux2Actif();

  if (choixDifficulteInitial) {
    choixDifficulteInitial = false;
    demarrer(cycleSpeciaux2);
    return;
  }

  modeMajusculeNiveauActif = false;
  motsActuels = cycleSpeciaux2.mots;
  demarrerCycle(cycleSpeciaux2);
  jeuActif = true;
  const maintenant = performance.now();
  dernierSpawn = maintenant;
  dernierFrame = maintenant;
  requestAnimationFrame(boucle);
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

// Démarre l'écran titre (démo jouée par une IA) puis enchaîne les invites clavier
// MENU -> (AZERTY ou QWERTY) -> (AVENTURE, SURVIE ou ENTRAINEMENT) -> COMMENCER avant de
// lancer la vraie partie. Redemande la disposition clavier à chaque passage par MENU
// (retour au titre par inactivité ou fin de partie compris), pour permettre de la
// changer sans recharger la page.
function lancerSequenceMenu() {
  ecranTitre.style.display = 'flex';
  demarrerPrompt(MOT_MENU, motMenuEl, () => {
    ecranTitre.style.display = 'none';
    afficherChoixClavier(afficherPopupMenu);
  }, true);
}

// Demande AZERTY ou QWERTY (voir lancerSequenceMenu) : met à jour modeClavier et son
// rappel visuel (indicateurClavierEl) avant d'appeler callback.
function afficherChoixClavier(callback) {
  ecranClavier.style.display = 'flex';
  demarrerChoixPrompt(
    [
      { mot: MOT_AZERTY, element: motAzertyEl },
      { mot: MOT_QWERTY, element: motQwertyEl }
    ],
    (choix) => {
      ecranClavier.style.display = 'none';
      modeClavier = choix === MOT_AZERTY ? 'azerty' : 'qwerty';
      majIndicateurClavier();
      callback();
    }
  );
}

// Affiche le menu principal (AVENTURE / SURVIE / ENTRAINEMENT), une fois la disposition
// clavier choisie (voir afficherChoixClavier).
function afficherPopupMenu() {
  ecranPopupMenu.style.display = 'flex';
  dansPopupMenu = true;
  planifierRetourDemo();

  demarrerChoixPrompt(
    [
      { mot: MOT_AVENTURE, element: motAventureEl },
      { mot: MOT_SURVIE, element: motSurvieEl },
      { mot: MOT_ENTRAINEMENT, element: motEntrainementEl }
    ],
    (choix) => {
      dansPopupMenu = false;
      annulerRetourDemo();
      ecranPopupMenu.style.display = 'none';

      if (choix === MOT_AVENTURE) {
        demarrerAventure();
      } else if (choix === MOT_SURVIE) {
        demarrerSurvie();
      } else {
        ecranDebut.style.display = 'flex';
        demarrerPrompt(MOT_COMMENCER, motCommencerEl, lancerAvecChoixDifficulte);
      }
    }
  );
}

majIndicateurClavier();
demarrerDemo();
lancerSequenceMenu();
