const mongoose = require("mongoose");

// User 스키마 정의
const gameUserSchema = new mongoose.Schema({
    name: String,
    resourceAmount: Number, 
    turn: Number,
    myturn: Boolean,

    username: String,
    gameroom: String,
    createdAt: {
        type: Date,
        default: Date.now, // 문서가 생성될 때의 시간
        expires: 86400,  // 1시간 후에 자동으로 삭제 (초 단위)
    },
});

// User 모델 생성
const gameUser = mongoose.model("gameUser", gameUserSchema);

module.exports = gameUser;