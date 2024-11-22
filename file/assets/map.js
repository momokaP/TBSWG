import { meleeUnit, rangedUnit, eliteUnit } from "./UnitClass.js";
import { mainBuilding, developmentBuilding, meleeUnitBuilding, rangedUnitBuilding, eliteUnitBuilding } from "./BuildingClass.js";
import { User } from "./UserClass.js";
import { createHexMap, drawChangedTiles, drawMap, highlightNearbyTiles } from "./CenterRelatedFunc.js";
import { clearButton, switchcase_makeButton, clearStatus, makeDevelopmentButton, makeUnitButton } from "./BelowRelatedFunc.js";
import { animateProjectile, attackedMotion } from "./AnimationRelatedFunc.js";

export const canvas = document.getElementById("hexMap");
export const ctx = canvas.getContext("2d");

const tileSizeSlider = document.getElementById("tileSizeSlider");
const moveSpeedSlider = document.getElementById("moveSpeedSlider");
const tileSizeValue = document.getElementById("tileSizeValue");
const moveSpeedValue = document.getElementById("moveSpeedValue");

let scaleChange = 1;

//export let gameSettings.hexRadius = 50; // 육각형 타일의 반지름
//export const gameSettings.rows = 45; // 행 수
//export const gameSettings.cols = 45; // 열 수
//export let gameSettings.turn = 1;

//export let gameSettings.mapOffset.x = 0; // 맵의 이동을 위한 변수
//export let gameSettings.mapOffset.y = 0; // 맵의 이동을 위한 변수
//export let gameSettings.initial = true;
//export let gameSettings.unitStartPosition.row = 22; // 유닛 초기 행 위치
//export let gameSettings.unitStartPosition.col = 22; // 유닛 초기 열 위치

//export let prices.units.buildUnit = 10;
//export let prices.units.meleeUnit = 20;
//export let priceOfrangedUnit = 30;
//export let priceOfeliteUnit = 40;

//export let priceOfmainBuilding = 100;
//export let priceOfdevelopmentBuilding = 150;
//export let priceOfmeleeUnitBuilding = 200;
//export let priceOfrangedUnitBuilding = 300;
//export let priceOfeliteUnitBuilding = 400;

//export let priceOfMainBuildingImprovement = 100;
//export let priceOfDevelopmentImprovement = 100;
//export let priceOfProductionImprovement = 100;
//export let priceOfmeleeUnitImprovement = 100;
//export let priceOfrangedUnitImprovement = 100;
//export let priceOfeliteUnitImprovement = 100;

//export let initialBuildUnitLimit = 1;
//export let buildUnitLimit = 3;
//export let meleeUnitLimit = 3;
//export let rangedUnitLimit = 3;
//export let eliteUnitLimit = 3;
//export let developmentLimit = 3;

//export let buildUnitMove = 2;
//export let meleeUnitMove = 2;
//export let rangedUnitMove = 2;
//export let eliteUnitMove = 4;

//export let user1 = "user1";
//export let test = "test";

// 리스너용 전역 변수들
let isDragging = false; // 마우스 드래그 여부
let startX, startY; // 마우스 드래그 시작 위치 x,y
let moveSpeed = 100; // 한 번에 이동할 거리 (픽셀 단위
canvas.tabIndex = 1000;  // tabIndex를 설정하여 캔버스가 포커스를 받을 수 있게 합니다.
//export let selectedUnit = null; // 현재 선택된 유닛
let oldSelectedUnit = null; // 이전에 선택된 유닛
//let selectedBuilding = null; //현재 선택된 건물

// 게임 설정 객체
export const gameSettings = {
    hexRadius: 50, // 육각형 타일의 반지름
    rows: 45, // 행 수
    cols: 45, // 열 수
    turn: 1, // 현재 턴
    mapOffset: { x: 0, y: 0 }, // 맵 이동
    initial: true, // 초기 상태
    unitStartPosition: { row: 22, col: 22 }, // 유닛 초기 위치
};

// 자원 및 가격 정보 객체
export const prices = {
    units: {
        buildUnit: 10,
        meleeUnit: 20,
        rangedUnit: 30,
        eliteUnit: 40,
    },
    buildings: {
        mainBuilding: 100,
        developmentBuilding: 150,
        meleeUnitBuilding: 200,
        rangedUnitBuilding: 300,
        eliteUnitBuilding: 400,
    },
    improvements: {
        mainBuilding: 100,
        development: 100,
        production: 100,
        meleeUnit: 100,
        rangedUnit: 100,
        eliteUnit: 100,
    },
};

