const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
        
    {
        senderId : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User"
        },

        // recieverId : {
        //     type : mongoose.Schema.Types.ObjectId,
        //     ref : "User"
        // },

        board : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Board"
        },

        message : {
            type : String,
            required : true
        },

        createdAt : {
            type : Date,
            default : Date.now
        }

    }
    ,{ timeStamps: true }
);

chatSchema.methods.storeMessage = async function(senderId, boardId, message){
    try{
        const chat = await this.model("Chat").create({
            senderId,
            board : boardId,
            message
        });
        return chat;
    }catch(err){
        console.log("Error while creating a new chat", err);
    }
}





module.exports = mongoose.model("Chat", chatSchema);