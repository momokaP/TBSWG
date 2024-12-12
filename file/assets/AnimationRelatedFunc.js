import { 
    canvas, ctx, 
    gameSettings, prices, limits, 
    unitMovement, userInfo, state, 
    hexMap, unitMap, buildingMap} from "./map.js";
import { createHexMap } from "./CenterRelatedFunc.js";

export function attackedMotion(dx, dy, object) {
    // 공격받은 방향 계산
    const distance = Math.sqrt(dx ** 2 + dy ** 2);

    // 반대 방향으로 밀림 (정규화 후 이동 거리 설정)
    const pushDistance = 10; // 밀림 거리
    const normalizedDx = (dx / distance) * pushDistance;
    const normalizedDy = (dy / distance) * pushDistance;

    // 밀림 애니메이션 적용
    object.moveTemporarily(normalizedDx, normalizedDy, ctx, gameSettings.mapOffset.x, gameSettings.mapOffset.y);
}

export function animateProjectile(fromX, fromY, toX, toY, onComplete) {
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
        createHexMap(gameSettings.rows, gameSettings.cols); // 타일 다시 그리기
        ctx.beginPath();
        ctx.arc(currentX, currentY, (gameSettings.hexRadius / 2) / 4, 0, 2 * Math.PI); // 작은 원 (반지름 5)
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
