const mongoose = require("mongoose");

// Mongoose 스키마 가져오기
const Schema = mongoose.Schema;

const buildingMapSchema = new Schema({
    name: String,
    row: Number,
    col: Number,
    health: Number,
    user: String,
    pendingUnits: [{
        startTurn: Number,
        delay: Number,
        buildingType: String,
        tile: Object,
    }],
    pendingDevelopment: [{
        startTurn: Number,
        delay: Number,
        developmentType: String,
        tile: Object,
    }],
    gatherResources: Number,
    
    username: String,
    createdAt: {
        type: Date,
        default: Date.now, // 문서가 생성될 때의 시간
        expires: 86400,  // 1시간 후에 자동으로 삭제 (초 단위)
    },
});

// TTL 인덱스를 `createdAt` 필드에 설정
buildingMapSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // 1시간 후 자동 삭제

const BuildingMap = mongoose.model("BuildingMap", buildingMapSchema);

module.exports = BuildingMap;