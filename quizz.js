const phrases = [
  "Bonjour, comment ça va ?",
  "L'élève a bien réussi l'examen !",
  "C'est l'été : il fait chaud & ensoleillé",
  "Appuyez sur le bouton ROUGE",
  "Étudiez bien l'HTML, le CSS & le JavaScript",
  "Il a dit : « Je viendrai demain »"
];

const phraseCible = document.getElementById('phrase-cible');
const zoneSaisie = document.getElementById('zone-saisie');
const feedback = document.getElementById('feedback');
const boutonDemarrer = document.getElementById('demarrer');

let phraseActuelle = "";

boutonDemarrer.addEventListener('click', () => {
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
