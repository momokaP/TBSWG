let rooms = JSON.parse(localStorage.getItem('rooms') || '[]');

const roomsPerPage = 10;
let currentPage = 1;

function renderRooms() {
    const roomList = document.getElementById('roomList');
    roomList.innerHTML = '';

    const startIndex = (currentPage - 1) * roomsPerPage;
    const endIndex = startIndex + roomsPerPage;
    const currentRooms = rooms.slice(startIndex, endIndex);

    currentRooms.forEach(room => {
        const li = document.createElement('li');
        li.className = 'p-4 border-b hover:bg-gray-100 cursor-pointer';
        li.textContent = room.name;
        li.addEventListener('click', () => {
            window.location.href = `room.html?id=${room.id}`;
        });
        roomList.appendChild(li);
    });

    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(rooms.length / roomsPerPage);
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prevButton').disabled = currentPage === 1;
    document.getElementById('nextButton').disabled = currentPage === totalPages;
}

document.getElementById('prevButton').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderRooms();
    }
});

document.getElementById('nextButton').addEventListener('click', () => {
    const totalPages = Math.ceil(rooms.length / roomsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderRooms();
    }
});

// 페이지 로드 시 방 목록을 렌더링합니다.
renderRooms();

