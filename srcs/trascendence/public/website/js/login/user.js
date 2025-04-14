import { current_user, navigate, nullify_user, user_name } from "../main.js";
import {updateProfileUI} from "../pages/modes.js";
import { showInfoModal } from "../modal.js";
import { remove_all } from "../error_main.js";

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

export async function restore_user()
{
    try
    {
        if (window.location.pathname === '/' || (sessionStorage.getItem('already in') !== '1' && localStorage.getItem('session opened', 0) !== '1'))
            return null;

        let data = JSON.stringify({});
        const response = await fetch("http://localhost:8008",
        {
            method: "get_user",
            body: data
        })

        const result = await response.json();
        // console.log("(get_user)\nData login = ", result);
        if (result)
        {
            let name;
            let username = user_name;
            if (Array.isArray(result.guest))
            {
                name = result.guest.filter(guest => guest !== null)
                .find(guest => guest.username === username);
            }
            if (!name && Array.isArray(result.user))
                name = result.user.find(user => user.realname === username);
            if (name)
            {
                const ref_user = new profile(
                    name.email,
                    name.username,
                    name.realname,
                    name.bio,
                    name.image,
                    name.type
                );
                remove_all(1, 1);
                updateProfileUI(ref_user);
                return ref_user;
            }
            else
            {
                remove_all(0, 0, 1);
                if (window.location.pathname !== '/')
                    navigate("/", "home");
                showInfoModal("ERROR GET_USER: An error has occured(\"" + result.status + "\")", () => {});
                return null;
            }
        }
        else
        {
            remove_all(0, 0, 1);
            if (window.location.pathname !== '/')
                navigate("/", "home");
            showInfoModal("no result??", () => {});
        }
    }
    catch (error)
    {
        remove_all(0, 0, 1);
        if (window.location.pathname !== '/')
            navigate("/", "home");
        showInfoModal("Error with get_user:", error);
        return null;
    }
}
