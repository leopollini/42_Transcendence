import { showInfoModal } from "../modal.js"

export async function fetchOnlineUsers(current_user) {
    try {
        const response = await fetch("https://" + window.location.hostname + ":8008", {
            method: "get_online",
            body: JSON.stringify({})
        });

        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status} - ${response.statusText}`);
        }
        const data = await response.json();
        //console.log("data = ", data);
        let users_online = [];
        data.online_users.forEach(user => {
            if (user !== current_user)
                users_online.push(user);
        });
        //console.log("users online =>", users_online);
        return users_online;
    } catch (error) {
        showInfoModal("Fetch error:", error);
    }
}