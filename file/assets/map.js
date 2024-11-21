const canvas = document.getElementById("hexMap");
const ctx = canvas.getContext("2d");

const tileSizeSlider = document.getElementById("tileSizeSlider");
const moveSpeedSlider = document.getElementById("moveSpeedSlider");
const tileSizeValue = document.getElementById("tileSizeValue");
const moveSpeedValue = document.getElementById("moveSpeedValue");

let hexRadius = 50; // 육각형 타일의 반지름
const rows = 45; // 행 수
const cols = 45; // 열 수
let mapOffsetX = 0; // 맵의 이동을 위한 변수
let mapOffsetY = 0; // 맵의 이동을 위한 변수
let scaleChange = 1;
let initial = true;
let initialResource = true;
let initial_unit_row = 22; // 유닛 초기 행 위치
let initial_unit_col = 22; // 유닛 초기 열 위치
let turn = 1;

let priceOfbuildUnit = 10;
let priceOfmeleeUnit = 20;
let priceOfrangedUnit = 30;
let priceOfeliteUnit = 40;

let priceOfmainBuilding = 100;
let priceOfdevelopmentBuilding = 150;
let priceOfmeleeUnitBuilding = 200;
let priceOfrangedUnitBuilding = 300;
let priceOfeliteUnitBuilding = 400;

let user1 = "user1";
let test = "test";

// 리스너용 전역 변수들
let isDragging = false; // 마우스 드래그 여부
let startX, startY; // 마우스 드래그 시작 위치 x,y
let moveSpeed = 100; // 한 번에 이동할 거리 (픽셀 단위
canvas.tabIndex = 1000;  // tabIndex를 설정하여 캔버스가 포커스를 받을 수 있게 합니다.
let selectedUnit = null; // 현재 선택된 유닛
let oldSelectedUnit = null; // 이전에 선택된 유닛
let selectedBuilding = null; //현재 선택된 건물

const hexMap = []; // 육각형 타일 정보를 저장할 배열
const unitMap = []; // 유닛 정보를 저장할 배열
const buildingMap = []; // 건물 정보를 저장할 배열

for (let row = 0; row < rows; row++) {
    hexMap[row] = []; // 각 행을 초기화
    unitMap[row] = []; // 각 행을 초기화
    buildingMap[row] = []; // 각 행을 초기화
}

class User{
    constructor(name){
        this.name = name;
        this.unit = [];
        this.numberOfUnit = 0;
        this.building = [];
        this.numberOfBuilding = 0;
        this.resourceAmount = 100;
    }
    insertBuilding(Building){
        this.building[this.numberOfBuilding] = Building;
        this.numberOfBuilding = this.numberOfBuilding + 1;
    }
    deleteBuilding(Building) {
        for (let i = 0; i < this.building.length; i++) {
            if (this.building[i].row === Building.row && 
                this.building[i].col === Building.col) {
    
                this.building.splice(i, 1); // 배열에서 항목 제거
                this.numberOfBuilding--;   // 건물 수 업데이트
                return; // 삭제 후 루프 종료
            }
        }
    }
    insertUnit(Unit){
        this.unit[this.numberOfUnit] = Unit;
        this.numberOfUnit = this.numberOfUnit + 1;
    }
    deleteUnit(Unit) {
        for (let i = 0; i < this.unit.length; i++) {
            if (this.unit[i].row === Unit.row && 
                this.unit[i].col === Unit.col) {
    
                this.unit.splice(i, 1); // 배열에서 항목 제거
                this.numberOfUnit--;   // 유닛 수 업데이트
                return; // 삭제 후 루프 종료
            }
        }
    }
    gatheredResources(){
        let sum = 0;

        for (let i = 0; i < this.numberOfBuilding; i++) {
            if(this.building[i] instanceof mainBuilding){
                let currentTile = hexMap[this.building[i].row][this.building[i].col];
                if (currentTile.resourceAmount > 0) {
                    // 자원 감소
                    currentTile.subtractResources(this.building[i].gatherResources);
                    // 자원이 남았다면, sum에 자원 채취량을 더함
                    sum += this.building[i].gatherResources;
                }
            }
        }

        user.resourceAmount = user.resourceAmount + sum;
    }
}

function showstatus(ctx){
    // 글씨 스타일 설정
    ctx.font = "25px Arial";  // 폰트 크기와 종류 설정
    ctx.fillStyle = "black";    // 글씨 색상 설정
    ctx.textAlign = "center";  // 텍스트 정렬 방식 (가운데 정렬)
    ctx.textBaseline = "middle"; // 텍스트 수직 정렬 (중앙 정렬)

    // 캔버스에 글씨 쓰기, 텍스트의 너비 계산
    const text = `유닛 수: ${user.unit.length} 건물 수: ${user.building.length} 자원: ${user.resourceAmount}`;
    const textWidth = ctx.measureText(text).width;

    const fontSize = parseInt(ctx.font);  // "30px Arial"에서 숫자 부분만 가져오기
    const textHeight = fontSize;  // 일반적으로 세로 크기는 폰트 크기와 같음    
    
    //console.log(`${canvas.width} ${textWidth} ${textHeight}`);
    // 캔버스에 텍스트 쓰기 (오른쪽 상단에 위치)
    ctx.fillStyle = "white";
    ctx.fillRect(canvas.width - textWidth, 0, textWidth, textHeight+3);  // 건물 그리기
    ctx.fillStyle = "black";
    ctx.fillText(text, canvas.width - textWidth + textWidth/2, textHeight - 10);
}

