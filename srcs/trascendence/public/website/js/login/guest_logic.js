import { navigate, save_global, token, user_name } from "../main.js";
import { user, login_with_token, profile, check_name, escapeHtml } from "./user.js";
import { update_image, change_name } from "../pages/modes.js";
import { showInputModal, showInfoModal } from "../modal.js"
import { remove_all } from "../utils_main/error_main.js";

export async function guest_login() {
  if (token) {
    let result = await login_with_token();
    if (result === 0) {
      showInfoModal("Session restored", () => { });
      navigate("/modes", "Modalità di gioco");
    }
    else if (result === 1)
      showInfoModal(user_name + " must finish the game", () => { });
    else
      remove_all();
    return;
  }
  showInputModal("Insert your nickname", async (name) => {
    if (check_name(name) === true) {
      name = escapeHtml(String(name).trim());
      addGuest(name);
    }
  });
}

function addGuest(name) {
  let curr_guest = new user("website/images/guest.jpg", name, null, null, null);
  update_guest(curr_guest);
}

function update_guest(curr_guest) {
  change_name(curr_guest.name);
  update_image(curr_guest.image);
  let guest_user = new profile(
    "",
    curr_guest.name,
    "",
    curr_guest.bio,
    curr_guest.image,
    "guest"
  );
  const data = JSON.stringify({ data: { username: guest_user.display_name, image: guest_user.image, login_as_guest: "true" } });
  fetch("http://localhost:8008",
    {
      method: "login_user",
      body: data
    })
    .then(response => response.json())
    .then(data => {
      if (data.success === "true") {
        //console.log("data = ", data);
        save_global("acess", true);
        save_global("token", data.token);
        save_global("name", guest_user.display_name);
        save_global("user", guest_user);
        navigate("/modes", "Modalità di gioco");
      }
      else {
        guest_user = null;
        if (data.status === "username taken")
          showInfoModal("ERROR: Name already taken, try a different one", () => { });
        else
          showInfoModal("ERROR in LOGIN_USER: An error has occured(\"" + data.status + "\")", () => { });
        remove_all();
        return;
      }
    })
    .catch(error => {
      remove_all();
      showInfoModal("ERROR: with login_user: (" + error + ")", () => { });
    })
}