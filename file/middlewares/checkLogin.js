const jwt = require("jsonwebtoken");
require("dotenv").config();
const jwtSecret = process.env.JWT_SECRET;

const checkLogin_game = async (req,res,next)=>{
    res.setHeader("Cache-Control","no-cache, no-store, mst-revalidate");

    const token = req.cookies.token;

    if(!token){
        return res.redirect("/login");
    }
    try{
        const decoded = jwt.verify(token,jwtSecret);
        req.username = decoded.username;
        next();
    } 
    catch (error) {
        return res.status(400).render("error", { 
            errorMessage: "에러.".replace(/\n/g, "<br>"),
            redirectLink: "/",
            redirectText: "메인으로" });
        //res.status(401).json({message:"로그인이 필요합니다."});
    }
};

const checkLogin_main = async (req,res,next)=>{
    res.setHeader("Cache-Control","no-cache, no-store, mst-revalidate");

    const token = req.cookies.token;

    if(!token){
        return res.redirect("/new");
    }
    try{
        const decoded = jwt.verify(token,jwtSecret);
        req.username = decoded.username;
        next();
    } 
    catch (error) {
        return res.status(400).render("error", { 
            errorMessage: "에러.".replace(/\n/g, "<br>"),
            redirectLink: "/",
            redirectText: "메인으로" }); 
        //res.status(401).json({message:"로그인이 필요합니다."});
    }
};

const checkLogin_new = async (req,res,next)=>{
    res.setHeader("Cache-Control","no-cache, no-store, mst-revalidate");

    const token = req.cookies.token;

    if(!token){
        return next();
    }
    try{
        const decoded = jwt.verify(token,jwtSecret);
        req.username = decoded.username;
        res.redirect("/");
    } 
    catch (error) {
        return res.status(400).render("error", { 
            errorMessage: "에러.".replace(/\n/g, "<br>"),
            redirectLink: "/",
            redirectText: "메인으로"
             });
        //res.status(401).json({message:"로그인이 필요합니다."});
    }
};

module.exports = {checkLogin_game, checkLogin_main, checkLogin_new};