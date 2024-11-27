const express = require("express");
const cookieParser = require("cookie-parser");
const {checkLogin_game, checkLogin_main} = require("../middlewares/checkLogin");
const {
    getGame,
} = require("../controllers/gameController");

const router = express.Router();

router.use(cookieParser());

router.route("/").get(checkLogin_game, getGame);

module.exports = router;