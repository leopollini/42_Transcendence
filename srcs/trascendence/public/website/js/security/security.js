import { readCookie } from "../login/user.js";
import { current_user } from "../main.js";

export async function validateUploadedImage(file)
{
    return new Promise((resolve, reject) =>
    {
        if (file.size > 5 * 1024 * 1024) 
        {
            alert("Error: Image file is too large. Maximum size is 5MB.");
            return reject();
        }

        const validFormats = ['image/jpeg', 'image/png'];
        if (!validFormats.includes(file.type))
        {
            alert("Error: Invalid image format. Only JPEG and PNG are allowed.");
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
                    alert("Error: Invalid PNG file.");
                    return reject();
                }
            } else if (file.type === 'image/jpeg')
            {
    
                if (uint8Array[0] !== 0xFF || uint8Array[1] !== 0xD8)
                {
                    alert("Error: Invalid JPEG file.");
                    return reject();
                }
            }

            resolve();
        };

        reader.onerror = function ()
        {
            alert("Error: Unable to read file.");
            return reject();
        };

        reader.readAsArrayBuffer(file);
    });
}

export function escapeHTML(str)
{
    str = str.trim();
    const div = document.createElement('div');
    if (str) 
        div.textContent = str;
    return div.innerHTML;
}

export function free_users()
{
    if (readCookie("user_token"))
    {
        let user_token = readCookie("user_token");
        let data = JSON.stringify({"token" : user_token});
        fetch("http://localhost:8008",
        {
            method: "logout_user",
            body: data
        })
        .then(data =>{
            console.log("deleting current user");
        })
        .catch(error => console.error("Error with logout_user:", error));
    }
    else
        console.log("user_token not found");
}