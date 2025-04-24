import { showInfoModal, showInputModal } from "../modal.js";
import { remove_all } from "../utils_main/error_main.js";
import { navigate, reset_all_let, save_global, token, user_name } from "../main.js";
import { update_image, change_name } from "../pages/modes.js"
import { check_name } from "./user.js";

export default function Callback() {
  return `
    `;
}

export async function addCallbackPageHandlers() {
  let let_me_in = await checkAuthentication(window.location.pathname);
  if (let_me_in === 1) {
    await navigate("/", "Home");
    return (1);
  }
  else if (let_me_in === -1) {
    await navigate("/modes", "Return to Game Mode");
    return (1);
  }
}

async function checkAuthentication() {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) {
      showInfoModal("Missing OAuth parameters.", () => { });
      navigate("/", "Return to home");
      remove_all(0, 0, 1);
      return;
    }
    const response = await fetch('/api/callback?' + params.toString());
    const data = await response.json();
    if (data.success) {
      save_global("name", data.name);
      save_global("token", data.token);
      save_global("acess", true);
      await get_data();
      showInfoModal(data.message, () => { });
      navigate("/modes", "Modalità di gioco", true, window.location.pathname);
    } else {
      showInfoModal("Autenticazione fallita: " + (data.error || "Unknown Error"), () => {
      });
      navigate("/", "Return to home");
      remove_all(0, 0, 1);
    }
  } catch (error) {
    showInfoModal("Errore durante la gestione del callback: " + error.message, () => { });
    remove_all(0, 0, 1);
    navigate("/", "Return to home");
  }
}

async function update_with_new_name(name) {
  console.log("token = ", token);
  console.log("name = ", name)
  let data = JSON.stringify({
    "token": token,
    "new_params": {
    "display_name": name}});
    fetch("http://localhost:8008",
    {
      method: "update_user",
      body: data
    })
    .then(response => response.json())
    .then(data =>{
      if (data)
      {
        if (data.success !== "true")
        {
          remove_all(0, 0, 1);
          reset_all_let();
          navigate("/", "home");
          showInfoModal("ERROR UPDATE_USER: An error has occured(\"" + data.status + "\")", () => {});
        }
      }
    })
    .catch(error =>
    {
      remove_all(0, 0, 1);
      reset_all_let();
      navigate("/", "home");
      showInfoModal("Error with update_user:" + error, () => {});
    });
}

async function set_user(result)
{
  const promptModal = msg => new Promise(resolve => showInputModal(msg, resolve));
  const name = await promptModal("Inserisci il tuo nickname");
  if ((await check_name(name)) !== true) {
    remove_all(0, 0, 1);
    reset_all_let();
    navigate("/", "home");
    return;
  }
  let new_user =
  {
    email: result.user[0].email,
    login_name: name,
    realname: result.user[0].realname,
    image: result.user[0].image,
    bio: result.user[0].bio,
    type: "login"
  };
  await update_with_new_name(name);
  remove_all(1, 1);
  change_name(new_user.login_name);
  update_image(new_user.image);
}

/*function set_user()
{
  let new_user =
  {
    email: result.user[0].email,
    login_name: result.user[0].display_name,
    realname: result.user[0].realname,
    image: result.user[0].image,
    bio: result.user[0].bio,
    type: "login"
  };
  remove_all(1, 1);
  change_name(new_user.login_name);
  update_image(new_user.image);
}*/

async function get_data() {
  try {
    const data = JSON.stringify({ "params": { "display_name": user_name }, "token": token });
    const response = await fetch("http://localhost:8008", {
      method: "get_user",
      body: data
    })
    const result = await response.json();
    if (result && result.status === "success"){
      await set_user(result);
      return;
    }
    else {
      remove_all(0, 0, 1);
      if (window.location.pathname !== '/')
        navigate("/", "home");
      showInfoModal("ERROR Login GET_USER: An error has occured(\"" + data.status + "\")", () => { });;
      return;
    }
  }
  catch (error) {
    console.log("error = ", error);
    remove_all(0, 0, 1);
    if (window.location.pathname !== '/')
      navigate("/", "home");
    showInfoModal("Error during Login in get_user: " + error.message, () => { });
    return;
  }
}

export async function performLogin() {
  try {
    const response = await fetch('/auth/login');
    const data = await response.json();
    if (data.auth_url) {
      window.location.href = data.auth_url;
    } else
    throw new Error("No auth_url received");
  } catch (error) {
    showInfoModal("Error during login: " + error.message, () => { });
  }
}
