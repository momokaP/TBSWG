const express = require("express");
const cookieParser = require("cookie-parser");
const {checkLogin_game, checkLogin_main} = require("../middlewares/checkLogin");
const { 
    getgameroom, updategameroom,
    saveHexMap, getHexMap,
    saveUnitMap, getUnitMap,
    saveBuildingtMap, getBulidingMap,
    saveGameUser, getGameUser,
    deleteAllUserData
 } = require("../controllers/dataController");

const router = express.Router();

router.use(cookieParser());

router.route("/gameroom").get(checkLogin_game, getgameroom);
router.route("/gameroom").put(checkLogin_game, updategameroom);

router.route("/save-hex-map").post(checkLogin_game, saveHexMap);
router.route("/get-hex-map").get(checkLogin_game, getHexMap);

router.route("/save-unit-map").post(checkLogin_game, saveUnitMap);
router.route("/get-unit-map").get(checkLogin_game, getUnitMap);

router.route("/save-building-map").post(checkLogin_game, saveBuildingtMap);
router.route("/get-building-map").get(checkLogin_game, getBulidingMap);

router.route("/save-gameUser").post(checkLogin_game, saveGameUser);
router.route("/get-gameUser").get(checkLogin_game, getGameUser);

router.route("/delete-all").delete(checkLogin_game, deleteAllUserData);

module.exports = router;