import { user_name } from "../main.js";
import { showInfoModal } from "../modal.js";
import { remove_all } from "../utils_main/error_main.js";
export async function validateUploadedImage(file)
{
    return new Promise((resolve, reject) =>
    {
        if (file.size > 5 * 1024 * 1024) 
        {
            showInfoModal("Error: Image file is too large. Maximum size is 5MB.", () => {});
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
        let data = JSON.stringify({"display_name" : user_name});
        fetch("http://localhost:8008",
        {
            method: "logout_user",
            body: data
        })
        .then(response => response.json())
        .then(data =>
        {
            if (data)
            {
                if (data.status === " (guest) does not exist")
                    return;
                if (data.status && data.success)
                {
                    if (data.status !== "success" && data.success !== "true")
                        showInfoModal("ERROR LOGOUT: An error has occured(\"" + data.status + "\")", () => {});
                }
            }
        })
        .catch(error =>
        {
            remove_all(0, 0);
            if (window.location.pathname !== '/')
                navigate("/", "home");
            showInfoModal("Error with fetch logout_user:" +  error, () => {});
        });
    }
    catch (error)
    {
        remove_all(0, 0);
        if (window.location.pathname !== '/')
            navigate("/", "home");
        showInfoModal("Error in logout_user:", error);
    }
}
