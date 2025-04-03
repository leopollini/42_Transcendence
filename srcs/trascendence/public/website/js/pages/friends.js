import { friend_list } from "../login/user.js";

export default function Friends() {
    return `
    <h1 class="text">
        <span class="letter letter-1">F</span>
        <span class="letter letter-2">R</span>
        <span class="letter letter-3">I</span>
        <span class="letter letter-4">E</span>
        <span class="letter letter-5">N</span>
        <span class="letter letter-6">D</span>
        <span class="letter letter-7">S</span>
    </h1>
    <div class="friends-container">
        <div class="form">
            <h2 id="friendtext">Search for friends</h2> 
            <input type="text" id="friendSearch" class="form__field" placeholder="Cerca un amico...">
            <button id="toggleFriends" class="button-style">Friends</button>
            <button id="showAllFriends" class="button-style">Show All Friends</button>
        </div>
        <div id="friendsList" class="friends-dropdown"></div>
        <div id="allFriendsList" class="friends-dropdown"></div>
    </div>
    `;
}

export function Friendlists() {
    
    let text = document.querySelector('#friendtext');
    text.style.fontSize = "1.6em";
    text.style.fontFamily = "'Liberty', sans-serif";
    text.style.color = "#09a09b"; 

    friend_list.splice(0, friend_list.length,
        { name: "maria", status: "Online" },
        { name: "marco", status: "Offline" },
        { name: "gigi", status: "Online" },
        { name: "giorgio", status: "Online" },
        { name: "giovanni", status: "Offline" },
        { name: "luca", status: "Online" },
        { name: "Don gino", status: "Online" }
    );
    friend_searcher(friend_list);
    updateFriendList(friend_list, '');
    handleFriendsButton();
    handleShowAllFriendsButton(friend_list);
}

function friend_searcher(friend_list) {
    const friendsListContainer = document.querySelector("#friendsList");
    const friendSearchInput = document.querySelector("#friendSearch");

    // Rimuoviamo il posizionamento fisso e facciamo tutto tramite il CSS
    friendsListContainer.style.backgroundColor = "#00FFFF";
    friendsListContainer.style.padding = "20px";
    friendsListContainer.style.boxShadow = "2px 0px 5px rgba(0, 0, 0, 0.1)";
    friendsListContainer.style.overflowY = "auto";

    friendSearchInput.addEventListener("input", function() {
        updateFriendList(friend_list, friendSearchInput.value);
    });
}
function updateFriendList(friend_list, searchTerm) {
    const friendsListContainer = document.querySelector("#friendsList");

    // Filtra gli amici online
    const filteredFriends = searchTerm === ''
        ? friend_list.filter(friend => friend.status.toLowerCase() === "online")
        : friend_list.filter(friend => 
            friend.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
            friend.status.toLowerCase() === "online"
        );

    // Svuota il contenitore
    friendsListContainer.innerHTML = '';

    if (filteredFriends.length === 0) {
        const noFriendsMessage = document.createElement("p");
        noFriendsMessage.textContent = "No friends found.";
        friendsListContainer.appendChild(noFriendsMessage);
    } else {
        const title = document.createElement("h3");
        title.textContent = "Your Friends";
        friendsListContainer.appendChild(title);

        filteredFriends.forEach(friend => {
            const friendItem = document.createElement("div");
            friendItem.classList.add("friend-item", friend.status.toLowerCase());

            const friendStatus = document.createElement("span");
            friendStatus.classList.add("friend-status");
            friendStatus.textContent = friend.status;

            const friendName = document.createElement("span");
            friendName.classList.add("friend-name");
            friendName.textContent = friend.name;

            friendItem.appendChild(friendStatus);
            friendItem.appendChild(friendName);
            friendsListContainer.appendChild(friendItem);
        });
    }
}


function handleFriendsButton() {
    const toggleFriendsButton = document.querySelector("#toggleFriends");
    const friendsListContainer = document.querySelector("#friendsList");

    toggleFriendsButton.addEventListener("click", () => {
        if (friendsListContainer.style.display === "none" || friendsListContainer.style.display === "") {
            friendsListContainer.style.display = "block";
        } else {
            friendsListContainer.style.display = "none";
        }
    });
}

function handleShowAllFriendsButton(friend_list) {
    const showAllFriendsButton = document.querySelector("#showAllFriends");
    const allFriendsListContainer = document.querySelector("#allFriendsList");

    showAllFriendsButton.addEventListener("click", () => {
        if (allFriendsListContainer.style.display === "none" || allFriendsListContainer.style.display === "")
            allFriendsListContainer.style.display = "block";
        else
            allFriendsListContainer.style.display = "none";

        if (allFriendsListContainer.style.display === "block") {
            allFriendsListContainer.innerHTML = `
                <h3>All your Friends</h3>
                ${friend_list.map(friend => {
                    const safeStatus = DOMPurify.sanitize(friend.status);
                    const safeName = DOMPurify.sanitize(friend.name);

                    return `
                        <div class="friend-item ${safeStatus.toLowerCase()}">
                            <span class="friend-status">${safeStatus}</span>
                            <span class="friend-name">${safeName}</span>
                        </div>
                    `;
                }).join('')}
            `;
        }
    });
}
