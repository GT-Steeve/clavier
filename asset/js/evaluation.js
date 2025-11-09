const phraseCible = document.getElementById('phrase-cible');
const zoneSaisie = document.getElementById('zone-saisie');
const feedback = document.getElementById('feedback');
const boutonDemarrer = document.getElementById('demarrer');
const boutonRecommencer = document.getElementById('recommencer');
const resultat = document.getElementById('resultat');

// === Barre de progression ===
let barreContainer = document.getElementById('progression-container');
let barre = document.getElementById('progression-bar');

// Si la barre n’existe pas encore, on la crée dynamiquement
if (!barreContainer) {
  barreContainer = document.createElement('div');
  barreContainer.id = 'progression-container';
  barreContainer.style.width = '100%';
  barreContainer.style.background = '#e6e9ff';
  barreContainer.style.borderRadius = '6px';
  barreContainer.style.margin = '10px 0';
  barreContainer.style.height = '15px';
  barreContainer.style.overflow = 'hidden';

  barre = document.createElement('div');
  barre.id = 'progression-bar';
  barre.style.height = '100%';
  barre.style.width = '0%';
  barre.style.background = '#4e73df';
  barre.style.borderRadius = '6px';
  barre.style.transition = 'width 0.4s ease';

  barreContainer.appendChild(barre);
  phraseCible.parentNode.insertBefore(barreContainer, phraseCible.nextSibling);
}

let phraseActuelle = "";
let phraseTerminee = false;
let debutChrono = 0;

// Statistiques
let totalPhrases = 0;
let phrasesCorrectes = 0;
let totalTemps = 0;
const MAX_PHRASES = 1;

// Liste étendue à 50 phrases éducatives et bienveillantes
const phrasesSpeciales = [
  "Commence toujours par dire bonjour au professeur.",
  "Arriver avant la sonnerie, c’est déjà être prêt à apprendre.",
  "Ne rabaisse jamais ton camarade, encourage-le à progresser.",
  "Les bonnes habitudes te feront avancer loin.",
  "Si le professeur s’énerve, excuse-toi calmement et ça passera.",
  "Ranger son bureau, c’est ranger ses idées.",
  "Travailler en équipe, c’est apprendre à écouter les autres.",
  "Écouter avant de parler, c’est déjà respecter.",
  "Un élève poli facilite la vie de la classe.",
  "Faire de son mieux vaut mieux que ne rien faire.",
  "Le respect est la première des réussites.",
  "S’excuser, c’est grandir.",
  "Aider un camarade, c’est apprendre deux fois.",
  "Ne coupe pas la parole, attends ton tour.",
  "Un mot gentil peut changer la journée de quelqu’un.",
  "Être à l’heure, c’est une preuve de respect.",
  "Le calme aide à mieux comprendre.",
  "Rester concentré, c’est progresser.",
  "Savoir écouter, c’est déjà apprendre.",
  "Les efforts d’aujourd’hui font les réussites de demain.",
  "Ne te moque pas, chacun apprend à son rythme.",
  "Sois fier de ton travail, même imparfait.",
  "La politesse ouvre toutes les portes.",
  "Dire merci et s’il te plaît, ce sont des mots magiques.",
  "Être attentif, c’est montrer du respect au professeur.",
  "Les erreurs sont des marches vers la réussite.",
  "Apprendre à corriger ses fautes, c’est avancer.",
  "Encourage plutôt que de critiquer.",
  "Prends soin du matériel commun, il sert à tous.",
  "Un sourire rend le collège plus agréable.",
  "Reste calme même quand c’est difficile.",
  "Ne triche pas, sois fier de ton travail personnel.",
  "Respecte le silence pendant les explications.",
  "Sois curieux, pose des questions pour comprendre.",
  "Les petits efforts répétés font de grandes réussites.",
  "Aide ton camarade à se relever, pas à tomber.",
  "Une classe respectueuse apprend mieux.",
  "Prends le temps de bien faire les choses.",
  "Être poli, c’est être fort.",
  "Ne cherche pas à avoir raison, cherche à comprendre.",
  "Réfléchis avant d’agir.",
  "Les règles sont là pour protéger, pas pour punir.",
  "Sois bienveillant, même quand tu es fatigué.",
  "Soutiens les autres au lieu de te moquer.",
  "Dire la vérité, c’est être digne de confiance.",
  "Organise ton travail pour être plus serein.",
  "Fais ton maximum, le reste viendra avec le temps.",
  "Sois patient avec les autres et avec toi-même.",
  "Apprendre, c’est aussi se tromper.",
  "Le respect rend le collège agréable pour tous."
];

