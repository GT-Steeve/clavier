const phraseCible = document.getElementById('phrase-cible');
const zoneSaisie = document.getElementById('zone-saisie');
const feedback = document.getElementById('feedback');
const boutonDemarrer = document.getElementById('demarrer');

let phrases = [];
let phraseActuelle = "";
let phraseTerminee = false;

// Charger les phrases depuis le fichier texte
fetch('phrases.txt')
  .then(response => {
    if (!response.ok) {
      throw new Error("Impossible de charger le fichier de phrases.");
    }
    return response.text();
  })
  .then(data => {
    phrases = data.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    boutonDemarrer.disabled = false; // bouton actif quand phrases chargées
  })
  .catch(error => {
    phraseCible.textContent = "Erreur de chargement des phrases.";
    console.error(error);
  });

// Fonction pour choisir et afficher une nouvelle phrase aléatoire
function chargerPhrase() {
  if (phrases.length === 0) {
    phraseCible.textContent = "Aucune phrase disponible.";
    zoneSaisie.disabled = true;
    boutonDemarrer.disabled = true;
    return;
  }
  phraseActuelle = phrases[Math.floor(Math.random() * phrases.length)];
  phraseCible.textContent = phraseActuelle;
  zoneSaisie.value = "";
  zoneSaisie.disabled = false;
  zoneSaisie.focus();
  feedback.textContent = "";
  feedback.className = "";
  phraseTerminee = false;
  boutonDemarrer.textContent = "Commencer";
  boutonDemarrer.disabled = true; // Désactive bouton pendant la saisie
}

boutonDemarrer.addEventListener('click', () => {
  if (phraseTerminee) {
    chargerPhrase();
  } else {
    // Si on clique sur "Commencer" au départ, on charge la 1ère phrase
    chargerPhrase();
  }
});

zoneSaisie.addEventListener('input', () => {
  const saisie = zoneSaisie.value;

  if (saisie === phraseActuelle) {
    feedback.textContent = "Parfait !";
    feedback.className = "correct";
    phraseTerminee = true;
    zoneSaisie.disabled = true;
    boutonDemarrer.textContent = "Phrase suivante";
    boutonDemarrer.disabled = false; // Active le bouton pour passer à la suivante
  } else if (phraseActuelle.startsWith(saisie)) {
    feedback.textContent = "Continue...";
    feedback.className = "";
  } else {
    feedback.textContent = "Erreur détectée ❌";
    feedback.className = "incorrect";
  }
});
