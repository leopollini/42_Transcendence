import { free_users } from "./security/security.js";
import { nullify_user } from "./main.js";

function reset_value()
{
    if (sessionStorage.getItem("path game"))
        sessionStorage.removeItem("path game");
    if (!sessionStorage.getItem('already in'))
        sessionStorage.setItem('already in', '0');
    if (!localStorage.getItem('session opened'))
        localStorage.setItem('session opened', '0');
    if (sessionStorage.getItem('already in') === '0' && localStorage.getItem('session opened') === '0')
        free_users();
    if (sessionStorage.getItem('already in') === '1' && localStorage.getItem('session opened') === '0')
        localStorage.setItem('session opened', 1);
}

export function check_valid_operation(path)
{
    reset_value();
    if (sessionStorage.getItem('already in') === '1' && path === "/")
    {
        free_users();
        nullify_user();
        localStorage.setItem('session opened', 0);
        sessionStorage.setItem('already in', 0);
        return (0);
    }
    else if (path !== '/')
    {
        if (continue_error_check(path) === 1)
            return (1);
    }
    return (0);
}

function continue_error_check(path)
{
    if (sessionStorage.getItem('already in') === '1')
    {
        if (path === window.location.pathname
        && sessionStorage.getItem('already in') === '1')
        {
            if (sessionStorage.getItem('game ended') === 'true')
            {
                sessionStorage.removeItem("game ended");
                sessionStorage.removeItem("start");
                showInfoModal("the operation you are doing is forbidden", () => {});
                navigate("/modes", "Return to Game Mode");
                return (1);
            }
            return (0);
        }
    }
    else
    {
        if ((localStorage.getItem('session opened') === '1' && sessionStorage.getItem('already in') === '0') ||
        (sessionStorage.getItem('already in') === '0' && localStorage.getItem('session opened') === '0'))
        {
            showInfoModal("ERROR: accessing unauthorized page...", () => {});
            navigate("/", "home");
            return (1);
        }
    }
}

export function cant_go_back(path)
{
    if (path === sessionStorage.getItem("path game"))
    {
        sessionStorage.removeItem("path game");
        sessionStorage.removeItem("start");
        sessionStorage.setItem("already in", 0);
        localStorage.setItem("session opened", 0);
        navigate("/", "home");
        showInfoModal("you have quitted the active session", () => {});
        return (1);
    }
    return (0);
}