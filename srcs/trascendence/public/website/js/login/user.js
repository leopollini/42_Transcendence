import { nullify_user, updateProfileUI} from "../pages/modes.js";
import { navigate } from "../main.js";
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

export function restore_user()
{
    let token = readCookie("user_token").replace(/"/g, '');
    let data = JSON.stringify({ "params" : [{}]});
    fetch("http://localhost:8008",
    {
        method: "get_user",
        body: data
    })
    .then(response => response.json())
    .then(data =>
    {
        //console.log("(get_user)\nData login = ", data);
        if (!data || (!data.user && !data.guest)) 
        {
            nullify_user();
            alert("ERROR: no users found...");
            navigate("/", "home");
            return;
        }
        let type = 1;
        let find_user = data.user?.find(u => u.token === token);
        if (!find_user)
        {
            find_user = data.guest?.find(g => g.token === token);
            type = 0;
        }
        if (find_user) 
        {
            let user_type;
            if (type === 1)
                user_type = "user"
            else
                user_type =  "guest";
            let ref_user = new profile(
                "",
                find_user.username,
                "",
                "",
                "website/images/guest.jpg" || find_user.image,
                user_type
            );
            localStorage.setItem('session opened', 1);
            localStorage.setItem('your_profile', JSON.stringify(ref_user));
            updateProfileUI(ref_user);
        }
        else 
        {
            nullify_user();
            alert("ERROR: finding logged user...");
            navigate("/", "home");
        }
    });
}


export function isValidImageUrl(url) {
    const allowedDomains = ['example.com', 'trusted-source.com'];
    try {
        const parsedUrl = new URL(url);
        if (allowedDomains.includes(parsedUrl.hostname) && isImageExtension(parsedUrl.pathname)) {
            return true;
        }
    } catch (e) {
        console.error("URL non valido:", e);
    }
    return false;
}

function isImageExtension(path)
{
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
    return imageExtensions.some(ext => path.endsWith(ext));
}

export function escapeHTML(str)
{
    str = str.trim();
    const div = document.createElement('div');
    if (str) {
        div.textContent = str;
    }
    return div.innerHTML;
}

export function isValidImageExtension(filename)
{
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
    const fileExtension = filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
    return validExtensions.includes(`.${fileExtension}`);
}

export function isValidImageData(imageData)
{
    const base64Header = imageData.substring(0, 5);
    return base64Header === "data:";
}