const user = new User(user1);

// 육각형 타일 클래스 정의
class HexTile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.defaultColor = "lightblue";
        this.color = this.defaultColor;
        this.isHovered = false; // hover 상태
        this.isClicked = false;  // 클릭 상태 저장
        this.dirty = true;  // 타일의 상태가 변경되었을 때만 true로 설정
        this.resource = false; // 자원 타일 여부
        this.unit = null; // 유닛 객체
        this.Building = null; //건물 객체
        this.row = null;
        this.col = null;
        this.resourceAmount = null // 자원 양
    }

    addResources(Amount){
        this.resourceAmount = this.resourceAmount + Amount;
    }

    subtractResources(Amount){
        this.resourceAmount = this.resourceAmount - Amount;
    }

    // 색상 설정
    setColor(color) {
        this.color = color;
    }

    // 유닛 배치
    placeUnit(unit) {
        this.unit = unit; // 유닛 객체 저장
        this.dirty = true; // 유닛이 타일에 배치되었으므로 해당 타일을 다시 그려야 함
        this.unit.setRowCol(this.row, this.col);
        this.unit.setXY(this.x, this.y);
    }
    
    deleteUnit(){
        this.unit = null;
    }

    placeBuilding(Building) {
        this.Building = Building; // 건물 객체 저장
        this.dirty = true; // 건물이 타일에 배치되었으므로 해당 타일을 다시 그려야 함
        this.Building.setRowCol(this.row, this.col);
        this.Building.setXY(this.x, this.y);
    }

    deleteBuilding(){
        this.Building = null;
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
        ctx.strokeStyle = "black"; // 선 색깔
        ctx.stroke();
        ctx.fillStyle = this.isHovered ? this.invertColor(this.color) : this.color; // 면 색깔
        ctx.fill();

        // 타일을 그린 후 dirty 상태를 false로 리셋
        this.dirty = false;

        // 건물 그리기 (타일 위에 건물이 있을 경우)
        if (this.Building) {
            this.Building.draw(ctx, offsetX, offsetY);
        }

        // 유닛 그리기 (타일 위에 유닛이 있을 경우)
        if (this.unit) {
            this.unit.draw(ctx, offsetX, offsetY);
        }
    }

    // 색상 반전 함수
    invertColor(color) {
        if (color === "red") return "cyan";
        if (color === "lightblue") return "darkblue";
        if (color === "yellow") return "orange"; 
        if (color === "gold") return "orange";
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

    // 클릭 상태 업데이트
    updateClick(mouseX, mouseY, offsetX = 0, offsetY = 0) {
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

        const wasClicked = this.isClicked;
        this.isClicked = ctx.isPointInPath(hexPath, mouseX, mouseY);  // 클릭 상태 업데이트

        if (this.isClicked !== wasClicked) {
            this.dirty = true;
        }
    }
    
    // 타일 클릭 시 유닛 이동
    moveUnit(unit) {
        this.placeUnit(unit);
    }
}

class Unit {
    constructor(size = 20, color = 'blue', name = "유닛1", health = 101, move = 2) {
        this.name = name; // 유닛 이름
        this.health = health; // 유닛 체력
        this.size = size;
        this.color = color;
        this.isSelected = false; // 유닛 선택 상태
        this.x = null;
        this.y = null;
        this.row = null;
        this.col = null;
        this.dx = 0;
        this.dy = 0;
        this.initialMove = move;
        this.move = move;
    }

    draw(ctx, offsetX = 0, offsetY = 0) {
        ctx.beginPath();
        ctx.arc(this.x + offsetX + this.dx, this.y + offsetY + this.dy, this.size, 0, 2 * Math.PI); // 유닛 그리기 (원으로)
        ctx.fillStyle = this.isSelected ? 'yellow' : this.color; // 선택된 유닛은 노란색
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();
    }

    // 유닛 클릭 체크
    isClicked(mouseX, mouseY, offsetX = 0, offsetY = 0) {
        const distance = Math.sqrt((mouseX - (this.x + offsetX)) ** 2 + (mouseY - (this.y + offsetY)) ** 2);
        return distance <= this.size;
    }

    setRowCol(row, col){
        this.row = row;
        this.col = col;
    }

    setXY(x,y){
        this.x=x;
        this.y=y;
    }

    setMove(move){
        this.move=move;
    }

    // 공격 시 반대 방향으로 밀렸다가 복귀
    moveTemporarily(dx, dy, ctx, offsetX, offsetY, duration = 150) {
        // 색 바꾸기
        const oldColor = this.color;
        this.color = "red";

        // 밀림 효과
        this.dx = dx;
        this.dy = dy;
        createHexMap(rows, cols);
        
        // 일정 시간 후 원래 위치로 복귀
        setTimeout(() => {
            this.dx = 0;
            this.dy = 0;
            this.color = oldColor;
            createHexMap(rows, cols);
        }, duration);
    }
}

