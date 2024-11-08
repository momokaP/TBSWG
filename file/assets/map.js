const canvas = document.getElementById("hexMap");
const ctx = canvas.getContext("2d");

const tileSizeSlider = document.getElementById("tileSizeSlider");
const moveSpeedSlider = document.getElementById("moveSpeedSlider");
const tileSizeValue = document.getElementById("tileSizeValue");
const moveSpeedValue = document.getElementById("moveSpeedValue");

// 육각형 타일의 반지름
let hexRadius = 50; // 육각형 반지름
const rows = 45; // 행 수
const cols = 45; // 열 수
const hexMap = []; // 육각형 타일 정보를 저장할 배열
let scaleChange = 1;

// 맵의 이동을 위한 변수
let mapOffsetX = 0;
let mapOffsetY = 0;

// 캔버스 크기 설정
// canvas.width = (cols + 3) * hexRadius * Math.sqrt(3); // 타일의 수에 맞춰 캔버스 너비 설정
// canvas.height = (rows + 3) * hexRadius * 1.5; // 타일의 수에 맞춰 캔버스 높이 설정

// 육각형 타일 클래스 정의
class HexTile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.defaultColor = "lightblue";
        this.color = this.defaultColor;
        this.isHovered = false; // hover 상태
        this.dirty = true;  // 타일의 상태가 변경되었을 때만 true로 설정
    }

    // 색상 설정
    setColor(color) {
        this.color = color;
    }

    // 육각형 그리기
    draw(ctx, offsetX = 0, offsetY = 0) {
        if (!this.dirty) return;

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * (i + 0.5); // 각도를 30도 회전
            const xPos = this.x + hexRadius * Math.cos(angle) + offsetX;
            const yPos = this.y + hexRadius * Math.sin(angle) + offsetY;
            if (i === 0) {
                ctx.moveTo(xPos, yPos);
            } else {
                ctx.lineTo(xPos, yPos);
            }
        }
        ctx.closePath();
        ctx.strokeStyle = "black";
        ctx.stroke();
        ctx.fillStyle = this.isHovered ? this.invertColor(this.color) : this.color;
        ctx.fill();

        // 타일을 그린 후 dirty 상태를 false로 리셋
        this.dirty = false;
    }

    // 색상 반전 함수
    invertColor(color) {
        if (color === "red") return "cyan";
        if (color === "lightblue") return "darkblue";
        return color;        
    }

    // hover 상태 업데이트
    updateHover(mouseX, mouseY, offsetX = 0, offsetY = 0) {
        const hexPath = new Path2D();
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 3 * (i + 0.5);
            const xPos = this.x + hexRadius * Math.cos(angle) + offsetX;
            const yPos = this.y + hexRadius * Math.sin(angle) + offsetY;
            if (i === 0) {
                hexPath.moveTo(xPos, yPos);
            } else {
                hexPath.lineTo(xPos, yPos);
            }
        }
        hexPath.closePath();

        const wasHovered = this.isHovered;
        this.isHovered = ctx.isPointInPath(hexPath, mouseX, mouseY); // hover 상태 업데이트
    
        // 상태가 변경되었으면 dirty 상태를 true로 설정
        if (this.isHovered !== wasHovered) {
            this.dirty = true;
        }
    }
}

// 육각형 맵 생성
function createHexMap(rows, cols) {
    const horizontalSpacing = Math.sqrt(3) * hexRadius; // 수평 간격
    const verticalSpacing = 1.5 * hexRadius; // 수직 간격

    const offsetX = (canvas.width - cols * horizontalSpacing) / 2; // 중앙 정렬을 위한 x 오프셋
    const offsetY = (canvas.height - rows * verticalSpacing) / 2; // 중앙 정렬을 위한 y 오프셋

    for (let row = 0; row < rows; row++) {
        hexMap[row] = []; // 각 행을 초기화
        for (let col = 0; col < cols; col++) {
            let x = col * horizontalSpacing + (row % 2) * (horizontalSpacing / 2);
            let y = row * verticalSpacing;

            x = (x + offsetX);// + mapOffsetX*(1-scaleChange);
            y = (y + offsetY);// + mapOffsetY*(1-scaleChange);

            // HexTile 객체 생성
            const tile = new HexTile(x, y); // 타일 위치 설정
            hexMap[row][col] = tile; // 타일 객체 저장
            tile.draw(ctx, mapOffsetX, mapOffsetY); // 타일 그리기
        }
    }
    markRedTiles();
    drawChangedTiles();
}

// 특정 좌표에 있는 타일들을 빨간색으로 설정
function markRedTiles() {
    const redTilePositions = [
        [8-1, 8-1], [8-1, 23-1], [8-1, 38-1],
        [23-1, 8-1], [23-1, 23-1], [23-1, 38-1],
        [38-1, 8-1], [38-1, 23-1], [38-1, 38-1],
        [16-1, 16-1], [30-1, 16-1], [16-1, 30-1], [30-1, 30-1]
    ];

    redTilePositions.forEach(([row, col]) => {
        if (hexMap[row] && hexMap[row][col]) {
            hexMap[row][col].setColor("red");
            hexMap[row][col].dirty=true;
        }
    });
}

