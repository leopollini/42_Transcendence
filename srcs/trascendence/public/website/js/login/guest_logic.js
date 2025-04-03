import { navigate } from "../main.js";
import { user, profile, eraseCookie} from "./user.js";
import { update_image, change_name, updateUserProfile, nullify_user } from "../pages/modes.js";
import { saveCookie, escapeHTML} from "./user.js";
import { showInputModal, showInfoModal } from "../modal.js"

export function guest_login() {
    showInputModal("Inserisci il tuo nickname", (name) => {
      if (!name.trim()) {
        showInfoModal("No name. Please try again.", guest_login);
        return;
      }
      
      name = escapeHTML(name);
      
      if (!name.trim()) {
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
    let current_user = new profile(
        "",
        curr_guest.name,
        "",
        curr_guest.bio,
        curr_guest.image,
        "guest"
    );
    sessionStorage.setItem("already in", 1);
    localStorage.setItem("session opened", 1);
    let data = JSON.stringify({data : {username : current_user.display_name}, login_as_guest : "true"});
    fetch("http://localhost:8008",
    {
        method: "login_user",
        body: data
    })
    .then(response => response.json())
    .then(data =>
    {
        console.log("(LOGIN_USER)\ndatas = ", data);
        if (data.status === "username already in use")
        {
            sessionStorage.setItem("already in", 0);
            localStorage.setItem("session opened", 0);
            eraseCookie("user_token");
            nullify_user();
            showInfoModal("Name already taken, try a different one", () => {});
            return;
        }
        if (!data.token)
            saveCookie("user_token", "nulla", 1);
        else
            saveCookie("user_token", data.token, 1);
        updateUserProfile(current_user);
        navigate("/modes", "Modalità di gioco");
    })
}