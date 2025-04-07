import { navigate, nullify_user } from "../main.js";
import {updateProfileUI} from "../pages/modes.js";
import { showInfoModal } from "../modal.js";

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
    constructor(email, display_name, realname, bio, image, type)
    {
        this.email = email;
        this.display_name = display_name;
        this.realname = realname
        this.bio = bio;
        this.image = image;
        this.num_friends = 0;
        this.myfriend = friend_list;
        this.type = type
    }
}

export let friend_list = [];

export class Friend {
    constructor(name, status)
    {
        this.name = name;
        this.status = status;
    }
}

export function saveCookie(name, element, days) {
    let data = new Date();
    data.setTime(data.getTime() + (days * 24 * 60 * 60 * 1000));
    let expire_date = "expires=" + data.toUTCString();
    document.cookie = name + "=" + encodeURIComponent(JSON.stringify(element)) + ";" + expire_date + ";path=/";
}

export async function readCookie(name)
{
    if (window.location.pathname === '/' || (sessionStorage.getItem('already in') !== '1' && localStorage.getItem('session opened', 0) !== '1'))
        return null;
    try
    {
        let data = JSON.stringify({ "params" : [{'token' : 'token'}]});
        const response = await fetch("http://localhost:8008",
        {
            method: "get_user",
            body: data
        })

        const result = await response.json();
        //console.log("(get_user)\nData login = ", data);
        if (result)
        {
            if (result.success === "true" && result.status === "success")
            {
                const ref_user = new profile(
                    "",
                    result.username,
                    "",
                    result.bio,
                    result.image,
                    result.type
                );
                sessionStorage.setItem('already in', 1);
                localStorage.setItem('session opened',1);
                updateProfileUI(ref_user);
                return ref_user;
            }
            else
            {
                showInfoModal("ERROR: An error has occured(\"" + result.status + "\")", () => {});
                nullify_user();
                navigate("/", "home");
                return null;
            }
        }
        else
            showInfoModal("no result??", () => {});
    }
    catch (error)
    {
        console.error("Error with get_user:", error);
        return null;
    }
}
