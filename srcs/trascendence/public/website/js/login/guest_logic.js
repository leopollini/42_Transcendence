import { navigate } from "../main.js";
import { user, profile, readCookie, eraseCookie} from "./user.js";
import { update_image, change_name, updateUserProfile } from "../pages/modes.js";
import { saveCookie } from "./user.js";

export async function guest_login()
{
    let name = prompt("Enter your guest name:");
    if (!name) {
        alert('No name. Please try again');
        return ;
    }
    name = name.trim();
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
    /* let data = JSON.stringify({"params" : {}});
    fetch("http://localhost:8008",
    {
        method: "get_user",
        body: data
    })
    .then(response => response.json())
    .then(data => {
        console.log("get name = ", data);
        if (data.user && Array.isArray(data.user)) {
            let value = data.user.some(user => user.display_name === name) ? 1 : 0;
            if (value === 1)
            {
                alert("Name already taken, try a different one");
                return;
            }
            else if (data.guest && Array.isArray(data.guest))
            {
                value = data.guest.some(guest => guest.display_name === name) ? 1 : 0;
                if (value === 1)
                {
                    alert("Name already taken, try a different one");
                    return;
                }
            }
            addGuest(name);
        }
        else
            alert("Failed to check name. Please try again later.");
    })
    .catch(error => {
        console.error("Error:", error);
    }); */
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
        console.log("(LOGIN_USER)\n data guest = ", data);
        saveCookie("logged", 1, 1);
        if (!data.token)
            saveCookie("user_token", "nulla", 1);
        else
            saveCookie("user_token", data.token, 1);
        updateUserProfile(current_user);
        navigate("/modes", "Modalità di gioco");
    })
}