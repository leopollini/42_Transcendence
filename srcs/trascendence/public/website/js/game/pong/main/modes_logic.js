import { navigate } from "../../../main.js";
import { pop_false } from "../../../login/login_logic.js";
import { current_user } from "../../../pages/modes.js";
import { eraseCookie } from "../../../login/user.js";
export function handle_modes_logic(classicButton, aiButton, tournamentButton, 
        forza4Button, avatarImage, menuContainer, Settings, profileIcon,
        statIcon, friends, history, logout)
{
    classicButton?.addEventListener('click', () => {
        navigate("/classic", "Modalità Classic");
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
        navigate("/forza4", "Modalità Forza 4");
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
    if (statIcon)
    {
        statIcon.addEventListener("click", () => {
            navigate("/stats", "Stats");
        });
    }
    else
        console.error("stat icon not found!");
    if (friends)
    {
        friends.addEventListener("click", () => {
            if (current_user.type == "guest")
            {
                alert("You must be logged to use this feature!");
                return;
            }
            navigate("/friends", "Friends");
        });
    }
    else
        console.error("friend icon not found!");
    if (history)
    {
        history.addEventListener("click", () => {
        if (current_user.type == "guest")
            {
                alert("You must be logged to use this feature!");
                return;
            }
            navigate("/tournament/userstats", "Userstats");
        });
    }
    else 
        console.error("history icon not found!");
    if (logout)
    {
        logout.addEventListener("click", () => {
            localStorage.clear();
            sessionStorage.clear();
            pop_false();
            if (current_user.type === "guest")
            {
                fetch("http://localhost:8008",
                {
                    method: "drop_users"
                })
                .then(data =>{
                    console.log("data delete guest = ", data);
                })
                eraseCookie("current_guest");
            }
            else
            {
                let data = JSON.stringify({"realname" : current_user.realname, "entered" : "0"})
                fetch("http://localhost:8008",
                {
                    method: "update_user",
                    body: data
                })
                .then(data =>{
                    console.log("data update logged user = ", data);
                })
            }
            navigate("/", "login");
        });
    }
    else 
        console.error("logout icon not found!");
}

export function access_denied()
{
    navigate("/access_denied", "Access Denied");
    setTimeout(() => {
        navigate("/", "home");
    }, 3000);
}
