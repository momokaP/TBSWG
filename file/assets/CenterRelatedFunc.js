import { HexTile } from "./HexTileClass.js";
import { 
    canvas, ctx, 
    gameSettings, prices, limits, 
    unitMovement, userInfo, state, 
    hexMap, unitMap, buildingMap, user} from "./map.js";
import { buildUnit, meleeUnit } from "./UnitClass.js";

export function showstatus(ctx) {
    // 글씨 스타일 설정
    ctx.font = "25px Arial"; // 폰트 크기와 종류 설정
    ctx.fillStyle = "black"; // 글씨 색상 설정
    ctx.textAlign = "center"; // 텍스트 정렬 방식 (가운데 정렬)
    ctx.textBaseline = "middle"; // 텍스트 수직 정렬 (중앙 정렬)

    const {
        buildUnitCount, meleeUnitCount, rangedUnitCount, eliteUnitCount
    } = user.howManyUnit();

    const {
        limitOfBuildUnit, limitOfMeleeUnit, limitOfRangedUnit, limitOfEliteUnit
    } = user.limitOfUnit();

    let howManyBuildUnit = `B:${buildUnitCount}/${limitOfBuildUnit}`;
    let howManyMeleeUnit = `M:${meleeUnitCount}/${limitOfMeleeUnit}`;
    let howManyRangedUnit = `R:${rangedUnitCount}/${limitOfRangedUnit}`;
    let howManyEliteUnitt = `E:${eliteUnitCount}/${limitOfEliteUnit}`;

    // 캔버스에 글씨 쓰기, 텍스트의 너비 계산
    const text = `${howManyBuildUnit} ${howManyMeleeUnit} ${howManyRangedUnit} ${howManyEliteUnitt} 건물: ${user.building.length} 자원: ${user.resourceAmount}`;
    const textWidth = ctx.measureText(text).width;

    const fontSize = parseInt(ctx.font); // "30px Arial"에서 숫자 부분만 가져오기
    const textHeight = fontSize; // 일반적으로 세로 크기는 폰트 크기와 같음    


    // 캔버스에 텍스트 쓰기 (오른쪽 상단에 위치)
    ctx.fillStyle = "white";
    ctx.fillRect(canvas.width - textWidth, 0, textWidth, textHeight + 3); // 건물 그리기
    ctx.fillStyle = "black";
    ctx.fillText(text, canvas.width - textWidth + textWidth / 2, textHeight - 10);
}

// 유닛 클릭 시 근처 타일 색상 변경
export function highlightNearbyTiles(unit, rows, cols, range = 1) {
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
                    if (distance <= 1) hexMap[row][col].setColor("yellow");
                    if (distance > 1) hexMap[row][col].setColor("gold");
                }
            }
        }
    }

    drawChangedTiles(gameSettings.rows, gameSettings.cols);
}
// 육각형 맵 생성

