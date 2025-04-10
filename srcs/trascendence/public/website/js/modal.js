// Modal di conferma: con due bottoni (Accept e Reject)
export function showConfirmModal(message, onConfirm, onReject) {
    const confirmModal = document.getElementById("confirmModal");
    const confirmMessage = document.getElementById("confirmMessage");
    const confirmAccept = document.getElementById("confirmAccept");
    const confirmReject = document.getElementById("confirmReject");
  
    confirmMessage.textContent = message;
    confirmModal.classList.add("active");
  
    // Rimuovo eventuali listener precedenti
    confirmAccept.onclick = null;
    confirmReject.onclick = null;
  
    confirmAccept.onclick = () => {
      confirmModal.classList.remove("active");
      if (typeof onConfirm === "function") onConfirm();
    };
  
    confirmReject.onclick = () => {
      confirmModal.classList.remove("active");
      if (typeof onReject === "function") onReject();
    };
  }
  
  // Modal informativo: con un solo bottone OK
export function showInfoModal(message, onOk) {
    const infoModal = document.getElementById("infoModal");
    const infoMessage = document.getElementById("infoMessage");
    const infoOk = document.getElementById("infoOk");
  
    infoMessage.textContent = message;
    infoModal.classList.add("active");
  
    // Rimuovo eventuali listener precedenti
    infoOk.onclick = null;
  
    infoOk.onclick = () => {
      infoModal.classList.remove("active");
      if (typeof onOk === "function") onOk();
    };
}
  
  // Modal di input per il nickname
export function showInputModal(title, onConfirm) {
    const inputModal = document.getElementById("inputModal");
    const inputModalTitle = document.getElementById("inputModalTitle");
    const nicknameInput = document.getElementById("nicknameInput");
    const inputConfirm = document.getElementById("inputConfirm");
  
    inputModalTitle.textContent = title || "Inserisci il tuo nickname";
    nicknameInput.value = "";
    inputModal.classList.add("active");
  
    inputConfirm.onclick = () => {
      const nickname = nicknameInput.value.trim();
      if (!nickname) {
        nicknameInput.focus();
        return;
      }
      inputModal.classList.remove("active");
      if (typeof onConfirm === "function") {
        onConfirm(nickname);
      }
    };
}