
import { navigate } from "../main.js";
import { update_image, change_name, updateUserProfile} from "../pages/modes.js";
import { profile, readCookie, deleteAllCookies} from "./user.js";
import { saveCookie } from "./user.js";
export let popupOpened = false;

export function pop_false()
{
    popupOpened = false;
    localStorage.setItem('popup_opened', 'false');
}

function checkLoginRestrictions()
{
    if (readCookie("logged") === 1)
    {
        alert("user already logged in");
        return false;
    }
    return true;
}

function popupHandling(popup, data)
{
    popupOpened = true;
    localStorage.setItem('popup_opened', 'true');

    let log_succ = false
    function receiveMessage(event) {
        if (event.data.access_granted === true) {
            log_succ = true;
        }
    }
    window.addEventListener("message", receiveMessage);
    let popupMonitor = setInterval(() => {
        if (popup.closed) {
            clearInterval(popupMonitor);
            localStorage.setItem('popup_opened', 'false');
            popupOpened = false;
            window.removeEventListener("message", receiveMessage); // Rimuovi l'evento dopo la chiusura

            console.log("log_succ = ", log_succ);
            if (log_succ === true)
            {
                get_data();
                navigate("/modes", "Modalità di gioco");
                alert("You are logged in successfully.\nTo change user, close this tab first!");
            }
            else
                alert("Error: Unexpected popup closure, authentication failed.");
        }
    }, 10);
}

function get_data()
{
    let data = JSON.stringify({"params" :{"type" : "login"}});
    fetch("http://localhost:8008", {
        method: "get_user",
        body: data
    })
    .then(response => response.json())
    .then(data =>
    {
        console.log("(GET_USER)\ndata login = ", data);
        if (data.status === "no users found")
        {;
            deleteAllCookies();
            navigate("/", "login");
            return ;
        }
        let user = data.user[0];
        let new_user = {
            email: user.email,
            login_name: user.display_name,
            realname: user.realname,
            image: user.image,
            bio: user.bio,
            type: "login"
        };
    
        change_name(new_user.login_name);
        update_image(new_user.image);
    
        let current_user = new profile(
            new_user.email,
            new_user.login_name,
            new_user.realname,
            new_user.bio,
            new_user.image,
            new_user.type
        );
        console.log("adding user hahahah");
        saveCookie("user_token");
        saveCookie("logged", 1, 1);
        sessionStorage.setItem("already in", '1');
        localStorage.setItem("session opened", '1');
        updateUserProfile(current_user);
    })
    .catch(error => {
        console.error("Error fetching user data:", error);
    });
}

export function performLogin()
{
    if (!checkLoginRestrictions())
        return ;
    fetch('/auth/login')
    .then(response => response.json())
    .then(data => {
        const popup = window.open(data.auth_url, 'Login', 'width=800,height=800');
        popupHandling(popup, data);
    })
}
