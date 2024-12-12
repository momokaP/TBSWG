const path = require("path");
const express = require("express");
const dbConnect = require("./config/dbConnect");
const methodOverride = require("method-override");
const Room = require("./models/roomModel"); 
const User = require("./models/userModel");  // User 모델 불러오기
const GameRoom = require("./models/gameRoomModel");

const { Server } = require("socket.io");
const http = require("http");

const app = express();
const port = 3000;

// HTTP 서버 생성
const server = http.createServer(app);
const io = new Server(server);

app.set("view engine","ejs");
app.set("views","./views");

app.use(express.static(path.join(__dirname, "assets")));
app.use(methodOverride("_method"));

dbConnect();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use("/", require("./routes/main_loginRoutes"));
app.use("/game", require("./routes/gameRoutes"));
app.use("/data", require("./routes/dataRoutes"));
app.use("/room", require("./routes/roomRoutes"));

app.get("/error", (req, res)=>{
	res.render("error");
})

app.get("/userDelete", (req, res)=>{
	res.render("userDelete");
})

// 소켓 통신 설정
io.on("connection", (socket) => {
    console.log("새로운 클라이언트가 연결되었습니다:", socket.id);

    socket.on("chat game message", async (msg, gameroom, username) => {
        const foundRoom = await GameRoom.findOne({ gameroom: gameroom });
        console.log(foundRoom);
        
        // 새로운 메시지 객체 생성
        const newMessage = {
            user: username,
            text: msg
        };

        // 메시지 저장
        foundRoom.messages.push(newMessage);
        await foundRoom.save();

        console.log("메시지:", msg, "방이름:", gameroom);
        io.to(gameroom).emit("chat history", foundRoom.messages); // 모든 클라이언트에 메시지 전달
    });

	socket.on("save data", (message) => {
        console.log(message.gameroom," 데이터를 저장합니다:", message.Message);
		io.to(message.gameroom).emit("save data", message); // 모든 클라이언트에 메시지 전달
    });

    socket.on("save record", async (iswin, username, gameroom) => {
        console.log(iswin, username);
        try {
            let gameroomname = gameroom;
            let users;
            
            const user = await User.findOne({ username: username }); // 사용자 찾기
            //gameroomname = user.gameroom;

            
            if (user) {
                // 새 기록 객체 생성
                const newRecord = {
                    gamaroomname: gameroomname,
                    iswin: iswin
                };
                
                // record 배열에 새 기록 추가
                user.record.push(newRecord);
                
                await user.save();  // 변경 사항 저장
            }
        } catch (err) {
            console.error(`Error while recording game ${username}:`, err);
        }
    });

    socket.on("Gameend", (gameroom) => {
        console.log("게임 종료");
		io.to(gameroom).emit("Gameend"); // 모든 클라이언트에 전달
    });

    socket.on("joinGameRoom", async (gameroom) => {
        socket.join(gameroom);
        console.log(`소켓 ${socket.id}가 ${gameroom}에 참여했습니다.`);

        try {
            const foundRoom = await GameRoom.findOne({ gameroom: gameroom });
            if (foundRoom) {
                // 방의 기존 메시지들을 클라이언트에 전송
                socket.emit("chat history", foundRoom.messages);
            }
        } catch (error) {
            console.error(`Error fetching messages for room ${gameroom}:`, error);
        }

    });

    // 방 삭제 요청 처리
    socket.on("deleteGameRoom", async (gameroom) => {
        // 방 정보 가져오기
        const foundRoom = await GameRoom.findOne({ gameroom: gameroom });

        if (!foundRoom) {
            console.log("방을 찾을 수 없습니다.");
            return;
        }

        // 방에 있는 모든 유저들에게 방 삭제 알림
        io.to(gameroom).emit("gameroomDeleted", gameroom);

        // 방에 연결된 모든 클라이언트 퇴장
        io.socketsLeave(gameroom);

        console.log(`방 ${gameroom}이 삭제되었습니다.`);
    });

    // 사용자가 특정 방에 입장할 때
    socket.on("joinRoom", async (roomId, username) => {
        const MAX_USERS_PER_ROOM = 2;  // 방에 최대 입장할 수 있는 유저 수

        // 방 정보 가져오기
        const foundRoom = await Room.findById(roomId);
        const user = await User.findOne({ username: username });
        
        if (!foundRoom) {
            console.log("방을 찾을 수 없습니다.");
            return;
        }

        user.isroom = true;  
        await user.save();  // 변경 사항 저장

        // 이미 해당 방에 있지 않다면 유저를 usernames 배열에 추가
        if (!foundRoom.usernames.includes(username)) {
            foundRoom.usernames.push(username);
            await foundRoom.save();
        }

        // 방이 이미 최대 유저 수를 초과한 경우
        if (foundRoom.usernames.length > MAX_USERS_PER_ROOM) {
            socket.emit("room full", roomId);  // 클라이언트에 방이 가득 찼음을 알림
            console.log(`방 ${roomId}가 가득 차서 ${username}이 입장할 수 없습니다.`);
            
            // 해당 유저 이름을 usernames 배열에서 제거
            foundRoom.usernames = foundRoom.usernames.filter(user => user !== username);
            await foundRoom.save();
            return;  // 유저가 방에 입장하지 못하도록 막음
        }
        
        // 사용자 목록을 해당 방에 있는 모든 클라이언트에게 전송
        io.to(roomId).emit('update user list', foundRoom.usernames);

        // 클라이언트를 해당 방에 입장시키기
        socket.join(roomId);
        console.log(`${username}님이 방 ${roomId}에 입장했습니다.`);
        
        // 새로 입장한 유저에게 사용자 목록을 전송
        socket.emit('update user list', foundRoom.usernames);

        // 방의 기존 메시지들을 클라이언트에게 전송
        socket.emit("chat history", foundRoom.messages);
    });

    // 클라이언트에서 채팅 메시지가 오면
    socket.on("chat message", async (roomId, msg) => {
        const foundRoom = await Room.findById(roomId);

        if (!foundRoom) {
            console.log("방을 찾을 수 없습니다.");
            return;
        }

        // 새로운 메시지 객체 생성
        const newMessage = {
            user: msg.user,
            text: msg.text
        };

        // 메시지 저장
        foundRoom.messages.push(newMessage);
        await foundRoom.save();

        // 메시지를 모든 클라이언트에게 전송
        io.to(roomId).emit("chat message", newMessage);
    });

    // 클라이언트가 방을 떠날 때
    socket.on("leaveRoom", async (roomId, username) => {
        const foundRoom = await Room.findById(roomId);
        const user = await User.findOne({ username: username });

        if (!foundRoom || !user) {
            console.log("찾을 수 없습니다.");
            return;
        }

        user.isroom = false;  // 방을 떠났으므로 inroom을 false로 설정
        await user.save();  // 변경 사항 저장

        // 해당 유저 이름을 usernames 배열에서 제거
        foundRoom.usernames = foundRoom.usernames.filter(user => user !== username);
        await foundRoom.save();

        // 클라이언트를 해당 방에서 나가게 함
        socket.leave(roomId);

        // 방에 남아있는 모든 클라이언트에게 갱신된 사용자 목록 전송
        io.to(roomId).emit('update user list', foundRoom.usernames);

        console.log(`${username}님이 방 ${roomId}에서 나갔습니다.`);
    });

    // 방 삭제 요청 처리
    socket.on("deleteRoom", async (roomId) => {
        // 방 정보 가져오기
        const foundRoom = await Room.findById(roomId);

        if (!foundRoom) {
            console.log("방을 찾을 수 없습니다.");
            return;
        }

        // 방에 있는 모든 유저들에게 방 삭제 알림
        io.to(roomId).emit("roomDeleted", roomId);

        // 방에 있는 모든 사용자에 대해 isroom을 false로 업데이트
        const usernames = foundRoom.usernames;
        for (const username of usernames) {
            try {
                const user = await User.findOne({ username: username }); // 사용자 찾기
                if (user) {
                    user.isroom = false;  // 방을 떠났으므로 isroom을 false로 설정
                    await user.save();  // 변경 사항 저장
                }
            } catch (err) {
                console.error(`Error while updating user ${username}:`, err);
            }
        }

        // 방을 데이터베이스에서 삭제
        await Room.findByIdAndDelete(roomId);

        // 방에 연결된 모든 클라이언트 퇴장
        io.socketsLeave(roomId);

        console.log(`방 ${roomId}이 삭제되었습니다.`);
    });

    socket.on("gamestart", async (roomId, hostname) => {
        const foundRoom = await Room.findById(roomId);

        if (!foundRoom) {
            console.log("찾을 수 없습니다.");
            return;
        }

        // 새로운 Room 데이터 생성
        const newGameRoom = new GameRoom({
            gameroom: `${hostname}_${foundRoom.roomname}`,
            initial: true,
            myturn: hostname,
        });

        const usernames = foundRoom.usernames;
        for (const username of usernames) {
            try {
                const user = await User.findOne({ username: username }); // 사용자 찾기
                if (user) {
                    user.gameroom = `${hostname}_${foundRoom.roomname}`;  // 방을 떠났으므로 isroom을 false로 설정
                    user.isroom = false;  // 방을 떠났으므로 isroom을 false로 설정
                    user.isgame = true;
                    newGameRoom.usernames.push(username);
                    await user.save();  // 변경 사항 저장
                }
            } catch (err) {
                console.error(`Error while updating user ${username}:`, err);
            }
        }

        // MongoDB에 Room 저장
        await newGameRoom.save();

        // 방에 연결된 모든 클라이언트에게 /game으로 이동하라는 명령 전송
        io.to(roomId).emit("redirectToGame");

        // 방을 데이터베이스에서 삭제
        await Room.findByIdAndDelete(roomId);

        // 방에 연결된 모든 클라이언트 퇴장
        io.socketsLeave(roomId);

        console.log(`방 ${roomId}이 삭제되었습니다.`);
    });

    socket.on("disconnect", () => {
        console.log("클라이언트가 연결을 종료했습니다:", socket.id);
    });
});


//app.get("/game", (req, res) => {
//	res.status(200);
//	res.sendFile(__dirname+"/assets/test1.html");
//});

server.listen(port, () => {
	console.log(`${port}번 포트에서 서버 실행 중`);
});

