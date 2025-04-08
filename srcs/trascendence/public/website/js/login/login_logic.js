import { navigate, popup, setpopup} from "../main.js";
import { update_image, change_name} from "../pages/modes.js";
import { showInfoModal } from "../modal.js";
import { remove_all } from "../error_main.js";
export function pop_false()
{
    localStorage.setItem('popup_opened', 'false');
}

function popupHandling(popup)
{
    localStorage.setItem("popup opened", true);
    let log_succ = false
    function receiveMessage(event)
    {
        if (event.data.access_granted === true)
            log_succ = true;
    }
    window.addEventListener("message", receiveMessage);
    let popupMonitor = setInterval(() => {
        if (popup.closed)
        {
            clearInterval(popupMonitor);
            localStorage.setItem("popup opened", false);
            window.removeEventListener("message", receiveMessage);
            if (log_succ === true)
            {
                get_data();
                remove_all(1, 1);
                navigate("/modes", "Modalità di gioco");
                showInfoModal("You are logged in successfully.\nTo change user, close this tab first!", () => {});
            }
            else if (log_succ === false)
                localStorage.removeItem("popup opened");
            else
            {
                remove_all(0, 0);
                showInfoModal("Error: Unexpected popup closure, authentication failed.", () => {});
            }
        }
    }, 10);
}

function get_data()
{
    let data = JSON.stringify({"params" :{'token' : 'token'}});
    fetch("http://localhost:8008", {
        method: "get_user",
        body: data
    })
    .then(response => response.json())
    .then(data =>
    {
        //console.log("(GET_USER)\ndata login = ", data);
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
            update_user(new_user);   
        }
        else
        {
            showInfoModal("ERROR GET_USER: An error has occured(\"" + data.status + "\")", () => {});;
            remove_all(0, 0, 1);
            navigate("/", "login");
            return ;
        }
    })
    .catch(error =>
    {
        console.error("Error with get_user:", error);
    });
}

export function performLogin()
{
    fetch('/auth/login')
    .then(response => response.json())
    .then(data => {
        setpopup(window.open(data.auth_url, 'Login', 'width=800,height=800'));
        popupHandling(popup, data);
    })
}
