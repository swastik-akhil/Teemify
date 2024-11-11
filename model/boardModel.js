const mongoose = require("mongoose");


const boardSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true,
        trim : true
    },

    description : {
        type : String,
        required : true,
        trim : true
    },

    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },

    members : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }],

    lists : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : "List"
    }],

    cards : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Card"
    }],

    chat : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Chat"
    }],

    archived : {
        type : Boolean,
        default : false
    },

    attachments : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Attachment"
    }],
    
    // color : {
    //     type : String,
    //     default : "#0079bf"
    // },


}, { timestamps : true });



module.exports = mongoose.model("Board", boardSchema);