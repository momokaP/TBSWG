import { io } from "/socket.io/socket.io.esm.min.js"; // ESM 방식 사용 시
const socket = io(); // 서버와 연결

import { buildUnit, meleeUnit, rangedUnit, eliteUnit } from "./UnitClass.js";
import { mainBuilding, developmentBuilding, 
         meleeUnitBuilding, rangedUnitBuilding, 
         eliteUnitBuilding } from "./BuildingClass.js";
import { User } from "./UserClass.js";
import { createHexMap, drawChangedTiles, 
         drawMap, highlightNearbyTiles, 
         drawEmptyTiles } from "./CenterRelatedFunc.js";
import { clearButton, switchcase_makeButton, 
         clearStatus, makeDevelopmentButton, 
         makeUnitButton } from "./BelowRelatedFunc.js";
import { animateProjectile, attackedMotion } from "./AnimationRelatedFunc.js";
import { saveHexMapToServer, 
         fetchHexMapFromServer, 
         saveUnitMapToServer,
         fetchUnitMapFromServer,
         saveBuildingMapToServer,
         fetchBuildingMapFromServer,
         saveGameUserToServer,
         fetchGameUserFromServer } from "./mongodbHandler.js";

export const canvas = document.getElementById("hexMap");
export const ctx = canvas.getContext("2d");

const tileSizeSlider = document.getElementById("tileSizeSlider");
const moveSpeedSlider = document.getElementById("moveSpeedSlider");
const tileSizeValue = document.getElementById("tileSizeValue");
const moveSpeedValue = document.getElementById("moveSpeedValue");

let scaleChange = 1;

let gameroom;

// 리스너용 전역 변수들
let isDragging = false; // 마우스 드래그 여부
let startX, startY; // 마우스 드래그 시작 위치 x,y
let moveSpeed = 50; // 한 번에 이동할 거리 (픽셀 단위)
canvas.tabIndex = 1000;  // tabIndex를 설정하여 캔버스가 포커스를 받을 수 있게 합니다.

let oldSelectedUnit = null; // 이전에 선택된 유닛
let whoturn;

