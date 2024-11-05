const canvas = document.getElementById("hexMap");
const ctx = canvas.getContext("2d");

// 육각형 타일의 반지름
const hexRadius = 30; // 육각형 반지름
const rows = 45; // 행 수
const cols = 45; // 열 수
const hexMap = []; // 육각형 타일 정보를 저장할 배열

// 캔버스 크기 설정
canvas.width = (cols + 3) * hexRadius * Math.sqrt(3); // 타일의 수에 맞춰 캔버스 너비 설정
canvas.height = (rows + 3) * hexRadius * 1.5; // 타일의 수에 맞춰 캔버스 높이 설정

// 육각형 타일 클래스 정의
class HexTile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.defaultColor = "lightblue";
        this.color = this.defaultColor;
        this.isHovered = false; // hover 상태
    }

    // 색상 설정
    setColor(color) {
        this.color = color;
    }

    // 육각형 그리기
    draw(ctx) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 3 * (i + 0.5); // 각도를 30도 회전
            const xPos = this.x + hexRadius * Math.cos(angle);
            const yPos = this.y + hexRadius * Math.sin(angle);
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
    }

    // 색상 반전 함수
    invertColor(color) {
        if (color === "red") return "cyan";
        if (color === "lightblue") return "darkblue";
        return color;        
    }

    // hover 상태 업데이트
    updateHover(mouseX, mouseY) {
        const hexPath = new Path2D();
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 3 * (i + 0.5);
            const xPos = this.x + hexRadius * Math.cos(angle);
            const yPos = this.y + hexRadius * Math.sin(angle);
            if (i === 0) {
                hexPath.moveTo(xPos, yPos);
            } else {
                hexPath.lineTo(xPos, yPos);
            }
        }
        hexPath.closePath();
        this.isHovered = ctx.isPointInPath(hexPath, mouseX, mouseY); // hover 상태 업데이트
    }
}

// 육각형 맵 생성
function createHexMap(rows, cols) {
    const offsetX = (canvas.width - cols * hexRadius * Math.sqrt(3)) / 2; // 중앙 정렬을 위한 x 오프셋
    const offsetY = (canvas.height - rows * hexRadius * 1.5) / 2; // 중앙 정렬을 위한 y 오프셋

    for (let row = 0; row < rows; row++) {
        hexMap[row] = []; // 각 행을 초기화
        for (let col = 0; col < cols; col++) {
            let x = col * hexRadius * Math.sqrt(3) + (row % 2) * (hexRadius * Math.sqrt(3) / 2); // 홀수 행 오프셋
            let y = row * hexRadius * 1.5; // 세로 간격

            x = x + offsetX;
            y = y + offsetY;

            // HexTile 객체 생성
            const tile = new HexTile(x, y); // 타일 위치 설정
            hexMap[row][col] = tile; // 타일 객체 저장
            tile.draw(ctx); // 타일 그리기
        }
    }
    // 특정 좌표에 있는 타일들을 빨간색으로 설정
    markRedTiles();
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
            const wasHovered = hex.isHovered;
            hex.updateHover(mouseX, mouseY);
            if (hex.isHovered !== wasHovered) {
                needsRedraw = true;
            }
        });
    });

    if (needsRedraw) {
        requestAnimationFrame(drawMap);
        needsRedraw = false;
    }
});

// 맵을 다시 그리는 함수
function drawMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hexMap.forEach(row => {
        row.forEach(hex => {
            hex.draw(ctx);
        });
    });
}

// 맵 생성 함수 호출
createHexMap(rows, cols); // 45행, 45열의 육각형 맵
