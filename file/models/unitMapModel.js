const mongoose = require("mongoose");

// Mongoose 스키마 가져오기
const Schema = mongoose.Schema;

const unitMapSchema = new Schema({
    name: String,
    row: Number,
    col: Number,
    health: Number,
    damage: Number,
    move: Number,
    user: String,
    color: String,
    
    username: String,
    gameroom: String,
    createdAt: {
        type: Date,
        default: Date.now, // 문서가 생성될 때의 시간
        expires: 86400,  // 1시간 후에 자동으로 삭제 (초 단위)
    },
});

// TTL 인덱스를 `createdAt` 필드에 설정
unitMapSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // 1시간 후 자동 삭제

const UnitMap = mongoose.model("UnitMap", unitMapSchema);

module.exports = UnitMap;