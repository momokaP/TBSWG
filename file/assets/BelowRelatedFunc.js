import { 
    mainBuilding, 
    developmentBuilding, 
    meleeUnitBuilding, 
    rangedUnitBuilding, 
    eliteUnitBuilding } from "./BuildingClass.js";
import { 
    canvas, ctx, 
    gameSettings, prices, limits, 
    unitMovement, userInfo, state, 
    hexMap, unitMap, buildingMap, user} from "./map.js";
import { createHexMap } from "./CenterRelatedFunc.js";
import { 
    buildUnit, 
    meleeUnit, 
    rangedUnit, 
    eliteUnit } from "./UnitClass.js";

export function clearStatus() {
    document.getElementById("name-value").textContent = " ";
    document.getElementById("owner-value").textContent = " ";
    document.getElementById("health-value").textContent = " ";
    document.getElementById("move").textContent = "이동력";
    document.getElementById("move-value").textContent = " ";
    document.getElementById("function-value").textContent = " ";
}
export function switchcase_makeButton(tile) {
    switch (true) {
        case state.selectedUnit instanceof buildUnit:
            // 건설 유닛이면 기능에 유닛의 건설하기 버튼 추가
            makeBuildButton(tile, 1, "mainBuilding");
            makeBuildButton(tile, 2, "developmentBuilding");
            makeBuildButton(tile, 3, "meleeUnitBuilding");
            makeBuildButton(tile, 4, "rangedUnitBuilding");
            makeBuildButton(tile, 5, "eliteUnitBuilding");
            break;
        case state.selectedUnit instanceof meleeUnit:
            break;
        case state.selectedUnit instanceof rangedUnit:
            break;
        case state.selectedUnit instanceof eliteUnit:
            break;
        default:
            console.log("unit은 다른 클래스의 인스턴스입니다.");
    }
}
export function clearButton() {
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
export function makeBuildButton(tile, number = 1, whatBuilding) {
    if (!document.getElementById(`Button_${number}`)) {
        const functionValue_1 = document.getElementById(`button-${number}`);
        const Button_1 = document.createElement(`button-${number}`);
        Button_1.id = `Button_${number}`;
        Button_1.textContent = "건설하기";
        if (canAffordBuilding() <= 0) {
            Button_1.style.backgroundColor = "#ccc"; // 비활성화 색상
            Button_1.style.cursor = "not-allowed";
        }
        Button_1.onclick = () => {
            if (canAffordBuilding() > 0) {
                switchcase_buildButton();
            }
        };
        functionValue_1.appendChild(Button_1);
    }
    else {
        const Button_1 = document.getElementById(`Button_${number}`);
        if (Button_1) {
            Button_1.onclick = () => {
                if (canAffordBuilding() > 0) {
                    switchcase_buildButton();
                }
            };
        }
    }

    function canAffordBuilding() {
        let buildingCost;
        switch (whatBuilding) {
            case "mainBuilding":
                buildingCost = prices.buildings.mainBuilding;
                break;
            case "developmentBuilding":
                buildingCost = prices.buildings.developmentBuilding;
                break;
            case "meleeUnitBuilding":
                buildingCost = prices.buildings.meleeUnitBuilding;
                break;
            case "rangedUnitBuilding":
                buildingCost = prices.buildings.rangedUnitBuilding;
                break;
            case "eliteUnitBuilding":
                buildingCost = prices.buildings.eliteUnitBuilding;
                break;
            default:
                console.log(`알 수 없는 건물 유형: ${whatBuilding}`);
                return false;
        }
        return user.resourceAmount >= buildingCost ? buildingCost : 0;
    }

    function switchcase_buildButton() {
        if (!buildingMap[tile.row][tile.col]) {
            let building;
            switch (whatBuilding) {
                case "mainBuilding":
                    if (tile.resource) {
                        building = new mainBuilding(gameSettings.hexRadius);
                    }
                    break;
                case "developmentBuilding":
                    building = new developmentBuilding(gameSettings.hexRadius);
                    break;
                case "meleeUnitBuilding":
                    building = new meleeUnitBuilding(gameSettings.hexRadius);
                    break;
                case "rangedUnitBuilding":
                    building = new rangedUnitBuilding(gameSettings.hexRadius);
                    break;
                case "eliteUnitBuilding":
                    building = new eliteUnitBuilding(gameSettings.hexRadius);
                    break;
                default:
                    console.log(`알 수 없는 건물 유형: ${whatBuilding}`);
            }
            if (building) {
                buildingMap[tile.row][tile.col] = building;
                user.insertBuilding(building);
                user.resourceAmount -= canAffordBuilding(); // 자원 차감
            }
            createHexMap(gameSettings.rows, gameSettings.cols);
        }
    }
}
export function makeUnitButton(tile, number = 1, whatBuilding) {
    if (!document.getElementById(`Button_${number}`)) {
        const functionValue_1 = document.getElementById(`button-${number}`);
        const Button_1 = document.createElement(`button-${number}`);
        Button_1.id = `Button_${number}`;
        Button_1.textContent = "생산하기";
        if (canAffordUnit() <= 0) {
            Button_1.style.backgroundColor = "#ccc"; // 비활성화 색상
            Button_1.style.cursor = "not-allowed";
        }
        Button_1.onclick = () => {
            if (canAffordUnit() > 0) {
                if (!checkUnitCapacity()) {
                    initiateUnitProduction();
                    createHexMap(gameSettings.rows, gameSettings.cols);
                    //switchcase_unitButton();
                }
                else {
                    console.log("유닛 제한 초과");
                }
            }
        };
        functionValue_1.appendChild(Button_1);
    }
    else {
        const Button_1 = document.getElementById(`Button_${number}`);
        if (Button_1) {
            Button_1.onclick = () => {
                if (canAffordUnit() > 0) {
                    if (!checkUnitCapacity()) {
                        initiateUnitProduction();
                        createHexMap(gameSettings.rows, gameSettings.cols);
                        //switchcase_unitButton();
                    }
                    else {
                        console.log("유닛 제한 초과");
                    }
                }
            };
        }
    }

    function checkUnitCapacity() {
        let isUnitLimitExceeded = true;
        const {
            buildUnitCount, meleeUnitCount, rangedUnitCount, eliteUnitCount
        } = user.howManyUnit();

        const {
            limitOfBuildUnit, limitOfMeleeUnit, limitOfRangedUnit, limitOfEliteUnit
        } = user.limitOfUnit();

        console.log(user.pendingBuildUnits);
        console.log(limitOfBuildUnit)

        switch (whatBuilding) {
            case "mainBuilding":
                isUnitLimitExceeded = buildUnitCount + user.pendingBuildUnits >= limitOfBuildUnit;
                break;
            case "meleeUnitBuilding":
                isUnitLimitExceeded = meleeUnitCount + user.pendingMeleeUnits >= limitOfMeleeUnit;
                break;
            case "rangedUnitBuilding":
                isUnitLimitExceeded = rangedUnitCount + user.pendingRangedUnits >= limitOfRangedUnit;
                break;
            case "eliteUnitBuilding":
                isUnitLimitExceeded = eliteUnitCount + user.pendingEliteUnits >= limitOfEliteUnit;
                break;
            default:
                console.log(`알 수 없는 건물 유형: ${whatBuilding}`);
                return false;
        }
        return isUnitLimitExceeded;
    }

    function canAffordUnit() {
        let unitCost;
        switch (whatBuilding) {
            case "mainBuilding":
                unitCost = prices.units.buildUnit;
                break;
            case "meleeUnitBuilding":
                unitCost = prices.units.meleeUnit;
                break;
            case "rangedUnitBuilding":
                unitCost = prices.units.rangedUnit;
                break;
            case "eliteUnitBuilding":
                unitCost = prices.units.eliteUnit;
                break;
            default:
                console.log(`알 수 없는 건물 유형: ${whatBuilding}`);
                return false;
        }
        return user.resourceAmount >= unitCost ? unitCost : 0;
    }

    function initiateUnitProduction() {
        switch (whatBuilding) {
            case "mainBuilding":
                user.pendingBuildUnits++;
                break;
            case "meleeUnitBuilding":
                user.pendingMeleeUnits++;
                break;
            case "rangedUnitBuilding":
                user.pendingRangedUnits++;
                break;
            case "eliteUnitBuilding":
                user.pendingEliteUnits++;
                break;
            default:
                console.log(`몰루?`);
        }

        const unitProductionDelay = 1; // 유닛 생산에 필요한 턴 수
        const currentTurn = gameSettings.turn; // 현재 턴을 가져오는 로직


        // 이전 유닛의 delay를 확인
        const lastUnit = buildingMap[tile.row][tile.col].pendingUnits[buildingMap[tile.row][tile.col].pendingUnits.length - 1];
        const previousDelay = lastUnit ? lastUnit.delay : 0;

        // 새 유닛의 delay는 이전 유닛의 delay + 기본 delay
        const calculatedDelay = previousDelay + unitProductionDelay;

        const unitData = {
            startTurn: currentTurn,
            delay: calculatedDelay,
            buildingType: whatBuilding,
            tile: tile,
        };

        buildingMap[tile.row][tile.col].pendingUnits.push(unitData); // 대기 중인 유닛을 사용자 목록에 추가
        user.resourceAmount -= canAffordUnit(); // 자원 차감

        const selectedBuilding = buildingMap[tile.row][tile.col];
        let penddingTurns = selectedBuilding.pendingUnits[0].startTurn + selectedBuilding.pendingUnits[0].delay - gameSettings.turn;
        let pendingUnits = selectedBuilding.pendingUnits.length;
        document.getElementById("move-value").innerHTML =
            `${penddingTurns}턴 뒤 유닛 생산<br>${pendingUnits}개 대기중`;
    }
}

export function makeDevelopmentButton(tile, number = 1, whatDevelopment) {
    if (!document.getElementById(`Button_${number}`)) {
        const functionValue_1 = document.getElementById(`button-${number}`);
        const Button_1 = document.createElement(`button-${number}`);
        Button_1.id = `Button_${number}`;
        Button_1.textContent = "발전하기";
        if (canAffordDevelopment() <= 0) {
            Button_1.style.backgroundColor = "#ccc"; // 비활성화 색상
            Button_1.style.cursor = "not-allowed";
        }
        Button_1.onclick = () => {
            if (canAffordDevelopment() > 0) {
                if (!checkDevelopmentCapacity()) {
                    initiateDevelopment();
                    createHexMap(gameSettings.rows, gameSettings.cols);
                }
                else {
                    console.log("유닛 제한 초과");
                }
            }
        };
        functionValue_1.appendChild(Button_1);
    }
    else {
        const Button_1 = document.getElementById(`Button_${number}`);
        if (Button_1) {
            Button_1.onclick = () => {
                if (canAffordDevelopment() > 0) {
                    if (!checkDevelopmentCapacity()) {
                        initiateDevelopment();
                        createHexMap(gameSettings.rows, gameSettings.cols);
                    }
                    else {
                        console.log("발전 제한 초과");
                    }
                }
            };
        }
    }

    function checkDevelopmentCapacity() {
        let isDevelopmentLimitExceeded = true;
        // 발전 건물의 발전 대기열 한계와, 대기 중인 발전을 비교하여
        // 대기 중인 발전이 발전 대기열의 한계라면 발전 대기열 추가 못하도록
        isDevelopmentLimitExceeded = buildingMap[tile.row][tile.col].pendingDevelopment.length >= limits.development;

        return isDevelopmentLimitExceeded;
    }

    function canAffordDevelopment() {
        let DevelopmentCost;
        switch (whatDevelopment) {
            case "mainBuildingImprovement":
                DevelopmentCost = prices.improvements.mainBuilding;
                break;
            case "developmentImprovement":
                DevelopmentCost = prices.improvements.development;
                break;
            case "productionImprovement":
                DevelopmentCost = prices.improvements.production;
                break;
            case "meleeUnitImprovement":
                DevelopmentCost = prices.improvements.meleeUnit;
                break;
            case "rangedUnitImprovement":
                DevelopmentCost = prices.improvements.rangedUnit;
                break;
            case "eliteUnitImprovement":
                DevelopmentCost = prices.improvements.eliteUnit;
                break;
            default:
                console.log(`알 수 없는 건물 유형: ${whatDevelopment}`);
                return false;
        }
        return user.resourceAmount >= DevelopmentCost ? DevelopmentCost : 0;
    }

    function initiateDevelopment() {
        switch (whatDevelopment) {
            case "mainBuildingImprovement":
                break;
            case "developmentImprovement":
                break;
            case "productionImprovement":
                break;
            case "meleeUnitImprovement":
                break;
            case "rangedUnitImprovement":
                break;
            case "eliteUnitImprovement":
                break;
            default:
                console.log(`몰루?`);
        }

        const DevelopmentDelay = 1; // 발전에 필요한 턴 수
        const currentTurn = gameSettings.turn; // 현재 턴을 가져오는 로직


        // 이전 발전의 delay를 확인
        const lastDevelopment = buildingMap[tile.row][tile.col].pendingDevelopment[buildingMap[tile.row][tile.col].pendingDevelopment.length - 1];
        const previousDelay = lastDevelopment ? lastDevelopment.delay : 0;

        // 새 발전의 delay는 이전 발전의 delay + 기본 delay
        const calculatedDelay = previousDelay + DevelopmentDelay;

        const DevelopmentData = {
            startTurn: currentTurn,
            delay: calculatedDelay,
            developmentType: whatDevelopment,
            tile: tile,
        };

        buildingMap[tile.row][tile.col].pendingDevelopment.push(DevelopmentData); // 대기 중인 발전을 목록에 추가
        user.resourceAmount -= canAffordDevelopment(); // 자원 차감

        const selectedBuilding = buildingMap[tile.row][tile.col];
        let penddingTurns = selectedBuilding.pendingDevelopment[0].startTurn + selectedBuilding.pendingDevelopment[0].delay - gameSettings.turn;
        let pendingDevelopment = selectedBuilding.pendingDevelopment.length;
        document.getElementById("move-value").innerHTML =
            `${penddingTurns}턴 뒤 발전<br>${pendingDevelopment}개 대기중`;
    }
}

