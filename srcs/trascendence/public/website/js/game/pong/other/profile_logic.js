import { escapeHTML, isValidImageExtension, isValidImageData} from "../../../login/user.js";
import { showInfoModal } from "../../../modal.js";

export function savebio(me, yourDataSection)
{
    const bioInput = yourDataSection.querySelector('#bioInput');
    const newBio = bioInput.value;

    newBio = escapeHTML(newBio);

    let polbio = yourDataSection.querySelector('#bioSection');
    polbio.style.width = "50%";

    if (!newBio)
        return ("Error: No Bio saved(Please enter a bio next time)\n");
    if (newBio.length >= 400)
        return ("Error: Bio too big\n");
    me.bio = JSON.stringify(newBio);
    return("✅saved bio successfully\n");
}


export function savename(me, yourDataSection)
{
    const changeName = yourDataSection.querySelector('#displayNameInput');
    const newname = changeName.value;
    
    newname = escapeHTML(newname);
    let polname = yourDataSection.querySelector('#changeDisplayName');
    polname.style.width = "50%";
    
    if (!newname)
        return("Error: No Name saved(Please enter a name next time)\n");
    if (newname.length < 4)
        return("Error: Name too short(" + newname + ")\n");
    if (newname.length >= 15)
        return("Error: Name too long(" + newname + ")\n");
    if (me.display_name !== newname)
    {
        me.display_name = newname;
        return ("✅Saved name successfully(" + newname + ")\n");
    }
    else
        return ("Error: name already taken(" + newname + ")\n");
}

export function saveimage(me, yourDataSection)
{
    //const changeProfileImageBtn = yourDataSection.querySelector('#changeProfileImageBtn');
    const imageUploadInput = yourDataSection.querySelector('#imageUploadInput');
    const profileImage = yourDataSection.querySelector('#profileImage');
    
    profileImage.addEventListener('click', () => {
        imageUploadInput.click();
    });

    imageUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file)
        {
            if (!file.type.startsWith('image/'))
            {
                showInfoModal("Error: Please select a valid image file.\n", () => {});
                return;
            }
            if (!isValidImageExtension(file.name)) {
                showInfoModal("Error: Invalid image file extension.\n", () => {});
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                showInfoModal("Error: Image file is too large. Maximum size is 5MB.\n", () => {});
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const newImage = e.target.result;
                if (isValidImageData(newImage))
                {
                    me.image = newImage;
                    profileImage.src = newImage;
                }
                else
                showInfoModal("Error: Invalid image data.", () => {});
                me.image = newImage;
                profileImage.src = newImage;
            };
            reader.readAsDataURL(file);
        }
        else
        {
            showInfoModal("Error: No file selected.", () => {});
            return;
        }
    });
}