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
        this.entered = 0;
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

export function saveCookie(name, element, days)
{
    let data = new Date();
    data.setTime(data.getTime() + (days * 24 * 60 * 60 * 1000));
    let scadenza = "expires=" + data.toUTCString();
    document.cookie = name + "=" + encodeURIComponent(JSON.stringify(element)) + ";" + scadenza + ";path=/";
}

export function readCookie(name)
{
    let nameCookie = name + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let cookieArray = decodedCookie.split(';');
    for (let i = 0; i < cookieArray.length; i++) {
      let cookie = cookieArray[i];
      while (cookie.charAt(0) == ' ') {
        cookie = cookie.substring(1);
      }
      if (cookie.indexOf(nameCookie) == 0) {
        return JSON.parse(cookie.substring(nameCookie.length, cookie.length));
      }
    }
    return null;
}

export function eraseCookie(name)
{
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
}