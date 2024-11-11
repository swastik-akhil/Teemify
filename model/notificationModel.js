const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    
    description : {
        type : String,
        required : true,
    },

    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
        
    
},{ timestamps : true});



module.exports = mongoose.model("Notification", notificationSchema);