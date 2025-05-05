import { initSocket, restartSocket, socket } from './socketHandler.js';
import { makeDraggable } from './domUtils.js';
import { setupEventListeners } from './eventListeners.js';
import { current_user, user_name } from '../../main.js';
import { another_user_info, is_online, } from '../../login/user.js';
import { showInfoModal } from '../../modal.js';
class ChatApp {
    constructor() {
        this.chats = new Map();
        this.unreadCounts = {};
        this.currentChat = 'general';
        this.friends = new Set();
        this.pendingRequests = new Set();
        this.receivedRequests = [];
        this.selectedUser = null;
        this.username = null;
        this.blockedUsers = new Set(); 
        this.disabledChats = {};
        this.initialize();
        this.sendStateRequest();
    }

    sendStateRequest() {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "get_state", username: user_name }));
        } else {
            socket.addEventListener("open", () => {
                socket.send(JSON.stringify({ type: "get_state", username: user_name }));
            }, { once: true });
        }
    }

    getChatPartner(chatId) {
        const parts = chatId.replace('private-', '').split('-');
        return parts[0] === this.username ? parts[1] : parts[0];
    }

    getPrivateChatId(user1, user2) {
        return user1 < user2 ? `private-${user1}-${user2}` : `private-${user2}-${user1}`;
    }

    initialize() {
        if (current_user && current_user.display_name)
            this.username = current_user.display_name;
        else
        this.username = "default";
        this.socket = initSocket(this.username, this);
        
        this.initializeElements();
        setupEventListeners(this);
        this.initializeGeneralChat();
    }

    initializeElements() {
        this.elements = {
            chatToggle: document.getElementById('chatToggle'),
            chatContainer: document.getElementById('chatContainer'),
            closeChat: document.getElementById('closeChat'),
            messageInput: document.getElementById('messageInput'),
            sendButton: document.getElementById('sendButton'),
            messagesContainer: document.getElementById('messages'),
            chatsList: document.getElementById('chatsList'),
            currentChatTitle: document.getElementById('currentChatTitle'),
            friendsList: document.getElementById('friendsList'),
            friendRequestsList: document.getElementById('friendRequestsList'),
            blockedUsersList: document.getElementById('blockedUsersList'),
            contextMenu: document.getElementById('contextMenu'),
            profileModal: document.getElementById('profileModal'),
            closeProfile: document.getElementById('closeProfile'),
            friendsButton: document.getElementById('friendsButton'),
            friendRequestsButton: document.getElementById('friendRequestsButton'),
            blockedUsersButton: document.getElementById('blockedUsersButton')
        };

        makeDraggable(this.elements.contextMenu);

        this.elements.blockedUsersButton.addEventListener('click', () => {
            this.switchToBlockedUsers();
        });

        this.elements.friendsList.style.display = 'block';
        this.elements.friendRequestsList.style.display = 'none';
        this.elements.blockedUsersList.style.display = 'none';

        this.elements.friendsButton.classList.add('active');
        this.elements.friendRequestsButton.classList.remove('active');
        this.elements.blockedUsersButton.classList.remove('active');
    }

    initializeGeneralChat() {
        if (!this.chats.has('general')) {
            this.chats.set('general', []);
            this.createChatElement('general', 'General Chat', false);
            this.updateMessagesDisplay();
        }
    }

    toggleChat() {
        const isOpen = this.elements.chatContainer.classList.toggle('open');
        this.elements.chatToggle.style.display = isOpen ? 'none' : 'block';
    }

    closeChat() {
        this.elements.chatContainer.classList.remove('open');
        this.elements.chatToggle.style.display = 'block';
    }

    switchChat(chatId) {
        this.currentChat = chatId;
        this.updateActiveTab();
        this.updateMessagesDisplay();
        this.elements.currentChatTitle.textContent =
            chatId === 'general'
                ? 'General Chat'
                : chatId.replace('private-', '').charAt(0) +
                chatId.replace('private-', '').slice(1);
        this.unreadCounts[chatId] = 0;
        this.updateBadge(chatId);

        if (chatId === 'general' || !this.disabledChats[chatId]) {
            this.elements.messageInput.disabled = false;
        } else {
            this.elements.messageInput.disabled = true;
        }
    }

    updateActiveTab() {
        document.querySelectorAll('.chat-tab').forEach((tab) => {
            tab.classList.toggle('active', tab.dataset.chat === this.currentChat);
        });
    }

    updateMessagesDisplay() {
        let messages = this.chats.get(this.currentChat) || [];
        this.elements.messagesContainer.innerHTML = messages
            .map((msg) => this.createMessageElement(msg))
            .join('');
        this.scrollToBottom();
    }

    createMessageElement(msg) {
        const time = new Date();
        const hours = time.getHours().toString().padStart(2, '0');
        const minutes = time.getMinutes().toString().padStart(2, '0');
        const formattedTime = `${hours}:${minutes}`;

        if (msg.from === 'system') {
            return `<div class="message system">
                        <div class="text">${msg.content}</div>
                    </div>`;
        } else {
            const className = msg.from === this.username ? 'self' : 'other';
            return `<div class="message ${className}">
                        <div class="sender">
                            ${msg.from.charAt(0) + msg.from.slice(1)}
                        </div>
                        <div class="text">
                            ${msg.content}
                        </div>
                        <div class="time">${formattedTime}</div>
                    </div>`;
        }
    }

    blockUser(user) {
        this.blockedUsers.add(user);

        if (this.friends.has(user)) {
            this.socket.send(JSON.stringify({ type: "remove_friend", to: user }));
            this.friends.delete(user);
            this.updateFriendsList();
        }

        const chatId = this.getPrivateChatId(this.username, user);
        if (this.chats.has(chatId)) {
            this.disablePrivateChat(chatId);
            this.addMessageToChat(chatId, {
                date: new Date().toISOString(),
                from: 'system',
                to: chatId,
                content: `You have blocked ${user.charAt(0) + user.slice(1)}.`
            });
        }

        this.socket.send(JSON.stringify({ type: "block_user", to: user }));
    }

    unblockUser(user) {
        if (this.blockedUsers.has(user)) {
            this.blockedUsers.delete(user);
            this.socket.send(JSON.stringify({ type: "unblock_user", to: user }));
            const chatId = this.getPrivateChatId(this.username, user);
            if (this.chats.has(chatId)) {
                this.addMessageToChat(chatId, {
                    date: new Date().toISOString(),
                    from: 'system',
                    to: chatId,
                    content: `You have unblocked ${user.charAt(0) + user.slice(1)}.`
                });
                if (this.currentChat === chatId && this.friends.has(user)) {
                    this.enablePrivateChat();
                }
            }
            this.updateBlockedUsersList();
        }
    }

    addMessageToChat(chatId, msg) {
        const sender = msg.from || 'system';
        msg.from = sender;

        if (sender !== 'system' && this.blockedUsers.has(sender)) {
            return;
        }

        if (!this.chats.has(chatId)) {
            this.chats.set(chatId, []);
        }
        this.chats.get(chatId).push(msg);

        if (chatId !== this.currentChat && chatId.startsWith('private-')) {
            if (!this.unreadCounts[chatId]) {
                this.unreadCounts[chatId] = 0;
            }
            this.unreadCounts[chatId]++;
            this.updateBadge(chatId);
        }
        if (this.currentChat === chatId) {
            this.updateMessagesDisplay();
        }
    }

    updateBadge(chatId) {
        const tab = document.querySelector(`.chat-tab[data-chat="${chatId}"]`);
        if (!tab) return;
        const badge = tab.querySelector('.unread-badge');
        if (badge) {
            const count = this.unreadCounts[chatId] || 0;
            badge.textContent = count;
            badge.style.display = count > 0 ? 'block' : 'none';
        }
    }

    scrollToBottom() {
        this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
    }

    createChatElement(chatId, title, closable) {
        if (document.querySelector(`.chat-tab[data-chat="${chatId}"]`)) return;
        const chatTab = document.createElement('div');
        chatTab.className = 'chat-tab active';
        chatTab.dataset.chat = chatId;
        chatTab.textContent = title.charAt(0) + title.slice(1);
        const badge = document.createElement('span');
        badge.className = 'unread-badge';
        badge.textContent = '0';
        chatTab.appendChild(badge);
        if (closable) {
            const closeBtn = document.createElement('span');
            closeBtn.className = 'tab-close';
            closeBtn.textContent = '×';
            chatTab.appendChild(closeBtn);
        }
        this.elements.chatsList.appendChild(chatTab);
        this.updateActiveTab();
    }

    closePrivateChat(chatId) {
        if (chatId === 'general') return;
        this.chats.delete(chatId);
        const tab = document.querySelector(`.chat-tab[data-chat="${chatId}"]`);
        if (tab) tab.remove();
        if (this.currentChat === chatId) {
            this.switchChat('general');
        }
    }

    openPrivateChat(user) {
        if (!this.friends.has(user)) return;
        const chatId = this.getPrivateChatId(this.username, user);
        if (!this.chats.has(chatId) && !document.querySelector(`.chat-tab[data-chat="${chatId}"]`)) {
            this.chats.set(chatId, []);
            this.createChatElement(chatId, user, true);
            this.addMessageToChat(chatId, {
                date: new Date().toISOString(),
                from: 'system',
                to: chatId,
                content: `Private chat with ${user.charAt(0) + user.slice(1)} started.`
            });
            this.socket.send(JSON.stringify({ type: "private_chat_started", to: user }));
        }
        this.selectedUser = user;
        this.switchChat(chatId);
        this.enablePrivateChat();
    }

    disablePrivateChat(chatId) {
        if (!this.disabledChats[chatId]) {
            this.addMessageToChat(chatId, {
                date: new Date().toISOString(),
                from: 'system',
                to: chatId,
                content: 'You are no longer friends. You cannot send messages in this chat.'
            });
            this.disabledChats[chatId] = true;
        }
        if (this.currentChat === chatId) {
            this.elements.messageInput.disabled = true;
        }
    }

    enablePrivateChat() {
        if (this.currentChat !== 'general') {
            this.elements.messageInput.disabled = false;
        }
    }

    sendMessage() {
        let text = this.elements.messageInput.value;
        if (!text) return;
        text = encodeURIComponent(text);
        const messagePayload = {
            content: text,
            date: new Date().toISOString()
        };

        if (this.currentChat.startsWith('private-')) {
            const friend = this.getChatPartner(this.currentChat);
            messagePayload.chat = 'private';
            messagePayload.to = friend;
        } else if (this.currentChat === 'general') {
            messagePayload.chat = 'general';
            messagePayload.to = 'general';
        }
        this.socket.send(JSON.stringify({ type: "send_message", ...messagePayload }));
        this.elements.messageInput.value = '';
    }

    updateFriendsList() {
        if (!this.elements.friendsList) return;
        this.elements.friendsList.textContent = '';
        this.elements.friendsList.textContent = '';
        this.friends.forEach((user) => {
            const friendItem = document.createElement('div');
            friendItem.className = 'friend-item';
            friendItem.dataset.user = user;
            friendItem.textContent = user.charAt(0) + user.slice(1);
            this.elements.friendsList.appendChild(friendItem);
        });
    }

    updateFriendRequestsUI() {
        if (!this.elements.friendRequestsList) return;

        this.elements.friendRequestsList.textContent = '';

        this.receivedRequests.forEach((req, index) => {
            const fromUser = (req && typeof req === 'object' && req.from)
                ? req.from
                : String(req);
            const formattedName = fromUser.charAt(0) + fromUser.slice(1);

            const item = document.createElement('div');
            item.className = 'friend-request-item';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = formattedName;
            item.appendChild(nameSpan);

            const buttonsDiv = document.createElement('div');
            const acceptButton = document.createElement('button');
            acceptButton.className = 'accept-request';
            acceptButton.dataset.index = index;

            const rejectButton = document.createElement('button');
            rejectButton.className = 'reject-request';
            rejectButton.dataset.index = index;

            buttonsDiv.appendChild(acceptButton);
            buttonsDiv.appendChild(rejectButton);
            item.appendChild(buttonsDiv);

            this.elements.friendRequestsList.appendChild(item);
        });

        document.querySelectorAll('.accept-request').forEach(btn => {
            btn.onclick = e => {
                const idx = e.currentTarget.dataset.index;
                const req = this.receivedRequests[idx];
                const fromUser = (req && req.from) ? req.from : String(req);

                this.socket.send(JSON.stringify({
                    type: "friend_response",
                    to: fromUser,
                    accepted: true
                }));
                this.friends.add(fromUser);

                const chatId = this.getPrivateChatId(this.username, fromUser);
                if (this.disabledChats[chatId]) {
                    delete this.disabledChats[chatId];
                    if (this.currentChat === chatId) {
                        this.enablePrivateChat();
                    }
                }
                this.receivedRequests.splice(idx, 1);
                this.updateFriendRequestsUI();
                this.updateFriendsList();
            };
        });

        document.querySelectorAll('.reject-request').forEach(btn => {
            btn.onclick = e => {
                const idx = e.currentTarget.dataset.index;
                const req = this.receivedRequests[idx];
                const fromUser = (req && req.from) ? req.from : String(req);

                this.socket.send(JSON.stringify({
                    type: "friend_response",
                    to: fromUser,
                    accepted: false
                }));

                this.receivedRequests.splice(idx, 1);
                this.updateFriendRequestsUI();
            };
        });

        const badge = document.getElementById('friendRequestsBadge');
        if (badge) {
            if (this.receivedRequests.length > 0) {
                badge.style.display = 'inline-block';
                badge.textContent = this.receivedRequests.length;
            } else {
                badge.style.display = 'none';
            }
        }
    }

    updateBlockedUsersList() {
        if (!this.elements.blockedUsersList) return;
        this.elements.blockedUsersList.textContent = '';
        this.elements.blockedUsersList.textContent = '';
        this.blockedUsers.forEach((user) => {
            const blockedItem = document.createElement('div');
            blockedItem.className = 'blocked-user-item';
            blockedItem.dataset.user = user;
            blockedItem.textContent = user.charAt(0) + user.slice(1);
            this.elements.blockedUsersList.appendChild(blockedItem);
        });
    }

    switchToBlockedUsers() {
        this.elements.friendsList.style.display = 'none';
        this.elements.friendRequestsList.style.display = 'none';
        this.elements.blockedUsersList.style.display = 'block';
        this.elements.friendsButton.classList.remove('active');
        this.elements.friendRequestsButton.classList.remove('active');
        this.elements.blockedUsersButton.classList.add('active');
        this.updateBlockedUsersList();
    }

    async showContextMenuForUser(user, x, y) {
        this.selectedUser = user;
        const menu = this.elements.contextMenu;
        menu.style.display = 'block';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        const chatItem = menu.querySelector('[data-action="chat"]');
        const addFriendItem = menu.querySelector('[data-action="addFriend"]');
        const inviteItem = menu.querySelector('[data-action="invite"]');
        const profileItem = menu.querySelector('[data-action="profile"]');
        const blockItem = menu.querySelector('[data-action="block"]');

        const online = await is_online(user);
        if ((user === this.username) || (user !== this.username && online === false)) {
            chatItem.style.display = 'none';
            addFriendItem.style.display = 'none';
            if (inviteItem) inviteItem.style.display = 'none';
            profileItem.style.display = 'block';
            blockItem.style.display = 'none';
            return;
        }

        if (this.blockedUsers.has(user)) {
            chatItem.style.display = 'none';
            if (inviteItem) inviteItem.style.display = 'none';
            addFriendItem.style.display = 'block';
            if (this.friends.has(user)) {
                addFriendItem.textContent = 'Remove Friend';
                addFriendItem.style.opacity = '1';
            } else if (this.pendingRequests.has(user)) {
                addFriendItem.textContent = 'Request Sent';
                addFriendItem.style.opacity = '0.6';
            } else {
                addFriendItem.textContent = 'Add Friend';
                addFriendItem.style.opacity = '1';
            }
            profileItem.style.display = 'block';
            blockItem.style.display = 'block';
            blockItem.textContent = 'Unblock User';
            return;
        }

        chatItem.style.display = this.friends.has(user) ? 'block' : 'none';

        if (user === 'general') {
            addFriendItem.style.display = 'none';
        } else {
            addFriendItem.style.display = 'block';
            if (this.friends.has(user)) {
                addFriendItem.textContent = 'Remove Friend';
                addFriendItem.style.opacity = '1';
            } else if (this.pendingRequests.has(user)) {
                addFriendItem.textContent = 'Request Sent';
                addFriendItem.style.opacity = '0.6';
            } else {
                addFriendItem.textContent = 'Add Friend';
                addFriendItem.style.opacity = '1';
            }
        }

        if (inviteItem) inviteItem.style.display = 'block';
        profileItem.style.display = 'block';
        blockItem.style.display = 'block';
        blockItem.textContent = 'Block User';
    }
    
    hideContextMenu() {
        this.elements.contextMenu.style.display = 'none';
    }

    async handleContextAction(action) {
        switch (action) {
            case 'chat':
                if (await is_online(this.selectedUser) === false) {
                    this.hideContextMenu();
                    showInfoModal("The user is no longer online", () => { });
                    return;
                }
                this.openPrivateChat(this.selectedUser);
                break;
            case 'addFriend':
                if (await is_online(this.selectedUser) === false) {
                    this.hideContextMenu();
                    showInfoModal("The user is no longer online", () => { });
                    return;
                }
                if (this.blockedUsers.has(this.selectedUser)) {
                    this.addMessageToChat(this.currentChat, {
                        date: new Date().toISOString(),
                        from: 'system',
                        to: this.currentChat,
                        content: `You cannot send a friend request to ${this.selectedUser.charAt(0) + this.selectedUser.slice(1)} because you blocked him.`
                    });
                } else {
                    if (this.friends.has(this.selectedUser)) {
                        this.socket.send(JSON.stringify({ type: "remove_friend", to: this.selectedUser }));
                        this.friends.delete(this.selectedUser);
                        this.updateFriendsList();
                        if (this.currentChat === `private-${this.selectedUser}`) {
                            this.disablePrivateChat(this.currentChat);
                        }
                    } else {
                        if (!this.pendingRequests.has(this.selectedUser)) {
                            this.pendingRequests.add(this.selectedUser);
                            this.socket.send(JSON.stringify({ type: "friend_request", to: this.selectedUser }));
                        }
                    }
                }
                break;
            case 'profile':
                this.showUserProfile();
                break;
            case 'invite':
                break;
            case 'block':
                if (await is_online(this.selectedUser) === false) {
                    this.hideContextMenu();
                    showInfoModal("The user is no longer online", () => { });
                    return;
                }
                if (this.blockedUsers.has(this.selectedUser)) {
                    this.unblockUser(this.selectedUser);
                } else {
                    this.blockUser(this.selectedUser);
                }
                break;
            default:
                break;
        }
        this.hideContextMenu();
    }

    showUserProfile() {
        const modal = this.elements.profileModal;
        const profileStatusElement = document.getElementById('profileStatus');
        document.getElementById('profileName').textContent =
            this.selectedUser.charAt(0) + this.selectedUser.slice(1);

        if (this.selectedUser === this.username) {
            profileStatusElement.style.display = 'none';
        } else {
            profileStatusElement.style.display = 'block';
            profileStatusElement.textContent = this.friends.has(this.selectedUser) ? 'Friend' : 'Not a Friend';
        }
        modal.style.display = 'block';
        this.set_profile_info(this.selectedUser);
    }

    async set_profile_info(user_in_chat) {
        const profileDetails = document.querySelector('.profile-details');
        const statusIndicator = profileDetails?.querySelector('#statusIndicator');
        const lastOnline     = profileDetails?.querySelector('#lastOnline');

        const userimage = document.querySelector("#profileAvatar");
        const realname  = document.getElementById('realname');
        const userEmail = document.getElementById('userEmail');
        const userBio   = document.getElementById('userBio');
    
        if (!current_user) return;
    
        const online = await is_online(user_in_chat);
            lastOnline.textContent = online ? 'ONLINE' : 'OFFLINE';
    
        if (online) {
            await this.set_online_data(
                userimage, statusIndicator, realname, userEmail, userBio, user_in_chat
            );
            this.requestUserStats(user_in_chat);
        } else {
            this.set_offline_data(
                userimage, statusIndicator, realname, userEmail, userBio, user_in_chat
            );
        }
    }

    requestUserStats(user) {
        const data = JSON.stringify({
          username:  user,
          get_stats: "true"
        });
      
        fetch("http://localhost:8008/", {
          method: "get_pong_games",
          body:   data
        })
        .then(res => res.json())
        .then(data => {
          if (data.success === "true") {
            this.updateProfileStats(data.wins, data.losses);
          } else {
            showInfoModal("Error stats:", data.status);
          }
        })
        .catch(err => {
          showInfoModal("Network error:", err);
        });
    }
      
    updateProfileStats(wins, losses) {
        document.getElementById("userWins").textContent   = wins;
        document.getElementById("userLosses").textContent = losses;
    }   

    async set_online_data(userimage, statusIndicator, realname, userEmail, userBio, user_in_chat) {
        statusIndicator.classList.replace('offline', 'online');
        let user_selected;
        if (current_user.display_name !== user_in_chat)
            user_selected = await another_user_info(user_in_chat);
        else
            user_selected = current_user;
        if (!user_selected)
            return;

        if (user_selected.realname)
            realname.textContent = user_selected.realname;
        else
            realname.textContent = "No Realname for this user";

        if (user_selected.email)
            userEmail.textContent = user_selected.email;
        else
            userEmail.textContent = "No Email for this user";


        if (user_selected.bio)
            userBio.textContent = user_selected.bio;
        else
        {
            userBio.textContent = "No Bio for this user";
        }
        userimage.src = user_selected.image;
    }

    set_offline_data(userimage, statusIndicator, realname, userEmail, userBio) {
        realname.textContent = "No Realname for this user";
        userEmail.textContent = "No Email for this user";
        userBio.textContent = "No Bio for this user";
        userimage.src = "../website/images/offline.png";
        statusIndicator.classList.replace('online', 'offline');
    }
}

export default ChatApp;