// 유닛 및 제한 관련 설정
export const limits = {
    initialBuildUnit: 1,
    buildUnit: 3,
    meleeUnit: 3,
    rangedUnit: 3,
    eliteUnit: 3,
    development: 3,
};

// 유닛 이동 거리
export const unitMovement = {
    buildUnit: 2,
    meleeUnit: 2,
    rangedUnit: 2,
    eliteUnit: 4,
};

// 사용자 정보
export const userInfo = {
    user1: "user1",
    test: "test",
};

// 상태 및 이벤트 관련 변수들
export const state = {
    selectedUnit: null, // 현재 선택된 유닛
    selectedBuilding: null, // 현재 선택된 건물
    dragging: {
        isDragging: false, // 마우스 드래그 여부
        startX: null, // 드래그 시작 X 좌표
        startY: null, // 드래그 시작 Y 좌표
        moveSpeed: 100, // 이동 속도
    },
};

export const hexMap = []; // 육각형 타일 정보를 저장할 배열
export const unitMap = []; // 유닛 정보를 저장할 배열
export const buildingMap = []; // 건물 정보를 저장할 배열

export const user = new User(userInfo.user1);

for (let row = 0; row < gameSettings.rows; row++) {
    hexMap[row] = []; // 각 행을 초기화
    unitMap[row] = []; // 각 행을 초기화
    buildingMap[row] = []; // 각 행을 초기화
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
            hex.updateHover(mouseX, mouseY, gameSettings.mapOffset.x, gameSettings.mapOffset.y);
        });
    });

    requestAnimationFrame(() => drawChangedTiles()); // 변경된 타일만 다시 그리기

    if (isDragging) {
        // 드래그 중일 때 마우스 이동 거리를 계산하여 mapOffsetX, mapOffsetY 변경
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;

        gameSettings.mapOffset.x += dx;
        gameSettings.mapOffset.y += dy;

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
    let buildingAttacked = false;

    hexMap.forEach(row => {
        row.forEach(tile => {
            tile.updateClick(mouseX, mouseY, gameSettings.mapOffset.x, gameSettings.mapOffset.y);
            try {
                if (tile.unit && tile.unit.isClicked(mouseX, mouseY, gameSettings.mapOffset.x, gameSettings.mapOffset.y)) {
                    // 유닛을 클릭했을 때
                    state.selectedUnit = tile.unit;
                    unitClicked = true;

                    // 유닛의 정보를 <div class="status">에 표시
                    document.getElementById("name-value").textContent = `${state.selectedUnit.name}`;
                    document.getElementById("owner-value").textContent = `${state.selectedUnit.user}`;
                    document.getElementById("health-value").textContent = `체력: ${state.selectedUnit.health}`;
                    document.getElementById("move").textContent = `이동력`;
                    document.getElementById("move-value").textContent = `${state.selectedUnit.move}`;
                    document.getElementById("function-value").textContent = `기능: ${state.selectedUnit.description}`;

                    clearButton();
                    switchcase_makeButton(tile);

                    if (state.selectedUnit !== oldSelectedUnit) {
                        //현재 클릭한 유닛과 이전에 클릭한 유닛이 다를 때
                        if (tile.color === "yellow" && oldSelectedUnit
                            && state.selectedUnit.user !== oldSelectedUnit.user) {
                            if (oldSelectedUnit && oldSelectedUnit.move > 0) {
                                //현재 클릭한 유닛의 유저와 이전에 클릭한 유닛의 유저가 다를 때 공격한다
                                if (oldSelectedUnit instanceof meleeUnit || oldSelectedUnit instanceof rangedUnit || oldSelectedUnit instanceof eliteUnit) {
                                    console.log(`attack!`);
                                    unitAttacked = true;
                                    oldSelectedUnit.move = oldSelectedUnit.move - 1;

                                    const dx = state.selectedUnit.x - oldSelectedUnit.x;
                                    const dy = state.selectedUnit.y - oldSelectedUnit.y;

                                    state.selectedUnit.health = state.selectedUnit.health - oldSelectedUnit.damage;

                                    if (oldSelectedUnit instanceof rangedUnit) {
                                        console.log(`원거리!`);
                                        // 원거리 유닛 공격 로직
                                        const fromX = oldSelectedUnit.x + gameSettings.mapOffset.x;
                                        const fromY = oldSelectedUnit.y + gameSettings.mapOffset.y;
                                        const toX = state.selectedUnit.x + gameSettings.mapOffset.x;
                                        const toY = state.selectedUnit.y + gameSettings.mapOffset.y;

                                        animateProjectile(fromX, fromY, toX, toY, () => {
                                            // 투사체 도착 후 공격 처리
                                            console.log(`ranged attack!`);
                                            attackedMotion(dx, dy, state.selectedUnit);
                                        });
                                    }
                                    else {
                                        attackedMotion(dx, dy, state.selectedUnit);
                                    }
                                    document.getElementById("health-value").textContent = `체력: ${state.selectedUnit.health}`;
                                }
                            }

                            if (state.selectedUnit.health <= 0) {
                                user.deleteUnit(unitMap[state.selectedUnit.row][state.selectedUnit.col]);
                                // 이전에 클릭한 유닛의 체력이 0이하가 되면 유닛 제거
                                unitMap[state.selectedUnit.row][state.selectedUnit.col] = null;
                                // 해당 타일의 유닛 제거
                                hexMap[state.selectedUnit.row][state.selectedUnit.col].deleteUnit();

                                clearStatus();
                                clearButton();
                            }
                        }
                        createHexMap(gameSettings.rows, gameSettings.cols);
                    }
                    if (state.selectedUnit.health > 0 && !unitAttacked) {
                        //if(selectedUnit instanceof eliteUnit){
                        //    highlightNearbyTiles(selectedUnit, rows, cols, 2); // 근처 타일 색상 변경
                        //}
                        //else{
                        highlightNearbyTiles(state.selectedUnit, gameSettings.rows, gameSettings.cols); // 근처 타일 색상 변경
                        //}
                    }

                    oldSelectedUnit = state.selectedUnit;
                }
            }
            catch (err) {
                console.error(err);
                console.log(`is:${tile.unit}, x:${tile.unit.row}, y:${tile.unit.col}`);
                unitMap.forEach(row => {
                    row.forEach(unit => {
                        if (unit) {
                            console.log(`unit O, x:${unit.row}, y:${unit.col}`);
                        }
                    });
                });
                hexMap.forEach(row => {
                    row.forEach(tile => {
                        if (tile.unit) {
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
                if (tile.isClicked === true) {
                    // 하이라이트 된, 유닛이 없는 타일을 클릭하면 유닛은 이동한다
                    if ((tile.color === "yellow" || tile.color === "gold") && tile.unit === null) {
                        if (tile.Building && oldSelectedUnit
                            && tile.Building.user !== oldSelectedUnit.user) {
                            if (oldSelectedUnit && oldSelectedUnit.move > 0) {
                                if (oldSelectedUnit instanceof meleeUnit || oldSelectedUnit instanceof rangedUnit || oldSelectedUnit instanceof eliteUnit) {
                                    console.log(`건물피격 판정`);
                                    buildingAttacked = true;
                                    oldSelectedUnit.move = oldSelectedUnit.move - 1;

                                    const dx = 0;
                                    const dy = 0;

                                    tile.Building.health = tile.Building.health - oldSelectedUnit.damage;

                                    if (oldSelectedUnit instanceof rangedUnit) {
                                        console.log(`원거리!`);
                                        // 원거리 유닛 공격 로직
                                        const fromX = oldSelectedUnit.x + gameSettings.mapOffset.x;
                                        const fromY = oldSelectedUnit.y + gameSettings.mapOffset.y;
                                        const toX = tile.Building.x + gameSettings.mapOffset.x;
                                        const toY = tile.Building.y + gameSettings.mapOffset.y;

                                        animateProjectile(fromX, fromY, toX, toY, () => {
                                            // 투사체 도착 후 공격 처리
                                            console.log(`ranged attack!`);
                                            attackedMotion(dx, dy), tile.Building;
                                        });
                                    }
                                    else {
                                        attackedMotion(dx, dy, tile.Building);
                                    }
                                    document.getElementById("health-value").textContent = `체력: ${tile.Building.health}`;
                                }
                            }

                            if (tile.Building.health <= 0) {
                                user.deleteBuilding(buildingMap[tile.Building.row][tile.Building.col]);
                                // 이전에 클릭한 건물의 체력이 0이하가 되면 건물 제거
                                buildingMap[tile.Building.row][tile.Building.col] = null;
                                // 해당 타일의 건물 제거
                                hexMap[tile.Building.row][tile.Building.col].deleteBuilding();

                                clearStatus();
                                clearButton();
                            }
                        }
                        else {
                            if (state.selectedUnit && state.selectedUnit.move > 0) {
                                state.selectedUnit.move = state.selectedUnit.move - 1;
                                document.getElementById("move-value").textContent = `${state.selectedUnit.move}`;
                                // 유닛을 다른 타일로 이동 시키기 위해 unitMap에서 이전의 유닛 제거
                                unitMap[state.selectedUnit.row][state.selectedUnit.col] = null;
                                // 유닛을 다른 타일로 이동 시키기 위해 hexMap에서 이전 타일을 고르고, 그 타일의 유닛 제거
                                hexMap[state.selectedUnit.row][state.selectedUnit.col].deleteUnit();

                                // 노란색으로 하이라이트 된 타일을 클릭하면 유닛을 해당 타일로 이동
                                tile.placeUnit(state.selectedUnit);
                                unitMap[tile.unit.row][tile.unit.col] = tile.unit;
                                unitMoved = true;

                                clearButton();
                                switchcase_makeButton(tile);

                                state.selectedUnit = null; // 유닛을 이동시킨 후 선택 해제
                                createHexMap(gameSettings.rows, gameSettings.cols);
                            }
                            else {
                                clearStatus();
                                clearButton();
                                createHexMap(gameSettings.rows, gameSettings.cols);
                            }
                        }
                    }
                    else {
                        if (!BuildingClicked) {
                            if (tile.resource) {
                                document.getElementById("name-value").textContent = `자원 타일이다`;
                                document.getElementById("health-value").textContent = `자원 양 : ${tile.resourceAmount}`;
                                document.getElementById("move").textContent = `이동력`;
                                document.getElementById("function-value").textContent = `이 타일 위에서만 main 건물을 건설할 수 있다`;
                            }
                            else {
                                clearStatus();
                            }
                            clearButton();

                            createHexMap(gameSettings.rows, gameSettings.cols);
                        }
                    }
                }
                if (tile.Building && !unitMoved && tile.Building.isBuildingClicked(mouseX, mouseY, gameSettings.mapOffset.x, gameSettings.mapOffset.y)) {
                    // 건물을 클릭했을 때
                    state.selectedBuilding = tile.Building;
                    BuildingClicked = true;

                    // 건물의 정보를 <div class="status">에 표시
                    document.getElementById("name-value").textContent = `${state.selectedBuilding.name}`;
                    document.getElementById("owner-value").textContent = `${state.selectedBuilding.user}`;
                    document.getElementById("health-value").textContent = `체력: ${state.selectedBuilding.health}`;
                    document.getElementById("move").textContent = `대기 턴 수`;
                    if (state.selectedBuilding.pendingUnits.length > 0) {
                        let penddingTurns = state.selectedBuilding.pendingUnits[0].startTurn + state.selectedBuilding.pendingUnits[0].delay - gameSettings.turn;
                        let pendingUnits = state.selectedBuilding.pendingUnits.length;
                        document.getElementById("move-value").innerHTML =
                            `${penddingTurns}턴 뒤 유닛 생산<br>${pendingUnits}개 대기중`;
                    }
                    if (state.selectedBuilding.pendingDevelopment.length > 0) {
                        let penddingTurns = state.selectedBuilding.pendingDevelopment[0].startTurn + state.selectedBuilding.pendingDevelopment[0].delay - gameSettings.turn;
                        let pendingUnits = state.selectedBuilding.pendingDevelopment.length;
                        document.getElementById("move-value").innerHTML =
                            `${penddingTurns}턴 뒤 발전<br>${pendingUnits}개 대기중`;
                    }
                    else {
                        document.getElementById("move-value").textContent = ` `;
                    }
                    document.getElementById("function-value").textContent = `기능: ${state.selectedBuilding.description}`;

                    clearButton();
                    switch (true) {
                        case state.selectedBuilding instanceof mainBuilding:
                            makeUnitButton(tile, 1, "mainBuilding");
                            makeDevelopmentButton(tile, 2, "mainBuildingImprovement")
                            break;
                        case state.selectedBuilding instanceof developmentBuilding:
                            makeDevelopmentButton(tile, 1, "developmentImprovement");
                            makeDevelopmentButton(tile, 2, "productionImprovement");
                            makeDevelopmentButton(tile, 3, "meleeUnitImprovement");
                            makeDevelopmentButton(tile, 4, "rangedUnitImprovement");
                            makeDevelopmentButton(tile, 5, "eliteUnitImprovement");
                            break;
                        case state.selectedBuilding instanceof meleeUnitBuilding:
                            makeUnitButton(tile, 1, "meleeUnitBuilding");
                            break;
                        case state.selectedBuilding instanceof rangedUnitBuilding:
                            makeUnitButton(tile, 1, "rangedUnitBuilding");
                            break;
                        case state.selectedBuilding instanceof eliteUnitBuilding:
                            makeUnitButton(tile, 1, "eliteUnitBuilding");
                            break;
                        default:
                            console.log("Building은 다른 클래스의 인스턴스입니다.");
                    }

                    createHexMap(gameSettings.rows, gameSettings.cols);
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
                gameSettings.mapOffset.y += moveSpeed;  // 위로 이동
                break;
            case 'S':
            case 's':
            case 'ArrowDown':
                gameSettings.mapOffset.y -= moveSpeed;  // 아래로 이동
                break;
            case 'A':
            case 'a':
            case 'ArrowLeft':
                gameSettings.mapOffset.x += moveSpeed;  // 왼쪽으로 이동
                break;
            case 'D':
            case 'd':
            case 'ArrowRight':
                gameSettings.mapOffset.x -= moveSpeed;  // 오른쪽으로 이동
                break;
        }
        requestAnimationFrame(drawMap);
    }
});

// 마우스 휠 이벤트 처리
canvas.addEventListener("wheel", (event) => {
    event.preventDefault(); // 기본 스크롤 동작 방지

    const zoomSpeed = 2;  // 휠 스크롤 시 변화 속도
    const oldRadius = gameSettings.hexRadius; // 이전 반지름 저장

    if (event.deltaY < 0) {
        gameSettings.hexRadius += zoomSpeed; // 휠을 위로 올리면 타일 크기 증가
    } else {
        gameSettings.hexRadius -= zoomSpeed; // 휠을 아래로 내리면 타일 크기 감소
    }

    // hexRadius의 범위 제한
    gameSettings.hexRadius = Math.min(Math.max(gameSettings.hexRadius, 10), 100);

    // 스케일 변화 비율 계산
    scaleChange = gameSettings.hexRadius / oldRadius;

    // 기존 offsetX, offsetY 보정 적용
    gameSettings.mapOffset.x *= scaleChange;
    gameSettings.mapOffset.y *= scaleChange;

    // 타일 크기 표시 업데이트
    tileSizeValue.textContent = gameSettings.hexRadius;
    tileSizeSlider.value = gameSettings.hexRadius;

    // 맵 다시 그리기
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    createHexMap(gameSettings.rows, gameSettings.cols);
});

// 타일 크기 슬라이더 값이 변경될 때
tileSizeSlider.addEventListener("input", (event) => {
    const oldRadius = gameSettings.hexRadius; // 이전 반지름 저장

    gameSettings.hexRadius = parseInt(event.target.value);
    tileSizeValue.textContent = gameSettings.hexRadius;  // 슬라이더 값 표시

    // 스케일 변화 비율 계산
    scaleChange = gameSettings.hexRadius / oldRadius;

    // 기존 offsetX, offsetY 보정 적용
    gameSettings.mapOffset.x *= scaleChange;
    gameSettings.mapOffset.y *= scaleChange;

    // 맵 다시 그리기
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    createHexMap(gameSettings.rows, gameSettings.cols);
});

// 이동 속도 슬라이더 값이 변경될 때
moveSpeedSlider.addEventListener("input", (event) => {
    moveSpeed = parseInt(event.target.value);
    moveSpeedValue.textContent = moveSpeed;  // 슬라이더 값 표시
});

function nextTurn() {
    // 턴을 표시하는 div 요소
    const turnElement = document.getElementById("turn");

    // 턴 넘기기 버튼
    const nextTurnButton = document.getElementById("nextTurnButton");

    if (gameSettings.initial) turnElement.textContent = `턴: ${gameSettings.turn}`; // 텍스트 업데이트

    // 턴 넘기기 버튼 클릭 시 실행되는 함수
    nextTurnButton.addEventListener("click", function () {
        gameSettings.turn++; // 턴을 증가시킴
        turnElement.textContent = `턴: ${gameSettings.turn}`; // 텍스트 업데이트

        for (let row = 0; row < gameSettings.rows; row++) {
            for (let col = 0; col < gameSettings.cols; col++) {
                if (unitMap[row] && unitMap[row][col]) {
                    unitMap[row][col].move = unitMap[row][col].initialMove;
                }
            }
        }

        user.gatheredResources();
        user.processPending();

        createHexMap(gameSettings.rows, gameSettings.cols);
        clearStatus();
        clearButton();
    });
}
nextTurn();

// 맵 생성 함수 호출
createHexMap(gameSettings.rows, gameSettings.cols); // 45행, 45열의 육각형 맵
createHexMap(gameSettings.rows, gameSettings.cols); // 45행, 45열의 육각형 맵