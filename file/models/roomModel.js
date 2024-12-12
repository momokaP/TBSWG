const mongoose = require("mongoose");

// User 스키마 정의
const RoomSchema = new mongoose.Schema({
    hostname: String,
    roomname: String,

    usernames: [String], // 여러 사용자 이름을 배열로 저장

    messages: [{
        user: String,    // 메시지를 보낸 사용자
        text: String,    // 메시지 내용
    }],

    createdAt: {
        type: Date,
        default: Date.now, // 문서가 생성될 때의 시간
        expires: 86400,  // 1시간 후에 자동으로 삭제 (초 단위)
    },
});

// User 모델 생성
const room = mongoose.model("room", RoomSchema);

module.exports = room;