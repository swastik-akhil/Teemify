const express = require("express");
const http = require("http");
const app = express();
require("dotenv").config();
const cookieParser = require("cookie-parser");
const { PORT } = process.env;
require("./config/dbConnect").dbConnect();
const path = require("path");
const cors = require("cors");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server);
const { ObjectId } = require('mongodb');
const passport = require("./config/passportConfig");
const axios = require("axios");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
app.use(
  cors({
    origin: "*",
    credentials: true,
    optionsSuccessStatus: 200,
    exposedHeaders: ['Content-Type', 'Authorization'], // Expose the 'Authorization' header

  })
);


const expressSession = require("express-session");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");

const dbString = process.env.MONGODB_URL;
const dbOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

const sessionStore = MongoStore.create({
  clientPromise: mongoose.connect(dbString, dbOptions).then(m => m.connection.getClient()),
  collectionName: "session"
});

app.use(expressSession({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: sessionStore,
  cookie: { secure: process.env.NODE_ENV === "production" ? true : false },
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//middlewares
app.use(express.static(path.resolve("./public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: "/tmp/"
}));
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY
});

//import routes
const userRouter = require("./router/userRouter");
const listRouter = require("./router/listRouter");
const boardRouter = require("./router/boardRouter");
const cardRouter = require("./router/cardRouter");
const paymentRouter = require("./router/paymentRouter");
//routes
app.use("/api/user", userRouter);
app.use("/api/board", boardRouter);
app.use("/api/list", listRouter);
app.use("/api/card", cardRouter);
app.use("/api/payment", paymentRouter);

app.post('/sendToML', async (req, res) => {
  try {
    const { domain } = req.body;

    // Define the allowed values for the domain
    const allowedDomains = /^(Frontend|Backend|ML|Design|App)$/i;

    // Check if the domain matches the allowed pattern
    if (!allowedDomains.test(domain)) {
      return res.status(400).json({ error: 'Invalid domain value' });
    }

    // Call machine learning API
    const mlApiResponse = await axios.post('https://erp.anaskhan.site/api/recommendation/', { domain });

    // Process ML API response
    const processedData = mlApiResponse.data;

    // Send processed data back to frontend
    res.json({ result: processedData });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// const User = require("./model/userModel");        
// const Chat = require("./model/chatsModel");
const { initializeSocket } = require("./config/sockets");
// io.on("connection", (socket) => {
// 	console.log(socket.id);
// 	socket.on("newMessage", async(messageText, incomingUserId) => {             //TODO: change userId to variable
//     let userId = new ObjectId(incomingUserId);
//     const user = await User.findById(userId);
//     const senderId = new ObjectId("655e5a3d67a8ae739ca6792b");
//     // const newMessage = await Chat.create({sender : req.user._id, reciever : userId, message : messageText, isIndividualChat : true});
//     const newMessage = await Chat.create({ sender: senderId, reciever: userId, message: messageText, isIndividualChat: true });
//     user.chat.push(newMessage._id);
//     console.log(newMessage);
//     socket.broadcast.to(userId).emit("newMessage", message);
//   });

// });
initializeSocket(server);
app.post('/sendToML', async (req, res) => {
  try {
    const { domain } = req.body;

    // Define the allowed values for the domain
    const allowedDomains = /^(Frontend|Backend|ML|Design|App)$/i;

    // Check if the domain matches the allowed pattern
    if (!allowedDomains.test(domain)) {
      return res.status(400).json({ error: 'Invalid domain value' });
    }

    // Call machine learning API
    const mlApiResponse = await axios.post('https://erp.anaskhan.site/api/recommendation/', { domain });

    // Process ML API response
    const processedData = mlApiResponse.data;
    // Send processed data back to frontend
    res.json({ result: processedData });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.get("/", (req, res) => {
  return res.sendFile("./public/index.html");
});


// app.post("/testImgUpload", async (req, res) =>{
//   try{
//       // const board = await boardModel.findById(req.params.id);
//       // if(!board){
//       //     return res.status(400).json({status : "failed", message : "Board not found"});
//       // }
//       // const flag = board.members.includes(req.user._id);
//       // if(!flag){
//       //     return res.status(400).json({status : "failed", message : "User not a member of this board"});
//       // }
//       let result;
//       let imageArray = [];
//       if(req.files){
//           for(let i=0; i<req.files.sampleFile.length; i++){
//               // let file = req.files.sampleFile[i].tempFilePath;
//               result = await cloudinary.uploader.upload(req.files.sampleFile[i].tempFilePath, {
//                   folder: "teemify",
//               });
//               imageArray.push({secure_url :result.secure_url, public_id : result.public_id});
//           }
//       }
//       console.log(req.files);
//       // let file = req.files.sampleFile;
//       // let result = await cloudinary.uploader.upload(file.tempFilePath, {
//       //     folder: "teemify",
//       // });
//       // console.log(result);
//       // let attachment = await Attachment.create({board : req.params.id, user : req.user._id, secure_url : result.secure_url, public_id : result.public_id});
//       // board.attachments.push(attachment._id);
//       // await board.save();
//       // req.user.attachments.push(attachment._id);
//       // await req.user.save();

//       return res.status(200).json({status : "success", message : "File uploaded successfully", imageArray : imageArray});
//   }catch(e){
//       console.log(e);
//       return res.status(400).json({status : "failed", message : "Something went wrong"})
//   }
// });



server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

