import { sendMessage, socket } from '../live-chat/socketHandler.js';
import { current_user, navigate, save_global } from '../../main.js';
import { showInfoModal } from '../../modal.js';
import { saveMatchStatsData } from '../../game/pong/data/game_stats.js';

let chat_match_opponent = null;

function chat_match_response_event(event) {
    const msg = JSON.parse(event.data)
    /*console.log("received response", msg);
    console.log("chat oppt", chat_match_opponent);
    console.log("info data", msg.data);*/
    if (msg.type === "match_response" && chat_match_opponent && msg.data.from === chat_match_opponent)
    {
        //console.log("match response from ", chat_match_opponent);
        if (msg.data.accepted === "true") {
           //console.log("invitation accepted!");
            showInfoModal("match accepted! Press OK to start", () => {
                save_global("game", 1);
                save_global("p1", current_user.display_name);
                save_global("p2", chat_match_opponent);
                save_global("opponent", chat_match_opponent);
                navigate("/classic", "Classic Pong Game", [current_user.display_name, chat_match_opponent]);
            });
        }
        else
            showInfoModal("match rejected!");
    }
    removeEventListener("message", chat_match_response_event);
}

function setupEventListeners(chatApp) {
    const elems = chatApp.elements;

    elems.chatToggle.addEventListener('click', () => chatApp.toggleChat());
    elems.closeChat.addEventListener('click', () => chatApp.closeChat());
    elems.sendButton.addEventListener('click', () => chatApp.sendMessage());
    elems.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') chatApp.sendMessage();
    });

    elems.friendsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('friend-item')) {
            const user = e.target.dataset.user;
            chatApp.showContextMenuForUser(user, e.clientX, e.clientY);
        }
    });

    if (elems.blockedUsersList) {
        elems.blockedUsersList.addEventListener('click', (e) => {
            // Aggiungi un log di debug per verificare l'evento
            //console.log('Click in blockedUsersList', e.target);
            if (e.target.classList.contains('blocked-user-item')) {
                const user = e.target.dataset.user;
                chatApp.showContextMenuForUser(user, e.clientX, e.clientY);
            }
        });
    }

    elems.chatsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('chat-tab') && !e.target.classList.contains('tab-close')) {
            const chatId = e.target.dataset.chat;
            chatApp.switchChat(chatId);
        } else if (e.target.classList.contains('tab-close')) {
            const chatId = e.target.closest('.chat-tab').dataset.chat;
            chatApp.closePrivateChat(chatId);
        }
    });

    elems.chatsList.addEventListener('contextmenu', (e) => {
        const chatTab = e.target.closest('.chat-tab');
        if (chatTab && !chatTab.classList.contains('tab-close')) {
            const chatId = chatTab.dataset.chat;
            if (chatId !== 'general' && chatId.startsWith('private-')) {
                e.preventDefault();
            }
        }
    });

    elems.currentChatTitle.addEventListener('contextmenu', (e) => {
        if (chatApp.currentChat !== 'general') {
            e.preventDefault();
            const user = chatApp.currentChat.replace('private-', '');
            chatApp.showContextMenuForUser(user, e.clientX, e.clientY);
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.context-menu') &&
            !e.target.classList.contains('friend-item') &&
            !e.target.classList.contains('sender') &&
            !e.target.classList.contains('blocked-user-item')) {
            chatApp.hideContextMenu();
        }
    });

    elems.contextMenu.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        if (!action) return;
    
        if (action === 'invite') {
            const userToInvite = chatApp.selectedUser;
            if (!userToInvite) return;

        //   if (window.location.pathname !== '/classic/lobby') {
        //     navigate('/classic/lobby', 'Classic Pong Lobby');
        //   }
            removeEventListener("message", chat_match_response_event);
            chat_match_opponent = userToInvite;
            socket.addEventListener("message", chat_match_response_event);

            sendMessage({
                type: "match_request",
                to: userToInvite
            });
    
            // const ctxInvite = elems.contextMenu.querySelector('[data-action="invite"]');
            // ctxInvite.style.pointerEvents = 'none';
            // ctxInvite.classList.add('disabled');
    
            // const lobbyInviteBtn = document.getElementById('pongInviteButton');
            // if (lobbyInviteBtn) lobbyInviteBtn.disabled = true;
    
            chatApp.hideContextMenu();
        }
        else {
            chatApp.handleContextAction(action);
        }
    });

    elems.closeProfile.addEventListener('click', () => {
        chatApp.elements.profileModal.style.display = 'none';
    });

    elems.messagesContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('sender')) {
            const user = e.target.textContent.replace(':', '').trim();
            if (user !== 'self') {
                chatApp.showContextMenuForUser(user, e.clientX, e.clientY);
            }
        }
    });

    if (elems.friendsButton) {
        elems.friendsButton.addEventListener('click', () => {
            elems.friendsList.style.display = 'block';
            elems.friendRequestsList.style.display = 'none';
            elems.blockedUsersList.style.display = 'none';
            elems.friendsButton.classList.add('active');
            if (elems.friendRequestsButton) elems.friendRequestsButton.classList.remove('active');
            if (elems.blockedUsersButton) elems.blockedUsersButton.classList.remove('active');
        });
    }

    if (elems.friendRequestsButton) {
        elems.friendRequestsButton.addEventListener('click', () => {
            elems.friendsList.style.display = 'none';
            elems.friendRequestsList.style.display = 'block';
            elems.blockedUsersList.style.display = 'none';
            elems.friendsButton.classList.remove('active');
            elems.friendRequestsButton.classList.add('active');
            if (elems.blockedUsersButton) elems.blockedUsersButton.classList.remove('active');
        });
    }

    if (elems.blockedUsersButton) {
        elems.blockedUsersButton.addEventListener('click', () => {
            elems.friendsList.style.display = 'none';
            elems.friendRequestsList.style.display = 'none';
            elems.blockedUsersList.style.display = 'block';
            elems.friendsButton.classList.remove('active');
            elems.friendRequestsButton.classList.remove('active');
            elems.blockedUsersButton.classList.add('active');
        });
    }
}

export { setupEventListeners };
