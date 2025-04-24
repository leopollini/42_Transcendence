import { profile} from "../../login/user.js";
import { savebio, saveimage, savename } from "../../game/pong/other/profile_logic.js";
import { showInfoModal } from "../../modal.js";
import { navigate, current_user, token} from "../../main.js";
import { remove_all } from "../../utils_main/error_main.js";

export default function Profile() {
  return `
    <div class="profile-page">
      <div class="profile-card">
        <!-- Immagine cliccabile -->
        <div id="profileImageSection" class="profile-image-container">
          <img id="profileImage" src="null" alt="Profile Image">
          <input type="file" id="imageUploadInput" accept="image/*">
        </div>
        <!-- Informazioni -->
        <section id="yourData" class="profile-info1">
          <h3 id="myName"></h3>
          <div id="changeDisplayName" class="form-group display-name-group">
            <label for="displayNameInput">Change your display name:</label>
            <input type="text" id="displayNameInput" class="input-field" autocomplete="off" placeholder="Insert your new name">
            <span id="displayNameLabel" class="is-hidden"></span>
          </div>
          <div id="bioSection" class="form-group bio-group">
            <label for="bioInput">Modify your bio:</label>
            <textarea id="bioInput" class="input-field" autocomplete="off" placeholder="Insert bio here"></textarea>
          </div>
        </section>
      </div>
      <div class="profile-actions">
        <button id="save" class="button-style">Save Changes</button>
        <button id="back" class="button-style" >Back To Menu</button>
      </div>
    </div>
  `;
}

export let me = new profile(null, null, null, null, null, null);

function insert_user_data(current_user)
{
  me.display_name = current_user.display_name;
  me.realname = current_user.realname || null;
  me.image = current_user.image;
  me.bio = (current_user.bio || "").replace(/^"/, '').replace(/"$/, '').replace(/\\n/g, "\n");
  return current_user;
}

export function profileHandler()
{
  let back_to_menu = document.querySelector("#back");
  back_to_menu.addEventListener("click", () =>
  {
    navigate("/modes", "Return to Game Mode");
  });
  insert_user_data(current_user);
  document.querySelector("#profileImage").src = me.image;
  document.getElementById("imageUploadInput").style.display = "none";
  if (current_user.type === "guest")
    document.getElementById("changeDisplayName").style.display = "none";
  // Seleziono l'intera scheda e, all'interno, la sezione delle informazioni
  const card = document.querySelector(".profile-card");
  const infoContainer = card.querySelector("#yourData");

  updateDisplayNames(infoContainer);
  
  // Pre-compila il campo bio se già salvato
  const bioInput = infoContainer.querySelector("#bioInput");
  bioInput.value = me.bio;
  
  const save = document.querySelector("#save");
  saveimage(me, card);
  save.addEventListener("click", () => {
    saveProfile(infoContainer);
  });
}

function updateLogin(current_user)
{
  let data = JSON.stringify({
  "token": token,
  "new_params": {
  "display_name": current_user.display_name,
  "bio": current_user.bio,
  "image": current_user.image}});
  fetch("http://localhost:8008",
  {
    method: "update_user",
    body: data
  })
  .then(response => response.json())
  .then(data =>{
    console.log("data update = ", data);
    if (data && data.success !== "true")
    {
      remove_all(1, 1);
      showInfoModal("ERROR UPDATE_USER: An error has occured(\"" + data.status + "\")", () => {});
    }
  })
  .catch(error =>
  {
    showInfoModal("Error with update_user:" + error, () => {});
  });
}

function updateGuest(current_user)
{
  let data = JSON.stringify({
  "token": token,
  "new_params": {
  "bio": current_user.bio,
  "image": current_user.image}});
  fetch("http://localhost:8008",
  {
    method: "update_user",
    body: data
  })
  .then(response => response.json())
  .then(data =>{
    if (data && data.success !== "true")
    {
      remove_all(1, 1);
      showInfoModal("ERROR UPDATE_USER: An error has occured(\"" + data.status + "\")", () => {});
    }
  })
  .catch(error =>
  {
    showInfoModal("Error with update_user:", error);
  });
}

function saveProfile(infoContainer) {
  let saving;
  let myname;
  if (current_user.image === me.image)
    saving = "⚠️no canges in image have been made\n";
  else
  saving = "✅saved image successfully\n";
  current_user.image = me.image;
  let checkbio;
  if (current_user.bio)
    checkbio = current_user.bio.replace(/^"/, '').replace(/"$/, '').replace(/\\n/g, "\n");
  else
    checkbio = null;
  if (checkbio && checkbio === me.bio)
    saving += "⚠️no canges in bio have been made\n";
  else
  {
    saving += savebio(me, infoContainer);
    current_user.bio = me.bio;
  }
  if (current_user.type === "login")
  {
    saving += savename(me, infoContainer);
    current_user.display_name = me.display_name;
    if (current_user.display_name === me.display_name)
      saving += "✅saved new name successfully\n";
  }
  if (current_user.type === "guest")
    updateGuest(current_user);
  else
    updateLogin(current_user);
  showInfoModal(saving, () => {});
  history.back();
}

function updateDisplayNames(infoContainer) {
  let myName = infoContainer.querySelector("#myName");
  myName.textContent = `the actual name : ${current_user.display_name}`;
}
