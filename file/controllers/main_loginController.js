const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;

//@desc Main Page
//@route GET /
const getMain = (req,res)=>{
    res.render("main2");
}

//@desc Main Page
//@route GET /new
const getNewMain = (req,res)=>{
    res.render("main");
}


//@desc Register Page
//@route GET /register
const getRegister = (req,res)=>{
    res.render("register1");
};

//@desc Register user
//@route POST /register
const registerUser = asyncHandler(async (req,res)=>{
    // 폼에서 넘겨받은 내용(req.body)을 username과 password, confirmPassword 추출합니다.
    const{username, password, confirmPassword} = req.body;

    // 비밀번호 강도 검사: 8자 이상, 대문자/소문자/숫자/특수문자 포함 여부 확인
    //const passwordRegex = /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    
    // 비밀번호 강도 검사: 4자 이상
    const passwordRegex = /^.{4,}$/;

    if (!passwordRegex.test(password)) {
        return res.status(400).render("error", {
            errorMessage: "비밀번호는 8자 이상이어야 하며 특수문자를 포함해야 합니다.".replace(/\n/g, "<br>"),
            redirectLink: "/register",
            redirectText: "다시 회원가입하기"
        });
    }

    if (password !== confirmPassword) {
        return res.status(400).render("error", { 
            errorMessage: "비밀번호와 비밀번호 확인이 일치하지 않습니다",
            redirectLink: "/register",
            redirectText: "다시 회원가입하기" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, password: hashedPassword });
        res.status(201).redirect("/registerSuccessful");
    } catch (err) {
        // 중복된 username 에러 처리
        if (err.code === 11000) { // MongoDB duplicate key error code
            return res.status(400).render("error", {
                errorMessage: "이미 존재하는 사용자 이름입니다. 다른 이름을 사용해주세요.".replace(/\n/g, "<br>"),
                redirectLink: "/register",
                redirectText: "다시 회원가입하기"
            });
        }
        res.status(400).render("error", {
            errorMessage: "회원가입 중 오류가 발생했습니다. 다시 시도해주세요.".replace(/\n/g, "<br>"),
            redirectLink: "/register",
            redirectText: "다시 회원가입하기"
        });
    }
})

//@desc Get login page
//@route GET /login
const getLogin = (req,res)=>{
    res.render("login");
};

//@desc Login user
//@route POST /login
const loginUser = asyncHandler(async(req,res)=>{
    const {username, password} = req.body;

    const user = await User.findOne({username});

    if(!user){
        res.status(400).render("error", { 
            errorMessage: "일치하는 사용자가 없습니다.".replace(/\n/g, "<br>"),
            redirectLink: "/login",
            redirectText: "다시 로그인하기" });
        //return res.status(401).json({message:"일치하는 사용자가 없습니다."});
    }

    // 이미 로그인된 상태인지 확인
    if (user.isonline) {
        // 이미 로그인하면 초기화 진행하고 로그인
        user.isonline = false;
        user.isroom = false;
        user.isgame = false;
        user.gameroom = null;
        await user.save();
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch){
        res.status(400).render("error", { 
            errorMessage: "비밀번호가 일치하지 않습니다.".replace(/\n/g, "<br>"),
            redirectLink: "/login",
            redirectText: "다시 로그인하기" });
        //return res.status(401).json({message:"비밀번호가 일치하지 않습니다."});
    }

    // 로그인 성공 시 isonline을 true로 설정
    user.isonline = true;
    user.isroom = false;
    user.isgame = false;
    user.gameroom = null;

    // 변경된 user 데이터를 저장
    await user.save();

    const token = jwt.sign({id:user._id},jwtSecret);
    res.cookie("token", token, {httpOnly: true});

    res.redirect("/");
});

// @desc Logout
// @route GET /logout
const logout = async (req,res)=>{
    // 인증된 사용자의 ID를 얻기 위해 토큰을 검증
    const token = req.cookies.token;
    if (!token) {
        return res.redirect("/login");
    }

    try {
        // 토큰을 디코드하여 사용자 ID 가져오기
        const decoded = jwt.verify(token, jwtSecret);
        const userId = decoded.id;

        // 해당 사용자를 찾아서 isonline을 false로 설정
        const user = await User.findById(userId);
        if (user) {
            user.isonline = false;
            user.isroom = false;
            user.isgame = false;
            user.gameroom = null;
            await user.save();
        }
    } catch (error) {
        console.error("로그아웃 처리 중 오류 발생:", error);
    }

    res.clearCookie("token");
    res.redirect("/");
}

// @desc mypage
// @route GET /mypage
const mypage = asyncHandler(async(req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1;
        const recordsPerPage = 3;

        const token = req.cookies.token;    

        // 토큰이 없다면 오류 처리
        if (!token) {
            return res.status(401).json({ message: '인증되지 않은 요청입니다.' });
        }

        const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        const totalRecords = user.record.length;
        const totalPages = Math.ceil(totalRecords / recordsPerPage);

        const startIndex = (page - 1) * recordsPerPage;
        const endIndex = startIndex + recordsPerPage;
        const records = user.record.reverse().slice(startIndex, endIndex);

        res.render('mypage', { 
            Message: `${user.username}님의 페이지`, 
            records: records,
            currentPage: page,
            totalPages: totalPages
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '오류가 발생했습니다.' });
    }

    //const token = req.cookies.token;    
    //const decoded = jwt.verify(token,jwtSecret);
    //const id = decoded.id;
    //const user = await User.findById(id);

    //res.render("mypage",{Message:`${user.username}님의 페이지`});
});

// @desc mypage
// @route Delete /mypage
const mypageDelete = asyncHandler(async(req,res)=>{
    try {
        const token = req.cookies.token;    

        // 토큰이 없다면 오류 처리
        if (!token) {
            return res.status(401).json({ message: '인증되지 않은 요청입니다.' });
        }

        const decoded = jwt.verify(token, jwtSecret);
        const id = decoded.id;
        
        // 사용자 계정 삭제
        const user = await User.findByIdAndDelete(id); // 삭제 처리

        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        // 사용자 로그아웃 처리 (세션이나 쿠키 삭제)
        res.clearCookie('token');

        // 계정 삭제 후 화면 렌더링
        res.redirect("/userDelete");
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '계정 삭제 중 오류가 발생했습니다.' });
    }
});

module.exports = { getNewMain, getMain, getRegister, registerUser, getLogin, loginUser, logout, mypage, mypageDelete };