import { navigate, update_name} from "../main.js";
import { update_image, change_name} from "../pages/modes.js";
import { showInfoModal } from "../modal.js";
import { remove_all } from "../error_main.js";

async function get_data()
{
  try
  {
    const data = JSON.stringify({});
    const response = await fetch("http://localhost:8008", {
        method: "get_user",
        body: data
    })
    const result = await response.json();
    console.log("(GET_USER)\ndata login = ", result);
    let name;
    if (result.user && Array.isArray(result.user))
      name = result.user.find(user => user.entered === 1);
    if (name)
    {
      const user = name;
      let new_user =
      {
        email: user.email,
        login_name: user.display_name,
        realname: user.realname,
        image: user.image,
        bio: user.bio,
        type: "login"
      };
      remove_all(1, 1);
      update_name(new_user.realname);
      change_name(new_user.login_name);
      update_image(new_user.image);
      return ;
    }
    else
    {
      if (window.location.pathname !== '/')
        navigate("/", "home");
      remove_all(0, 0, 1);
      showInfoModal("ERROR Login GET_USER: An error has occured(\"" + data.status + "\")", () => {});;
      return;
    }
  }
  catch (error)
  {
    if (window.location.pathname !== '/')
      navigate("/", "home");
    remove_all(0, 0, 1);
    showInfoModal("Error during Login in get_user: " + error.message, () => {});
    return;
  }
}

export async function performLogin() {
    try
    {
      const response = await fetch('/auth/login');
      const data = await response.json();
      window.location.href = data.auth_url;
    }
    catch (error)
    {
      showInfoModal("Error during login: " + error.message, () => {});
    }
}

export const checkAuthentication = async (path) =>
{
  if (path === "/callback")
  {
    try
    {
      const response = await fetch('/api/callback?' + new URLSearchParams(window.location.search));
      const data = await response.json();
      
      //console.log("data: ", data);
      if (data.success === true)
      {
        showInfoModal(data.message, () => {});
        await get_data()
        navigate("/modes", "Modalità di gioco");
        return (0);
      }
      else
      {
        showInfoModal("Autenticazione fallita: " + (data.error || "Unknown Error"), () => {});
        return (1);
      }

    }
    catch (error)
    {
      showInfoModal("Errore durante la gestione del callback: " + error.message, () => {});
      return (1);
    }
  }
};