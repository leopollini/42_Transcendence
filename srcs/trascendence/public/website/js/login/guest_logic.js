import { navigate, update_user } from "../main.js";
import { user, profile, eraseCookie, saveCookie} from "./user.js";
import { update_image, change_name} from "../pages/modes.js";
import { escapeHTML } from "../security/security.js";
import { showInputModal, showInfoModal } from "../modal.js"
export function guest_login() {
    showInputModal("Inserisci il tuo nickname", (name) => {
      if (!name) {
        showInfoModal("No name. Please try again.", guest_login);
        return;
      }
      
      name = escapeHTML(name);
      
      if (!name) {
        showInfoModal("Name cannot be just spaces.", guest_login);
        return;
      }
      
      if (name.length < 4) {
        showInfoModal("Name too short.", guest_login);
        return;
      }
      
      if (name.length >= 15) {
        showInfoModal("Name too long.", guest_login);
        return;
      }
      
      addGuest(name);
    });
}

function addGuest(name) {
    let curr_guest = new user("website/images/guest.jpg", name, null, null, null);
    update_guest(curr_guest);
}

function update_guest(curr_guest)
{
    change_name(curr_guest.name);
    update_image(curr_guest.image);
    let guest_user = new profile(
        "",
        curr_guest.name,
        "",
        curr_guest.bio,
        curr_guest.image,
        "guest"
    );
    sessionStorage.setItem("already in", 1);
    localStorage.setItem("session opened", 1);
    let data = JSON.stringify({data : {username : guest_user.display_name, image : guest_user.image, bio : ""}, login_as_guest : "true"});
    fetch("http://localhost:8008",
    {
        method: "login_user",
        body: data
    })
    .then(response => response.json())
    .then(data =>
    {
        //console.log("(LOGIN_USER)\ndatas = ", data);
        if (data.status === "success" && data.success === "true")
        {
            sessionStorage.setItem("type", "guest");
            sessionStorage.setItem("already in", 1);
            localStorage.setItem("session opened", 1);
            saveCookie("user_token", data.token, 1);
            update_user(guest_user);
            navigate("/modes", "Modalità di gioco");
        }
        else
        {
            sessionStorage.setItem("already in", 0);
            localStorage.setItem("session opened", 0);
            eraseCookie("user_token");
            guest_user = null;
            if (data.status === "no users found")
                alert("ERROR: Name already taken, try a different one");
            else
                alert("ERROR: An error has occured(\"" + data.status + "\")");
            return;
        }
    })
    .catch(error => console.error("Error with login_user:", error));
}