class buildUnit extends Unit{
    constructor(size, user = user1, color = 'blue', name = "건설 유닛", health = 50) {
        super(size, color, name, health);  
        this.description = "이동과 건설을 할 수 있는 유닛이다"; 
        this.user = user;
    }
}

class meleeUnit extends Unit{
    constructor(size, user = user1, color = 'lime', name = "근접 유닛", health = 150, damage=20) {
        super(size, color, name, health);  
        this.description = "근접 공격을 할 수 있는 유닛이다";  
        this.damage = damage;
        this.user = user;
    }
}

class rangedUnit extends Unit{
    constructor(size, user = user1, color = 'peru', name = "원거리 유닛", health = 100, damage=10) {
        super(size, color, name, health);   
        this.description = "원거리 공격을 할 수 있는 유닛이다";
        this.damage = damage;
        this.user = user;
    }
}

class eliteUnit extends Unit{
    constructor(size, user = user1, color = 'olive', name = "엘리트 유닛", health = 200, damage=40) {
        super(size, color, name, health);   
        this.description = "기동력이 좋은 유닛이다";
        this.damage = damage;
        this.user = user;
    }
}

class Building {
    constructor(size, color = 'gray', name = "건물1", health = 501) {
        this.name = name;  // 건물 이름
        this.health = health; // 건물 체력
        this.size = size;    // 건물의 크기
        this.color = color;
        this.isSelected = false; // 건물 선택 상태
        this.x = null;        // 건물의 x 위치
        this.y = null;        // 건물의 y 위치
        this.row = null;
        this.col = null; 
    }

    // 건물 그리기
    draw(ctx, offsetX = 0, offsetY = 0) {
        const buildingSize = this.size*1.23;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + offsetX - buildingSize/2, this.y + offsetY - buildingSize/2, buildingSize, buildingSize);  // 건물 그리기
        ctx.strokeStyle = 'black';
        ctx.strokeRect(this.x + offsetX - buildingSize/2, this.y + offsetY - buildingSize/2, buildingSize, buildingSize);
    }

    // 건물 클릭 체크
    isBuildingClicked(mouseX, mouseY, offsetX = 0, offsetY = 0) {
        const buildingSize = this.size*1.23;
        // 건물의 좌측 상단 (x, y) 좌표와 우측 하단 (x + width, y + height) 좌표를 계산
        const withinX = mouseX >= (this.x + offsetX - buildingSize/2) && mouseX <= (this.x + offsetX - buildingSize/2 + buildingSize);
        const withinY = mouseY >= (this.y + offsetY - buildingSize/2) && mouseY <= (this.y + offsetY - buildingSize/2 + buildingSize);

        // 마우스 좌표가 건물의 영역 내에 있으면 클릭한 것으로 처리
        return withinX && withinY;
    }

    setRowCol(row, col){
        this.row = row;
        this.col = col;
    }

    setXY(x,y){
        this.x=x;
        this.y=y;
    }
}

class mainBuilding extends Building{
    constructor(size, user = user1, color = 'pink', name = "메인 건물", health = 500, gatherResources = 100) {
        // 부모 클래스인 Building의 constructor를 호출합니다.
        super(size, color, name, health); 
        this.description = "메인 건물이다";
        this.user = user;
        this.gatherResources = gatherResources;
    }
}

class developmentBuilding extends Building{
    constructor(size, user = user1, color = 'purple', name = "발전 건물", health = 500) {
        // 부모 클래스인 Building의 constructor를 호출합니다.
        super(size, color, name, health); 
        this.description = "발전 건물이다";
        this.user = user;
    }
}

class meleeUnitBuilding extends Building{
    constructor(size, user = user1, color = 'lime', name = "근거리 유닛 생산 건물", health = 500) {
        // 부모 클래스인 Building의 constructor를 호출합니다.
        super(size, color, name, health); 
        this.description = "근거리 유닛 생산 건물이다";
        this.user = user;
    }
}

class rangedUnitBuilding extends Building{
    constructor(size, user = user1, color = 'peru', name = "원거리 유닛 생산 건물", health = 500) {
        // 부모 클래스인 Building의 constructor를 호출합니다.
        super(size, color, name, health); 
        this.description = "원거리 유닛 생산 건물이다";
        this.user = user;
    }
}

class eliteUnitBuilding extends Building{
    constructor(size, user = user1, color = 'olive', name = "엘리트 유닛 생산 건물", health = 500) {
        // 부모 클래스인 Building의 constructor를 호출합니다.
        super(size, color, name, health); 
        this.description = "엘리트 유닛 생산 건물이다";
        this.user = user;
    }
}

