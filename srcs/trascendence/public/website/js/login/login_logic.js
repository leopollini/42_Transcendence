import { showInfoModal, showInputModal } from "../modal.js";
import { remove_all } from "../utils_main/error_main.js";
import {navigate, save_global, token, user_name } from "../main.js";
import { update_image, change_name } from "../pages/modes.js"
import { check_name, escapeHtml } from "./user.js";

export default function Callback() {
  return `
    `;
}

export async function addCallbackPageHandlers() {
  let let_me_in = await checkAuthentication(window.location.pathname);
  if (let_me_in === 1) {
    remove_all();
  }
  else if (let_me_in === -1) {
    await navigate("/modes", "Return to Game Mode");
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
          remove_all();
          showInfoModal("ERROR UPDATE_USER: An error has occured(\"" + data.status + "\")", () => { });
        }
      }
    })
    .catch(error => {
      remove_all();
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
    //console.log("data = ", data);
    if (data.success === "true") {
      //console.log("data = ", data);
      if (await set_user(data) === 1)
        return (1);
      showInfoModal(data.message, () => { });
      return (-1);
    } else {
      console.log("data = ", data);
      if (data.message === "user already online") {
        showInfoModal("Username taken", () => {});
        navigate("/", "home");
        return (0);
      }
      else
        showInfoModal("Authentication failed", () => {});
      return (1);
    }
  } catch (error) {
    showInfoModal("ERROR handling in callback: " + error.message, () => { });
    return (1);
  }
}

async function set_user(user) {
  let name_changed = false
  let display_name;
  if (!user.display_name) {
    const promptModal = msg => new Promise(resolve => showInputModal(msg, resolve));
    display_name = await promptModal("Insert your nickname");
    if (check_name(display_name) !== true) {
      return (1);
    }
    name_changed = true;
  }
  else
    display_name = user.display_name;
  if (name_changed)
    await update_with_new_name(display_name);
  let new_user =
  {
    email: user.email,
    display_name: escapeHtml(String(display_name).trim()),
    realname: user.realname,
    image: user.image,
    bio: user.bio,
    type: "login"
  };
  save_global("name", display_name);
  save_global("token", user.token);
  save_global("user", new_user);
  save_global("acess", true);
  /*update_image(new_user.image);
  change_name(new_user.display_name);*/
}

export async function performLogin() {
  try {
    if (token)
    {
      let result = await login_with_token();
      if (result === 0)
      {
        showInfoModal("Session restored", () => {});
        navigate("/modes", "Modalità di gioco");
      }
      else if (result === 1)
        showInfoModal(user_name + " must finish the game", () => {});
      else
        remove_all();
      return;
    }
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
