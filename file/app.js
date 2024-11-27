const path = require("path");
const express = require("express");
const dbConnect = require("./config/dbConnect");
const methodOverride = require("method-override");

const app = express();
const port = 3000;

app.set("view engine","ejs");
app.set("views","./views");

app.use(express.static(path.join(__dirname, "assets")));
app.use(methodOverride("_method"));

dbConnect();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use("/", require("./routes/main_loginRoutes"));
app.use("/game", require("./routes/gameRoutes"));

app.get("/error", (req, res)=>{
	res.render("error");
})

app.get("/userDelete", (req, res)=>{
	res.render("userDelete");
})

//app.get("/game", (req, res) => {
//	res.status(200);
//	res.sendFile(__dirname+"/assets/test1.html");
//});

app.listen(port, () => {
	console.log(`${port}번 포트에서 서버 실행 중`);
});

