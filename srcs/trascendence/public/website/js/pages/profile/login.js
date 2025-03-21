import { guest_login } from "../../login/guest_logic.js";
import { performLogin, popupOpened } from "../../login/login_logic.js";
import { eraseCookie, readCookie, saveCookie } from "../../login/user.js";
import { navigate, unauthorized_acess } from "../../main.js";
import { nullify_user } from "../modes.js";
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

function AllTabClosed()
{
    nullify_user();
    sessionStorage.clear();
    localStorage.clear();
    deleteAllCookies();
}


window.addEventListener('beforeunload', () => {
    if (sessionStorage.getItem("opened") === '1')
    {
        let openTabs = parseInt(localStorage.getItem('openTabs')) || 1;
        openTabs--;
        localStorage.setItem('openTabs', openTabs);
        if (openTabs === 0)
            AllTabClosed();
        else if (sessionStorage.getItem("already in") === '1')
        {
            sessionStorage.setItem("already in", '0');
            localStorage.setItem("session opened", '1');
        }
    }
});

window.addEventListener('load', () => {
    if (sessionStorage.getItem("opened") === null)
    {
        let openTabs = parseInt(localStorage.getItem('openTabs')) || 0;
        openTabs++;
        localStorage.setItem('openTabs', openTabs);
        sessionStorage.setItem("opened", '1');
    }   
    if (sessionStorage.getItem("already in") === null)
        sessionStorage.setItem("already in", '0');
});

/*window.addEventListener('storage', (event) => {
    if (event.key === 'session closed' && event.newValue === 'true')
    {
        sessionStorage.setItem("already in", '0');
        localStorage.setItem("session opened", '1');
        localStorage.removeItem('session closed');
    }
});*/

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
        if (popupOpened === true)
            alert("popup already open finish authentication before continuing")
        else if (sessionStorage.getItem("already in") === '0'
        && localStorage.getItem("session opened") === '1')
            alert("You've already logged in!");
        else
            performLogin();
    });
    guestButton.addEventListener("click", () => {
        if (popupOpened === true)
            alert("Authenticating in progress....\nPlease wait.");
        else if (sessionStorage.getItem("already in") === '0'
        && localStorage.getItem("session opened") === '1')
            alert("You've already logged in!");
        else
            guest_login();
    });
}