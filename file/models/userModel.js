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
});

// User 모델을 만들고 내보내기
module.exports = mongoose.model("User", UserSchema);