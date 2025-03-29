import { navigate } from "../main.js";
import { user, profile, eraseCookie} from "./user.js";
import { update_image, change_name, updateUserProfile, nullify_user } from "../pages/modes.js";
import { saveCookie, escapeHTML} from "./user.js";

export function guest_login()
{
    let name = prompt("Enter your guest name:");
    if (!name) {
        alert('No name. Please try again');
        return ;
    }
    name = escapeHTML(name);
    if (!name) {
        alert('Name cannot be just spaces');
        return;
    }
    if (name.length < 4) {
        alert('Name too short.');
        return ;
    }
    if (name.length >= 15)
    {
        alert('Name too long.');
        return ;
    }
    addGuest(name);
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
            alert("ERROR: Name already taken, try a different one");
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