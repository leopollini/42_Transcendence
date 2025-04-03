import { navigate } from "../main.js";
import { update_image, change_name, updateUserProfile} from "../pages/modes.js";
import { profile} from "./user.js";
import { saveCookie } from "./user.js";
import { showInfoModal } from "../modal.js";

export let popupOpened = false;

export function pop_false()
{
    popupOpened = false;
    localStorage.setItem('popup_opened', 'false');
}

function popupHandling(popup, data)
{
    localStorage.setItem("popup opened", true);
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
            localStorage.setItem("popup opened", false);
            window.removeEventListener("message", receiveMessage);
            console.log("log_succ = ", log_succ);
            if (log_succ === true)
            {
                get_data();
                localStorage.removeItem("popup opened");
                navigate("/modes", "Modalità di gioco");
                showInfoModal("You are logged in successfully.\nTo change user, close this tab first!", () => {});
            }
            else if (log_succ === false)
                localStorage.removeItem("popup opened");
            else
                showInfoModal("Error: Unexpected popup closure, authentication failed.", () => {});
        }
    }, 10);
}

function get_data()
{
    let data = JSON.stringify({"params" :{}});
    fetch("http://localhost:8008", {
        method: "get_user",
        body: data
    })
    .then(response => response.json())
    .then(data =>
    {
        console.log("(GET_USER)\ndata login = ", data);
        if (data.success === "true" && data.status === "success")
        {
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
            sessionStorage.setItem("type", "login");
            sessionStorage.setItem("already in", 1);
            localStorage.setItem("session opened", 1);
            update_user(new_user);   
        }
        else
        {
            alert("ERROR: An error has occured(\"" + data.status + "\")");
            sessionStorage.setItem("already in", 0);
            localStorage.setItem("session opened", 0);
            sessionStorage.removeItem("type");
            navigate("/", "login");
            return ;
        }
    })
    .catch(error => {
        console.error("Error fetching user data:", error);
    });
}

export function performLogin()
{
    fetch('/auth/login')
    .then(response => response.json())
    .then(data => {
        const popup = window.open(data.auth_url, 'Login', 'width=800,height=800');
        popupHandling(popup, data);
    })
}
