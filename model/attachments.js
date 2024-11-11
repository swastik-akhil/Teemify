const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema({
    board : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Board",
        required : true
    },
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    // secure_url : {
    //     type : [],
    //     required : true
    // },
    // public_id : {
    //     type : {},
    //     required : true
    // },
    imageArray : {
        type : [],
        required : true
    },
})

module.exports = mongoose.model("Attachment", attachmentSchema);