import { 
    canvas, ctx, 
    gameSettings, prices, limits, 
    unitMovement, userInfo, state, 
    hexMap, unitMap, buildingMap} from "./map.js";
import { createHexMap } from "./CenterRelatedFunc.js";

class Unit {
    constructor(size = 20, color = 'blue', name = "유닛1", health = 101, move = 2) {
        this.name = name; // 유닛 이름
        this.health = health; // 유닛 체력
        this.size = size;
        this.color = color;
        this.originalColor = color;
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

    setRowCol(row, col) {
        this.row = row;
        this.col = col;
    }

    setXY(x, y) {
        this.x = x;
        this.y = y;
    }

    setMove(move) {
        this.move = move;
    }

    // 공격 시 반대 방향으로 밀렸다가 복귀
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
}
export class buildUnit extends Unit {
    constructor(size, user = userInfo.user1, color = 'blue', name = "건설 유닛", health = 50) {
        super(size, color, name, health, unitMovement.buildUnit);
        this.description = "이동과 건설을 할 수 있는 유닛이다";
        this.user = user;
    }
}
export class meleeUnit extends Unit {
    constructor(size, user = userInfo.user1, color = 'lime', name = "근접 유닛", health = 150, damage = 20) {
        super(size, color, name, health, unitMovement.meleeUnit);
        this.description = "근접 공격을 할 수 있는 유닛이다";
        this.damage = damage;
        this.user = user;
    }
}
export class rangedUnit extends Unit {
    constructor(size, user = userInfo.user1, color = 'peru', name = "원거리 유닛", health = 100, damage = 10) {
        super(size, color, name, health, unitMovement.rangedUnit);
        this.description = "원거리 공격을 할 수 있는 유닛이다";
        this.damage = damage;
        this.user = user;
    }
}
export class eliteUnit extends Unit {
    constructor(size, user = userInfo.user1, color = 'olive', name = "엘리트 유닛", health = 200, damage = 40) {
        super(size, color, name, health, unitMovement.eliteUnit);
        this.description = "기동력이 좋은 유닛이다";
        this.damage = damage;
        this.user = user;
    }
}
