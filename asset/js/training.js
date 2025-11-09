const phraseCible = document.getElementById('phrase-cible');
const zoneSaisie = document.getElementById('zone-saisie');
const feedback = document.getElementById('feedback');
const boutonDemarrer = document.getElementById('demarrer');
const boutonRecommencer = document.getElementById('recommencer');
const progressBar = document.querySelector('.progress-bar');

let phrases = [];
let phrasesRestantes = [];
let phraseActuelle = "";
let phraseTerminee = false;
let compteur = 0;
const maxPhrases = 2;

// Charger les phrases
fetch('./asset/phrases.txt')
  .then(response => {
    if (!response.ok) throw new Error("Impossible de charger le fichier de phrases.");
    return response.text();
  })
  .then(data => {
    phrases = data.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    phrasesRestantes = [...phrases];
    boutonDemarrer.disabled = false;
  })
  .catch(error => {
    phraseCible.textContent = "Erreur de chargement des phrases.";
    console.error(error);
  });

// Fonction pour afficher la phrase suivante
function chargerPhrase() {
  if (compteur >= maxPhrases || phrasesRestantes.length === 0) {
    phraseCible.textContent = `Session terminée ! Vous avez vu ${compteur} phrase${compteur > 1 ? 's' : ''}.`;
    zoneSaisie.disabled = true;
    boutonDemarrer.textContent = "Retour au menu";
    boutonDemarrer.disabled = false;
    progressBar.style.width = '100%';
    return;
  }

  // Choisir une phrase aléatoire parmi les restantes
  const index = Math.floor(Math.random() * phrasesRestantes.length);
  phraseActuelle = phrasesRestantes.splice(index, 1)[0];

  phraseCible.textContent = phraseActuelle;
  zoneSaisie.value = "";
  zoneSaisie.disabled = false;
  zoneSaisie.focus();
  feedback.textContent = "";
  feedback.className = "";
  phraseTerminee = false;
  boutonDemarrer.textContent = "Commencer";
  boutonDemarrer.disabled = true;

  boutonRecommencer.style.display = "inline-block";
}

boutonDemarrer.addEventListener('click', () => {
  if (phraseTerminee) {
    chargerPhrase();
  } else if (boutonDemarrer.textContent === "Retour au menu") {
    window.location.href = "index.html";
  } else {
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
    boutonDemarrer.disabled = false;

    compteur++;
    const pourcentage = (compteur / maxPhrases) * 100;
    progressBar.style.width = `${pourcentage}%`;
  } else if (phraseActuelle.startsWith(saisie)) {
    feedback.textContent = "Continue...";
    feedback.className = "";
  } else {
    feedback.textContent = "Erreur détectée ❌";
    feedback.className = "incorrect";
  }
});

boutonRecommencer.addEventListener('click', () => {
  phrasesRestantes = [...phrases];
  compteur = 0;
  progressBar.style.width = '0%';
  chargerPhrase();
});