// 유닛 클릭 시 근처 1 타일 색상 변경
function highlightNearbyTiles(unit, rows, cols, range=1) {
    const unitRow = unit.row; // 유닛의 행
    const unitCol = unit.col; // 유닛의 열
    
    // 큐브 좌표로 변환
    function cubeCoordinates(row, col) {
        const q = col - Math.floor(row / 2);
        const r = row;
        const s = -q - r;
        return { q, r, s };
    }

    // 큐브 거리 계산
    function cubeDistance(a, b) {
        return Math.max(
            Math.abs(a.q - b.q),
            Math.abs(a.r - b.r),
            Math.abs(a.s - b.s)
        );
    }

    // 유닛의 큐브 좌표
    const unitCube = cubeCoordinates(unitRow, unitCol);

    // 범위 내 타일 탐색
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            // 현재 타일의 큐브 좌표
            const tileCube = cubeCoordinates(row, col);

            // 큐브 거리 계산
            const distance = cubeDistance(unitCube, tileCube);

            // 범위 내 타일 하이라이트
            if (distance <= range) {
                if (hexMap[row] && hexMap[row][col]) {
                    if (row === unitRow && col === unitCol) {
                        continue; // 유닛의 위치에 해당하는 타일은 건너뛰기
                    }
                    hexMap[row][col].dirty = true;
                    if(distance<=1) hexMap[row][col].setColor("yellow");
                    if(distance>1) hexMap[row][col].setColor("gold");
                }
            }
        }
    }

    drawChangedTiles();
}

// 육각형 맵 생성
function createHexMap(rows, cols) {
    const horizontalSpacing = Math.sqrt(3) * hexRadius; // 수평 간격
    const verticalSpacing = 1.5 * hexRadius; // 수직 간격

    const offsetX = (canvas.width - cols * horizontalSpacing) / 2; // 중앙 정렬을 위한 x 오프셋
    const offsetY = (canvas.height - rows * verticalSpacing) / 2; // 중앙 정렬을 위한 y 오프셋

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            // 홀수 행이면 (row % 2) 오른쪽으로 반절 이동시켜서 육각형 타일이 맞물리도록
            let x = col * horizontalSpacing + (row % 2) * (horizontalSpacing / 2); 
            let y = row * verticalSpacing;

            x = (x + offsetX);
            y = (y + offsetY);

            /* // HexTile 객체 생성
            const tile = new HexTile(x, y); // 타일 위치 설정
            hexMap[row][col] = tile; // 타일 객체 저장
            tile.row = row;
            tile.col = col; 
            */

            // 이미 타일이 생성된 경우 위치만 업데이트
            if (!hexMap[row][col]) {
                const tile = new HexTile(x, y); // 타일 생성
                hexMap[row][col] = tile; // 타일 저장
                tile.row = row;
                tile.col = col;
            } else {
                hexMap[row][col].x = x; // 위치 업데이트
                hexMap[row][col].y = y;
            }

            const tile = hexMap[row][col];
            tile.color = "lightblue";
            tile.dirty = true;

            // 특정 타일에 유닛 배치 (예: (2,2) 위치에 유닛)
            if (initial === true && 
                row === initial_unit_row && col === initial_unit_col) {
                console.log("initial");

                initial = false
                const unit = new buildUnit(hexRadius/2); // 유닛 크기와 색상 설정
                unitMap[row][col] = unit;
                tile.placeUnit(unit); // 타일에 유닛 배치
                user.insertUnit(unit);
                
                // 테스트 용
                const unit2 = new meleeUnit(hexRadius/2, test, "black", "테스트용 유닛이다", 1000, 50); // 유닛 크기와 색상 설정
                unitMap[21][20] = unit2;
                tile.placeUnit(unit2); // 타일에 유닛 배치

                tile.draw(ctx, mapOffsetX, mapOffsetY); // 타일 그리기
            }

            if (buildingMap[row] && buildingMap[row][col]){
                tile.placeBuilding(buildingMap[row][col]); // 타일에 건물 배치
                buildingMap[row][col].size = hexRadius;
            }

            if (unitMap[row] && unitMap[row][col]){
                tile.placeUnit(unitMap[row][col]); // 타일에 유닛 배치
                unitMap[row][col].size = hexRadius/2;
                //console.log(`i'm createHexMap, ${unitMap[row][col].row}, ${unitMap[row][col].col}, ${unitMap[row][col].size}`)
            }
            tile.draw(ctx, mapOffsetX, mapOffsetY); // 타일 그리기
        }
    }
    markRedTiles();
    drawChangedTiles();
    showstatus(ctx)
    //console.log(`ofx:${mapOffsetX}, ofy:${mapOffsetY}`)
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
            hexMap[row][col].resource = true;
            if(hexMap[row][col].resourceAmount === null){
                console.log("처음자원");
                hexMap[row][col].resourceAmount = 1000;
            }
        }
    });

}

canvas.addEventListener('mousedown', (event) => {
    // 마우스 클릭 시 드래그 시작
    isDragging = true;
    startX = event.clientX;
    startY = event.clientY;
});

