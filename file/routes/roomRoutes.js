const express = require("express");
const cookieParser = require("cookie-parser");
const {checkLogin_game, checkLogin_main} = require("../middlewares/checkLogin");
const { 
    getCreateRoom,
    postCreateRoom,
    getListRoom,
    getListRoomData,
    getInRoom
 } = require("../controllers/roomController");

const router = express.Router();

router.use(cookieParser());

router.route("/list-room").get(checkLogin_game, getListRoom);
router.route("/list-room-data").get(checkLogin_game, getListRoomData);

router.route("/create-room").get(checkLogin_game, getCreateRoom);
router.route("/create-room").post(checkLogin_game, postCreateRoom);

router.route("/in-room").get(checkLogin_game, getInRoom);

module.exports = router;