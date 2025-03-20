import { guest_login } from "../../login/guest_logic.js";
import { performLogin, popupOpened } from "../../login/login_logic.js";
import { readCookie, saveCookie } from "../../login/user.js";

export default function Login() {
    return `
        <h1 class="text">
            <span class="letter letter-1">F</span>
            <span class="letter letter-2">T</span>
            <span class="letter letter-3">_</span>
            <span class="letter letter-4">T</span>
            <span class="letter letter-5">R</span>
            <span class="letter letter-6">A</span>
            <span class="letter letter-7">N</span>
            <span class="letter letter-8">S</span>
            <span class="letter letter-9">C</span>
            <span class="letter letter-10">E</span>
            <span class="letter letter-11">N</span>
            <span class="letter letter-12">D</span>
            <span class="letter letter-13">E</span>
            <span class="letter letter-14">N</span>
            <span class="letter letter-15">C</span>
            <span class="letter letter-16">E</span>
        </h1>
        <div id="authButtonsContainer">
            <button class="button-style" id="loginButton"><span class="text-animation">LOGIN</span></button>
            <button class="button-style" id="guestButton"><span class="text-animation">OSPITE</span></button>
        </div>
    `;
}

window.addEventListener('beforeunload', () => {
    let openTabs = parseInt(localStorage.getItem('openTabs')) || 1;
    console.log("if(tabs > 1)= ", openTabs);
    if (openTabs > 1)
        localStorage.setItem('openTabs', openTabs - 1);
    else
    {
        localStorage.removeItem('openTabs');
        checkIfNoTabHasCookie();
    }
    if (sessionStorage.getItem("already in") === '1')
        localStorage.setItem('session closed', 'true');
});

function checkIfNoTabHasCookie()
{
    if (!localStorage.getItem('openTabs'))
    {
        alert("deleting all data");
        console.log("deleting all");
        sessionStorage.clear();
        localStorage.clear();
        deleteAllCookies();
    }
}

window.addEventListener('load', () => {
    if (sessionStorage.getItem("already in") === null)
        sessionStorage.setItem("already in", '0');
    let openTabs = parseInt(localStorage.getItem('openTabs')) || 0;
    openTabs++;
    localStorage.setItem('openTabs', openTabs);
});

window.addEventListener('storage', (event) => {
    if (event.key === 'session closed' && event.newValue === 'true')
    {
        console.log("already in = ", sessionStorage.getItem("already in"));
        if (sessionStorage.getItem("already in") === '0')
        {
            sessionStorage.setItem("already in", '0');
            localStorage.setItem("session opened", '0');
        }
        localStorage.removeItem('session closed');
    }
    if (event.key === 'already in' && event.newValue === '1')
    {
        console.log("already in aggiornato ora");
    }
    if (event.key === 'openTabs' && event.newValue === '0')
        checkIfNoTabHasCookie();
});

export const addLoginPageHandlers = () => {
    const loginButton = document.getElementById("loginButton");
    const guestButton = document.getElementById("guestButton");
    if (!loginButton || !guestButton)
        return;
    handle_access(loginButton, guestButton);
};

function handle_access(loginButton, guestButton)
{
    loginButton.addEventListener("click", () => {
        console.log("already in = ", sessionStorage.getItem("already in"));
        console.log("session opened = ", localStorage.getItem("session opened"));
        if (popupOpened === true)
            alert("popup already open finish authentication before continuing")
        else if (sessionStorage.getItem("already in") === '0'
        && localStorage.getItem("session opened") === '1')
            alert("You've already logged in!");
        else
            performLogin();
    });
    guestButton.addEventListener("click", () => {
        console.log("already in = ", sessionStorage.getItem("already in"));
        console.log("session opened = ", localStorage.getItem("session opened"));
        if (popupOpened === true)
            alert("Authenticating in progress....\nPlease wait.");
        else if (sessionStorage.getItem("already in") === '0'
        && localStorage.getItem("session opened") === '1')
            alert("You've already logged in!");
        else
            guest_login();
    });
}