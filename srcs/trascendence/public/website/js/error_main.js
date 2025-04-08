import { free_users } from "./security/security.js";
import { nullify_user, navigate, popup } from "./main.js";
import { showInfoModal } from "./modal.js";


function reset_value()
{
    let session = localStorage.getItem('session opened');
    let already = sessionStorage.getItem('already in');
    if (!popup)
        localStorage.setItem('popup opened', 'false');
    if (!already)
    {
        sessionStorage.setItem('already in', '0');
        already = 0;
    }
    if (!session)
    {
        localStorage.setItem('session opened', '0');
        session = 0;
    }
    if (already === '0' && session === '0')
        remove_all(0, 0, 1);
    if (already === '1' && session === '0')
        localStorage.setItem('session opened', 1);
}

export function remove_all(session, already, all)
{
    if (all === 1)
    {
        free_users();
        nullify_user();
    }
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('session opened', session);
    sessionStorage.setItem('already in', already);
}
export function check_valid_operation(path)
{
    reset_value();
    if (sessionStorage.getItem('already in') === '1' && path === "/")
    {
        remove_all(0, 0, 1);
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
    let session = localStorage.getItem('session opened');
    let already = sessionStorage.getItem('already in');
    if ((session === '1' && already === '0') ||
    (already === '0' && session === '0'))
    {
        remove_all(1, 0);
        showInfoModal("ERROR: accessing unauthorized page...", () => {});
        navigate("/", "home");
        return (1);
    }
}

export function path_error(path)
{
    let opponent = sessionStorage.getItem("opponent");
    console.log("opponent = ", opponent);
    if (!opponent && (path === "/classic" || path === "/forza4/game"))
    {
        showInfoModal("the operation you are doing is forbidden", () => {});
        navigate("/modes", "return to modes");
        return(1);
    }
    return (0);
}