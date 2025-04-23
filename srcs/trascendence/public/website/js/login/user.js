import { navigate, user_name, token } from "../main.js";
import { updateProfileUI } from "../pages/modes.js";
import { showInfoModal } from "../modal.js";
import { remove_all } from "../utils_main/error_main.js";

export class user {
    constructor(image, name, login_name, email, bio) {
        this.image = image;
        this.name = name;
        this.login_name = login_name;
        this.email = email;
        this.bio = bio;
    }
}

export class profile {
    constructor(email, display_name, realname, bio, image, type) {
        this.email = email;
        this.display_name = display_name;
        this.realname = realname
        this.bio = bio;
        this.image = image;
        this.type = type
    }
}

export let friend_list = [];

export class Friend {
    constructor(name, status) {
        this.name = name;
        this.status = status;
    }
}

function set_user(user, type)
{
    let name;
    if (type === "guest")
        name = user.username;
    else
        name = user.display_name;
    let new_user = new profile(
        user.email,
        user.username || user.display_name,
        user.realname,
        user.bio,
        user.image,
        type
    );
    return new_user;
}

export async function restore_user() {
    try {
        if (window.location.pathname === '/')
            return null;
        let data = JSON.stringify({ "params": { "display_name": user_name, "token": token } });
        const response = await fetch("http://localhost:8008",
        {
            method: "get_user",
            body: data
        })

        let result = await response.json();
        if (result && result.status === "success") {
            let ref_user;
            if (result.guest)
                ref_user = set_user(result.guest, "guest");
            else
                ref_user = set_user(result.user[0], "login");
            remove_all(1, 1);
            updateProfileUI(ref_user);
            return ref_user;
        }
        else {
            remove_all(0, 0, 1);
            if (window.location.pathname !== '/')
                navigate("/", "home");
            showInfoModal("ERROR GET_USER: An error has occured(\"" + result.status + "\")", () => { });
            return null;
        }
    }
    catch (error) {
        console.log("Error in get_user = ", error);
        remove_all(0, 0, 1);
        if (window.location.pathname !== '/')
            navigate("/", "home");
        showInfoModal("Error with get_user:", error);
        return null;
    }
}

/*export async function online(name)
{
}*/

export async function exist(name)
{
    try
    {
        const response = await fetch("http://localhost:8008",
            {
                method: "get_user",
                body: JSON.stringify({})
            });
            const data = await response.json();
            let userFound = false;
            console.log("data = ", data);
            console.log("guest = ", data.guest);
            if (Array.isArray(data.guest)) {
                userFound = data.guest.includes(name);
            }
            console.log("user = ", data.user);
            if (!userFound && Array.isArray(data.user)) {
                userFound = data.user.includes(name);
            }
            return userFound;
    }
    catch (error)
    {
        showInfoModal("An error has occured in exist  (" + error + ")");
        return false;
    }
}