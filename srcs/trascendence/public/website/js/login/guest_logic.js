import { navigate, update_user } from "../main.js";
import { user, profile} from "./user.js";
import { update_image, change_name} from "../pages/modes.js";
import { showInputModal, showInfoModal } from "../modal.js"
import { remove_all } from "../error_main.js";

function hasNoSpaces(str)
{
  return !/\s/.test(str);
}

function alphanum(str) {
  return /^[a-zA-Z0-9]+$/.test(str);
}

export function guest_login()
{
    showInputModal("Inserisci il tuo nickname", (name) => {
      name = name.trim();
      if (alphanum(name) === false)
      {
        showInfoModal("Invalid name format(please try again)...", () => {});
        return;
      }
      if (hasNoSpaces(name) === false)
      {
        showInfoModal("Name cannot have spaces", () => {});
        return;
      }
      if (name.length < 4)
      {
        showInfoModal("Name too short.", () => {});
        return;
      }
      
      if (name.length >= 15) {
        showInfoModal("Name too long.", () => {});
        return;
      }
      
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
  let data = {"data" : {"username":guest_user.display_name,"image":guest_user.image},"login_as_guest":"true"};
  data = JSON.stringify(data);
  fetch("http://localhost:8008",
  {
      method: "login_user",
      body: data
  })
  .then(response => response.json())
  .then(data =>
  {
    //console.log("(LOGIN_USER)\ndatas = ", data);
    if (data.status === "success" && data.success === "true")
    {
      remove_all(1, 1);
      sessionStorage.setItem("user_name", guest_user.display_name);
      update_user(guest_user);
      navigate("/modes", "Modalità di gioco");
    }
    else
    {
      guest_user = null;
      remove_all(0, 0, 1);
      if (data.status === "no users found")
        showInfoModal("ERROR: Name already taken, try a different one", () => {});
      else
        showInfoModal("ERROR in LOGIN_USER: An error has occured(\"" + data.status + "\")", () => {});
      return;
    }
  })
  .catch(error =>
  {
    console.error("Error with login_user:", error);
  })
}