// 게임 설정 객체
export const gameSettings = {
    hexRadius: 14, // 육각형 타일의 반지름
    rows: 15, // 행 수
    cols: 15, // 열 수
    turn: 1, // 현재 턴
    oldturn: 1,
    myturn: false,
    mapOffset: { x: 0, y: 0 }, // 맵 이동
    initial: true, // 초기 상태
    unit1_StartPosition: { row: 2, col: 7 }, // 유닛 초기 위치
    unit2_StartPosition: { row: 12, col: 7 }, // 유닛 초기 위치
    username,
    win:2,
    lose:2,
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
    development: 1,
    pendingUnit: 1,
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
    user: null,
    user1: "user1",
    user2: "user2",
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

    requestAnimationFrame(() => drawChangedTiles(gameSettings.rows, gameSettings.cols)); // 변경된 타일만 다시 그리기

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
        requestAnimationFrame(() => drawMap(gameSettings.rows, gameSettings.cols)); //createHexMap(rows, cols)
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
                if (unitMap[tile.row][tile.col] && unitMap[tile.row][tile.col].isClicked(mouseX, mouseY, gameSettings.mapOffset.x, gameSettings.mapOffset.y)) {
                    // 유닛을 클릭했을 때
                    state.selectedUnit = unitMap[tile.row][tile.col];
                    unitClicked = true;

                    // 유닛의 정보를 <div class="status">에 표시
                    document.getElementById("name-value").textContent = `${state.selectedUnit.name}`;
                    document.getElementById("owner-value").textContent = `${state.selectedUnit.user}`;
                    document.getElementById("health-value").textContent = `체력: ${state.selectedUnit.health}`;
                    document.getElementById("move").textContent = `이동력`;
                    document.getElementById("move-value").textContent = `${state.selectedUnit.move}`;
                    document.getElementById("function-value").textContent = `기능: ${state.selectedUnit.description}`;

                    clearButton();


                    if(userInfo.user.name === state.selectedUnit.user && gameSettings.myturn ) switchcase_makeButton(tile);

                    console.log(userInfo.user.name);
                    if(oldSelectedUnit) console.log(oldSelectedUnit.user);

                    if ( state.selectedUnit !== oldSelectedUnit ) {
                        //현재 클릭한 유닛과 이전에 클릭한 유닛이 다를 때
                        if (tile.color === "yellow" && oldSelectedUnit
                            && state.selectedUnit.user !== oldSelectedUnit.user) {
                            // 유닛의 유닛 공격
                            if (oldSelectedUnit && oldSelectedUnit.move > 0 &&
                                userInfo.user.name === oldSelectedUnit.user &&
                                gameSettings.myturn) {
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
                                            (async function() {
                                                await attackedMotion(dx, dy, state.selectedUnit);
                                                savedata();
                                            })();
                                        });
                                    }
                                    else {
                                        (async function() {
                                            await attackedMotion(dx, dy, state.selectedUnit);
                                            savedata();
                                        })();
                                        //attackedMotion(dx, dy, state.selectedUnit);
                                    }
                                    document.getElementById("health-value").textContent = `체력: ${state.selectedUnit.health}`;
                                }
                            }

                            if (state.selectedUnit.health <= 0) {
                                console.log("유닛 사망");
                                userInfo.user.deleteUnit(unitMap[state.selectedUnit.row][state.selectedUnit.col]);
                                // 이전에 클릭한 유닛의 체력이 0이하가 되면 유닛 제거
                                unitMap[state.selectedUnit.row][state.selectedUnit.col] = null;
                                // 해당 타일의 유닛 제거
                                hexMap[state.selectedUnit.row][state.selectedUnit.col].deleteUnit();
                                
                                savedata();
                                clearStatus();
                                clearButton();
                            }
                        }
                        createHexMap(gameSettings.rows, gameSettings.cols);
                    }
                    if (state.selectedUnit.health > 0 && !unitAttacked &&
                        userInfo.user.name === state.selectedUnit.user &&
                        gameSettings.myturn) {
                        highlightNearbyTiles(state.selectedUnit, gameSettings.rows, gameSettings.cols); // 근처 타일 색상 변경
                    }

                    oldSelectedUnit = state.selectedUnit;
                }
            }
            catch (err) {
                console.log("cilck error");
            }
        });
    });

    if (!unitClicked) {
        hexMap.forEach(row => {
            row.forEach(tile => {
                if (tile.isClicked === true) {
                    // 하이라이트 된, 유닛이 없는 타일을 클릭하면 유닛은 이동한다
                    if ((tile.color === "yellow" || tile.color === "gold") && !unitMap[tile.row][tile.col]) {
                        if (buildingMap[tile.row][tile.col] && oldSelectedUnit
                            && buildingMap[tile.row][tile.col].user !== oldSelectedUnit.user) {
                            // 유닛의 건물 공격
                            // 나의 공격 유닛이 상대 유저의 건물을 클릭하면 건물을 공격한다
                            if (oldSelectedUnit && oldSelectedUnit.move > 0 &&
                                oldSelectedUnit.user === userInfo.user.name &&
                                gameSettings.myturn) {
                                if (oldSelectedUnit instanceof meleeUnit || oldSelectedUnit instanceof rangedUnit || oldSelectedUnit instanceof eliteUnit) {
                                    console.log(`건물피격 판정`);
                                    buildingAttacked = true;
                                    oldSelectedUnit.move = oldSelectedUnit.move - 1;

                                    const dx = 0;
                                    const dy = 0;

                                    buildingMap[tile.row][tile.col].health = buildingMap[tile.row][tile.col].health - oldSelectedUnit.damage;

                                    if (oldSelectedUnit instanceof rangedUnit) {
                                        console.log(`원거리!`);
                                        // 원거리 유닛 공격 로직
                                        const fromX = oldSelectedUnit.x + gameSettings.mapOffset.x;
                                        const fromY = oldSelectedUnit.y + gameSettings.mapOffset.y;
                                        const toX = buildingMap[tile.row][tile.col].x + gameSettings.mapOffset.x;
                                        const toY = buildingMap[tile.row][tile.col].y + gameSettings.mapOffset.y;

                                        animateProjectile(fromX, fromY, toX, toY, () => {
                                            // 투사체 도착 후 공격 처리
                                            console.log(`ranged attack!`);
                                            attackedMotion(dx, dy), buildingMap[tile.row][tile.col];
                                        });
                                    }
                                    else {
                                        attackedMotion(dx, dy, buildingMap[tile.row][tile.col]);
                                    }
                                    document.getElementById("health-value").textContent = `체력: ${buildingMap[tile.row][tile.col].health}`;
                                }
                            }

                            if (buildingMap[tile.row][tile.col].health <= 0) {
                                userInfo.user.deleteBuilding(buildingMap[buildingMap[tile.row][tile.col].row][buildingMap[tile.row][tile.col].col]);
                                // 이전에 클릭한 건물의 체력이 0이하가 되면 건물 제거
                                buildingMap[tile.row][tile.col] = null;
                                // 해당 타일의 건물 제거
                                //hexMap[tile.row][tile.col].deleteBuilding();

                                clearStatus();
                                clearButton();
                            }
                            savedata();
                        }
                        else {
                            // 유닛의 이동
                            if (gameSettings.myturn &&
                                userInfo.user.name === state.selectedUnit.user &&
                                state.selectedUnit && state.selectedUnit.move > 0) {
                                state.selectedUnit.move = state.selectedUnit.move - 1;
                                document.getElementById("move-value").textContent = `${state.selectedUnit.move}`;
                                // 유닛을 다른 타일로 이동 시키기 위해 unitMap에서 이전의 유닛 제거
                                unitMap[state.selectedUnit.row][state.selectedUnit.col] = null;

                                // 노란색으로 하이라이트 된 타일을 클릭하면 유닛을 해당 타일로 이동
                                unitMap[tile.row][tile.col] = state.selectedUnit;
                                unitMoved = true;

                                clearButton();
                                switchcase_makeButton(tile);

                                state.selectedUnit = null; // 유닛을 이동시킨 후 선택 해제
                                savedata();
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
                if (buildingMap[tile.row][tile.col] && !unitMoved && buildingMap[tile.row][tile.col].isBuildingClicked(mouseX, mouseY, gameSettings.mapOffset.x, gameSettings.mapOffset.y)) {
                    // 건물을 클릭했을 때
                    state.selectedBuilding = buildingMap[tile.row][tile.col];
                    BuildingClicked = true;

                    // 건물의 정보를 <div class="status">에 표시
                    document.getElementById("name-value").textContent = `${state.selectedBuilding.name}`;
                    document.getElementById("owner-value").textContent = `${state.selectedBuilding.user}`;
                    document.getElementById("health-value").textContent = `체력: ${state.selectedBuilding.health}`;
                    document.getElementById("move").textContent = `대기 턴 수`;
                    if (state.selectedBuilding.pendingUnits.length > 0 &&
                        state.selectedBuilding.user === userInfo.user.name) {
                        console.log("건물"+state.selectedBuilding.pendingUnits[0]);
                        console.log(state.selectedBuilding.pendingUnits.length);
                        let penddingTurns = state.selectedBuilding.pendingUnits[0].startTurn + state.selectedBuilding.pendingUnits[0].delay - gameSettings.turn;
                        let pendingUnits = state.selectedBuilding.pendingUnits.length;
                        console.log(`${penddingTurns} ${pendingUnits}`);
                        //document.getElementById("move-value").innerHTML =
                        //    `${penddingTurns}턴 뒤 유닛 생산<br>${pendingUnits}개 대기중`;
                    }
                    else if (state.selectedBuilding.pendingDevelopment.length > 0 &&
                             state.selectedBuilding.user === userInfo.user.name) {
                        let penddingTurns = state.selectedBuilding.pendingDevelopment[0].startTurn + state.selectedBuilding.pendingDevelopment[0].delay - gameSettings.turn;
                        let pendingUnits = state.selectedBuilding.pendingDevelopment.length;
                        //document.getElementById("move-value").innerHTML =
                        //    `${penddingTurns}턴 뒤 발전<br>${pendingUnits}개 대기중`;
                    }
                    else {
                        document.getElementById("move-value").textContent = ` `;
                    }
                    document.getElementById("function-value").textContent = `기능: ${state.selectedBuilding.description}`;

                    clearButton();
                    if(state.selectedBuilding.user === userInfo.user.name &&
                        gameSettings.myturn){
                        switch (true) {
                            case state.selectedBuilding instanceof mainBuilding:
                                makeUnitButton(tile, 1, "mainBuilding");
                                //makeDevelopmentButton(tile, 2, "mainBuildingImprovement")
                                break;
                            case state.selectedBuilding instanceof developmentBuilding:
                                //makeDevelopmentButton(tile, 1, "developmentImprovement");
                                //makeDevelopmentButton(tile, 2, "productionImprovement");
                                //makeDevelopmentButton(tile, 3, "meleeUnitImprovement");
                                //makeDevelopmentButton(tile, 4, "rangedUnitImprovement");
                                //makeDevelopmentButton(tile, 5, "eliteUnitImprovement");
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
        requestAnimationFrame(() => drawMap(gameSettings.rows, gameSettings.cols));
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


const gameEndButton = document.getElementById("end-game-btn");
gameEndButton.addEventListener("click", function () {
    gamedelete();
});

// 클라이언트에서 방 삭제 처리
socket.on('gameroomDeleted', (gameroom) => {
    alert(`방 ${gameroom}이 삭제되었습니다.`);
    window.location.href = '/';  // 메인 페이지로 리디렉션
});


function gamedelete() {
    // 종료 확인 창 표시
    const userConfirmed = confirm("정말로 게임을 종료하시겠습니까?");

    if (userConfirmed) {
        socket.emit('deleteGameRoom', gameroom); // 서버로 방 삭제 요청


        // 확인을 누르면 DELETE 요청 전송
        fetch("/data/delete-all", {
            method: "DELETE",
        })
            .then(response => {
                if (response.ok) {
                    // 성공 시 다른 페이지로 리다이렉트
                    window.location.href = "/";
                } else {
                    alert("게임 종료 중 오류가 발생했습니다. 다시 시도해주세요.");
                }
            })
            .catch(error => {
                window.location.href = "/";
                console.error("Error:", error);
                alert("서버와의 연결에 문제가 발생했습니다.");
            });
    } else {
        // 취소를 누른 경우 아무 작업도 하지 않음
        console.log("사용자가 종료를 취소했습니다.");
    }
}

// 클라이언트에서 방 삭제 처리
socket.on('Gameend', () => {
    gameend();
});

function gameend() {
    let iswin;

    if(gameSettings.lose === 1){
        alert("패배했습니다");
        iswin = false;
    }
    else{
        alert("승리했습니다");
        iswin = true;
    }


    socket.emit('save record', iswin, userInfo.user.name, gameroom);
    socket.emit('deleteGameRoom', gameroom); // 서버로 방 삭제 요청


    // 확인을 누르면 DELETE 요청 전송
    fetch("/data/delete-all", {
        method: "DELETE",
    })
        .then(response => {
            if (response.ok) {
                // 성공 시 다른 페이지로 리다이렉트
                window.location.href = "/";
            } else {
                alert("게임 종료 중 오류가 발생했습니다. 다시 시도해주세요.");
            }
        })
        .catch(error => {
            window.location.href = "/";
            console.error("Error:", error);
            alert("서버와의 연결에 문제가 발생했습니다.");
        });

}

function nextTurn() {
    // 턴을 표시하는 div 요소
    const turnElement = document.getElementById("turn");

    // 턴 넘기기 버튼
    const nextTurnButton = document.getElementById("nextTurnButton");

    //if (gameSettings.initial) turnElement.textContent = `턴: ${gameSettings.turn}`; // 텍스트 업데이트

    // 턴 넘기기 버튼 클릭 시 실행되는 함수
    nextTurnButton.addEventListener("click", function () {
        if(gameSettings.myturn){
            gameSettings.turn++; // 턴을 증가시킴
            //turnElement.textContent = `턴: ${gameSettings.turn}`; // 텍스트 업데이트

            for (let row = 0; row < gameSettings.rows; row++) {
                for (let col = 0; col < gameSettings.cols; col++) {
                    if (unitMap[row] && unitMap[row][col]) {
                        unitMap[row][col].move = unitMap[row][col].initialMove;
                    }
                }
            }

            userInfo.user.gatheredResources();
            //userInfo.user.processPending();

            savedata();
            updateGameRoom();

            renderHexMap();
            renderUnitMap();
            renderBuildingMap();
            renderGameUser();
            userStatusUpdate();

            createHexMap(gameSettings.rows, gameSettings.cols);
            clearStatus();
            clearButton();

            //console.log("whoturn:",whoturn);
            //document.getElementById("turn").textContent = `${whoturn}의 턴`;
        }
    });
    
}

document.addEventListener("DOMContentLoaded", async () => {
    await fetchGameRoom();
    socket.emit("joinGameRoom", gameroom);

    createHexMap(gameSettings.rows, gameSettings.cols); // 15행, 15열의 육각형 맵

    // 새로고침 하면 서버에서 데이터 가져와 렌더링
    await renderHexMap(); 
    await renderUnitMap();
    await renderBuildingMap();
    await renderGameUser();
    userStatusUpdate();

    gameSettings.oldturn = gameSettings.turn;

    savedata();

    document.getElementById("turn").textContent = `${whoturn}의 턴`;

    createHexMap(gameSettings.rows, gameSettings.cols); // 15행, 15열의 육각형 맵
});

export function savedata() {
    const formattedHexMap = hexMap.map((row, rowIndex) => row
        .map((tile, colIndex) => {
            // resource가 true일 때만 객체를 생성
            if (tile.resource) {
                return {
                    row: rowIndex,
                    col: colIndex,
                    resource: tile.resource,
                    resourceAmount: tile.resourceAmount,
                };
            }
            return null; // resource가 없으면 null 반환
        })
        .filter(tile => tile !== null) // null 값 제거
    );

    const formattedUnitMap = unitMap.map((row, rowIndex) => row
        .map((unit, colIndex) => {
            // resource가 true일 때만 객체를 생성
            if (unit) {
                return {
                    name: unit.name,
                    row: rowIndex,
                    col: colIndex,
                    health: unit.health,
                    damage: unit.damage,
                    move: unit.move,
                    user: unit.user,
                    color: unit.originalColor,
                };
            }
            return null; // resource가 없으면 null 반환
        })
        .filter(unit => unit !== null) // null 값 제거
    );

    const formattedBuildingMap = buildingMap.map((row, rowIndex) => row
        .map((building, colIndex) => {
            // resource가 true일 때만 객체를 생성
            if (building) {
                return {
                    name: building.name,
                    row: rowIndex,
                    col: colIndex,
                    health: building.health,
                    user: building.user,
                    // pendingUnits가 배열이고 모든 요소가 유효한 경우만 저장
                    pendingUnits: Array.isArray(building.pendingUnits)
                        ? building.pendingUnits
                            .filter(unit => unit.startTurn !== undefined &&
                                unit.delay !== undefined &&
                                unit.buildingType !== undefined &&
                                unit.tile !== undefined)
                            .map(unit => ({
                                startTurn: unit.startTurn,
                                delay: unit.delay,
                                buildingType: unit.buildingType,
                                tile: unit.tile,
                            }))
                        : [],
                    // pendingDevelopment가 배열이고 모든 요소가 유효한 경우만 저장
                    pendingDevelopment: Array.isArray(building.pendingDevelopment)
                        ? building.pendingDevelopment
                            .filter(dev => dev.startTurn !== undefined &&
                                dev.delay !== undefined &&
                                dev.developmentType !== undefined &&
                                dev.tile !== undefined)
                            .map(dev => ({
                                startTurn: dev.startTurn,
                                delay: dev.delay,
                                developmentType: dev.developmentType,
                                tile: dev.tile,
                            }))
                        : [],
                    gatherResources: building.gatherResources,
                };
            }
            return null; // resource가 없으면 null 반환
        })
        .filter(building => building !== null) // null 값 제거
    );

    //console.log(formattedHexMap);
    //console.log(formattedUnitMap);
    //console.log(formattedBuildingMap);
    saveHexMapToServer(formattedHexMap);
    saveUnitMapToServer(formattedUnitMap);
    saveBuildingMapToServer(formattedBuildingMap);
    saveGameUserToServer(userInfo.user);

    // 소켓을 통해 서버에 데이터 전송
    socket.emit("save data", {
        Message: "save data",
        gameroom: gameroom,
    });
}

async function fetchGameRoom(){
    try {
        const response = await fetch('/data/gameroom'); // 서버에서 데이터 받아오기
        const data = await response.json();
        gameroom = data.gameroom;
        userInfo.user1 = data.usernames[0];
        userInfo.user2 = data.usernames[1];
        gameSettings.username = data.username;
        gameSettings.initial=data.initial;
    
        console.log(userInfo.user1, userInfo.user2, gameSettings.username);
    
        if(gameSettings.username===userInfo.user1){
            userInfo.user = new User(userInfo.user1);
        }
        else if(gameSettings.username===userInfo.user2){
            userInfo.user = new User(userInfo.user2);
        }

        whoturn = data.myturn;

        if(data.myturn === userInfo.user.name){
            gameSettings.myturn = true;
        }
        else{
            gameSettings.myturn = false;
        }
        console.log(gameSettings.myturn);
    
    } catch (error) {
        console.error('Error fetching gameroom');
    }
}

async function fetchGameRoom_turn(){
    try {
        const response = await fetch('/data/gameroom'); // 서버에서 데이터 받아오기
        const data = await response.json();

        if(data.myturn === userInfo.user.name){
            gameSettings.myturn = true;
        }
        else{
            gameSettings.myturn = false;
        }
        whoturn = data.myturn;
        document.getElementById("turn").textContent = `${whoturn}의 턴`;
        //console.log(gameSettings.myturn);
    
    } catch (error) {
        console.error('Error fetching gameroom');
    }
}

async function updateGameRoom(){
    try {
        let nextuser;
        if(userInfo.user1 !== userInfo.user.name){
            nextuser = userInfo.user1;
        }
        else{
            nextuser = userInfo.user2;
        }
        console.log(nextuser);

        const response = await fetch("/data/gameroom", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json", // 서버가 JSON을 받는다고 알림
            },
            body: JSON.stringify({ 
                initial: gameSettings.initial,
                nextuser: nextuser  // nextuser 추가
            }), // 서버로 JSON 형태로 데이터 전송
        });

        if (response.ok) {
            const data = await response.json();
            //alert("Hex map이 성공적으로 저장되었습니다.");
        } else {
            const error = await response.json();
            alert(`Error: ${error.message}`);
        }
    } catch (error) {
        console.error('Error updateing gameroom');
    }
}

socket.on('save data', async (Message) => {
    console.log("save data");
    console.log(Message);

    await renderHexMap(); 
    await renderUnitMap();
    await renderBuildingMap();
    await renderGameUser();
    userStatusUpdate();
    fetchGameRoom_turn();

    if(userInfo.user.unit.length <=0 && 
        userInfo.user.building.length <=0){
            gameSettings.lose = 1;
            socket.emit('Gameend', gameroom); // 서버로 방 삭제 요청
        }

    createHexMap(gameSettings.rows, gameSettings.cols); // 15행, 15열의 육각형 맵
});

function userStatusUpdate(){
    userInfo.user.reset();
    for(let row=0; row<gameSettings.rows; row++){
        for(let col=0; col<gameSettings.cols; col++){
            if (buildingMap[row] && buildingMap[row][col]){
                if(buildingMap[row][col].user===userInfo.user.name){
                    userInfo.user.insertBuilding(buildingMap[row][col]);

                    switch (true) {
                        case buildingMap[row][col] instanceof mainBuilding:
                            userInfo.user.pendingBuildUnits+=buildingMap[row][col].pendingUnits.length;
                            break;
                        case buildingMap[row][col] instanceof meleeUnitBuilding:
                            userInfo.user.pendingMeleeUnits+=buildingMap[row][col].pendingUnits.length;
                            break;
                        case buildingMap[row][col] instanceof rangedUnitBuilding:
                            userInfo.user.pendingRangedUnits+=buildingMap[row][col].pendingUnits.length;
                            break;
                        case buildingMap[row][col] instanceof eliteUnitBuilding:
                            userInfo.user.pendingEliteUnits+=buildingMap[row][col].pendingUnits.length;
                            break;
                        default:
                            console.log(`pass`);
                    }
                }
            }
            if (unitMap[row] && unitMap[row][col]){
                if(unitMap[row][col].user===userInfo.user.name){
                    userInfo.user.insertUnit(unitMap[row][col]);
                }

            }
        }
    }
}

async function renderGameUser(){
    const gameUser = await fetchGameUserFromServer();
    if (gameUser.length === 0) return;

    gameUser.forEach((gameuser) => {
        userInfo.user.resourceAmount = gameuser.resourceAmount;
        gameSettings.turn = gameuser.turn;
        //document.getElementById("turn").textContent = `${whoturn}의 턴: ${gameSettings.turn}`;
    });
}

// Hex Map 데이터를 가져와 렌더링하는 함수
async function renderHexMap() {
    const hexMapData = await fetchHexMapFromServer();
    if (hexMapData.length === 0) return; // 데이터가 없으면 중단

    // 가져온 데이터를 기반으로 Hex Map을 렌더링
    hexMapData.forEach((tile) => {
        hexMap[tile.row][tile.col].resourceAmount=tile.resourceAmount;
    });
}

// Unit Map 데이터를 가져와 렌더링하는 함수
async function renderUnitMap() {
    const unitMapData = await fetchUnitMapFromServer();
    if (unitMapData.length === 0) {
        return; // 데이터가 없으면 중단
    }
    else {
        gameSettings.initial = false;
        
        // 가져온 데이터를 기반으로 Hex Map을 렌더링
        unitMapData.forEach((unit) => {
            if(!unitMap[unit.row][unit.col]){
                let makeUnit;
                switch (unit.name) {
                    case "건설 유닛":
                        makeUnit = new buildUnit(gameSettings.hexRadius / 2);
                        break;
                    case "근접 유닛":
                        makeUnit = new meleeUnit(gameSettings.hexRadius / 2);
                        break;
                    case "원거리 유닛":
                        makeUnit = new rangedUnit(gameSettings.hexRadius / 2);
                        break;
                    case "엘리트 유닛":
                        makeUnit = new eliteUnit(gameSettings.hexRadius / 2);
                        break;
                    default:
                        console.log(`알 수 없는 유닛 유형: ${unit.name}`);
                        return false;
                }
                unitMap[unit.row][unit.col] = makeUnit;
            }

            unitMap[unit.row][unit.col].row=unit.row;
            unitMap[unit.row][unit.col].col=unit.col;
            unitMap[unit.row][unit.col].health=unit.health;
            unitMap[unit.row][unit.col].move=unit.move;
            unitMap[unit.row][unit.col].user=unit.user;
            unitMap[unit.row][unit.col].color=unit.color;

            if(unit.damage){
                unitMap[unit.row][unit.col].damage=unit.damage;
            }
        });

        // Set을 사용해 새롭게 불러온 유닛 좌표를 저장
        const currentUnitsSet = new Set(
            unitMapData.map((unit) => `${unit.row},${unit.col}`)
        );

        // 기존 unitMap에서 매칭되지 않는 유닛을 확인
        for (let row = 0; row < unitMap.length; row++) {
            for (let col = 0; col < unitMap[row].length; col++) {
                if (
                    !gameSettings.initial &&
                    unitMap[row][col] && // 유닛이 존재하고
                    !currentUnitsSet.has(`${row},${col}`) // 새 데이터에 포함되지 않음
                ) {
                    console.log(`유닛 제거: ${row}, ${col}`);
                    unitMap[row][col] = null; // 매칭되지 않는 유닛 제거
                }
            }
        }
    }
}

// Building Map 데이터를 가져와 렌더링하는 함수
async function renderBuildingMap() {
    const buildingMapData = await fetchBuildingMapFromServer();
    if (!buildingMapData.length === 0) {
        return; // 데이터가 없으면 중단
    }
    else {
        gameSettings.initial = false;

        // 가져온 데이터를 기반으로 Building Map을 렌더링
        buildingMapData.forEach((building) => {
            if(!buildingMap[building.row][building.col]){
                let makeBuilding;
                switch (building.name) {
                    case "메인 건물":
                        makeBuilding = new mainBuilding(gameSettings.hexRadius);
                        break;
                    case "발전 건물":
                        makeBuilding = new developmentBuilding(gameSettings.hexRadius);
                        break;
                    case "근거리 유닛 생산 건물":
                        makeBuilding = new meleeUnitBuilding(gameSettings.hexRadius);
                        break;
                    case "원거리 유닛 생산 건물":
                        makeBuilding = new rangedUnitBuilding(gameSettings.hexRadius);
                        break;
                    case "엘리트 유닛 생산 건물":
                        makeBuilding = new eliteUnitBuilding(gameSettings.hexRadius);
                        break;
                    default:
                        console.log(`알 수 없는 건물 유형: ${building.name}`);
                        return false;
                }
                buildingMap[building.row][building.col] = makeBuilding;
            }

            buildingMap[building.row][building.col].row=building.row;
            buildingMap[building.row][building.col].col=building.col;
            buildingMap[building.row][building.col].health=building.health;
            buildingMap[building.row][building.col].user=building.user;

            if(building.pendingUnits.length>0){
                building.pendingUnits.forEach(unit=>{
                    const unitData = {
                        startTurn: unit.startTurn,
                        delay: unit.delay,
                        buildingType: unit.buildingType,
                        tile: unit.tile,
                    };
                    
                    // 기존 pendingUnits에 동일한 유닛이 있는지 확인
                    const exists = buildingMap[building.row][building.col].pendingUnits.some(existingUnit => {
                        return existingUnit.startTurn === unitData.startTurn &&
                            existingUnit.delay === unitData.delay &&
                            existingUnit.buildingType === unitData.buildingType &&
                            existingUnit.tile.row === unitData.tile.row &&
                            existingUnit.tile.col === unitData.tile.col;
                    });

                    // 동일한 유닛이 없으면 추가
                    if (!exists && buildingMap[building.row][building.col].pendingUnits.length <= 1) {
                        buildingMap[building.row][building.col].pendingUnits.push(unitData);
                        //console.log(`Pending Unit: Type: ${unit.buildingType}, Start Turn: ${unit.startTurn}`);
                    }
                    
                    //buildingMap[building.row][building.col].pendingUnits.push(unitData);
                    //console.log(`Pending Unit: Type: ${unit.buildingType}, Start Turn: ${unit.startTurn}`);
                })
                //buildingMap[building.row][building.col].pendingUnits.push(building.pendingUnits);
                console.log("render:"+buildingMap[building.row][building.col].pendingUnits);
            }

            if(building.pendingDevelopment.length>0){
                building.pendingDevelopment.forEach(dev=>{
                    //console.log(`Pending Dev: Type: ${dev.buildingType}, Start Turn: ${dev.startTurn}`);
                })
                //buildingMap[building.row][building.col].pendingDevelopment.push(building.pendingDevelopment);
            }

            if(building.gatherResources){
                buildingMap[building.row][building.col].gatherResources=building.gatherResources;
            }
        });

        // Set을 사용해 새롭게 불러온 건물 좌표를 저장
        const currentBuildingsSet = new Set(
            buildingMapData.map((building) => `${building.row},${building.col}`)
        );

        // 기존 buildingMap에서 매칭되지 않는 건물을 확인
        for (let row = 0; row < buildingMap.length; row++) {
            for (let col = 0; col < buildingMap[row].length; col++) {
                if (
                    !gameSettings.initial &&
                    buildingMap[row][col] && // 건물이 존재하고
                    !currentBuildingsSet.has(`${row},${col}`) // 새 데이터에 포함되지 않음
                ) {
                    console.log(`건물 제거: ${row}, ${col}`);
                    buildingMap[row][col] = null; // 매칭되지 않는 건물 제거
                }
            }
        }
    }
}
nextTurn();
// 맵 생성 함수 호출
//createHexMap(gameSettings.rows, gameSettings.cols); // 15행, 15열의 육각형 맵
ctx.clearRect(0, 0, canvas.width, canvas.height); // 캔버스를 지운 후

