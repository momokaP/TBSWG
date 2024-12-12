const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

const HexMap = require("../models/hexMapModel"); // HexMap 모델 불러오기
const UnitMap = require("../models/unitMapModel"); 
const BuildingMap = require("../models/buildingMapModel");
const gameUser = require("../models/gameUserModel");
const GameRoom = require("../models/gameRoomModel");
const User = require("../models/userModel");  // User 모델 불러오기

const jwtSecret = process.env.JWT_SECRET; // JWT 비밀키

// @desc getgameroom
// @route GET /data/gameroom
const getgameroom = asyncHandler(async (req,res) =>{
    try {
        // 토큰을 이용해 현재 사용자 정보 얻기
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
        }

        const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findById(decoded.id);  // 사용자 정보 찾기
        if (!user) {
            return res.status(401).json({ message: "사용자를 찾을 수 없습니다." });
        }
        const username = user.username;
        const gameroom = user.gameroom;

        const foundRoom = await GameRoom.findOne({ gameroom: gameroom });
        const usernames = foundRoom.usernames;
        const initial = foundRoom.initial;
        const myturn = foundRoom.myturn;

        res.status(200).json({ gameroom, usernames, username, initial, myturn, message: "성공" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "오류 발생" });
    }
});

// @desc updategameroom
// @route PUT /data/gameroom
const updategameroom = asyncHandler(async (req,res) =>{
    try {
        const { initial, nextuser } = req.body;
        // 토큰을 이용해 현재 사용자 정보 얻기
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
        }

        const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findById(decoded.id);  // 사용자 정보 찾기
        if (!user) {
            return res.status(401).json({ message: "사용자를 찾을 수 없습니다." });
        }
        const gameroom = user.gameroom;

        const foundRoom = await GameRoom.findOne({ gameroom: gameroom });
        foundRoom.initial = initial;
        foundRoom.myturn = nextuser;
        await foundRoom.save();

        res.status(200).json({ message: "성공" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "오류 발생" });
    }
});

// @desc Save Hex Map
// @route POST /data/save-hex-map
const saveHexMap = asyncHandler(async (req, res) => {
    const { hexMap } = req.body; // 클라이언트에서 전송한 hexMap 데이터

    if (!hexMap || !Array.isArray(hexMap)) {
        return res.status(400).json({ message: "유효하지 않은 데이터 형식입니다." });
    }

    try {
        // 토큰을 이용해 현재 사용자 정보 얻기
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
        }

        const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findById(decoded.id);  // 사용자 정보 찾기
        if (!user) {
            return res.status(401).json({ message: "사용자를 찾을 수 없습니다." });
        }

        const username = user.username;  // 사용자 이름 가져오기
        const gameroom = user.gameroom;

        // 기존 Hex Map 데이터 삭제 (있다면)
        //await HexMap.deleteMany({ username });
        await HexMap.deleteMany({ gameroom });

        // 새로운 데이터를 저장
        const formattedData = hexMap.flat().map((tile) => ({
            row: tile.row,
            col: tile.col,
            resource: tile.resource,
            resourceAmount: tile.resourceAmount,
            //username: username,  // 유저 이름 추가
            gameroom: gameroom,
        }));

        // Hex Map 데이터를 MongoDB에 저장
        await HexMap.insertMany(formattedData);

        res.status(200).json({ message: "Hex map이 성공적으로 저장되었습니다!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Hex map 저장 중 오류가 발생했습니다. 다시 시도해주세요." });
    }
});

// @desc Save Unit Map
// @route POST /data/save-unit-map
const saveUnitMap = asyncHandler(async (req, res) => {
    const { unitMap } = req.body;

    if (!unitMap || !Array.isArray(unitMap)) {
        return res.status(400).json({ message: "유효하지 않은 데이터 형식입니다." });
    }

    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
        }

        const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: "사용자를 찾을 수 없습니다." });
        }

        const username = user.username;
        const gameroom = user.gameroom;

        // 기존 Unit Map 데이터 삭제
        //await UnitMap.deleteMany({ username });
        await UnitMap.deleteMany({ gameroom });

        // 새로운 데이터를 저장
        const formattedData = unitMap.flat().map((unit) => ({
            name: unit.name,
            row: unit.row,
            col: unit.col,
            health: unit.health,
            damage: unit.damage,
            move: unit.move,
            user: unit.user,
            color: unit.color,
            //username: username,
            gameroom: gameroom,
        }));

        await UnitMap.insertMany(formattedData);

        res.status(200).json({ message: "Unit map이 성공적으로 저장되었습니다!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Unit map 저장 중 오류가 발생했습니다. 다시 시도해주세요." });
    }
});

