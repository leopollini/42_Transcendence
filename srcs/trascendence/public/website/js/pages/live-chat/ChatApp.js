import { initSocket } from './socketHandler.js';
import { makeDraggable } from './domUtils.js';
import { setupEventListeners } from './eventListeners.js';
import { current_user } from '../../main.js';
import { escapeHTML } from '../../security/security.js';
import { showInfoModal } from '../../modal.js';
class ChatApp {
    constructor() {
        this.chats = new Map();
        this.unreadCounts = {}; // { chatId: number of unread messages }
        this.currentChat = 'general';
        this.friends = new Set();
        this.pendingRequests = new Set();
        this.receivedRequests = []; // Array of objects { from }
        this.selectedUser = null;
        this.username = null;
        this.blockedUsers = new Set();
        this.disabledChats = {};
        this.userColors = new Map(); // Map to store assigned colors for users
        this.assignedColors = new Set();
        this.initialize();
    }

    // Returns the chat partner for a private chat
    getChatPartner(chatId) {
        const parts = chatId.replace('private-', '').split('-');
        return parts[0] === this.username ? parts[1] : parts[0];
    }

    // Generates the private chat ID based on the usernames
    getPrivateChatId(user1, user2) {
        return user1 < user2 ? `private-${user1}-${user2}` : `private-${user2}-${user1}`;
    }

    initialize() {
        this.initializeElements();
        setupEventListeners(this);
        this.initializeGeneralChat();

        if (current_user && current_user.display_name)
            this.username = current_user.display_name;
        else
            this.username = "default";

        this.socket = initSocket(this.username, this);
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
        const messages = this.chats.get(this.currentChat) || [];
        this.elements.messagesContainer.innerHTML = messages
            .map((msg) => this.createMessageElement(msg))
            .join('');
        this.scrollToBottom();
    }

    createMessageElement(msg) {
        if (msg.from === 'system') {
            return `<div class="message system"><div class="text">${msg.content}</div></div>`;
        } else {
            const className = msg.from === this.username ? 'self' : 'other';
            const senderColor = this.getUserColor(msg.from);
            const time = new Date();
            const hours = time.getHours().toString().padStart(2, '0');
            const minutes = time.getMinutes().toString().padStart(2, '0');
            const formattedTime = `${hours}:${minutes}`;

            return `<div class="message ${className}">
                        <div class="sender" style="color: ${senderColor};">
                            ${msg.from.charAt(0) + msg.from.slice(1)}
                        </div>
                        <div class="text">${msg.content}</div>
                        <div class="time">${formattedTime}</div>
                    </div>`;
        }
    }

    getUserColor(username) {
        if (this.userColors.has(username)) {
            return this.userColors.get(username);
        }

        let color;
        do {
            color = this.generateRandomColor();
        } while (this.assignedColors.has(color));

        this.userColors.set(username, color);
        this.assignedColors.add(color);
        return color;
    }

    generateRandomColor() {
        let color;
        do {
            const hue = Math.floor(Math.random() * 360);
            color = `hsl(${hue}, 70%, 50%)`;
        } while (this.isForbiddenColor(color));
        return color;
    }

    isForbiddenColor(color) {
        const forbiddenColors = ['rgb(255, 255, 255)', 'rgb(72, 31, 31)'];
        const div = document.createElement('div');
        div.style.color = color;
        document.body.appendChild(div);
        const computedColor = window.getComputedStyle(div).color;
        document.body.removeChild(div);
        return forbiddenColors.includes(computedColor);
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
        const text = escapeHTML(this.elements.messageInput.value);
        if (!text) return;

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
        this.elements.friendsList.innerHTML = '';
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
        this.elements.friendRequestsList.innerHTML = '';
        this.receivedRequests.forEach((req, index) => {
            const formattedName = req.from.charAt(0) + req.from.slice(1);
            const item = document.createElement('div');
            item.className = 'friend-request-item';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = formattedName;

            const buttonsDiv = document.createElement('div');
            const acceptButton = document.createElement('button');
            acceptButton.className = 'accept-request';
            acceptButton.dataset.index = index;
            const rejectButton = document.createElement('button');
            rejectButton.className = 'reject-request';
            rejectButton.dataset.index = index;

            buttonsDiv.appendChild(acceptButton);
            buttonsDiv.appendChild(rejectButton);
            item.appendChild(nameSpan);
            item.appendChild(buttonsDiv);

            this.elements.friendRequestsList.appendChild(item);
        });

        const acceptButtons = document.querySelectorAll('.accept-request');
        acceptButtons.forEach(btn => {
            btn.onclick = (e) => {
                const idx = e.target.dataset.index;
                const req = this.receivedRequests[idx];
                this.socket.send(JSON.stringify({ type: "friend_response", to: req.from, accepted: true }));
                this.friends.add(req.from);
                const chatId = this.getPrivateChatId(this.username, req.from);
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
        const rejectButtons = document.querySelectorAll('.reject-request');
        rejectButtons.forEach(btn => {
            btn.onclick = (e) => {
                const idx = e.target.dataset.index;
                const req = this.receivedRequests[idx];
                this.socket.send(JSON.stringify({ type: "friend_response", to: req.from, accepted: false }));
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
        this.elements.blockedUsersList.innerHTML = '';
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

    showContextMenuForUser(user, x, y) {
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
    
        // Se l'utente è l'utente corrente, nascondi opzioni non rilevanti
        if (user === this.username && sessionStorage.getItem("type") === "login"){
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

    handleContextAction(action) {
        switch (action) {
            case 'chat':
                this.openPrivateChat(this.selectedUser);
                break;
            case 'addFriend':
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

    set_profile_info()
    {
        console.log("user = ", current_user);
        const userimage = document.querySelector("#profileAvatar");
        const profileDetails = document.querySelector('.profile-details');
        const lastOnline = profileDetails.querySelector('#lastOnline');
        const statusIndicator = profileDetails.querySelector('#statusIndicator');
        const realname = document.querySelector('p > #realname').parentElement;
        const userEmail = document.querySelector('p > #userEmail').parentElement;
        const userBio = document.querySelector('#userBio');
        if (current_user)
        {
            lastOnline.textContent = "Online";
            statusIndicator.classList.remove('offline');
            statusIndicator.classList.add('online');
            if (sessionStorage.getItem("type", 1) === "login")
            {
                realname.textContent = current_user.realname;
                userEmail.textContent = current_user.email;
            }
            else
            {
                realname.style.display = 'none';
                userEmail.style.display = 'none';
            }
            if (!current_user.bio)
                userBio.textContent = "no bio yet";
            else
                userBio.textContent = current_user.bio;
            userimage.src = current_user.image;
        }
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
        this.set_profile_info();
        modal.style.display = 'block';
    }
}

export default ChatApp;