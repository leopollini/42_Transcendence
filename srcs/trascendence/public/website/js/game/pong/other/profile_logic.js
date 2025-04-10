import { validateUploadedImage} from "../../../security/security.js";
import { showInfoModal } from "../../../modal.js";
export function savebio(me, yourDataSection)
{
    const bioInput = yourDataSection.querySelector('#bioInput');
    const newBio = bioInput.value;

    let polbio = yourDataSection.querySelector('#bioSection');
    polbio.style.width = "50%";

    if (!newBio)
        return ("No Bio saved(Please enter a bio next time)\n");
    if (newBio.length >= 400)
        return ("Error: Bio too big\n");
    me.bio = JSON.stringify(newBio);
    return("✅saved bio successfully\n");
}


export function savename(me, yourDataSection)
{
    const changeName = yourDataSection.querySelector('#displayNameInput');
    const newname = changeName.value;

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

export async function saveimage(me, yourDataSection) {
    const imageUploadInput = yourDataSection.querySelector('#imageUploadInput');
    const profileImage = yourDataSection.querySelector('#profileImage');

    profileImage.addEventListener('click', () =>
    {
        imageUploadInput.value = '';
        imageUploadInput.click();
    });

    imageUploadInput.addEventListener('change', async (event) =>
    {
        const file = event.target.files[0];
        if (file)
        {
            try
            {
                await validateUploadedImage(file);
                const reader = new FileReader();
                reader.onload = async (e) => 
                {
                    const newImage = e.target.result;
                    if (profileImage.src === newImage)
                    {
                        showInfoModal("This image is already selected.", () => {});
                        return;
                    }
                    me.image = newImage;
                    profileImage.src = newImage;
                    showInfoModal("image changed successfully", () => {});
                };
                reader.readAsDataURL(file);
            }
            catch (error)
            {
            }
        }
        else
        {
            showInfoModal("Error: No file selected.", () => {});
            return;
        }
    });
}