export function createHexMap(rows, cols) {
    const horizontalSpacing = Math.sqrt(3) * gameSettings.hexRadius; // 수평 간격
    const verticalSpacing = 1.5 * gameSettings.hexRadius; // 수직 간격

    const offsetX = (canvas.width - cols * horizontalSpacing) / 2; // 중앙 정렬을 위한 x 오프셋
    const offsetY = (canvas.height - rows * verticalSpacing) / 2; // 중앙 정렬을 위한 y 오프셋

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            // 홀수 행이면 (row % 2) 오른쪽으로 반절 이동시켜서 육각형 타일이 맞물리도록
            let x = col * horizontalSpacing + (row % 2) * (horizontalSpacing / 2);
            let y = row * verticalSpacing;

            x = (x + offsetX);
            y = (y + offsetY);

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

            tile.draw(ctx, gameSettings.mapOffset.x, gameSettings.mapOffset.y); // 타일 그리기

            if (buildingMap[row] && buildingMap[row][col]) {
                buildingMap[row][col].setRowCol(row, col);
                buildingMap[row][col].setXY(x,y);
                buildingMap[row][col].size = gameSettings.hexRadius;
                
                buildingMap[row][col].draw(ctx, gameSettings.mapOffset.x, gameSettings.mapOffset.y);
            }

            if (unitMap[row] && unitMap[row][col]) {
                unitMap[row][col].setRowCol(row, col);
                unitMap[row][col].setXY(x,y);
                unitMap[row][col].size = gameSettings.hexRadius / 2;
            
                unitMap[row][col].draw(ctx, gameSettings.mapOffset.x, gameSettings.mapOffset.y);
            }

            // 특정 타일에 유닛 배치 (예: (2,2) 위치에 유닛)
            if (gameSettings.initial === true &&
                row === gameSettings.unitStartPosition.row && col === gameSettings.unitStartPosition.col) {
                console.log("initial");

                gameSettings.initial = false;
                const unit = new buildUnit(gameSettings.hexRadius / 2); // 유닛 크기와 색상 설정
                unitMap[row][col] = unit;
                user.insertUnit(unit);

                // 테스트 용
                const unit2 = new meleeUnit(gameSettings.hexRadius / 2, userInfo.test, "black", "근접 유닛", 1000, 50); // 유닛 크기와 색상 설정
                unit2.originalColor = "black";
                unitMap[row-1][col-1] = unit2;

                tile.draw(ctx, gameSettings.mapOffset.x, gameSettings.mapOffset.y); // 타일 그리기
            }
        }
    }
    markRedTiles();
    drawChangedTiles(gameSettings.rows, gameSettings.cols);
    showstatus(ctx);
}
// 특정 좌표에 있는 타일들을 빨간색으로 설정
function markRedTiles() {
    const redTilePositions = [
        [3 - 1, 3 - 1], [3 - 1, 8 - 1], [3 - 1, 13 - 1],
        [8 - 1, 3 - 1], [8 - 1, 8 - 1], [8 - 1, 13 - 1],
        [13 - 1, 3 - 1], [13 - 1, 8 - 1], [13 - 1, 13 - 1],
        [6 - 1, 6 - 1], [10 - 1, 6 - 1], [6 - 1, 10 - 1], [10 - 1, 10 - 1]
    ];

    redTilePositions.forEach(([row, col]) => {
        if (hexMap[row] && hexMap[row][col]) {
            hexMap[row][col].setColor("red");
            hexMap[row][col].dirty = true;
            hexMap[row][col].resource = true;
            if (hexMap[row][col].resourceAmount === null) {
                hexMap[row][col].resourceAmount = 1000;
            }
        }
    });

}

// 맵을 그리는 함수
export function drawMap(rows, cols) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 캔버스를 지운 후
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const tile = hexMap[row][col];
            const unit = unitMap[row][col];
            const building = buildingMap[row][col];

            tile.dirty = true;
            tile.draw(ctx, gameSettings.mapOffset.x, gameSettings.mapOffset.y);
            if(building) building.draw(ctx, gameSettings.mapOffset.x, gameSettings.mapOffset.y);
            if(unit) unit.draw(ctx, gameSettings.mapOffset.x, gameSettings.mapOffset.y);
        }
    }
    showstatus(ctx);
}

// 맵을 지우지 않고 변경되 타일만 다시 그리는 함수
export function drawChangedTiles(rows, cols) {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const tile = hexMap[row][col];
            const unit = unitMap[row][col];
            const building = buildingMap[row][col];

            tile.draw(ctx, gameSettings.mapOffset.x, gameSettings.mapOffset.y);
            if(building) building.draw(ctx, gameSettings.mapOffset.x, gameSettings.mapOffset.y);
            if(unit) unit.draw(ctx, gameSettings.mapOffset.x, gameSettings.mapOffset.y);
        }
    }
    showstatus(ctx);
}

export function drawEmptyTiles(rows, cols) {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const tile = hexMap[row][col];
            tile.dirty=true;
            tile.draw(ctx, gameSettings.mapOffset.x, gameSettings.mapOffset.y);
        }
    }
    showstatus(ctx);
}

