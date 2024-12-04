import { 
    canvas, ctx, 
    gameSettings, prices, limits, 
    unitMovement, userInfo, state, 
    hexMap, unitMap, buildingMap, user} from "./map.js";
import { createHexMap } from "./CenterRelatedFunc.js";
import { 
    buildUnit, meleeUnit, 
    rangedUnit, eliteUnit } from "./UnitClass.js";
import { User} from "./UserClass.js";
import { HexTile } from "./HexTileClass.js";

class Building {
    constructor(size, color = 'gray', name = "건물1", health = 501) {
        this.name = name; // 건물 이름
        this.health = health; // 건물 체력
        this.size = size; // 건물의 크기
        this.color = color;
        this.isSelected = false; // 건물 선택 상태
        this.x = null; // 건물의 x 위치
        this.y = null; // 건물의 y 위치
        this.row = null;
        this.col = null;
        this.dx = 0;
        this.dy = 0;
        this.pendingUnits = []; // 유닛 생산 대기열
        this.pendingDevelopment = []; // 발전 대기열
    }

    // 건물 그리기
    draw(ctx, offsetX = 0, offsetY = 0) {
        const buildingSize = this.size * 1.23;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + offsetX - buildingSize / 2, this.y + offsetY - buildingSize / 2, buildingSize, buildingSize); // 건물 그리기
        ctx.strokeStyle = 'black';
        ctx.strokeRect(this.x + offsetX - buildingSize / 2, this.y + offsetY - buildingSize / 2, buildingSize, buildingSize);
    }

    // 건물 클릭 체크
    isBuildingClicked(mouseX, mouseY, offsetX = 0, offsetY = 0) {
        const buildingSize = this.size * 1.23;
        // 건물의 좌측 상단 (x, y) 좌표와 우측 하단 (x + width, y + height) 좌표를 계산
        const withinX = mouseX >= (this.x + offsetX - buildingSize / 2) && mouseX <= (this.x + offsetX - buildingSize / 2 + buildingSize);
        const withinY = mouseY >= (this.y + offsetY - buildingSize / 2) && mouseY <= (this.y + offsetY - buildingSize / 2 + buildingSize);

        // 마우스 좌표가 건물의 영역 내에 있으면 클릭한 것으로 처리
        return withinX && withinY;
    }

    setRowCol(row, col) {
        this.row = row;
        this.col = col;
    }

    setXY(x, y) {
        this.x = x;
        this.y = y;
    }

    // 피격 모션
    moveTemporarily(dx, dy, ctx, offsetX, offsetY, duration = 150) {
        // 색 바꾸기
        const oldColor = this.color;
        this.color = "red";

        // 밀림 효과
        this.dx = dx;
        this.dy = dy;
        createHexMap(gameSettings.rows, gameSettings.cols);

        // 일정 시간 후 원래 위치로 복귀
        setTimeout(() => {
            this.dx = 0;
            this.dy = 0;
            this.color = oldColor;
            createHexMap(gameSettings.rows, gameSettings.cols);
        }, duration);
    }
    processPendingUnits(currentTurn) {
        let anyUnitDelayed = false; // 유닛 지연 여부를 추적하는 변수
        for (let i = 0; i < this.pendingUnits.length; i++) console.log(`유닛 ${this.pendingUnits[i].delay}`);

        // 대기열에서 생산 시간이 지난 유닛 생성
        this.pendingUnits = this.pendingUnits.filter((unitData) => {
            const { startTurn, delay, buildingType, tile } = unitData;
            console.log(`${startTurn}, ${delay}, ${currentTurn}`);
            if (currentTurn >= startTurn + delay) {
                let unit;

                // 타일에 유닛이 있으면 생산 지연
                if (unitMap[tile.row][tile.col]) {
                    console.log(`타일 (${tile.row}, ${tile.col})에 유닛이 이미 있어 생산 지연`);

                    // 모든 유닛 생산 지연: 대기열에 있는 모든 유닛의 delay를 1턴 늘리기
                    anyUnitDelayed = true; // 유닛이 지연됨을 기록
                    return true; // 대기열에 유닛을 남겨두기 (생산되지 않음)
                }

                switch (buildingType) {
                    case "mainBuilding":
                        unit = new buildUnit(gameSettings.hexRadius / 2);
                        user.pendingBuildUnits--;
                        break;
                    case "meleeUnitBuilding":
                        unit = new meleeUnit(gameSettings.hexRadius / 2);
                        user.pendingMeleeUnits--;
                        break;
                    case "rangedUnitBuilding":
                        unit = new rangedUnit(gameSettings.hexRadius / 2);
                        user.pendingRangedUnits--;
                        break;
                    case "eliteUnitBuilding":
                        unit = new eliteUnit(gameSettings.hexRadius / 2);
                        user.pendingEliteUnits--;
                        break;
                    default:
                        console.log(`알 수 없는 건물 유형: ${buildingType}`);
                }
                if (unit) {
                    unitMap[tile.row][tile.col] = unit;
                    user.insertUnit(unit);
                    createHexMap(gameSettings.rows, gameSettings.cols);
                }
                return false; // 생산 완료된 유닛은 대기열에서 제거
            }
            return true; // 아직 대기 중인 유닛은 유지
        });

        // 모든 유닛이 지연된 경우, 지연된 유닛들의 delay를 일괄적으로 증가시킴
        if (anyUnitDelayed) {
            this.pendingUnits.forEach((unitData) => {
                unitData.delay += 1; // 모든 유닛의 delay를 1턴씩 증가시킴
            });
        }
    }

    processPendingDevelopment(currentTurn) {
        for (let i = 0; i < this.pendingDevelopment.length; i++) console.log(`발전 ${this.pendingDevelopment[i].delay}`);

        // 대기열에서 생산 시간이 지나면 발전
        this.pendingDevelopment = this.pendingDevelopment.filter((DevelopmentData) => {
            const { startTurn, delay, developmentType, tile } = DevelopmentData;
            if (currentTurn >= startTurn + delay) {
                let development;

                switch (developmentType) {
                    case "mainBuildingImprovement":
                        console.log(`mainBuildingImprovement 발전 완료`);
                        break;
                    case "developmentImprovement":
                        console.log(`developmentImprovement 발전 완료`);
                        break;
                    case "productionImprovement":
                        console.log(`productionImprovement 발전 완료`);
                        break;
                    case "meleeUnitImprovement":
                        console.log(`meleeUnitImprovement 발전 완료`);
                        break;
                    case "rangedUnitImprovement":
                        console.log(`rangedUnitImprovement 발전 완료`);
                        break;
                    case "eliteUnitImprovement":
                        console.log(`eliteUnitImprovement 발전 완료`);
                        break;
                    default:
                        console.log(`알 수 없는 건물 유형: ${developmentType}`);
                }
                if (development) {
                    createHexMap(gameSettings.rows, gameSettings.cols);
                }
                return false; // 개발 완료된 기술은 대기열에서 제거
            }
            return true; // 아직 대기 중인 기술은 유지
        });
    }
}
export class mainBuilding extends Building {
    constructor(size, user = userInfo.user1, color = 'pink', name = "메인 건물", health = 500, gatherResources = 100) {
        // 부모 클래스인 Building의 constructor를 호출합니다.
        super(size, color, name, health);
        this.description = "메인 건물이다";
        this.user = user;
        this.gatherResources = gatherResources;
    }
}
export class developmentBuilding extends Building {
    constructor(size, user = userInfo.user1, color = 'purple', name = "발전 건물", health = 500) {
        // 부모 클래스인 Building의 constructor를 호출합니다.
        super(size, color, name, health);
        this.description = "발전 건물이다";
        this.user = user;
    }
}
export class meleeUnitBuilding extends Building {
    constructor(size, user = userInfo.user1, color = 'lime', name = "근거리 유닛 생산 건물", health = 500) {
        // 부모 클래스인 Building의 constructor를 호출합니다.
        super(size, color, name, health);
        this.description = "근거리 유닛 생산 건물이다";
        this.user = user;
    }
}
export class rangedUnitBuilding extends Building {
    constructor(size, user = userInfo.user1, color = 'peru', name = "원거리 유닛 생산 건물", health = 500) {
        // 부모 클래스인 Building의 constructor를 호출합니다.
        super(size, color, name, health);
        this.description = "원거리 유닛 생산 건물이다";
        this.user = user;
    }
}
export class eliteUnitBuilding extends Building {
    constructor(size, user = userInfo.user1, color = 'olive', name = "엘리트 유닛 생산 건물", health = 500) {
        // 부모 클래스인 Building의 constructor를 호출합니다.
        super(size, color, name, health);
        this.description = "엘리트 유닛 생산 건물이다";
        this.user = user;
    }
}