// 마우스 이동 이벤트 리스너
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

    if (isDragging) {
        // 드래그 중일 때 마우스 이동 거리를 계산하여 mapOffsetX, mapOffsetY 변경
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;

        mapOffsetX += dx;
        mapOffsetY += dy;

        // 현재 위치를 시작 위치로 업데이트
        startX = event.clientX;
        startY = event.clientY;

        //ctx.clearRect(0, 0, canvas.width, canvas.height);
        // 화면을 다시 그리기
        requestAnimationFrame(drawMap); //createHexMap(rows, cols)
    }
});

canvas.addEventListener('mouseup', () => {
    // 마우스 버튼을 떼면 드래그 종료
    isDragging = false;
});

canvas.addEventListener('mouseleave', () => {
    // 캔버스 밖으로 나가면 드래그 종료
    isDragging = false;
});

canvas.addEventListener("click", (event) => {
    canvas.focus();  // 캔버스를 클릭하면 포커스를 줍니다.

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // 유닛 클릭 확인
    let unitClicked = false;
    let BuildingClicked = false;
    let unitMoved = false;
    let unitAttacked = false;

    hexMap.forEach(row => {
        row.forEach(tile => {
            tile.updateClick(mouseX, mouseY, mapOffsetX, mapOffsetY);
            try{
                if (tile.unit && tile.unit.isClicked(mouseX, mouseY, mapOffsetX, mapOffsetY)) {
                    // 유닛을 클릭했을 때
                    selectedUnit = tile.unit;
                    unitClicked = true;

                    // 유닛의 정보를 <div class="status">에 표시
                    document.getElementById("name-value").textContent = `${selectedUnit.name}`;
                    document.getElementById("owner-value").textContent = `${selectedUnit.user}`;
                    document.getElementById("health-value").textContent = `체력: ${selectedUnit.health}`;
                    document.getElementById("move-value").textContent = `${selectedUnit.move}`;
                    document.getElementById("function-value").textContent = `기능: ${selectedUnit.description}`;
                    
                    clearButton();
                    switchcase_makeButton(tile);

                    if(selectedUnit !== oldSelectedUnit) {
                        //현재 클릭한 유닛과 이전에 클릭한 유닛이 다를 때
                        if(tile.color === "yellow" && oldSelectedUnit && selectedUnit.user !== oldSelectedUnit.user ){
                            if(oldSelectedUnit && oldSelectedUnit.move>0){
                                //현재 클릭한 유닛의 유저와 이전에 클릭한 유닛의 유저가 다를 때 공격한다
                                if(oldSelectedUnit instanceof meleeUnit || oldSelectedUnit instanceof rangedUnit || oldSelectedUnit instanceof eliteUnit){
                                    console.log(`attack!`);
                                    unitAttacked = true;
                                    oldSelectedUnit.move = oldSelectedUnit.move - 1 ;

                                    const dx = selectedUnit.x - oldSelectedUnit.x;
                                    const dy = selectedUnit.y - oldSelectedUnit.y;

                                    selectedUnit.health = selectedUnit.health - oldSelectedUnit.damage;

                                    if(oldSelectedUnit instanceof rangedUnit){
                                        console.log(`원거리!`);
                                        // 원거리 유닛 공격 로직
                                        const fromX = oldSelectedUnit.x + mapOffsetX;
                                        const fromY = oldSelectedUnit.y + mapOffsetY;
                                        const toX = selectedUnit.x + mapOffsetX;
                                        const toY = selectedUnit.y + mapOffsetY;

                                        animateProjectile(fromX, fromY, toX, toY, () => {
                                            // 투사체 도착 후 공격 처리
                                            console.log(`ranged attack!`);
                                            attackedMotion(dx, dy);
                                        });
                                    }
                                    else{
                                        attackedMotion(dx, dy);
                                    }
                                    document.getElementById("health-value").textContent = `체력: ${selectedUnit.health}`;
                                }
                            }

                            if(selectedUnit.health<=0){
                                user.deleteUnit(unitMap[selectedUnit.row][selectedUnit.col]);
                                // 이전에 클릭한 유닛의 체력이 0이하가 되면 유닛 제거
                                unitMap[selectedUnit.row][selectedUnit.col] = null; 
                                // 해당 타일의 유닛 제거
                                hexMap[selectedUnit.row][selectedUnit.col].deleteUnit();

                                clearStatus();
                                clearButton();
                            }
                        }
                        createHexMap(rows, cols);
                    }
                    if(selectedUnit.health>0 && !unitAttacked) {
                        if(selectedUnit instanceof eliteUnit){
                            highlightNearbyTiles(selectedUnit, rows, cols, 2); // 근처 타일 색상 변경
                        }
                        else{
                            highlightNearbyTiles(selectedUnit, rows, cols); // 근처 타일 색상 변경
                        }
                    } 
                    
                    oldSelectedUnit = selectedUnit;
                }
            }
            catch (err){
                console.error(err);
                console.log(`is:${tile.unit}, x:${tile.unit.row}, y:${tile.unit.col}`);
                unitMap.forEach(row => {
                    row.forEach(unit => {
                        if(unit){
                            console.log(`unit O, x:${unit.row}, y:${unit.col}`);
                        }
                    });
                });
                hexMap.forEach(row => {
                    row.forEach(tile => {
                        if(tile.unit){
                            console.log(`tile 0, x:${tile.unit.row}, y:${tile.unit.col}`);
                        }
                    });
                });
            }
        });
    });

    if (!unitClicked) {
        hexMap.forEach(row => {
            row.forEach(tile => {
                if (tile.isClicked===true){
                        // 하이라이트 된, 유닛이 없는 타일을 클릭하면 유닛은 이동한다
                        if( (tile.color === "yellow" || tile.color === "gold") && tile.unit === null) {
                            if(selectedUnit && selectedUnit.move>0){
                                selectedUnit.move = selectedUnit.move - 1;
                                document.getElementById("move-value").textContent = `${selectedUnit.move}`;
                                // 유닛을 다른 타일로 이동 시키기 위해 unitMap에서 이전의 유닛 제거
                                unitMap[selectedUnit.row][selectedUnit.col] = null; 
                                // 유닛을 다른 타일로 이동 시키기 위해 hexMap에서 이전 타일을 고르고, 그 타일의 유닛 제거
                                hexMap[selectedUnit.row][selectedUnit.col].deleteUnit();
                                
                                // 노란색으로 하이라이트 된 타일을 클릭하면 유닛을 해당 타일로 이동
                                tile.placeUnit(selectedUnit);
                                unitMap[tile.unit.row][tile.unit.col] = tile.unit;
                                unitMoved=true;

                                clearButton();
                                switchcase_makeButton(tile);

                                selectedUnit = null; // 유닛을 이동시킨 후 선택 해제
                                createHexMap(rows, cols);
                            }
                            else{
                                clearStatus();
                                clearButton();
                                createHexMap(rows, cols);
                            }
                        }
                    else{
                        if(!BuildingClicked){
                            if(tile.resource){
                                document.getElementById("name-value").textContent = `자원 타일이다`;
                                document.getElementById("health-value").textContent = `자원 양 : ${tile.resourceAmount}`;
                                document.getElementById("function-value").textContent = `이 타일 위에서만 main 건물을 건설할 수 있다`;
                            }
                            else{
                                clearStatus();
                            }
                            clearButton();

                            createHexMap(rows, cols);
                        }
                    }
                }
                if (tile.Building && !unitMoved && tile.Building.isBuildingClicked(mouseX, mouseY, mapOffsetX, mapOffsetY)){
                    // 건물을 클릭했을 때
                    selectedBuilding = tile.Building;
                    BuildingClicked=true;

                    // 건물의 정보를 <div class="status">에 표시
                    document.getElementById("name-value").textContent = `${selectedBuilding.name}`;
                    document.getElementById("owner-value").textContent = `${selectedBuilding.user}`;
                    document.getElementById("health-value").textContent = `체력: ${selectedBuilding.health}`;
                    document.getElementById("move-value").textContent = ` `;
                    document.getElementById("function-value").textContent = `기능: ${selectedBuilding.description}`;
               
                    clearButton();
                        switch (true) {
                            case selectedBuilding instanceof mainBuilding:
                                makeUnitButton(tile,1,"mainBuilding");
                                break;
                            case selectedBuilding instanceof developmentBuilding:
                                break;
                            case selectedBuilding instanceof meleeUnitBuilding:
                                makeUnitButton(tile,1,"meleeUnitBuilding");
                                break;
                            case selectedBuilding instanceof rangedUnitBuilding:
                                makeUnitButton(tile,1,"rangedUnitBuilding");
                                break;
                            case selectedBuilding instanceof eliteUnitBuilding:
                                makeUnitButton(tile,1,"eliteUnitBuilding");
                                break;
                            default:
                                console.log("Building은 다른 클래스의 인스턴스입니다.");
                        }

                    createHexMap(rows, cols);
                }
            });
        });
    }
});

