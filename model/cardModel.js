const mongoose = require("mongoose");
const cardSchema = new mongoose.Schema({
    
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

    board : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Board",
        required : true
    },

    list : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "List",
        required : true
    },

    members : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }],

    
    position : {
        type : Number,
        required : true,
        default : 0
    },

    isArchived : {
        type : Boolean,
        default : false
    },

    daysAlloted : {
        type : Number,
        required : false
    },

    isCompleted : {
        type : Boolean,
        default : false
    },

    // completedAt : {
    //     type : Date,
    //     required : false
    // },

    

    // labels : [{
    //     type : mongoose.Schema.Types.ObjectId,
    //     ref : "Label"
    // }],

    // checklists : [{
    //     type : mongoose.Schema.Types.ObjectId,
    //     ref : "Checklist"
    // }],
    
    // comments : [{
    //     type : mongoose.Schema.Types.ObjectId,
    //     ref : "Comment"
    // }],

    // attachments : [{
    //     type : mongoose.Schema.Types.ObjectId,
    //     ref : "Attachment"
    // }],

    // activities : [{
    //     type : mongoose.Schema.Types.ObjectId,
    //     ref : "Activity"
    // }],

    // cover : {
    //     type : mongoose.Schema.Types.ObjectId,
    //     ref : "Attachment"
    // },

    // color : {
    //     type : String,
    //     default : "#0079bf"
    // }


},{ timestamps : true});



module.exports = mongoose.model("Card", cardSchema);