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

  const messageLines = message.split("\n");

  infoMessage.textContent = '';
  messageLines.forEach((line, index) => {
    infoMessage.appendChild(document.createTextNode(line));
    if (index < messageLines.length - 1)
      infoMessage.appendChild(document.createElement("br"));
  });
  infoModal.classList.add("active");

  // Rimuovo eventuali listener precedenti
  infoOk.onclick = null;

  infoOk.onclick = () => {
    infoModal.classList.remove("active");
    if (typeof onOk === "function") onOk();
  };
}

export function showInputModal(title, onConfirm) {
  const inputModal       = document.getElementById("inputModal");
  const inputModalTitle  = document.getElementById("inputModalTitle");
  const nicknameInput    = document.getElementById("nicknameInput");
  const inputConfirm     = document.getElementById("inputConfirm");
  const inputModalClose  = document.getElementById("inputModalClose");

  inputModalTitle.textContent = title || "Inserisci il tuo nickname";
  nicknameInput.value = "";

  inputModal.classList.add("active");

  inputConfirm.onclick      = null;
  inputModalClose.onclick   = null;
  inputModal.onclick        = null;

  inputConfirm.onclick = () => {
    const nickname = nicknameInput.value.trim();
    if (!nickname) {
      nicknameInput.focus();
      return;
    }
    inputModal.classList.remove("active");
    if (typeof onConfirm === "function") onConfirm(nickname);
  };

  inputModalClose.onclick = () => {
    inputModal.classList.remove("active");
  };

  inputModal.onclick = (e) => {
    if (e.target === inputModal) {
      inputModal.classList.remove("active");
    }
  };
}