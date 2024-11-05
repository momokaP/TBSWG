const express = require("express");
const app = express();
const path = require("path");

const port = 3000;

app.use(express.static(path.join(__dirname, "assets")));

app.get("/", (req, res) => {
	res.status(200);
	res.sendFile(__dirname+"/assets/test1.html");
	// res.send("Hello Node!");
});

app.listen(port, () => {
	console.log(`${port}번 포트에서 서버 실행 중`);
});

