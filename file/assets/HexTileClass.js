import { 
    canvas, ctx, 
    gameSettings, prices, limits, 
    unitMovement, userInfo, state, 
    hexMap, unitMap, buildingMap, user} from "./map.js";import { buildUnit, meleeUnit, rangedUnit, eliteUnit } from "./UnitClass.js";
import { mainBuilding, developmentBuilding, meleeUnitBuilding, rangedUnitBuilding, eliteUnitBuilding } from "./BuildingClass.js";
import { User} from "./UserClass.js";

// 육각형 타일 클래스 정의
export class HexTile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.defaultColor = "lightblue";
        this.color = this.defaultColor;
        this.isHovered = false; // hover 상태
        this.isClicked = false; // 클릭 상태 저장
        this.dirty = true; // 타일의 상태가 변경되었을 때만 true로 설정
        this.resource = false; // 자원 타일 여부
        this.unit = null; // 유닛 객체
        this.Building = null; //건물 객체
        this.row = null;
        this.col = null;
        this.resourceAmount = null; // 자원 양
    }

    addResources(Amount) {
        this.resourceAmount = this.resourceAmount + Amount;
    }

    subtractResources(Amount) {
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

    deleteUnit() {
        this.unit = null;
    }

    placeBuilding(Building) {
        this.Building = Building; // 건물 객체 저장
        this.dirty = true; // 건물이 타일에 배치되었으므로 해당 타일을 다시 그려야 함
        this.Building.setRowCol(this.row, this.col);
        this.Building.setXY(this.x, this.y);
    }

    deleteBuilding() {
        this.Building = null;
    }

    // 육각형 그리기
    draw(ctx, offsetX = 0, offsetY = 0) {
        if (!this.dirty) return;

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * (i + 0.5); // 각도를 30도 회전
            const xPos = this.x + gameSettings.hexRadius * Math.cos(angle) + offsetX;
            const yPos = this.y + gameSettings.hexRadius * Math.sin(angle) + offsetY;
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
            const xPos = this.x + gameSettings.hexRadius * Math.cos(angle) + offsetX;
            const yPos = this.y + gameSettings.hexRadius * Math.sin(angle) + offsetY;
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
            const xPos = this.x + gameSettings.hexRadius * Math.cos(angle) + offsetX;
            const yPos = this.y + gameSettings.hexRadius * Math.sin(angle) + offsetY;
            if (i === 0) {
                hexPath.moveTo(xPos, yPos);
            } else {
                hexPath.lineTo(xPos, yPos);
            }
        }
        hexPath.closePath();

        const wasClicked = this.isClicked;
        this.isClicked = ctx.isPointInPath(hexPath, mouseX, mouseY); // 클릭 상태 업데이트

        if (this.isClicked !== wasClicked) {
            this.dirty = true;
        }
    }

    // 타일 클릭 시 유닛 이동
    moveUnit(unit) {
        this.placeUnit(unit);
    }
}