let phrasesDisponibles = [...phrasesSpeciales];

// --- Animation fluide ---
function fadeIn(element) {
  element.style.opacity = 0;
  element.style.transition = "opacity 0.5s ease";
  requestAnimationFrame(() => {
    element.style.opacity = 1;
  });
}

// --- Génération d’une phrase aléatoire unique ---
function genererPhrase() {
  if (phrasesDisponibles.length === 0) {
    finDeSession();
    return "👏 Bravo ! Tu as terminé toutes les phrases.";
  }

  const index = Math.floor(Math.random() * phrasesDisponibles.length);
  const phrase = phrasesDisponibles[index];
  phrasesDisponibles.splice(index, 1);
  return phrase;
}

// --- Mise à jour de la barre de progression ---
function majProgression() {
  const pourcentage = (totalPhrases / MAX_PHRASES) * 100;
  barre.style.width = `${pourcentage}%`;
}

// --- Chargement d’une nouvelle phrase ---
function chargerPhrase() {
  if (totalPhrases >= MAX_PHRASES) {
    finDeSession();
    return;
  }

  phraseActuelle = genererPhrase();
  phraseCible.textContent = phraseActuelle;
  fadeIn(phraseCible);

  zoneSaisie.value = "";
  zoneSaisie.disabled = false;
  zoneSaisie.focus();

  feedback.textContent = "";
  feedback.className = "";
  resultat.textContent = "";

  phraseTerminee = false;
  boutonDemarrer.disabled = true;
  boutonDemarrer.textContent = "Phrase suivante";
  debutChrono = Date.now();
}

// --- Fin de session ---
function finDeSession() {
  const tempsMoyen = totalPhrases === 0 ? 0 : (totalTemps / totalPhrases).toFixed(2);

  phraseCible.textContent = "🎉 Évaluation terminée !";
  feedback.textContent = "";
  zoneSaisie.disabled = true;
  boutonDemarrer.disabled = false;
  boutonDemarrer.textContent = "Retour au menu";
  boutonDemarrer.onclick = () => (window.location.href = "index.html");

  boutonRecommencer.style.display = "inline-block";

  resultat.innerHTML = `
    <h3>👏 Bravo pour ton travail !</h3>
    <p>Phrases tapées : <strong>${totalPhrases}</strong> / ${MAX_PHRASES}</p>
    <p>⚡ Vitesse moyenne : <strong>${tempsMoyen}s par phrase</strong></p>
  `;
}

// --- Recommencer la session ---
function recommencerSession() {
  phrasesDisponibles = [...phrasesSpeciales];
  totalPhrases = 0;
  phrasesCorrectes = 0;
  totalTemps = 0;
  phraseActuelle = "";

  majProgression();

  boutonDemarrer.disabled = false;
  boutonDemarrer.textContent = "Commencer l'évaluation";
  boutonDemarrer.onclick = chargerPhrase;

  phraseCible.textContent = "Appuyez sur le bouton pour recommencer la session.";
  feedback.textContent = "";
  resultat.textContent = "";
  zoneSaisie.value = "";
  boutonRecommencer.style.display = "none";
}

// --- Gestion de la saisie ---
zoneSaisie.addEventListener('input', () => {
  const saisie = zoneSaisie.value;

  if (saisie === phraseActuelle) {
    const temps = (Date.now() - debutChrono) / 1000;
    feedback.textContent = "✅ Parfait !";
    feedback.className = "correct";

    phraseTerminee = true;
    zoneSaisie.disabled = true;
    boutonDemarrer.disabled = false;
    boutonDemarrer.textContent = "Phrase suivante";
    boutonDemarrer.onclick = chargerPhrase;

    totalPhrases++;
    phrasesCorrectes++;
    totalTemps += temps;
    majProgression();

    resultat.innerHTML = `
      <p>⏱ Temps : <strong>${temps.toFixed(2)}s</strong></p>
      <p>📜 Phrases restantes : ${MAX_PHRASES - totalPhrases}</p>
    `;

    if (totalPhrases >= MAX_PHRASES) {
      setTimeout(finDeSession, 800);
    }

  } else if (phraseActuelle.startsWith(saisie)) {
    feedback.textContent = "Continue...";
    feedback.className = "";
  } else {
    feedback.textContent = "Erreur détectée ❌";
    feedback.className = "incorrect";
  }
});

// --- Événements principaux ---
boutonDemarrer.addEventListener('click', chargerPhrase);
boutonRecommencer.addEventListener('click', recommencerSession);
