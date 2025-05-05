import { user_name } from "../main.js";
import { showInfoModal } from "../modal.js";
import { token } from "../main.js";
export async function validateUploadedImage(file)
{
    return new Promise((resolve, reject) =>
    {
        if (file.size > 5 * 128 * 128) 
        {
            showInfoModal("Error: Image file is too large.\nTry some smaller", () => {});
            return reject();
        }

        const validFormats = ['image/jpeg', 'image/png'];
        if (!validFormats.includes(file.type))
        {
            showInfoModal("Error: Invalid image format. Only JPEG and PNG are allowed.", () => {});
            return reject();
        }

        const reader = new FileReader();
        reader.onload = function (e)
        {
            const arrayBuffer = e.target.result;
            const uint8Array = new Uint8Array(arrayBuffer);


            if (file.type === 'image/png')
            {
                if (uint8Array[0] !== 137 || uint8Array[1] !== 80 || uint8Array[2] !== 78 || uint8Array[3] !== 71)
                {
                    showInfoModal("Error: Invalid PNG file.", () => {});
                    return reject();
                }
            } else if (file.type === 'image/jpeg')
            {
    
                if (uint8Array[0] !== 0xFF || uint8Array[1] !== 0xD8)
                {
                    showInfoModal("Error: Invalid JPEG file.", () => {});
                    return reject();
                }
            }

            resolve();
        };

        reader.onerror = function ()
        {
            showInfoModal("Error: Unable to read file.", () => {});
            return reject();
        };

        reader.readAsArrayBuffer(file);
    });
}

export function renderHtmlAsText(input)
{
    const div = document.createElement('div');

    div.textContent = input;
    
    return div.innerHTML;
}

export function free_users()
{
    try
    {
        let data = JSON.stringify({"token" : token});
        fetch("http://localhost:8008",
        {
            method: "logout_user",
            body: data
        })
        .then(response => response.json())
        .then(data =>
        {
            //console.log("logout = ", data);
            if (data)
            {
                if (data.status === " (guest) does not exist")
                    return;
                if (data.status && data.success)
                {
                    //console.log("data = ", data);
                    if (data.success !== "true")
                        showInfoModal("ERROR LOGOUT: An error has occured(\"" + data.status + "\")", () => {});
                    //else
                        //console.log("logut esecuted succesfully")
                }
            }
        })
        .catch(error =>
        {
            showInfoModal("Error with fetch logout_user:" +  error, () => {});
        });
    }
    catch (error)
    {
        showInfoModal("Error in logout_user:", error);
    }
}
