import { current_user, updateUserProfile} from "../modes.js";
import { profile, profiles} from "../../login/user.js";
import { savebio, saveimage, savename } from "../../game/pong/other/profile_logic.js";

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
        <section id="yourData" class="profile-info">
          <h3 id="myName"></h3>
          <div id="changeDisplayName" class="form-group display-name-group">
            <label for="displayNameInput">Change your display name:</label>
            <input type="text" id="displayNameInput" class="input-field" autocomplete="off" placeholder="Insert your new name">
            <span id="displayNameLabel" style="display: none;"></span>
          </div>
          <div id="bioSection" class="form-group bio-group">
            <label for="bioInput">Modify your bio:</label>
            <textarea id="bioInput" class="input-field" autocomplete="off" placeholder="Insert bio here"></textarea>
          </div>
        </section>
      </div>
      <div class="profile-actions">
        <button id="save" class="button-style">Save Changes</button>
        <button id="back" class="button-style" onclick="history.back()">Back To Menu</button>
      </div>
    </div>
  `;
}

export let me = new profile(null, null, null, null, null, null);

function insert_user_data() {
  me.display_name = current_user.display_name;
  me.realname = current_user.realname || null;
  me.image = current_user.image;
  me.bio = current_user.bio || "";
  profiles.push(me);
}

export function profileHandler()
{
  insert_user_data();
  document.querySelector("#profileImage").src = me.image;
  document.getElementById("imageUploadInput").style.display = "none";
  if (current_user.type === "guest")
  {
    document.getElementById("changeDisplayName").style.display = "none";
    document.getElementById("myName").style.display = "none";
  }
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

function saveProfile(infoContainer) {
  let saving = "saved image successfully\n";
  current_user.image = me.image;
  
  saving += savebio(me, infoContainer);
  current_user.bio = me.bio;
  if (current_user.type === "login")
  {
    saving += savename(me, infoContainer);
    current_user.display_name = me.display_name;
  }
  else
  {
    let data = JSON.stringify({"display_name" : current_user.display_name, "image" : current_user.image, 
    "bio" : current_user.bio});
    fetch("http://localhost:8008",
    {
      method: "update_user",
      body: data
    })
    .then(data =>{
      console.log("(UPDATE_USER)\ndata update user profile = ", data);
    })
  }
  alert(saving);
  updateUserProfile(current_user);
  history.back();
}

function updateDisplayNames(infoContainer) {
  let myName = infoContainer.querySelector("#myName");
  myName.innerText = `the actual name ${current_user.display_name}`;
}
