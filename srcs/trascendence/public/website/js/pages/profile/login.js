import { guest_login } from "../../login/guest_logic.js";
import { performLogin } from "../../login/login_logic.js";
import { showInfoModal } from "../../modal.js";

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

export const addLoginPageHandlers = () => {
    const loginButton = document.getElementById("loginButton");
    const guestButton = document.getElementById("guestButton");
    if (!loginButton || !guestButton)
        return;
    handle_access(loginButton, guestButton);
};

function handle_access(loginButton, guestButton)
{
    console.log("popup = ", localStorage.getItem('popup opened'));
    loginButton.addEventListener("click", () => {
        if (localStorage.getItem('popup opened') === 'true')
            showInfoModal("popup already open finish authentication before continuing", () => {});
        else if (sessionStorage.getItem('already in') === '0'
        && localStorage.getItem('session opened') === '1')
            showInfoModal("You've already logged in!", () => {});
        else
            performLogin();
    });
    guestButton.addEventListener("click", () => {
        if (localStorage.getItem('popup opened') === 'true')
            showInfoModal("Authenticating in progress....\nPlease wait.", () => {});
        else if (sessionStorage.getItem('already in') === '0'
        && localStorage.getItem('session opened') === '1')
            showInfoModal("You've already logged in!", () => {});
        else
            guest_login();
    });
}