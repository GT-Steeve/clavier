const phraseCible = document.getElementById('phrase-cible');
const zoneSaisie = document.getElementById('zone-saisie');
const feedback = document.getElementById('feedback');
const boutonDemarrer = document.getElementById('demarrer');

let phrases = [];
let phraseActuelle = "";

// Charger les phrases depuis le fichier texte
fetch('phrases.txt')
  .then(response => {
    if (!response.ok) {
      throw new Error("Impossible de charger le fichier de phrases.");
    }
    return response.text();
  })
  .then(data => {
    // Découper le fichier par lignes et supprimer les lignes vides
    phrases = data.split('\n').map(p => p.trim()).filter(p => p.length > 0);
  })
  .catch(error => {
    phraseCible.textContent = "Erreur de chargement des phrases.";
    console.error(error);
  });

boutonDemarrer.addEventListener('click', () => {
  if (phrases.length === 0) {
    phraseCible.textContent = "Aucune phrase disponible.";
    return;
  }

  phraseActuelle = phrases[Math.floor(Math.random() * phrases.length)];
  phraseCible.textContent = phraseActuelle;
  zoneSaisie.value = "";
  zoneSaisie.disabled = false;
  zoneSaisie.focus();
  feedback.textContent = "";
  feedback.className = "";
});

zoneSaisie.addEventListener('input', () => {
  const saisie = zoneSaisie.value;

  if (saisie === phraseActuelle) {
    feedback.textContent = "Parfait ! 👍";
    feedback.className = "correct";
  } else if (phraseActuelle.startsWith(saisie)) {
    feedback.textContent = "Continue...";
    feedback.className = "";
  } else {
    feedback.textContent = "Erreur détectée ❌";
    feedback.className = "incorrect";
  }
});
