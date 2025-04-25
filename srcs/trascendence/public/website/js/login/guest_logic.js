import { navigate, save_global, user_name} from "../main.js";
import { user, profile, check_name} from "./user.js";
import { update_image, change_name} from "../pages/modes.js";
import { showInputModal, showInfoModal } from "../modal.js"
import { remove_all } from "../utils_main/error_main.js";
export async function guest_login()
{
    showInputModal("Inserisci il tuo nickname", async (name) => {
      if (await check_name(name) === true)
        addGuest(name);
    showInputModal("Inserisci il tuo nickname", async (name) => {
      if (await check_name(name) === true)
        addGuest(name);
    });
}

function addGuest(name) {
    let curr_guest = new user("website/images/guest.jpg", name, null, null, null);
    update_guest(curr_guest);
}

function update_guest(curr_guest)
{
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
  const data = JSON.stringify({data : {username: guest_user.display_name,image: guest_user.image, login_as_guest: "true"}});
  fetch("http://localhost:8008",
  {
      method: "login_user",
      body: data
  })
  .then(response => response.json())
  .then(data =>
  {
    if (data.status === "success")
    {
      remove_all(1, 1);
      save_global("acess", true);
      save_global("token", data.token);
      save_global("name", guest_user.display_name);
      navigate("/modes", "Modalità di gioco");
    }
    else
    {
      remove_all(0, 0, 1);
      guest_user = null;
      if (data.status === "no users found")
        showInfoModal("ERROR: Name already taken, try a different one", () => {});
      else
        showInfoModal("ERROR in LOGIN_USER: An error has occured(\"" + data.status + "\")", () => {});
      if (window.location.pathname !== '/')
        navigate("/", "home");
      return;
    }
  })
  .catch(error =>
  {
    remove_all(0, 0, 1);
    if (window.location.pathname !== '/')
      navigate("/", "home");
    showInfoModal("Error with login_user: (" + error + ")", () => {});
  })
}