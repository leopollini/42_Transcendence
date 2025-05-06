import { validateUploadedImage } from "../../../security/security.js";
import { showInfoModal } from "../../../modal.js";
import { exist, hasNoSpaces, alphanum } from "../../../login/user.js";
import { escapeHtml } from "../../../login/user.js";
import { restartSocket } from "../../../pages/live-chat/socketHandler.js";

function formatBio(bio) {
    let str = typeof bio === 'string' ? bio : JSON.stringify(bio);
    str = str
        .trim()
        .replace(/^"|"$/g, '')
        .replace(/\\n/g, '\n');
    return escapeHtml(str);
}

export function savebio(me, yourDataSection, current_user) {
    const bioInput = yourDataSection.querySelector('#bioInput');
    let newBio = bioInput.value;

    let polbio = yourDataSection.querySelector('#bioSection');
    polbio.style.width = "50%";

    if (!newBio)
        return ("⚠️No Bio saved(Please enter a bio next time)\n");
    if (newBio.length >= 400)
        return ("🚨Error: Bio too big\n");
    if (current_user.bio === newBio)
        return ("⚠️no changes in bio have been made\n")
    me.bio = newBio;
    current_user.bio = formatBio(me.bio);
    return ("✅saved bio successfully\n");
}

export async function savename(me, yourDataSection, current_user) {
    const changeName = yourDataSection.querySelector('#displayNameInput');
    let newname = changeName.value;

    let polname = yourDataSection.querySelector('#changeDisplayName');
    polname.style.width = "50%";

    newname = escapeHtml(newname.trim());
    if (!newname)
        return ("⚠️No Name saved(Please enter a name next time)\n");
    if (newname.length < 4)
        return ("🚨Error: Name too short(" + newname + ")\n");
    if (newname.length >= 15)
        return ("🚨Error: Name too long(" + newname + ")\n");
    if (newname === me.display_name)
        return ("⚠️No change in name have been made\n");
    //console.log("has space = ", hasNoSpaces(newname));
    if (hasNoSpaces(newname) === false)
        return ("🚨Name cannot have spaces(" + newname + ")\n");
    if (alphanum(newname) === false)
        return ("🚨Invalid name format(" + newname + ")\n");
    //console.log(me.display_name + " !== " + newname);
    if (me.display_name !== newname) {
        let result = await exist(newname);
        if (!result) {
            current_user.display_name = newname;
            restartSocket(current_user.display_name);
            return ("✅Saved name successfully(" + newname + ")\n");
        }
        return ("🚨Error: name already taken(" + newname + ")\n");
    }
}

export async function saveimage(me, yourDataSection, current_user) {
    const imageUploadInput = yourDataSection.querySelector('#imageUploadInput');
    const profileImage = yourDataSection.querySelector('#profileImage');

    profileImage.addEventListener('click', () => {
        imageUploadInput.value = '';
        imageUploadInput.click();
    });

    imageUploadInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                await validateUploadedImage(file);
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const newImage = e.target.result;
                    if (profileImage.src === newImage) {
                        showInfoModal("This image is already selected.", () => { });
                        return;
                    }
                    me.image = newImage;
                    profileImage.src = newImage;
                    showInfoModal("image changed successfully", () => { });

                };
                reader.readAsDataURL(file);
            }
            catch (error) {
                showInfoModal("Error in Image Updater (" + error + ")", () => { })
            }
        }
        else {
            showInfoModal("🚨No file selected.", () => { });
            return;
        }
    });
}