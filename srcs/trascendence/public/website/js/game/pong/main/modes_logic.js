import { navigate } from "../../../main.js";
import { pop_false } from "../../../login/login_logic.js";
import { current_user, nullify_user} from "../../../pages/modes.js";
import { deleteAllCookies} from "../../../login/user.js";
export function handle_modes_logic(classicButton, aiButton, tournamentButton, 
        forza4Button, avatarImage, menuContainer, Settings, profileIcon,
        history, logout)
{
    classicButton?.addEventListener('click', () => {
        navigate("/classic/lobby", "Classic Pong Lobby Room");
    });
    
    aiButton?.addEventListener('click', () => {
        navigate("/V.S._AI", "Modalità AI");
    });

    tournamentButton?.addEventListener('click', () => {
        if (current_user.type === "guest")
        {
            alert("You must be logged to use this feature!");
            return;
        }
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
                alert("You must be logged to use this feature!");
                return;
            }
            navigate("/userstats", "Game User Statistics");
        });
    }
    else 
        console.error("history icon not found!");
    if (logout)
    {
        logout.addEventListener("click", () => {
            pop_false();
            if (!current_user)
            {
                navigate("/", "logout");
                return;
            }
            if (current_user.type === "guest")
            {
                fetch("http://localhost:8008",
                {
                    method: "drop_guest"
                })
                .then(data =>{
                    console.log("(DROP_GUEST)\ndata delete from all users = ", data);
                })
            }
            else
            {
                let data = JSON.stringify({"realname" : current_user.realname})
                fetch("http://localhost:8008",
                {
                    method: "drop_user",
                    body: data
                })
                .then(data =>{
                    console.log("(DROP_USER)\ndata update logged user = ", data);
                })
            }
            sessionStorage.clear();
            localStorage.clear();
            deleteAllCookies();
            nullify_user();
            localStorage.setItem('openTabs', 1);
            navigate("/", "login");
        });
    }
    else 
        console.error("logout icon not found!");
}