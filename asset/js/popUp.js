const modal = document.getElementById("popupEntrainement");
const btn = document.getElementById("btn-entrainement");
const close = document.getElementById("closeModal");

btn.onclick = function() {
    modal.style.display = "flex";
}

close.onclick = function() {
    modal.style.display = "none";
}

// Fermer le pop-up en cliquant à l'extérieur du contenu
window.onclick = function(event) {
    if (event.target === modal) {
    modal.style.display = "none";
    }
}