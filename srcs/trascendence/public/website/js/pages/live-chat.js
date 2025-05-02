export default function LiveChat() {
    return `
        <button class="chat-toggle" id="chatToggle">Live Chat</button>
        <div class="context-menu" id="contextMenu">
            <div class="context-menu-item" data-action="chat">Open Private Chat</div>
            <div class="context-menu-item" data-action="addFriend">Add Friend</div>
            <div class="context-menu-item" data-action="block">Block User</div>
            <div class="context-menu-item" data-action="profile">View Profile</div>
            <div class="context-menu-item" id="contextInvite" data-action="invite">Invite To The Game</div>
        </div>
        <div class="profile-modal" id="profileModal">
            <div class="profile-header">
                <div class="header-left">
                    <!-- Avatar Profilo e Info Utente -->
                    <img src="test.png" alt="Avatar" class="profile-avatar" id="profileAvatar">
                    <div class="profile-info">
                        <div class="profile-title-wrapper">
                            <!-- Nome utente -->
                            <h3 class="chat-title" id="profileName">Nome Utente</h3>
                            <div class="profile-stats" id="profileStats">
                                <!-- Statistiche del profilo -->
                            W: <span id="userWins">0</span> | L: <span id="userLosses">0</span>
                            </div>
                        </div>
                        <!-- Stato dell'utente (Online/Offline) -->
                        <div class="friend-status" id="profileStatus">Stato Amico</div>
                    </div>
                </div>
                <!-- Pulsante chiudi -->
                <button class="close-profile" id="closeProfile">&times;</button>
            </div>
            <div class="profile-details">
                <!-- Dettagli utente -->
                <p>
                    <strong>Stato:</strong>
                    <span id="lastOnline" class="status-text offline">Offline</span>
                    <span id="statusIndicator" class="status-indicator offline"></span>
                </p>
                <p><strong>Nome reale:</strong><span id="realname">Nome Reale Utente</span></p>
                <p><strong>Email:</strong><span id="userEmail">utente@example.com</span></p>
                <p><strong>Bio:</strong><span id="userBio"></span></p>
            </div>
        </div>
        <div class="chat-container" id="chatContainer">
            <div class="left-panel">
                <div class="chats-list" id="chatsList">
                    <div class="chat-tab active" data-chat="general">General Chat</div>
                </div>
                <div class="friends-tabs">
                    <img id="friendsButton" class="active" src="website/images/friends.png" alt="Friends">
                    <div id="friendRequestsButtonContainer" class="friend-requests-container">
                        <img id="friendRequestsButton" src="website/images/add-friend.png" alt="Requests">
                          <span id="friendRequestsBadge" class="friend-badge"></span>
                    </div>                
                    <img id="blockedUsersButton" src="website/images/block-user.png" alt="Blocked">
                </div>
                <div class="friends-content">
                    <!-- Lista amici -->
                    <div class="friends-list" id="friendsList"></div>
                    <!-- Lista richieste di amicizia -->
                    <div id="friendRequestsList" class="friend-requests-list"></div>
                    <!-- Lista utenti bloccati -->
                    <div id="blockedUsersList" class="blocked-users-list"></div>
                </div>
            </div>
            <div class="main-chat">
                <header class="chat-header">
                    <h2 class="chat-title" id="currentChatTitle">General Chat</h2>
                    <button class="icon-button" id="closeChat">×</button>
                </header>
                <div class="messages-container" id="messages"></div>
                <div class="input-area">
                    <input type="text" class="message-input" id="messageInput" placeholder="Type your message..." autocomplete="off">
                    <button class="send-button" id="sendButton">Send</button>
                </div>
            </div>
        </div>
    `;
}
