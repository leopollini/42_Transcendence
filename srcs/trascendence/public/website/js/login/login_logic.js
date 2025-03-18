
import { navigate } from "../main.js";
import { update_image, change_name, updateUserProfile, current_user} from "../pages/modes.js";
import { user, profile, readCookie, eraseCookie} from "./user.js";
import { saveCookie } from "./user.js";
export let popupOpened = false;

export function pop_false()
{
    popupOpened = false;
    localStorage.setItem('popup_opened', 'false');
}

function checkLoginRestrictions()
{
    if (localStorage.getItem('your_profile'))
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
    let messageReceived = false;
    window.addEventListener("message", (event) => {
        log_succ = event.data.access_granted;
        if (event.data.access_granted === true) 
        {
            log_succ = true;
            messageReceived = true;
        } 
    });
    let popupMonitor = setInterval(() => {
        if (popup.closed) 
        {
            clearInterval(popupMonitor);
            localStorage.setItem('popup_opened', 'false');
            popupOpened = false;
            if (messageReceived === true && log_succ === true) 
            {
                get_data();
                navigate("/modes", "Modalità di gioco");
                alert("You are logged in successfully.\nTo change user, close this tab first!");
            }
            else
                alert("Error: Unexpected popup closure, authentication failed.");
        }
    }, 500);
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
        console.log("data login = ", data);
        /*if (data.status === "no users found" || !data.user || data.user.length === 0)
            navigate("/", "login");*/
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
        if (readCookie("logged_token"))
        {
            eraseCookie("logged_token");
            saveCookie("user_token");
        }
        saveCookie("logged", 1, 1);
        updateUserProfile(current_user);
    })
    .catch(error => {
        console.error("Error fetching user data:", error);
    });
}

export function performLogin()
{
    if (!checkLoginRestrictions())
        return;
    fetch('/auth/login')
    .then(response => response.json())
    .then(data => {
        const popup = window.open(data.auth_url, 'Login', 'width=800,height=800');
        popupHandling(popup, data);
    })
}