// 마우스 이동 이벤트 리스너
let needsRedraw = false;
canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    hexMap.forEach(row => {
        row.forEach(hex => {
            hex.updateHover(mouseX, mouseY, mapOffsetX, mapOffsetY);
        });
    });
    requestAnimationFrame(() => drawChangedTiles()); // 변경된 타일만 다시 그리기
});



let moveSpeed = 10; // 한 번에 이동할 거리 (픽셀 단위
canvas.tabIndex = 1000;  // tabIndex를 설정하여 캔버스가 포커스를 받을 수 있게 합니다.

// 캔버스 클릭 시 포커스 주기
canvas.addEventListener('click', () => {
    canvas.focus();  // 캔버스를 클릭하면 포커스를 줍니다.
});

// 다른 곳을 클릭할 때 캔버스의 포커스를 해제하는 방법
document.addEventListener('click', (event) => {
    // 캔버스를 제외한 다른 부분을 클릭하면 포커스를 해제
    if (!canvas.contains(event.target)) {
        canvas.blur();  // 캔버스 외부를 클릭하면 포커스를 해제
    }
});

// 키보드 입력 이벤트 리스너
canvas.addEventListener('keydown', (event) => {
    // 캔버스에 포커스가 있을 때만 키보드 이벤트를 처리
    if (document.activeElement === canvas) {
        switch (event.key) {
            case 'w':
            case 'ArrowUp':
                mapOffsetY += moveSpeed;  // 위로 이동
                break;
            case 's':
            case 'ArrowDown':
                mapOffsetY -= moveSpeed;  // 아래로 이동
                break;
            case 'a':
            case 'ArrowLeft':
                mapOffsetX += moveSpeed;  // 왼쪽으로 이동
                break;
            case 'd':
            case 'ArrowRight':
                mapOffsetX -= moveSpeed;  // 오른쪽으로 이동
                break;
        }
        requestAnimationFrame(drawMap);
        console.log(`mapOffsetX:${mapOffsetX}, mapOffsetY:${mapOffsetY}`);
    }
});

// 마우스 휠 이벤트 처리
canvas.addEventListener("wheel", (event) => {
    event.preventDefault(); // 기본 스크롤 동작 방지

    const zoomSpeed = 2;  // 휠 스크롤 시 변화 속도
    const oldRadius = hexRadius; // 이전 반지름 저장

    if (event.deltaY < 0) {
        hexRadius += zoomSpeed; // 휠을 위로 올리면 타일 크기 증가
    } else {
        hexRadius -= zoomSpeed; // 휠을 아래로 내리면 타일 크기 감소
    }

    // hexRadius의 범위 제한
    hexRadius = Math.min(Math.max(hexRadius, 10), 100);

    // 스케일 변화 비율 계산
    scaleChange = hexRadius / oldRadius;

    // 기존 offsetX, offsetY 보정 적용
    mapOffsetX *= scaleChange;
    mapOffsetY *= scaleChange;
    
    // 타일 크기 표시 업데이트
    tileSizeValue.textContent = hexRadius;
    tileSizeSlider.value = hexRadius;

    // 맵 다시 그리기
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    createHexMap(rows, cols);

    //console.log(`x00:${hexMap[0][0].x} y00:${hexMap[0][0].y}`)
});

// 타일 크기 슬라이더 값이 변경될 때
tileSizeSlider.addEventListener("input", (event) => {
    hexRadius = parseInt(event.target.value);
    tileSizeValue.textContent = hexRadius;  // 슬라이더 값 표시
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    createHexMap(rows, cols);  // 맵 다시 그리기
});

// 이동 속도 슬라이더 값이 변경될 때
moveSpeedSlider.addEventListener("input", (event) => {
    moveSpeed = parseInt(event.target.value);
    moveSpeedValue.textContent = moveSpeed;  // 슬라이더 값 표시
});

// 맵을 그리는 함수
function drawMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);  // 캔버스를 지운 후

    // 타일을 그릴 때 이동된 위치를 반영
    hexMap.forEach(row => {
        row.forEach(hex => {
            hex.dirty=true;
            hex.draw(ctx, mapOffsetX, mapOffsetY);
        });
    });
}


// 맵을 지우지 않고 변경되 타일만 다시 그리는 함수
function drawChangedTiles() {
    hexMap.forEach(row => {
        row.forEach(hex => {
            hex.draw(ctx, mapOffsetX, mapOffsetY);
        });
    });
}

// 맵 생성 함수 호출
createHexMap(rows, cols); // 45행, 45열의 육각형 맵
