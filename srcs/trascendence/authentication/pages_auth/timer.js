let countdown = 3;
const timerElement = document.getElementById('timer');

function closePopup()
{
    if (window.opener)
        window.opener.postMessage({ access_granted: true }, "*");

    setTimeout(() =>
    {
        window.close();
    }, 100);
}

const timerInterval = setInterval(function()
{
    countdown--;
    timerElement.textContent = countdown;
    
    if (countdown === 0)
    {
        clearInterval(timerInterval);
        closePopup();
    }
}, 1000);

window.addEventListener("beforeunload", () => {
  closePopup();  
});