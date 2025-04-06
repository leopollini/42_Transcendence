import { showConfirmModal, showInfoModal } from "../../modal.js";

let socket;

function initSocket(username, chatAppInstance) {
    socket = new WebSocket('ws://localhost:6087');

    socket.onopen = () => {
        socket.send(JSON.stringify({ type: "join", username }));

        socket.send(JSON.stringify({ type: "get_state", username }));
    };

    socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === "state") {
            const friends = msg.data.friends
            const friendRequests = msg.data.friend_requests
            const blockedUsers = msg.data.blocked_users
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
            if (msg.data.accepted) {
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
            showConfirmModal(
              `${sender} ti ha invitato a una partita. Accetti?`,
              () => { // onConfirm: utente conferma
                  const response = {
                      type: "match_response",
                      to: sender,
                      accepted: true
                  };
                  console.log("⚡ Invio risposta all'invito:", response);
                  socket.send(JSON.stringify(response));
              },
              () => { // onReject: utente rifiuta
                  const response = {
                      type: "match_response",
                      to: sender,
                      accepted: false
                  };
                  console.log("⚡ Invio risposta all'invito:", response);
                  socket.send(JSON.stringify(response));
              }
            );
        }
        else if (msg.type === "match_response") {
            console.log("📩 Risposta ricevuta:", msg);
            if (msg.data && msg.data.accepted)
                // Modal informativo: solo un pulsante OK
                showInfoModal("L'invito è stato accettato! Puoi avviare la partita.", () => {});
            else
                showInfoModal("L'invito è stato rifiutato.", () => {});
        }                                  
    };
    return socket;
}

function sendMessage(message) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
    } else {
        console.error("Socket non è connesso o non pronto.");
    }
}

export { initSocket, sendMessage };