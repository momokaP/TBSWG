import { 
    canvas, ctx, 
    gameSettings, prices, limits, 
    unitMovement, userInfo, state, 
    hexMap, unitMap, buildingMap} from "./map.js";

// 클라이언트 측에서 데이터 전송 (fetch 사용)
export async function saveHexMapToServer(formattedHexMap) {
    try {
        const response = await fetch("/data/save-hex-map", {
            method: "POST",
            headers: {
                "Content-Type": "application/json", // 서버가 JSON을 받는다고 알림
            },
            body: JSON.stringify({ hexMap: formattedHexMap }), // 서버로 JSON 형태로 데이터 전송
        });

        if (response.ok) {
            const data = await response.json();
            //alert("Hex map이 성공적으로 저장되었습니다.");
        } else {
            const error = await response.json();
            alert(`Error: ${error.message}`);
        }
    } catch (error) {
        console.error("Error saving hex map:", error);
        alert("Hex map을 저장하는 데 오류가 발생했습니다.");
    }
}

export async function saveUnitMapToServer(formattedUnitMap) {
    try {
        const response = await fetch("/data/save-unit-map", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ unitMap: formattedUnitMap }),
        });

        if (response.ok) {
            const data = await response.json();
            //alert("Unit map이 성공적으로 저장되었습니다.");
        } else {
            const error = await response.json();
            alert(`Error: ${error.message}`);
        }
    } catch (error) {
        console.error("Error saving unit map:", error);
        alert("Unit map을 저장하는 데 오류가 발생했습니다.");
    }
}

export async function saveBuildingMapToServer(formattedBuildingMap) {
    try {
        const response = await fetch("/data/save-building-map", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ buildingMap: formattedBuildingMap }),
        });

        if (response.ok) {
            const data = await response.json();
            //alert("Building map이 성공적으로 저장되었습니다.");
        } else {
            const error = await response.json();
            alert(`Error: ${error.message}`);
        }
    } catch (error) {
        console.error("Error saving building map:", error);
        alert("Building map을 저장하는 데 오류가 발생했습니다.");
    }
}

export async function saveGameUserToServer(user) {
    const response = await fetch('/data/save-gameUser', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: user.name,
            resourceAmount: user.resourceAmount,
            turn: gameSettings.turn,
        }),
    });

    if (response.ok) {
        //console.log("gameUser saved successfully!");
    } else {
        console.error("Failed to save gameUser.");
    }
}

export async function fetchHexMapFromServer() {
    try {
        const response = await fetch("/data/get-hex-map", {
            method: "GET",
            headers: {
                "Content-Type": "application/json", // 서버가 JSON을 반환한다고 알림
            },
        });

        if (response.ok) {
            const data = await response.json();
            return data.hexMap; // 데이터를 반환
        } else {
            const error = await response.json();
            console.error("Error:", error.message);
            alert(`Error: ${error.message}`);
            return null;
        }
    } catch (error) {
        console.error("Error fetching hex map:", error);
        alert("Hex map 데이터를 가져오는 데 오류가 발생했습니다.");
        return null;
    }
}

export async function fetchUnitMapFromServer() {
    try {
        const response = await fetch("/data/get-unit-map", {
            method: "GET",
            headers: {
                "Content-Type": "application/json", // 서버가 JSON을 반환한다고 알림
            },
        });

        if (response.ok) {
            const data = await response.json();
            return data.unitMap; // 데이터를 반환
        } else {
            const error = await response.json();
            console.error("Error:", error.message);
            alert(`Error: ${error.message}`);
            return null;
        }
    } catch (error) {
        console.error("Error fetching unit map:", error);
        alert("Unit map 데이터를 가져오는 데 오류가 발생했습니다.");
        return null;
    }
}

export async function fetchBuildingMapFromServer() {
    try {
        const response = await fetch("/data/get-building-map", {
            method: "GET",
            headers: {
                "Content-Type": "application/json", // 서버가 JSON을 반환한다고 알림
            },
        });

        if (response.ok) {
            const data = await response.json();
            return data.buildingMap; // 데이터를 반환
        } else {
            const error = await response.json();
            console.error("Error:", error.message);
            alert(`Error: ${error.message}`);
            return null;
        }
    } catch (error) {
        console.error("Error fetching building map:", error);
        alert("Building map 데이터를 가져오는 데 오류가 발생했습니다.");
        return null;
    }
}

export async function fetchGameUserFromServer() {
    try {
        const response = await fetch("/data/get-gameUser", {
            method: "GET",
            headers: {
                "Content-Type": "application/json", // 서버가 JSON을 반환한다고 알림
            },
        });

        if (response.ok) {
            const data = await response.json();
            return data.gameuser; // 데이터를 반환
        } else {
            const error = await response.json();
            console.error("Error:", error.message);
            alert(`Error: ${error.message}`);
            return null;
        }
    } catch (error) {
        console.error("Error fetching gameUser:", error);
        alert("gameUser 데이터를 가져오는 데 오류가 발생했습니다.");
        return null;
    }
}