// 다른 곳을 클릭할 때 캔버스의 포커스를 해제하기
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
            case 'W':
            case 'w':
            case 'ArrowUp':
                mapOffsetY += moveSpeed;  // 위로 이동
                break;
            case 'S':
            case 's':
            case 'ArrowDown':
                mapOffsetY -= moveSpeed;  // 아래로 이동
                break;
            case 'A':
            case 'a':
            case 'ArrowLeft':
                mapOffsetX += moveSpeed;  // 왼쪽으로 이동
                break;
            case 'D':
            case 'd':
            case 'ArrowRight':
                mapOffsetX -= moveSpeed;  // 오른쪽으로 이동
                break;
        }
        requestAnimationFrame(drawMap);
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
});

// 타일 크기 슬라이더 값이 변경될 때
tileSizeSlider.addEventListener("input", (event) => {
    const oldRadius = hexRadius; // 이전 반지름 저장

    hexRadius = parseInt(event.target.value);
    tileSizeValue.textContent = hexRadius;  // 슬라이더 값 표시

    // 스케일 변화 비율 계산
    scaleChange = hexRadius / oldRadius;

    // 기존 offsetX, offsetY 보정 적용
    mapOffsetX *= scaleChange;
    mapOffsetY *= scaleChange;

    // 맵 다시 그리기
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    createHexMap(rows, cols);  
});

