import { nullify_user, updateProfileUI} from "../pages/modes.js";

export class user {
    constructor(image, name, login_name, email, bio) {
        this.image = image;
        this.name = name;
        this.login_name = login_name;
        this.email = email;
        this.bio = bio;
    }
}

export let profiles = [];

export class profile {
    constructor(email, display_name, realname, bio, image, type)
    {
        this.email = email;
        this.display_name = display_name;
        this.realname = realname
        this.bio = bio;
        this.image = image;
        this.type = type;
        this.num_friends = 0;
        this.myfriend = friend_list;

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

export function deleteAllCookies()
{
    document.cookie.split(";").forEach(cookie => {
        let name = cookie.split("=")[0].trim();
        document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    });
}

export function restore_user()
{
    let token = readCookie("user_token");
    token = token.replace(/^"|"$/g, '');
    let data = JSON.stringify({ "params": {token} });
    console.log("data totale token+parametri = ", data);
    fetch("http://localhost:8008",
    {
        method: "get_user",
        body: data
    })
    .then(response => response.json())
    .then(data =>
    {
        console.log("(GET_USER)\ndata search ...= ", data);
        if (data && data.status === "no users found" || "invalid request")
        {
            nullify_user();
            deleteAllCookies();
            navigate("/access_denied", "invalid action");
            return;
        }
        if (data.user)
        {
            updateProfileUI(data.user[0]);
            localStorage.setItem('your_profile', JSON.stringify(data.user[0]));
        }
        else
        {
            updateProfileUI(data.guest[0]);
            localStorage.setItem('your_profile', JSON.stringify(data.guest[0]));
        }
    })
    .catch(error => {
        console.error("Errore nel recuperare i dati dell'utente: ", error);
        nullify_user();
        deleteAllCookies();
        navigate("/error", "Errore nel recuperare i dati");
    });   
}