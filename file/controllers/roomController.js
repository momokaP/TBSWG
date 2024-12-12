const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const Room = require("../models/roomModel"); 
const User = require("../models/userModel");  // User 모델 불러오기
const jwtSecret = process.env.JWT_SECRET; // JWT 비밀키

// @desc Get In Room
// @route GET /room/in-room
const getInRoom  = async (req,res)=>{
    try {
        const roomId = req.query.id; // URL 쿼리 파라미터에서 id 가져오기
        const foundRoom = await Room.findById(roomId);  // MongoDB에서 해당 id의 방을 찾음
        if (!foundRoom) {
          return res.status(404).send('Room not found');
        }

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

        // 방에 들어갈 때 isroom을 true로 설정
        user.isroom = true;
        await user.save();  // 변경 사항 저장

        
        console.log(foundRoom.hostname === username);

        // 방 정보를 EJS 템플릿에 전달
        res.render('in-room', { 
            room: foundRoom, 
            username: username,
            isHost: foundRoom.hostname === username, // 호스트 여부를 전달
            });
      } catch (err) {
        res.status(500).send('Error fetching room');
      }
};


// @desc Get List Room
// @route GET /room/list-room
const getListRoom  = (req,res)=>{
    res.render("list-room");
};

// @desc Get List Room Data
// @route GET /room/list-room-data
const getListRoomData = async (req, res) => {
    try {
        const rooms = await Room.find();  // 모든 방 데이터를 MongoDB에서 가져오기

        // 접속 중이고 방이나 게임에 있지 않은 유저 데이터 가져오기
        const users = await User.find({
            isonline: true,
            isroom: false,
            isgame: false
        });

        res.json({ rooms, users });  // JSON 형식으로 응답
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving rooms');
    }
};

// @desc Get Create Room
// @route GET /room/create-room
const getCreateRoom  = (req,res)=>{
    res.render("create-room");
};
// @desc Post Create Room
// @route POST /room/create-room
const postCreateRoom = asyncHandler(async (req, res) => {
    const { roomname } = req.body; // 클라이언트에서 전송한 hexMap 데이터

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

        // 동일한 hostname을 가진 방이 있는지 확인
        const existingRoom = await Room.findOne({ hostname: username });
        if (existingRoom) {
            return res.status(400).json({ message: "이미 방을 생성하셨습니다. 추가로 방을 만들 수 없습니다." });
        }

        // 새로운 Room 데이터 생성
        const newRoom = new Room({
            hostname: username, // hostname에 username 저장
            roomname: roomname, // 클라이언트에서 전달받은 roomname 저장
            usernames: [username], // usernames 배열에 첫 번째 사용자 추가
        });

        // MongoDB에 Room 저장
        await newRoom.save();

        // 방 생성 후 해당 방의 _id를 클라이언트로 반환
        res.status(200).json({
            message: "room이 성공적으로 생성되었습니다!",
            roomId: newRoom._id,  // 생성된 방의 _id 반환
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "room 생성 중 오류가 발생했습니다. 다시 시도해주세요." });
    }
});

module.exports = { 
    getCreateRoom,
    postCreateRoom,
    getListRoom,
    getListRoomData,
    getInRoom };