const mongoose = require("mongoose");


const listSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true,
        trim : true
    },

    board : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Board",
        required : true
    },

    cards : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Card"
    }],

    // position : {
    //     type : Number,
    //     required : true
    // },

    archived : {
        type : Boolean,
        default : false
    },

    color : {
        type : String,
        default : "#0079bf"
    }
},{ timestamps : true});



module.exports = mongoose.model("List", listSchema);