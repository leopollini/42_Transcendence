import { navigate, current_user, nullify_user} from "../../../main.js";
import { free_users } from "../../../security/security.js";
import { showInfoModal } from "../../../modal.js";

export function handle_modes_logic(classicButton, aiButton, tournamentButton, 
        forza4Button, avatarImage, menuContainer, Settings, profileIcon,
        history, logout)
{
    classicButton?.addEventListener('click', () => {
        navigate("/classic/lobby", "Classic Pong Lobby Room");
    });
    
    aiButton?.addEventListener('click', () => {
        sessionStorage.setItem("start", "true");
        navigate("/VS_AI", "Modalità AI");
    });

    tournamentButton?.addEventListener('click', () => {
        /*if (current_user.type === "guest")
        {
            showInfoModal("You must be logged to use this feature!", () => {});
            return;
        }
        else*/
            navigate("/tournament", "Modalità Torneo");
    });

    forza4Button?.addEventListener('click', () => {
        navigate("/forza4/findopponent", "Forza 4 Find Opponent");
    })
    avatarImage.addEventListener("click", (event) => {
        menuContainer.classList.toggle("visible");
    });

    Settings?.addEventListener('click', () => {
        navigate("/settings", "Settings");
    });
    
    // Chiusura del menu quando si clicca fuori dall'avatar o dal menu
    document.addEventListener("click", (event) => {
        // Verifica se il clic non è stato effettuato dentro l'avatar o il menu
        if (!avatarImage.contains(event.target) && !menuContainer.contains(event.target)) {
            // Se il clic è avvenuto fuori, nasconde il menu
            menuContainer.classList.remove("visible");
        }
    });
    if (profileIcon)
    {
        profileIcon.addEventListener("click", () => {
            navigate("/profile", "Profile");
        });
    }
    else
        console.error("profile icon not found!");
    if (history)
    {
        history.addEventListener("click", () => {
        if (current_user.type == "guest")
            {
                showInfoModal("You must be logged to use this feature!", () => {});
                return;
            }
            else
                navigate("/userstats", "Game User Statistics");
        });
    }
    else 
        console.error("history icon not found!");
    if (logout)
    {
        logout.addEventListener("click", () => {
            localStorage.setItem("popup opened", false);
            if (!current_user)
            {
                navigate("/", "logout");
                return;
            }
            free_users();
            nullify_user();
            sessionStorage.setItem("already in", 0);
            localStorage.setItem("session opened", 0);
            navigate("/", "login");
        });
    }
    else 
        console.error("logout icon not found!");
}