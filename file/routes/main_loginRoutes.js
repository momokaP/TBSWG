const express = require("express");
const cookieParser = require("cookie-parser");

const router = express.Router();
const { 
    getNewMain,
    getMain,
    getRegister,
    registerUser,
    getLogin,
    logout, 
    loginUser,
    mypage,
    mypageDelete } =require("../controllers/main_loginController");
const {checkLogin_game, checkLogin_main, checkLogin_new} = require("../middlewares/checkLogin");

router.use(cookieParser());

router.route("/").get(checkLogin_main, getMain);
router.route("/new").get(checkLogin_new, getNewMain);
router.route("/login").get(getLogin).post(loginUser);
router.route("/register").get(getRegister).post(registerUser);
router.route("/logout").get(checkLogin_main, logout);
router.route("/mypage").get(checkLogin_main, mypage).delete(mypageDelete);

router.route("/registerSuccessful").get((req, res)=>{
	res.render("registerSuccessful");
})

module.exports = router;