// @desc Save Building Map
// @route POST /data/save-building-map
const saveBuildingtMap = asyncHandler(async (req, res) => {
    const { buildingMap } = req.body;

    if (!buildingMap || !Array.isArray(buildingMap)) {
        return res.status(400).json({ message: "유효하지 않은 데이터 형식입니다." });
    }

    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
        }

        const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: "사용자를 찾을 수 없습니다." });
        }

        const username = user.username;
        const gameroom = user.gameroom;

        // 기존 Unit Map 데이터 삭제
        //await BuildingMap.deleteMany({ username });
        await BuildingMap.deleteMany({ gameroom });

        // 새로운 데이터를 저장
        const formattedData = buildingMap.flat().map((building) => ({
            name: building.name,
            row: building.row,
            col: building.col,
            health: building.health,
            user: building.user,
            pendingUnits: building.pendingUnits.map(unit => ({
                startTurn: unit.startTurn,
                delay: unit.delay,
                buildingType: unit.buildingType,
                tile: unit.tile,
            })),
            pendingDevelopment: building.pendingDevelopment.map(dev => ({
                startTurn: dev.startTurn,
                delay: dev.delay,
                developmentType: dev.developmentType,
                tile: dev.tile,
            })),
            gatherResources: building.gatherResources,
            //username: username,
            gameroom: gameroom,
        }));

        console.log("빌딩 저장"+gameroom);

        await BuildingMap.insertMany(formattedData);

        res.status(200).json({ message: "Building map이 성공적으로 저장되었습니다!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Building map 저장 중 오류가 발생했습니다. 다시 시도해주세요." });
    }
});

// @desc Save gameUser
// @route POST /data/save-gameUser
const saveGameUser = asyncHandler(async (req, res) => {
    const { name, resourceAmount, turn } = req.body;

    if (!name || resourceAmount === undefined) {
        return res.status(400).json({ error: "name and resourceAmount are required" });
    }

    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
        }

        const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: "사용자를 찾을 수 없습니다." });
        }

        const username = user.username;
        const gameroom = user.gameroom;

        await gameUser.deleteMany({ username });

        const formattedData = {
            name: name, 
            resourceAmount: resourceAmount,
            turn: turn, 
            username: username,
            gameroom: gameroom,
        };

        // 같은 gameroom의 모든 gameUser의 turn 업데이트
        await gameUser.updateMany(
            { gameroom: gameroom }, 
            { $set: { turn: turn } }
        );

        await gameUser.insertMany([formattedData]);

        res.status(200).json({ message: "gameUser이 성공적으로 저장되었습니다!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "gameUser 저장 중 오류가 발생했습니다. 다시 시도해주세요." });
    }
});

