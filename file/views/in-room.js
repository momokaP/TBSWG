const urlParams = new URLSearchParams(window.location.search);
const roomId = parseInt(urlParams.get('id'));

let rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
let currentRoom = rooms.find(room => room.id === roomId);

if (!currentRoom) {
    alert('Room not found');
    window.location.href = 'index.html';
}

currentRoom.users = currentRoom.users || [];
currentRoom.messages = currentRoom.messages || [];
currentRoom.host = currentRoom.host || currentRoom.users[0] || 'Anonymous';

const currentUser = 'User' + Math.floor(Math.random() * 1000); // 임시 사용자 ID
if (!currentRoom.users.includes(currentUser)) {
    currentRoom.users.push(currentUser);
}

function updateRoom() {
    localStorage.setItem('rooms', JSON.stringify(rooms));
    renderUsers();
    renderChat();
    checkHost();
}

function renderUsers() {
    const userList = document.getElementById('userList');
    userList.innerHTML = '';
    currentRoom.users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user;
        userList.appendChild(li);
    });
}

function renderChat() {
    const chatBox = document.getElementById('chatBox');
    chatBox.innerHTML = '';
    currentRoom.messages.forEach(message => {
        const p = document.createElement('p');
        p.textContent = `${message.user}: ${message.text}`;
        chatBox.appendChild(p);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
}

function checkHost() {
    const deleteRoomButton = document.getElementById('deleteRoomButton');
    if (currentUser === currentRoom.host) {
        deleteRoomButton.classList.remove('hidden');
    } else {
        deleteRoomButton.classList.add('hidden');
    }
}

document.getElementById('roomName').textContent = currentRoom.name;

document.getElementById('chatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    if (message) {
        currentRoom.messages.push({ user: currentUser, text: message });
        chatInput.value = '';
        updateRoom();
    }
});

document.getElementById('readyButton').addEventListener('click', () => {
    alert('All users are ready. Starting the game!');
    rooms = rooms.filter(room => room.id !== roomId);
    localStorage.setItem('rooms', JSON.stringify(rooms));
    window.location.href = 'index.html';
});

document.getElementById('leaveButton').addEventListener('click', () => {
    currentRoom.users = currentRoom.users.filter(user => user !== currentUser);
    if (currentRoom.users.length === 0) {
        rooms = rooms.filter(room => room.id !== roomId);
    } else if (currentUser === currentRoom.host) {
        currentRoom.host = currentRoom.users[0];
    }
    localStorage.setItem('rooms', JSON.stringify(rooms));
    window.location.href = 'index.html';
});

document.getElementById('deleteRoomButton').addEventListener('click', () => {
    if (currentUser === currentRoom.host) {
        rooms = rooms.filter(room => room.id !== roomId);
        localStorage.setItem('rooms', JSON.stringify(rooms));
        alert('Room deleted');
        window.location.href = 'index.html';
    }
});

updateRoom();

// 주기적으로 방 정보를 업데이트합니다 (실제 서버 통신을 대체)
setInterval(updateRoom, 1000);

