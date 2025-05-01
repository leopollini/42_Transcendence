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
        console.log("username: ", user_name);
        const response = await fetch("http://localhost:8008",
        {
            method: "get_user",
            body: data
        })

        let result = await response.json();
        if (result && result.success === "true") {
            let ref_user;
            if (result.guest)
                ref_user = set_user(result.guest, "guest");
            else
                ref_user = set_user(result.user, "login");
            updateProfileUI(ref_user);
            return ref_user;
        }
        else {
            remove_all();
            showInfoModal("ERROR GET_USER IN RESTORE USER: An error has occured(\"" + result.status + "\")", () => { });
            return null;
        }
    }
    catch (error) {
        remove_all();
        showInfoModal("ERROR GET_USER IN RESTORE USER CATCHED:" + error, () => {});
        return null;
    }
}

export async function exist(name)
{
    try
    {
        let data = JSON.stringify({"params": {"display_name": name}});
        const response = await fetch("http://localhost:8008",
        {
            method: "get_user",
            body: data
        });
        const result = await response.json();
        //console.log("result = ", result);
        if (result.status === "no user found")
            return true;
        else
        {
            return false;
        }
    }
    catch (error)
    {
        showInfoModal("An error has occured in exist  (" + error + ")", () => {});
        return false;
    }
}

export function escapeHtml(str)
{
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
}

export async function is_online(name)
{
    try {
        const response = await fetch("http://localhost:8008", {
            method: "get_online",
            body: JSON.stringify({})
        });
        const data = await response.json();
        if (Array.isArray(data.online_users))
            return data.online_users.includes(name);
        return false;
    } catch (error) {
        showInfoModal("is_online has encountered an error = " + error, () => {});
        return false;
    }
}

function hasNoSpaces(str)
{
  return !/\s/.test(str);
}

function alphanum(str) {
  return /^[a-zA-Z0-9]+$/.test(str);
}

export async function check_name(name)
{
    name = escapeHtml(String(name).trim());
    if (alphanum(name) === false)
    {
        showInfoModal("Invalid name format(please try again)...", () => {});
        return false;
    }
    if (hasNoSpaces(name) === false)
    {
        showInfoModal("Name cannot have spaces", () => {});
        return false;
    }
    if (name.length < 4)
    {
        showInfoModal("Name too short.", () => {});
        return false;
    }
    
    if (name.length >= 15) {
        showInfoModal("Name too long.", () => {});
        return false;
    }
    let it_exist = await exist(name);
    if (it_exist === false)
    {
        showInfoModal("Name already taken", () => {});
        return false;
    }
    return true;
}

export async function another_user_info(name)
{
    try {
        let data = JSON.stringify({ "params": { "display_name": name }});
        const response = await fetch("http://localhost:8008",
        {
            method: "get_user",
            body: data
        })
        let result = await response.json();
        if (result.user)
            return(result.user);
        else if (result.guest)
        {
            let user = new profile(null,
            result.guest.display_name,
            null,
            result.guest.bio,
            result.guest.image,
            "guest");
            return (user);
        }
        else
        {
            showInfoModal("Error: Unknown user", () => {});
            remove_all();
            return null;
        }
    }
    catch(error)
    {
        if (window.location.pathname !== "/")
            navigate("/", "home");
        showInfoModal("catched this error = (" +  error + ")", () => {});
    }
}