// 이동 속도 슬라이더 값이 변경될 때
moveSpeedSlider.addEventListener("input", (event) => {
    moveSpeed = parseInt(event.target.value);
    moveSpeedValue.textContent = moveSpeed;  // 슬라이더 값 표시
});

function clearStatus() {
    document.getElementById("name-value").textContent = " ";
    document.getElementById("owner-value").textContent = " ";
    document.getElementById("health-value").textContent = " ";
    document.getElementById("move-value").textContent = " ";
    document.getElementById("function-value").textContent = " ";
}

function switchcase_makeButton(tile) {
    switch (true) {
        case selectedUnit instanceof buildUnit:
            // 건설 유닛이면 기능에 유닛의 건설하기 버튼 추가
            makeBuildButton(tile, 1, "mainBuilding");
            makeBuildButton(tile, 2, "developmentBuilding");
            makeBuildButton(tile, 3, "meleeUnitBuilding");
            makeBuildButton(tile, 4, "rangedUnitBuilding");
            makeBuildButton(tile, 5, "eliteUnitBuilding");
            break;
        case selectedUnit instanceof meleeUnit:
            break;
        case selectedUnit instanceof rangedUnit:
            break;
        case selectedUnit instanceof eliteUnit:
            break;
        default:
            console.log("unit은 다른 클래스의 인스턴스입니다.");
    }
}

function clearButton() {
    const Button1 = document.getElementById("Button_1");
    if (Button1) { Button1.remove(); }
    const Button2 = document.getElementById("Button_2");
    if (Button2) { Button2.remove(); }
    const Button3 = document.getElementById("Button_3");
    if (Button3) { Button3.remove(); }
    const Button4 = document.getElementById("Button_4");
    if (Button4) { Button4.remove(); }
    const Button5 = document.getElementById("Button_5");
    if (Button5) { Button5.remove(); }
}

function makeBuildButton(tile, number=1, whatBuilding) {
    if (!document.getElementById(`Button_${number}`)) {
        const functionValue_1 = document.getElementById(`button-${number}`);
        const Button_1 = document.createElement(`button-${number}`);
        Button_1.id = `Button_${number}`;
        Button_1.textContent = "건설하기";
        if (canAffordBuilding() <= 0){
            Button_1.style.backgroundColor = "#ccc"; // 비활성화 색상
            Button_1.style.cursor = "not-allowed";
        }
        Button_1.onclick = () => {
            if (canAffordBuilding()>0) {
                switchcase_buildButton();
            }
        };
        functionValue_1.appendChild(Button_1);
    }
    else{
        const Button_1 = document.getElementById(`Button_${number}`);
        if (Button_1) {
            Button_1.onclick = () => {
                if (canAffordBuilding()>0) {
                    switchcase_buildButton();
                } 
            };  
        }
    }

    function canAffordBuilding() {
        let buildingCost;
        switch (whatBuilding) {
            case "mainBuilding":
                buildingCost = priceOfmainBuilding;
                break;
            case "developmentBuilding":
                buildingCost = priceOfdevelopmentBuilding;
                break;
            case "meleeUnitBuilding":
                buildingCost = priceOfmeleeUnitBuilding;
                break;
            case "rangedUnitBuilding":
                buildingCost = priceOfrangedUnitBuilding;
                break;
            case "eliteUnitBuilding":
                buildingCost = priceOfeliteUnitBuilding;
                break;
            default:
                console.log(`알 수 없는 건물 유형: ${whatBuilding}`);
                return false;
        }
        return user.resourceAmount >= buildingCost ? buildingCost : 0;
    }

    function switchcase_buildButton() {
        if (!tile.Building) {
            let building;
            switch (whatBuilding) {
                case "mainBuilding":
                    if(tile.resource) {
                        building = new mainBuilding(hexRadius);
                    }
                    break;
                case "developmentBuilding":
                    building = new developmentBuilding(hexRadius);
                    break;
                case "meleeUnitBuilding":
                    building = new meleeUnitBuilding(hexRadius);
                    break;
                case "rangedUnitBuilding":
                    building = new rangedUnitBuilding(hexRadius);
                    break;
                case "eliteUnitBuilding":
                    building = new eliteUnitBuilding(hexRadius);
                    break;
                default:
                    console.log(`알 수 없는 건물 유형: ${whatBuilding}`);
            }
            if(building) {
                tile.placeBuilding(building);
                user.insertBuilding(building);
                user.resourceAmount -= canAffordBuilding(); // 자원 차감
            }
            buildingMap[tile.row][tile.col] = tile.Building;
            createHexMap(rows, cols);
        }
    }
}

