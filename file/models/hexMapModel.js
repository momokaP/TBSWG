const mongoose = require("mongoose");

// Mongoose 스키마 가져오기
const Schema = mongoose.Schema;

const hexMapSchema = new Schema({
    row: Number,
    col: Number,
    resource: Boolean,
    resourceAmount: Number,
    
    username: String,
    gameroom: String,
    createdAt: {
        type: Date,
        default: Date.now, // 문서가 생성될 때의 시간
        expires: 86400,  // 24시간 후에 자동으로 삭제 (초 단위)
    },
});

// TTL 인덱스를 `createdAt` 필드에 설정
hexMapSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // 1시간 후 자동 삭제
hexMapSchema.index({ username: 1 }, { unique: false });

const HexMap = mongoose.model("HexMap", hexMapSchema);

module.exports = HexMap;