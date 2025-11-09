const phraseCible = document.getElementById('phrase-cible');
const zoneSaisie = document.getElementById('zone-saisie');
const feedback = document.getElementById('feedback');
const boutonDemarrer = document.getElementById('demarrer');
const resultat = document.getElementById('resultat');

let phraseActuelle = "";
let phraseTerminee = false;
let debutChrono = 0;

// Listes de mots pour créer des phrases aléatoires
const sujets = ["Le chat", "Une licorne", "Mon voisin", "La prof", "Un pirate", "Ce robot"];
const verbes = ["mange", "regarde", "attrape", "dessine", "construit", "détruit"];
const objets = ["une pomme", "un clavier", "le soleil", "une maison", "un ordinateur", "un arc-en-ciel"];
const compléments = ["avec joie", "sans raison", "tous les jours", "en secret", "à minuit", "pendant la pluie"];

// Fonction pour générer une phrase aléatoire
function genererPhrase() {
  const sujet = sujets[Math.floor(Math.random() * sujets.length)];
  const verbe = verbes[Math.floor(Math.random() * verbes.length)];
  const objet = objets[Math.floor(Math.random() * objets.length)];
  const complement = compléments[Math.floor(Math.random() * compléments.length)];
  return `${sujet} ${verbe} ${objet} ${complement}.`;
}

// Fonction pour charger une nouvelle phrase
function chargerPhrase() {
  phraseActuelle = genererPhrase();
  phraseCible.textContent = phraseActuelle;
  zoneSaisie.value = "";
  zoneSaisie.disabled = false;
  zoneSaisie.focus();
  feedback.textContent = "";
  feedback.className = "";
  phraseTerminee = false;
  boutonDemarrer.disabled = true;
  resultat.textContent = "";

  debutChrono = Date.now();
}

boutonDemarrer.addEventListener('click', () => {
  chargerPhrase();
});

zoneSaisie.addEventListener('input', () => {
  const saisie = zoneSaisie.value;

  if (saisie === phraseActuelle) {
    const temps = (Date.now() - debutChrono) / 1000;
    feedback.textContent = "✅ Parfait !";
    feedback.className = "correct";
    phraseTerminee = true;
    zoneSaisie.disabled = true;
    boutonDemarrer.disabled = false;
    boutonDemarrer.textContent = "Nouvelle phrase";

    resultat.innerHTML = `<p>⏱ Temps : <strong>${temps.toFixed(2)}s</strong></p>
                          <p>💬 Phrase : "${phraseActuelle}"</p>`;
  } else if (phraseActuelle.startsWith(saisie)) {
    feedback.textContent = "Continue...";
    feedback.className = "";
  } else {
    feedback.textContent = "Erreur détectée ❌";
    feedback.className = "incorrect";
  }
});
