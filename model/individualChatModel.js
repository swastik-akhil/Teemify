const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
        
    {
        senderId : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User"
        },

        recieverId : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User"
        },


        message : {
            type : String,
            required : true
        }

    }
    ,{ timeStamps: true }
);

chatSchema.methods.storeMessage = async function(senderId, recieverId, message){
    try{
        const chat = await this.model("IndividualChat").create({
            senderId,
            recieverId,
            message
        });
        return chat;
    }catch(err){
        console.log("Error while creating a new chat", err);
    }
}


module.exports = mongoose.model("IndividualChat", chatSchema);