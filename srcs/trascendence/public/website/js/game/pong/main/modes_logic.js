import { navigate, current_user } from "../../../main.js";
import { showInfoModal } from "../../../modal.js";
import { remove_all } from "../../../utils_main/error_main.js";

export function handle_modes_logic(classicButton, aiButton, tournamentButton,
    forza4Button, avatarImage, menuContainer, Settings, profileIcon,
    history, logout) {
    classicButton?.addEventListener('click', () => {
        navigate("/classic/lobby", "Classic Pong Lobby Room");
    });

    aiButton?.addEventListener('click', () => {
        navigate("/VS_AI", "Modalità AI");
    });

    // !test per torneo da togliere poi
    tournamentButton?.addEventListener('click', () => {
        if (current_user.type === "guest") {
            showInfoModal("You must be logged to use this feature!", () => { });
            return;
        }
        else {
            current_user.type = "guest";
            navigate("/tournament", "Modalità Torneo");
        }
    });

    forza4Button?.addEventListener('click', () => {
        navigate("/forza4/findopponent", "Forza 4 Find Opponent");
    })
    avatarImage?.addEventListener("click", () => {
        menuContainer.classList.toggle("visible");
    });

    Settings?.addEventListener('click', () => {
        navigate("/settings", "Settings");
    });

    // Chiusura del menu quando si clicca fuori dall'avatar o dal menu
    document?.addEventListener("click", (event) => {
        // Verifica se il clic non è stato effettuato dentro l'avatar o il menu
        if (avatarImage && menuContainer)
        {
            if (!avatarImage.contains(event.target) && !menuContainer.contains(event.target)) {
            // Se il clic è avvenuto fuori, nasconde il menu
            menuContainer.classList.remove("visible");
            }
        }
    });
    profileIcon?.addEventListener("click", () => {
        navigate("/profile", "Profile");
    });
    history?.addEventListener("click", () => {
        if (current_user.type == "guest") {
            showInfoModal("You must be logged to use this feature!", () => { });
            return;
        }
        else
            navigate("/userstats", "Game User Statistics");
    });
    logout?.addEventListener("click", async() => {
        await remove_all(0, 0, 1);
        if (!current_user) {
            showInfoModal("You logged out successfully", () => { });
            navigate("/", "logout");
            return;
        }
        navigate("/", "logout");
    });
}