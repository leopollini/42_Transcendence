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

export function readCookie(name)
{
    let nameCookie = name + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let cookieArray = decodedCookie.split(';');

    for (let i = 0; i < cookieArray.length; i++) {
        let cookie = cookieArray[i].trim();
        if (cookie.startsWith(nameCookie)) {
            return cookie.substring(nameCookie.length);
        }
    }
    return null;
}

export function eraseCookie(name)
{
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
}

export function saveCookie(name, element, days)
{
    let data = new Date();
    data.setTime(data.getTime() + (days * 24 * 60 * 60 * 1000));
    let expire_date = "expires=" + data.toUTCString();
    document.cookie = name + "=" + encodeURIComponent(JSON.stringify(element)) + ";" + expire_date + ";path=/";
}


export async function restore_user()
{
    if (window.location.pathname === '/' || (sessionStorage.getItem('already in') !== '1' && localStorage.getItem('session opened', 0) !== '1'))
        return null;
    let token = readCookie("user_token").replace(/"/g, '');
    try
    {
        let data = JSON.stringify({ "params" : [{'token' : token}]});
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
                let type = -1;
                if (sessionStorage.getItem("type", 1) === "guest")
                    type = 0;
                else if (sessionStorage.getItem("type", 1) === "login")
                    type = 1;
                else
                    return null;
                let user_type = type === 1 ? "user" : "guest";
                const ref_user = new profile(
                    "",
                    result.username,
                    "",
                    result.bio,
                    result.image,
                    user_type
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
                sessionStorage.removeItem("type");
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
