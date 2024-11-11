const { Server } = require('socket.io');
const User = require('../model/userModel');
const Chat = require('../model/chatsModel');
const IndividualChat = require('../model/individualChatModel');
const { ObjectId } = require('mongodb');
const Board = require('../model/boardModel');

async function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    },
    connectionStateRecovery: {},
  });

  console.log("socket initialized");

  io.on('connection', async (socket) => {
    console.log('a user connected');
    const { userIdFromClient } = socket.handshake.query;
    console.log('a user connected with userId:', userIdFromClient);
    let user;

    const userId = new ObjectId(userIdFromClient);

    try {
      user = await User.findById(userId).populate("boards");
      if (!user) {
        console.log("user not found");
        return;
      }

      console.log("user found is ", user);

      user.boards.forEach(board => {
        socket.join(board._id.toString());
        console.log(`user ${userId} joined board ${board._id}`);
      });

    } catch (error) {
      console.error(error);
    }

    socket.on('chatMessageToBoard', async (msg, boardId) => {
      try {
        const board = await Board.findById(boardId);
        if (!board) {
          console.log("board not found");
          return;
        }

        // io.to(boardId).emit('chat message', { senderId: userId, message: msg }); //to all users
        socket.to(boardId).emit("chat message", { senderId: userId, message: msg }); //to all users except sender

        const newChat = await Chat.create({
          senderId: userId,
          board: boardId,
          message: msg
        });

        console.log("newChat created is ", newChat);
      } catch (error) {
        console.error(error);
      }
    });

    socket.on('chatMessageToUser', async (msg, recieverId) => {
      try {
        const reciever = await User.findById(recieverId);
        if (!reciever) {
          console.log("reciever not found");
          return;
        }

        io.to(recieverId).emit('chat message', { senderId: userId, message: msg });

        const newChat = await IndividualChat.create({
          senderId: userId,
          recieverId: recieverId,
          message: msg
        });

        console.log("newChat created is ", newChat);
      } catch (error) {
        console.error(error);
      }
    });

    socket.on("loadBoardMessages", async (boardId) => {
      try {
        const board = await Board.findById(boardId);
        if (!board) {
          console.log("board not found");
          return;
        }

        const chats = await Chat.find({ board: boardId });
        console.log("chats are ", chats);
        socket.emit("messages", chats);
      } catch (error) {
        console.error(error);
      }
    });

    socket.on("loadChatMessages", async (recieverId) => {
      try {
        const reciever = await User.findById(recieverId);
        if (!reciever) {
          console.log("reciever not found");
          return;
        }

        const chats = await IndividualChat.find({
          $or: [
            { senderId: userId, recieverId: recieverId },
            { senderId: recieverId, recieverId: userId }
          ]
        });

        console.log("chats are ", chats);
        socket.emit("messages", chats);
      } catch (error) {
        console.error(error);
      }
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });

  return io;
}

module.exports = { initializeSocket };
