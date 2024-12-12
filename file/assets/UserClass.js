import { 
    canvas, ctx, 
    gameSettings, prices, limits, 
    unitMovement, userInfo, state, 
    hexMap, unitMap, buildingMap} from "./map.js";
import { buildUnit, meleeUnit, rangedUnit, eliteUnit } from "./UnitClass.js";
import { HexTile } from "./HexTileClass.js";
import { mainBuilding, developmentBuilding, meleeUnitBuilding, rangedUnitBuilding, eliteUnitBuilding } from "./BuildingClass.js";

export class User {
    constructor(name) {
        this.name = name;

        this.unit = [];
        this.numberOfUnit = 0;
        this.building = [];
        this.numberOfBuilding = 0;

        this.pendingBuildUnits = 0;
        this.pendingMeleeUnits = 0;
        this.pendingRangedUnits = 0;
        this.pendingEliteUnits = 0;

        this.resourceAmount = 100;
    }
    reset(){
        this.unit = [];
        this.numberOfUnit = 0;
        this.building = [];
        this.numberOfBuilding = 0;
        
        this.pendingBuildUnits = 0;
        this.pendingMeleeUnits = 0;
        this.pendingRangedUnits = 0;
        this.pendingEliteUnits = 0;
    }
    insertBuilding(Building) {
        this.building[this.numberOfBuilding] = Building;
        this.numberOfBuilding = this.numberOfBuilding + 1;
    }
    deleteBuilding(Building) {
        for (let i = 0; i < this.building.length; i++) {
            if (this.building[i].row === Building.row &&
                this.building[i].col === Building.col) {

                this.building.splice(i, 1); // 배열에서 항목 제거
                this.numberOfBuilding--; // 건물 수 업데이트
                return; // 삭제 후 루프 종료
            }
        }
    }
    insertUnit(Unit) {
        this.unit[this.numberOfUnit] = Unit;
        this.numberOfUnit = this.numberOfUnit + 1;
    }
    deleteUnit(Unit) {
        for (let i = 0; i < this.unit.length; i++) {
            if (this.unit[i].row === Unit.row &&
                this.unit[i].col === Unit.col) {

                this.unit.splice(i, 1); // 배열에서 항목 제거
                this.numberOfUnit--; // 유닛 수 업데이트
                return; // 삭제 후 루프 종료
            }
        }
    }
    gatheredResources() {
        let sum = 0;

        for (let i = 0; i < this.numberOfBuilding; i++) {
            if (this.building[i] instanceof mainBuilding) {
                let currentTile = hexMap[this.building[i].row][this.building[i].col];
                if (currentTile.resourceAmount > 0) {
                    // 자원 감소
                    currentTile.subtractResources(this.building[i].gatherResources);
                    // 자원이 남았다면, sum에 자원 채취량을 더함
                    sum += this.building[i].gatherResources;
                }
            }
        }

        userInfo.user.resourceAmount = userInfo.user.resourceAmount + sum;
    }
    processPending() {
        for (let i = 0; i < this.numberOfBuilding; i++) {
            if (this.building[i]) {
                this.building[i].processPendingUnits(gameSettings.turn);
                this.building[i].processPendingDevelopment(gameSettings.turn);
            }
        }
    }
    limitOfUnit() {
        let limitOfBuildUnit = 0;
        let limitOfMeleeUnit = 0;
        let limitOfRangedUnit = 0;
        let limitOfEliteUnit = 0;

        const {
            mainBuildingCount, developmentBuildingCount, meleeUnitBuildingCount, rangedUnitBuildingCount, eliteUnitBuildingCount
        } = this.howManyBuilding();

        limitOfBuildUnit = mainBuildingCount * limits.buildUnit + limits.initialBuildUnit;
        limitOfMeleeUnit = meleeUnitBuildingCount * limits.meleeUnit;
        limitOfRangedUnit = rangedUnitBuildingCount * limits.rangedUnit;
        limitOfEliteUnit = eliteUnitBuildingCount * limits.eliteUnit;

        return {
            limitOfBuildUnit,
            limitOfMeleeUnit,
            limitOfRangedUnit,
            limitOfEliteUnit
        };
    }
    howManyUnit() {
        let buildUnitCount = 0;
        let meleeUnitCount = 0;
        let rangedUnitCount = 0;
        let eliteUnitCount = 0;

        // 유닛 배열을 순회하여 각 타입의 유닛 수를 셈
        for (let i = 0; i < this.unit.length; i++) {
            const unit = this.unit[i];

            // instanceof로 유닛의 타입을 확인하여 카운트
            if (unit instanceof buildUnit) {
                buildUnitCount++;
            } else if (unit instanceof meleeUnit) {
                meleeUnitCount++;
            } else if (unit instanceof rangedUnit) {
                rangedUnitCount++;
            } else if (unit instanceof eliteUnit) {
                eliteUnitCount++;
            }
        }

        // 각 유닛 수를 객체로 반환
        return {
            buildUnitCount,
            meleeUnitCount,
            rangedUnitCount,
            eliteUnitCount
        };
    }
    howManyBuilding() {
        let mainBuildingCount = 0;
        let developmentBuildingCount = 0;
        let meleeUnitBuildingCount = 0;
        let rangedUnitBuildingCount = 0;
        let eliteUnitBuildingCount = 0;

        // 유닛 배열을 순회하여 각 타입의 유닛 수를 셈
        for (let i = 0; i < this.building.length; i++) {
            const building = this.building[i];

            // instanceof로 유닛의 타입을 확인하여 카운트
            if (building instanceof mainBuilding) {
                mainBuildingCount++;
            } else if (building instanceof developmentBuilding) {
                developmentBuildingCount++;
            } else if (building instanceof meleeUnitBuilding) {
                meleeUnitBuildingCount++;
            } else if (building instanceof rangedUnitBuilding) {
                rangedUnitBuildingCount++;
            } else if (building instanceof eliteUnitBuilding) {
                eliteUnitBuildingCount++;
            }
        }

        // 각 유닛 수를 객체로 반환
        return {
            mainBuildingCount,
            developmentBuildingCount,
            meleeUnitBuildingCount,
            rangedUnitBuildingCount,
            eliteUnitBuildingCount
        };
    }
}