function makeUnitButton(tile, number=1, whatBuilding) {
    if (!document.getElementById(`Button_${number}`)) {
        const functionValue_1 = document.getElementById(`button-${number}`);
        const Button_1 = document.createElement(`button-${number}`);
        Button_1.id = `Button_${number}`;
        Button_1.textContent = "생산하기";
        if (canAffordUnit() <= 0){
            Button_1.style.backgroundColor = "#ccc"; // 비활성화 색상
            Button_1.style.cursor = "not-allowed";
        }
        Button_1.onclick = () => {
            if(canAffordUnit()>0){
                switchcase_unitButton();
            }
        };
        functionValue_1.appendChild(Button_1);
    }
    else{
        const Button_1 = document.getElementById(`Button_${number}`);
        if (Button_1) {
            Button_1.onclick = () => {
                if(canAffordUnit()>0){
                    switchcase_unitButton();
                }
            };  
        }
    }

    function canAffordUnit() {
        let unitCost;
        switch (whatBuilding) {
            case "mainBuilding":
                unitCost = priceOfbuildUnit;
                break;
            case "meleeUnitBuilding":
                unitCost = priceOfmeleeUnit;
                break;
            case "rangedUnitBuilding":
                unitCost = priceOfrangedUnit;
                break;
            case "eliteUnitBuilding":
                unitCost = priceOfeliteUnit;
                break;
            default:
                console.log(`알 수 없는 건물 유형: ${whatBuilding}`);
                return false;
        }
        return user.resourceAmount >= unitCost ? unitCost : 0;
    }

    function switchcase_unitButton() {
        if (!tile.unit) {
            let unit;
            switch (whatBuilding) {
                case "mainBuilding":
                    unit = new buildUnit(hexRadius / 2);
                    break;
                case "meleeUnitBuilding":
                    unit = new meleeUnit(hexRadius / 2);
                    break;
                case "rangedUnitBuilding":
                    unit = new rangedUnit(hexRadius / 2);
                    break;
                case "eliteUnitBuilding":
                    unit = new eliteUnit(hexRadius / 2);
                    break;
                default:
                    console.log(`알 수 없는 건물 유형: ${whatBuilding}`);
            }
            if(unit){
                tile.placeUnit(unit);
                user.insertUnit(unit);
                user.resourceAmount -= canAffordUnit(); // 자원 차감
            }
            unitMap[tile.unit.row][tile.unit.col] = tile.unit;
            createHexMap(rows, cols);
        }
    }
}

function attackedMotion(dx, dy) {
    // 공격받은 방향 계산
    const distance = Math.sqrt(dx ** 2 + dy ** 2);

    // 반대 방향으로 밀림 (정규화 후 이동 거리 설정)
    const pushDistance = 10; // 밀림 거리
    const normalizedDx = (dx / distance) * pushDistance;
    const normalizedDy = (dy / distance) * pushDistance;

    // 밀림 애니메이션 적용
    selectedUnit.moveTemporarily(normalizedDx, normalizedDy, ctx, mapOffsetX, mapOffsetY);
}

function animateProjectile(fromX, fromY, toX, toY, onComplete) {
    const startTime = performance.now();
    const duration = 100; // 애니메이션 지속 시간 (ms)

    function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1); // 0에서 1까지 진행률

        // 현재 위치 계산 (선형 보간)
        const currentX = fromX + (toX - fromX) * progress;
        const currentY = fromY + (toY - fromY) * progress;

        // 캔버스에 원 그리기
        ctx.clearRect(0, 0, canvas.width, canvas.height); // 캔버스 초기화 (필요시 기존 타일도 다시 그리기)
        createHexMap(rows, cols); // 타일 다시 그리기
        ctx.beginPath();
        ctx.arc(currentX, currentY, (hexRadius/2)/4, 0, 2 * Math.PI); // 작은 원 (반지름 5)
        ctx.fillStyle = "black";
        ctx.fill();
        ctx.closePath();

        if (progress < 1) {
            requestAnimationFrame(step); // 다음 프레임으로 진행
        } else {
            onComplete(); // 애니메이션 완료 시 콜백 실행
        }
    }

    requestAnimationFrame(step);
}

function nextTurn(){
    // 턴을 표시하는 div 요소
    const turnElement = document.getElementById("turn");

    // 턴 넘기기 버튼
    const nextTurnButton = document.getElementById("nextTurnButton");

    if(initial) turnElement.textContent = `턴: ${turn}`; // 텍스트 업데이트

    // 턴 넘기기 버튼 클릭 시 실행되는 함수
    nextTurnButton.addEventListener("click", function() {
        turn++; // 턴을 증가시킴
        turnElement.textContent = `턴: ${turn}`; // 텍스트 업데이트

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++){
                if(unitMap[row] && unitMap[row][col]){
                    unitMap[row][col].move = unitMap[row][col].initialMove;
                }
            }
        }

        user.gatheredResources();

        createHexMap(rows, cols);
        clearStatus();
        clearButton();
    });
}
nextTurn();

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
    showstatus(ctx);
}


// 맵을 지우지 않고 변경되 타일만 다시 그리는 함수
function drawChangedTiles() {
    hexMap.forEach(row => {
        row.forEach(hex => {
            hex.draw(ctx, mapOffsetX, mapOffsetY);
        });
    });
    showstatus(ctx);
}

// 맵 생성 함수 호출
createHexMap(rows, cols); // 45행, 45열의 육각형 맵
createHexMap(rows, cols); // 45행, 45열의 육각형 맵