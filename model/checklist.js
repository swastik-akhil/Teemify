const mongoose = require("mongoose");


const checklistSchema = new mongoose.Schema({

    name : {
        type : String,
        required : true,
        trim : true
    },
    
    card : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Card",
        required : true
    },

    checked : {
        type : Boolean,
        default : false
    },

    position : {
        type : Number,
        required : true
    },
},{ timestamps : true});



module.exports = mongoose.model("Checklist", checklistSchema);