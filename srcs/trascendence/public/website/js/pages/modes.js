import {handle_modes_logic } from '../game/pong/main/modes_logic.js';
import { save_global } from '../main.js';

export default function Modes()
{
    return `
    <h1 class="text">
        <span class="letter letter-1">S</span>
        <span class="letter letter-2">E</span>
        <span class="letter letter-3">L</span>
        <span class="letter letter-4">E</span>
        <span class="letter letter-5">C</span>
        <span class="letter letter-6">T</span>
        <span class="letter letter-7"> </span>
        <span class="letter letter-8"> </span>
        <span class="letter letter-9">G</span>
        <span class="letter letter-10">A</span>
        <span class="letter letter-11">M</span>
        <span class="letter letter-12">E</span>
        <span class="letter letter-13"> </span>
        <span class="letter letter-14"> </span>
        <span class="letter letter-15">M</span>
        <span class="letter letter-16">O</span>
        <span class="letter letter-17">D</span>
        <span class="letter letter-18">E</span>
    </h1>
    <script src="../../login/guest_logic.js"></script>
    <div id="modeButtonsContainer">
        <div class="mode-button-container">
            <button class="button-style" id="classicButton"><span class="text-animation">CLASSIC</span></button>
        </div>
        <div class="mode-button-container">
            <button class="button-style" id="tournamentButton"><span class="text-animation">TOURNAMENT</span></button>
        </div>
        <div class="mode-button-container">
            <button class="button-style" id="aiButton"><span class="text-animation">VS_AI</span></button>
        </div>
        <div class="mode-button-container">
            <button class="button-style" id="forza4Button"><span class="text-animation">FORZA 4</span></button>
        </div>
    </div>
    <div class="avatar-container">
        <span id="avatarName">Default</span>
        <img alt="Avatar" class="avatar-image" id="avatarImage">
        <div class="menu-container hidden">
            <div class="menu-item"><img src="website/images/profile.png" alt="Profile" id="profileIcon"></div>
            <!-- <div class="menu-item"><img src="website/images/friends.jpg" alt="Settings" id="friends"></div> -->
            <div class="menu-item"><img src="website/images/history_match.png" alt="Settings" id="history"></div>
            <div class="menu-item" id="settings-link"><img src="website/images/settings.png" alt="Settings"></div>
            <div class="menu-item" id="logout"><img src="website/images/logout.png" alt="Settings"></div>
            </div>
    </div> 
    `;
}

export function updateProfileUI(profile)
{
    if (profile !== undefined && profile !== null)
    {
        if (profile.image)
            update_image(profile.image);
        if (profile.display_name)
            change_name(profile.display_name);
    }
}

export const addModesPageHandlers = () => {
    save_global("game", 0);
    const classicButton = document.getElementById('classicButton');
    const aiButton = document.getElementById('aiButton');
    const tournamentButton = document.getElementById('tournamentButton');
    const forza4Button = document.getElementById('forza4Button');
    const avatarImage = document.getElementById('avatarImage');
    const menuContainer = document.querySelector('.menu-container');
    const Settings = document.getElementById('settings-link');
    const profileIcon = document.getElementById("profileIcon");
    const history = document.getElementById("history");
    const logout = document.getElementById("logout");
    handle_modes_logic(classicButton, aiButton, tournamentButton, 
    forza4Button, avatarImage, menuContainer, Settings, profileIcon,
    history, logout);
};

export function update_image(image)
{
    const checkImageInterval = setInterval(() => {
        const avatarImage = document.getElementById('avatarImage');
        if (avatarImage)
        {
            avatarImage.src = image;
            clearInterval(checkImageInterval);
        }
    }, 100);
}

export async function change_name(name) {
    const checknameInterval = setInterval(() => {
        const avatarName = document.getElementById('avatarName');
        if (avatarName)
        {
            avatarName.textContent = name;
            clearInterval(checknameInterval);
        }
    }, 100);
}