// @desc Get Hex Map
// @route GET /data/get-hex-map
const getHexMap = asyncHandler(async (req, res) => {
    try {
        // 토큰에서 사용자 정보 확인
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
        }

        const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findById(decoded.id);  // 사용자 정보 찾기
        if (!user) {
            return res.status(401).json({ message: "사용자를 찾을 수 없습니다." });
        }

        const username = user.username;  // 사용자 이름 가져오기
        const gameroom = user.gameroom;

        // 사용자 이름에 해당하는 Hex Map 데이터 가져오기
        //const hexMap = await HexMap.find({ username: username }).lean();
        const hexMap = await HexMap.find({ gameroom: gameroom }).lean();

        if (!hexMap || hexMap.length === 0) {
            // Hex Map 데이터가 없으면 초기 메시지 전송
            return res.status(200).json({ 
                message: "게임을 처음 시작하는 사용자입니다.", 
                hexMap: [] // 빈 배열 반환
            });
        }

        res.status(200).json({ 
            message: "Hex Map 데이터를 성공적으로 가져왔습니다.", 
            hexMap: hexMap 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Hex Map 데이터를 가져오는 중 오류가 발생했습니다." });
    }
});

// @desc Get Unit Map
// @route GET /data/get-unit-map
const getUnitMap = asyncHandler(async (req, res) => {
    try {
        // 토큰에서 사용자 정보 확인
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
        }

        const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findById(decoded.id);  // 사용자 정보 찾기
        if (!user) {
            return res.status(401).json({ message: "사용자를 찾을 수 없습니다." });
        }

        const username = user.username;  // 사용자 이름 가져오기
        const gameroom = user.gameroom;

        // 사용자 이름에 해당하는 Hex Map 데이터 가져오기
        //const unitMap = await UnitMap.find({ username: username }).lean();
        const unitMap = await UnitMap.find({ gameroom: gameroom }).lean();

        if (!unitMap || unitMap.length === 0) {
            // Unit Map 데이터가 없으면 초기 메시지 전송
            return res.status(200).json({ 
                message: "게임을 처음 시작하는 사용자입니다.", 
                unitMap: [] // 빈 배열 반환
            });
        }

        res.status(200).json({ 
            message: "Unit Map 데이터를 성공적으로 가져왔습니다.", 
            unitMap: unitMap 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Unit Map 데이터를 가져오는 중 오류가 발생했습니다." });
    }
});

// @desc Get Buliding Map
// @route GET /data/get-buliding-map
const getBulidingMap = asyncHandler(async (req, res) => {
    try {
        // 토큰에서 사용자 정보 확인
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
        }

        const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findById(decoded.id);  // 사용자 정보 찾기
        if (!user) {
            return res.status(401).json({ message: "사용자를 찾을 수 없습니다." });
        }

        const username = user.username;  // 사용자 이름 가져오기
        const gameroom = user.gameroom;

        // 사용자 이름에 해당하는 Hex Map 데이터 가져오기
        //const buildingMap = await BuildingMap.find({ username: username }).lean();
        const buildingMap = await BuildingMap.find({ gameroom: gameroom }).lean();

        if (!buildingMap || buildingMap.length === 0) {
            // Unit Map 데이터가 없으면 초기 메시지 전송
            return res.status(200).json({ 
                message: "게임을 처음 시작하는 사용자입니다.", 
                buildingMap: [] // 빈 배열 반환
            });
        }

        res.status(200).json({ 
            message: "Building Map 데이터를 성공적으로 가져왔습니다.", 
            buildingMap: buildingMap 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Building Map 데이터를 가져오는 중 오류가 발생했습니다." });
    }
});

// @desc Get gameUserp
// @route GET /data/get-gameUser
const getGameUser = asyncHandler(async (req, res) => {
    try {
        // 토큰에서 사용자 정보 확인
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
        }

        const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findById(decoded.id);  // 사용자 정보 찾기
        if (!user) {
            return res.status(401).json({ message: "사용자를 찾을 수 없습니다." });
        }

        const username = user.username;  // 사용자 이름 가져오기
        const gameroom = user.gameroom;

        // 사용자 이름에 해당하는 Hex Map 데이터 가져오기
        //const gameuser = await gameUser.find({ username: username }).lean();
        const gameuser = await gameUser.find({ username: username, gameroom: gameroom }).lean();

        if (!gameuser || gameuser.length === 0) {
            // Unit Map 데이터가 없으면 초기 메시지 전송
            return res.status(200).json({ 
                message: "게임을 처음 시작하는 사용자입니다.", 
                gameuser: [] // 빈 배열 반환
            });
        }

        res.status(200).json({ 
            message: "gameUser 데이터를 성공적으로 가져왔습니다.", 
            gameuser: gameuser 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "gameUser 데이터를 가져오는 중 오류가 발생했습니다." });
    }
});

// @desc Delete all user data
// @route DELETE /data/delete-all
const deleteAllUserData = asyncHandler(async (req, res) => {
    try {
        // 토큰에서 사용자 정보 확인
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
        }

        const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findById(decoded.id); // 사용자 정보 찾기
        if (!user) {
            return res.status(401).json({ message: "사용자를 찾을 수 없습니다." });
        }

        const username = user.username; // 사용자 이름 가져오기
        const gameroom = user.gameroom;

        user.isgame = false;
        await user.save();  // 변경 사항 저장

        // 모든 관련 데이터를 삭제
        await HexMap.deleteMany({ gameroom });
        await UnitMap.deleteMany({ gameroom });
        await BuildingMap.deleteMany({ gameroom });
        await gameUser.deleteMany({ gameroom });
        await GameRoom.deleteMany({ gameroom });

        res.status(200).json({ message: "모든 사용자 데이터가 성공적으로 삭제되었습니다!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "데이터 삭제 중 오류가 발생했습니다." });
    }
});

module.exports = { 
    getgameroom, updategameroom,
    saveHexMap, getHexMap, 
    saveUnitMap, getUnitMap, 
    saveBuildingtMap, getBulidingMap,
    saveGameUser, getGameUser,
    deleteAllUserData };