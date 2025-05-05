import { showConfirmModal, showInfoModal } from "../../modal.js";
import { free_users, renderHtmlAsText } from "../../security/security.js";
import { current_user, in_game, save_global, token } from "../../main.js";
import { remove_all } from "../../utils_main/error_main.js";

export let socket = null;
let _username;
let _chatApp

export function restartSocket(username) {
    console.log("restarting socket. _chatApp set:", _chatApp);
    _username = username;
    if (_chatApp) {
        socket.close();
        socket = null;
        initSocket(username, _chatApp);
        return (1);
    }
    showInfoModal("Chat was not restored: chatApp not assigned");
    return (0);
}

export function closeSocket() {
    if (socket)
        socket.close();
    socket = null;
}

// function restoreChatState() {
//     if (socket && _username)
//         socket.send(JSON.stringify({ type: "get_state", 'username': _username }));
//     else
//         showInfoModal("restoreChatState failed: socket closed");
// }

function initSocket(username, chatAppInstance) {
    _username = username;
    _chatApp = chatAppInstance;
    console.log("SOCKET INIT. Username:", username);

    if (!socket)
    {
        try {
            socket = new WebSocket("wss://" + window.location.hostname + ":6087");
        }
        catch(error) {
            showInfoModal("Socket creation error: " + error);
            remove_all();
            return null;
        }
    }

    socket.onclose = () => {
        console.log("SOCKET CLOSED");
        socket = null;
    };

    socket.onopen = () => {
        if (!socket)
            return initSocket(username, chatAppInstance);
        socket.send(JSON.stringify({ type: "join", 'username': username, 'token': token }));
        socket.send(JSON.stringify({ type: "get_state", username: username }));

        // restoreChatState();
    };

    
    socket.onmessage = (event) => {
        let msg = JSON.parse(event.data);
        if (msg.data && msg.data.content) {
            msg.data.content = decodeURIComponent(msg.data.content);
            msg.data.content = renderHtmlAsText(msg.data.content);
        }
        // console.log("message from socket: ", msg)
        if (msg.type === "state") {
            const friends = msg.data.friends;
            const friendRequests = msg.data.friend_requests;
            const blockedUsers = msg.data.blocked_users;
            chatAppInstance.friends = new Set(friends);
            chatAppInstance.receivedRequests = friendRequests;
            chatAppInstance.blockedUsers = new Set(blockedUsers);
            chatAppInstance.updateFriendsList();
            chatAppInstance.updateFriendRequestsUI();
            chatAppInstance.updateBlockedUsersList();
        }
        else if (msg.type === "message") {
            chatAppInstance.addMessageToChat('general', msg.data);
        }
        else if (msg.type === "private_message") {
            const partner = username === msg.data.from ? msg.data.to : msg.data.from;
            const chatId = chatAppInstance.getPrivateChatId(username, partner);
            if (!chatAppInstance.chats.has(chatId)) {
                chatAppInstance.chats.set(chatId, []);
                chatAppInstance.createChatElement(chatId, partner, true);
            }
            chatAppInstance.addMessageToChat(chatId, msg.data);
        } 
        else if (msg.type === "friend_request") {
            if (!chatAppInstance.receivedRequests.find(r => r.from === msg.data.from)) {
                chatAppInstance.receivedRequests.push({ from: msg.data.from });
                chatAppInstance.updateFriendRequestsUI();
            }
        } 
        else if (msg.type === "friend_response") {
            if (msg.data.accepted === "true") {
                chatAppInstance.friends.add(msg.data.from);
                const chatId = chatAppInstance.getPrivateChatId(chatAppInstance.username, msg.data.from);
                if (chatAppInstance.disabledChats[chatId]) {
                    delete chatAppInstance.disabledChats[chatId];
                    if (chatAppInstance.currentChat === chatId) {
                        chatAppInstance.enablePrivateChat();
                    }
                }
            } else {
                chatAppInstance.pendingRequests.delete(msg.data.from);
            }
            chatAppInstance.updateFriendsList();
        }
        else if (msg.type === "block_user") {
            chatAppInstance.blockedBy.add(msg.data.from);
            chatAppInstance.addMessageToChat(chatAppInstance.currentChat, {
                date: new Date().toISOString(),
                from: 'system',
                content: `You have been blocked by ${msg.data.from}`
            });
        }
        else if (msg.type === "unblock_user") {
            chatAppInstance.blockedBy.delete(msg.data.from);
            chatAppInstance.addMessageToChat(chatAppInstance.currentChat, {
                date: new Date().toISOString(),
                from: 'system',
                content: `You have been unblocked by ${msg.data.from} `
            });
        }   
        else if (msg.type === "friend_removed") {
            chatAppInstance.friends.delete(msg.data.from);
            chatAppInstance.pendingRequests.delete(msg.data.from);
            chatAppInstance.updateFriendsList();
            if (chatAppInstance.selectedUser === msg.data.from) {
                const addFriendItem = chatAppInstance.elements.contextMenu.querySelector('[data-action="addFriend"]');
                addFriendItem.textContent = 'Add Friend';
                addFriendItem.style.opacity = '1';
            }
            const chatId = chatAppInstance.getPrivateChatId(username, msg.data.from);
            if (chatAppInstance.chats.has(chatId)) {
                chatAppInstance.disablePrivateChat(chatId);
            }
        }
        else if (msg.type === "private_chat_started") {
            const chatId = chatAppInstance.getPrivateChatId(username, msg.data.from);
            if (!chatAppInstance.chats.has(chatId) && !document.querySelector(`.chat-tab[data-chat="${chatId}"]`)) {
                chatAppInstance.chats.set(chatId, []);
                chatAppInstance.createChatElement(chatId, msg.data.from, true);
            }
            chatAppInstance.addMessageToChat(chatId, {
                date: new Date().toISOString(),
                from: 'system',
                to: chatId,
                content: `Private chat with ${msg.data.from.charAt(0) + msg.data.from.slice(1)} started.`
            });
        }
        else if (msg.type === "system") {
            if (msg.data.content && msg.data.content.includes("You cannot send a friend request")) {
                let regex = /you're blocked from ([^.]+)\./i;
                let match = msg.data.content.match(regex);
                if (!match) {
                    regex = /You cannot send a friend request to([^.]+) because he blocked you\./i;
                    match = msg.data.content.match(regex);
                }
                if (match && match[1]) {
                    const blockingUser = match[1].trim();
                    chatAppInstance.pendingRequests.delete(blockingUser);
                    if (chatAppInstance.selectedUser && chatAppInstance.selectedUser === blockingUser) {
                        const addFriendItem = chatAppInstance.elements.contextMenu.querySelector('[data-action="addFriend"]');
                        if (addFriendItem) {
                            addFriendItem.textContent = 'Add Friend';
                            addFriendItem.style.opacity = '1';
                        }
                    }
                }
            }
            chatAppInstance.addMessageToChat(chatAppInstance.currentChat, msg.data);
        }
        else if (msg.type === "match_request") {
            // L'utente ricevente visualizza la richiesta di partita tramite modal di conferma
            const sender = msg.data ? msg.data.from : msg.from; // "userA"
            const receiver = username; // "userB"
            if (in_game !== 0) {
                socket.send(JSON.stringify({
                    type: "match_response",
                    to: sender,
                    from: receiver,
                    accepted: "user unavailable"
                }));
                return;
            }
            
            showConfirmModal(
              `${sender} has invited you to a match. do you accept?`,
              () => { // onConfirm: utente conferma
                  const response = {
                      type: "match_response",
                      to: sender,
                      from: receiver,
                      accepted: "true"
                  };
                  //console.log("receiver", receiver);
                  //console.log("⚡ Invio risposta all'invito:", response);
                  socket.send(JSON.stringify(response));
              },
              () => { // onReject: utente rifiuta
                  const response = {
                      type: "match_response",
                      to: sender,
                      from: receiver,
                      accepted: "false"
                  };
                  //console.log("⚡ Invio risposta all'invito:", response);
                  socket.send(JSON.stringify(response));
              }
            );
        }
        else if (msg.type === "match_response") {
            //console.log("📩 Risposta ricevuta:", msg);
            if (!msg.data)
                showInfoModal("bad response.", () => {});
            if (msg.data.accepted === "true")
                // Modal informativo: solo un pulsante OK
                showInfoModal(msg.data.from + " accepted your invitation!", () => {});
            else if (msg.data.accepted === "user unavailable")
                showInfoModal(msg.data.accepted, () => {});
            else
                showInfoModal("the invite was rejected.", () => {});
        }
        else if (msg.type === "kick") {
            //console.log("kicked from chat because ", msg.status)
            showInfoModal("Chat closed: " + msg.status);
            socket.close();
            save_global("token", null);
            remove_all();
        }
    };
    return socket;
}

function sendMessage(message) {
    message.from = _username;
    console.log("SENDIN as", _username);
    if (socket && socket.readyState === WebSocket.OPEN)
        socket.send(JSON.stringify(message));
}

export { initSocket, sendMessage };