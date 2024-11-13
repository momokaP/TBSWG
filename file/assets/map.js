const canvas = document.getElementById("hexMap");
const ctx = canvas.getContext("2d");

const tileSizeSlider = document.getElementById("tileSizeSlider");
const moveSpeedSlider = document.getElementById("moveSpeedSlider");
const tileSizeValue = document.getElementById("tileSizeValue");
const moveSpeedValue = document.getElementById("moveSpeedValue");

// 육각형 타일의 반지름
let hexRadius = 100; // 육각형 반지름
const rows = 45; // 행 수
const cols = 45; // 열 수
const hexMap = []; // 육각형 타일 정보를 저장할 배열
const unitMap = []; // 유닛 정보를 저장할 배열
const buildingMap = []; // 건물 정보를 저장할 배열
let scaleChange = 1;

for (let row = 0; row < rows; row++) {
    hexMap[row] = []; // 각 행을 초기화
    unitMap[row] = []; // 각 행을 초기화
    buildingMap[row] = []; // 각 행을 초기화
}

// 맵의 이동을 위한 변수
let mapOffsetX = 0;
let mapOffsetY = 0;

let initial = true;

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
        this.isClicked = false;  // 클릭 상태 저장
        this.dirty = true;  // 타일의 상태가 변경되었을 때만 true로 설정
        this.unit = null; // 유닛 객체
        this.Building = null; //건물 객체
        this.row = null;
        this.col = null;
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
    constructor(size = 20, color = 'green', name = "유닛1", health = 101) {
        this.x = null;
        this.y = null;
        this.size = size;
        this.color = color;
        this.isSelected = false; // 유닛 선택 상태
        this.row = null;
        this.col = null;
        this.name = name; // 유닛 이름
        this.health = health; // 유닛 체력
    }

    draw(ctx, offsetX = 0, offsetY = 0) {
        ctx.beginPath();
        ctx.arc(this.x + offsetX, this.y + offsetY, this.size, 0, 2 * Math.PI); // 유닛 그리기 (원으로)
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

// 유닛 클릭 시 근처 타일 색상 변경
function highlightNearbyTiles(unit, rows, cols) {
    const horizontalSpacing = Math.sqrt(3) * hexRadius;
    const verticalSpacing = 1.5 * hexRadius;

    const unitRow = unit.row;//= Math.floor(unit.y / verticalSpacing); // 유닛의 행
    const unitCol = unit.col;//= Math.floor(unit.x / horizontalSpacing); // 유닛의 열

    //console.log(`ur:${unitRow}, uc:${unitCol}`);

    for (let row = Math.max(0, unitRow - 1); row <= Math.min(rows - 1, unitRow + 1); row++) {
        for (let col = Math.max(0, unitCol - 1); col <= Math.min(cols - 1, unitCol + 1); col++) {
            if (row === unitRow && col === unitCol) {
                continue; // 유닛의 위치에 해당하는 타일은 건너뛰기
            }
            
            if(row%2===1){
                // 타일이 짝수 행이거나, 홀수 행의 마지막 열이 아니면
                if(row===unitRow || ( (row===Math.max(0, unitRow - 1) || row===Math.min(rows - 1, unitRow + 1)) && col!=Math.min(cols - 1, unitCol + 1))){
                    if (hexMap[row] && hexMap[row][col]) {
                        hexMap[row][col].dirty=true;
                        hexMap[row][col].setColor("yellow"); // 근처 타일을 노란색으로 변경
                        //console.log(`${row}, ${col}`);
                    }
                }
            }

            if(row%2===0){
                // 타일이 짝수 행이거나, 홀수 행의 마지막 열이 아니면
                if(row===unitRow || ( (row===Math.max(0, unitRow - 1) || row===Math.min(rows - 1, unitRow + 1)) && col!=Math.max(0, unitCol - 1))){
                    if (hexMap[row] && hexMap[row][col]) {
                        hexMap[row][col].dirty=true;
                        hexMap[row][col].setColor("yellow"); // 근처 타일을 노란색으로 변경
                        //console.log(`${row}, ${col}`);
                    }
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
            let x = col * horizontalSpacing + (row % 2) * (horizontalSpacing / 2);
            let y = row * verticalSpacing;

            x = (x + offsetX);// + mapOffsetX*(1-scaleChange);
            y = (y + offsetY);// + mapOffsetY*(1-scaleChange);

            // HexTile 객체 생성
            const tile = new HexTile(x, y); // 타일 위치 설정
            hexMap[row][col] = tile; // 타일 객체 저장
            tile.row = row;
            tile.col = col;

            // 특정 타일에 유닛 배치 (예: (2,2) 위치에 유닛)
            if (initial === true && row === 20 && col === 20) {
                initial = false
                const unit = new Unit(hexRadius/2, 'blue'); // 유닛 크기와 색상 설정
                unitMap[row][col] = unit;
                console.log("initial");
                tile.placeUnit(unit); // 타일에 유닛 배치
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

    hexMap.forEach(row => {
        row.forEach(tile => {
            if(tile.unit){
                //console.log(`tile 0, x:${tile.unit.row}, y:${tile.unit.col}`);
            }
        });
    });

    markRedTiles();
    drawChangedTiles();

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
        }
    });
}

let isDragging = false;
let startX, startY;

canvas.addEventListener('mousedown', (event) => {
    // 마우스 클릭 시 드래그 시작
    isDragging = true;
    startX = event.clientX;
    startY = event.clientY;
});

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

    if (isDragging) {
        // 드래그 중일 때 마우스 이동 거리를 계산하여 mapOffsetX, mapOffsetY 변경
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;

        mapOffsetX += dx;
        mapOffsetY += dy;

        // 현재 위치를 시작 위치로 업데이트
        startX = event.clientX;
        startY = event.clientY;

        // 화면을 다시 그리기
        requestAnimationFrame(drawMap);
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



let moveSpeed = 100; // 한 번에 이동할 거리 (픽셀 단위
canvas.tabIndex = 1000;  // tabIndex를 설정하여 캔버스가 포커스를 받을 수 있게 합니다.

// 캔버스 클릭 시 포커스 주기
//canvas.addEventListener('click', () => {
//    canvas.focus();  // 캔버스를 클릭하면 포커스를 줍니다.
//});

let selectedUnit = null; // 현재 선택된 유닛
let selectedBuilding = null; //현재 선택된 건물

canvas.addEventListener("click", (event) => {
    canvas.focus();  // 캔버스를 클릭하면 포커스를 줍니다.

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // 유닛 클릭 확인
    let unitClicked = false;
    let BuildingClicked = false;
    let unitMoved = false;

    hexMap.forEach(row => {
        row.forEach(tile => {
            tile.updateClick(mouseX, mouseY, mapOffsetX, mapOffsetY);
            try{
                if (tile.unit && tile.unit.isClicked(mouseX, mouseY, mapOffsetX, mapOffsetY)) {
                    // 유닛을 클릭했을 때
                    selectedUnit = tile.unit;
                    unitClicked = true;

                    // 유닛의 정보를 <div class="status">에 표시
                    document.getElementById("name-value").textContent = selectedUnit.name || "유닛 이름";
                    document.getElementById("health-value").textContent = `체력: ${selectedUnit.health || 100}`;
                    document.getElementById("function-value").textContent = "기능: 이동";

                    if (!document.getElementById("build-button")) {
                        const functionValue = document.getElementById("function-value");
                        const buildButton = document.createElement('button');
                        buildButton.id = "build-button";
                        buildButton.textContent = "건설하기";
                        buildButton.onclick = () => {
                            if(!tile.Building){
                                const building = new Building(hexRadius)
                                tile.placeBuilding(building);
                                buildingMap[tile.row][tile.col]=tile.Building;
                                createHexMap(rows, cols);
                                console.log(`x:${tile.row} y:${tile.col}`)
                            }
                            
                        };  
                        functionValue.appendChild(buildButton);
                    }

                    highlightNearbyTiles(selectedUnit, rows, cols); // 근처 타일 색상 변경
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

    //console.log(`${mouseX}, ${mouseY}, ${unitClicked}`);

    if (!unitClicked) {
        hexMap.forEach(row => {
            row.forEach(tile => {
                if (tile.isClicked===true){
                    if(tile.color === "yellow" && tile.unit === null) {
                        // console.log(`Yo color:${tile.color}`);

                        //console.log(`selectedUnit: ${selectedUnit.row}, ${selectedUnit.col}`);
                        unitMap[selectedUnit.row][selectedUnit.col] = null;
                        //console.log(`is:${hexMap[selectedUnit.row][selectedUnit.col].unit}, x:${hexMap[selectedUnit.row][selectedUnit.col].unit.row}, y:${hexMap[selectedUnit.row][selectedUnit.col].unit.col}`);
                        hexMap[selectedUnit.row][selectedUnit.col].deleteUnit();
                        //console.log(`is:${hexMap[selectedUnit.row][selectedUnit.col].unit}`);
                        
                        // 노란색으로 하이라이트 된 타일을 클릭하면 유닛을 해당 타일로 이동
                        tile.placeUnit(selectedUnit);
                        //console.log(`i'm click, ${tile.unit.row}, ${tile.unit.col}`);
                        unitMap[tile.unit.row][tile.unit.col] = tile.unit;
                        unitMoved=true;
                        
                        const buildButton = document.getElementById("build-button");
                        if (buildButton) {
                            buildButton.onclick = () => {
                                if(!tile.Building){
                                    const building = new Building(hexRadius)
                                    tile.placeBuilding(building);
                                    buildingMap[tile.row][tile.col]=tile.Building;
                                    createHexMap(rows, cols);
                                    console.log(`x:${tile.row} y:${tile.col}`)
                                }
                                
                            };  
                        }
                        
                        selectedUnit = null; // 유닛을 이동시킨 후 선택 해제
                        createHexMap(rows, cols);
                    }
                    else{
                        if(!BuildingClicked){
                            document.getElementById("name-value").textContent = " ";
                            document.getElementById("health-value").textContent = " ";
                            document.getElementById("function-value").textContent = " ";
                            const buildButton = document.getElementById("build-button");
                            if (buildButton) {buildButton.remove();}
                            createHexMap(rows, cols);
                        }
                    }
                }
                if (tile.Building && !unitMoved && tile.Building.isBuildingClicked(mouseX, mouseY, mapOffsetX, mapOffsetY)){
                    selectedBuilding = tile.Building;
                    BuildingClicked=true;
                    // 건물의 정보를 <div class="status">에 표시
                    document.getElementById("name-value").textContent = selectedBuilding.name || "유닛 이름";
                    document.getElementById("health-value").textContent = `체력: ${selectedBuilding.health || 100}`;
                    document.getElementById("function-value").textContent = "기능: 건물이다";
               
                    createHexMap(rows, cols);
                }
            });
        });
        /*
        // 유닛을 선택하지 않고 타일을 클릭한 경우, 유닛 이동
        outerLoop: // 레이블을 붙여서 for문 안에서 break를 사용
        for (let row = 0; row < hexMap.length; row++) {
            for (let col = 0; col < hexMap[row].length; col++) {
                const tile = hexMap[row][col];
                console.log(`${tile.isClicked}`);
                if (tile.isClicked===true){
                        console.log("Ya");
                        if(tile.color === "yellow" && tile.unit === null) {
                        console.log(`Yo color:${tile.color}`);
                        // 노란색으로 하이라이트 된 타일을 클릭하면 유닛을 해당 타일로 이동
                        tile.placeUnit(selectedUnit);
                        selectedUnit = null; // 유닛을 이동시킨 후 선택 해제
                        ctx.clearRect(0, 0, canvas.width, canvas.height); // 캔버스를 지우고
                        createHexMap(rows, cols); // 맵 다시 그리기
                        break outerLoop; // 유닛을 이동시킨 후 반복을 종료
                    }
                }
            }
        }
        */
    }
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
        //console.log(`mapOffsetX:${mapOffsetX}, mapOffsetY:${mapOffsetY}`);
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
