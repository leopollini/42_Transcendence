import { showInfoModal, showInputModal } from "../modal.js";
import { remove_all } from "../utils_main/error_main.js";
import { navigate, reset_all_let, save_global, token, user_name } from "../main.js";
import { update_image, change_name } from "../pages/modes.js"
import { check_name, escapeHtml } from "./user.js";
import { free_users } from "../security/security.js";

export default function Callback() {
  return `
    `;
}

export async function addCallbackPageHandlers() {
  let let_me_in = await checkAuthentication(window.location.pathname);
  if (let_me_in === 1) {
    remove_all();
    return (1);
  }
  else if (let_me_in === -1) {
    await navigate("/modes", "Return to Game Mode");
    return (1);
  }
}

async function update_with_new_name(name) {
  let data = JSON.stringify({
    "token": token,
    "new_params": {
      "display_name": name
    }
  });
  fetch("http://localhost:8008",
    {
      method: "update_user",
      body: data
    })
    .then(response => response.json())
    .then(data => {
      if (data) {
        if (data.success !== "true") {
          showInfoModal("ERROR UPDATE_USER: An error has occured(\"" + data.status + "\")", () => { });
        }
      }
    })
    .catch(error => {
      showInfoModal("Error with update_user:" + error, () => { });
    });
}

async function checkAuthentication() {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) {
      showInfoModal("Missing OAuth parameters.", () => { });
      return (1);
    }
    const response = await fetch('/api/callback?' + params.toString());
    const data = await response.json();
    if (data.success === "true") {
      console.log("data = ", data);
      if (await set_user(data) === 1)
        return (1);
      showInfoModal(data.message, () => { });
      return (-1);
    } else {
      showInfoModal("Authentication failed: " + data.message, () => {});
      return (1);
    }
  } catch (error) {
    showInfoModal("ERROR handling in callback: " + error.message, () => { });
    return (1);
  }
}

async function set_user(user) {
  let name_changed = false
  let display_name
  // console.log("use data inside set user: ", user);
  if (!user.display_name) {
    const promptModal = msg => new Promise(resolve => showInputModal(msg, resolve));
    display_name = await promptModal("Inserisci il tuo nickname");
    if ((await check_name(display_name)) !== true) {
      return (1);
    }
    name_changed = true;
  }
  else {
    display_name = user.display_name;
  }
  save_global("name", display_name);
  save_global("token", user.token);
  console.log("displayname from server or input: ", display_name);
  let new_user =
  {
    email: user.email,
    login_name: escapeHtml(String(display_name).trim()),
    realname: user.realname,
    image: user.image,
    bio: user.bio,
    type: "login"
  };
  save_global("name", new_user.login_name);
  console.log("username after set = ", user_name);
  if (name_changed)
    await update_with_new_name(display_name);
  save_global("acess", true);
  change_name(new_user.login_name);
  update_image(new_user.image);
}

export async function performLogin() {
  try {
    const response = await fetch('/auth/login');
    const data = await response.json();
    if (data.auth_url)
      window.location.href = data.auth_url;
    else
      throw new Error("No auth_url received");
  } catch (error) {
    showInfoModal("Error during login: " + error.message, () => { });
  }
}
