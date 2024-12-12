const mongoose = require("mongoose");

// Mongoose 스키마 가져오기
const Schema = mongoose.Schema;

// 사용자 스키마를 만들기
const UserSchema = new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
    isonline: {
        type: Boolean,
        default: false, // 기본값은 false로 설정
    },
    isroom: {
        type: Boolean,
        default: false, // 기본값은 false로 설정
    },
    isgame: {
        type: Boolean,
        default: false, // 기본값은 false로 설정
    },
    gameroom:{
        type:String,
    },
    record: [{
        gamaroomname: String,
        iswin: Boolean,   
    }],

});

// User 모델을 만들고 내보내기
module.exports = mongoose.model("User", UserSchema);