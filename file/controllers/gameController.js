const asynchandler = require("express-async-handler");
const path = require("path");

// @desc Get game page
// @route GET /game
const getGame = asynchandler(async (req, res) => {
    // 절대 경로를 사용하여 올바른 경로로 파일 전송
    const filePath = path.join(__dirname, "../assets/test1.html");
    res.status(200);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error sending file:', err);
            res.status(500).send('Server Error');
        }
    });
});


module.exports = {
    getGame,
};