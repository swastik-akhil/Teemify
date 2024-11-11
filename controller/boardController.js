const boardModel = require('../model/boardModel');
const User = require('../model/userModel');
const cardModel = require('../model/cardModel');
const cloudinary = require('cloudinary').v2;
require("dotenv").config();
const Attachment = require("../model/attachments");

async function createBoard(req,res){
    try{
        let {name, description} = req.body;
        
        if(!name || !description){
            return res.status(400).json({status : "failed", message : "All fields are required"});
        }
        const user = req.user;              
        // const user = await User.findById(req.user._id); 
        if(!user){
            return res.status(400).json({status : "failed", message : "User not found"});
        }
        const exisitngBoards = user.boards;
        if(exisitngBoards.length > 10 && !user.isPremium){
            return res.status(400).json({status : "failed", message : "Maximum 10 boards allowed for a non premium user"});
        }
        if(exisitngBoards.length > 10 && user.susbcriptionExpiresAt < Date.now()){
            return res.status(400).json({status : "failed", message : "Subscription expired, renew you subscription to create or join more boards"});
        }
        let board;
        board = await boardModel.create({name, description, owner : req.user});
        board.members.push(req.user._id);
        await board.save({validateBeforeSave : false});
        user.boards.push(board._id);
        await user.save({validateBeforeSave : false});
        // console.log(req.cookies.token)
        return res.status(200).json({status : "success", message : "Board created successfully", board});
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"});
    }
}

async function getBoards(req,res){
    try{
        // const user = await User.findById(req.user._id).populate("boards");
        const user = await req.user.populate("boards");         //TODO: check if this works
        if(!user){
            return res.status(400).json({status : "failed", message : "User not found"});
        }
        return res.status(200).json({status : "success", message : "Boards fetched successfully", boards :  user.boards});
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"});
    }
}

async function getBoard(req,res){               
    try{
        const board = await boardModel.findById(req.params.id).populate({
            path : "lists",
            populate : {
                path : "cards"
            },
            path : "members",
            select : "name email"
        })
        // const board = await boardModel.findById(req.params.id).populate("owner members lists");         //TODO: check if this works
        if(!board){
            return res.status(400).json({status : "failed", message : "Board not found"});
        }
        const flag = board.members.includes(req.user._id);
        if(!flag){
            return res.status(400).json({status : "failed", message : "User not a member of this board"});
        }
        
        return res.status(200).json({status : "success", message : "Board fetched successfully", board});
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"});
    }
}

async function updateBoard(req,res){
    try{
        const {name, description, color} = req.body;
        const board = await boardModel.findById(req.params.id);
        if(!board){
            return res.status(400).json({status : "failed", message : "Board not found"});
        }
        let flag;
        if(board.owner.toString() === req.user._id.toString()){
            flag = true;
        }else{
            flag = false;
        }
        if(!flag){
            return res.status(400).json({status : "failed", message : "User not owner of this board"});
        }
        if(name){
            board.name = name;
        }    
        if(description){
            board.description = description;
        }
        if(color) {
            board.color = color;
        }
        await board.save();
        
        return res.status(200).json({status : "success", message : "Board updated successfully", board});
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"});
    }
}

async function deleteBoard(req, res) {
    try {
        const board = await boardModel.findById(req.params.id);
        
        if (!board) {
            return res.status(400).json({ status: "failed", message: "Board not found" });
        }

        if (board.owner.toString() !== req.user._id.toString()) {
            return res.status(400).json({ status: "failed", message: "Only owner can delete the board" });
        }

        // Use the deleteOne method to remove the board
        const result = await boardModel.deleteOne({ _id: req.params.id });

        if (result.deletedCount === 0) {
            return res.status(400).json({ status: "failed", message: "Board deletion failed" });
        }

        // Use $pull to remove the board ID from the user's boards array
        await User.updateMany({ boards: board._id }, { $pull: { boards: board._id } });

        return res.status(200).json({ status: "success", message: "Board deleted successfully" });
    } catch (e) {
        console.log(e);
        return res.status(500).json({ status: "failed", message: "Internal server error" });
    }
}

async function archiveBoard(req,res){
    try{
        const board = await boardModel.findById(req.params.id);
        if(!board){
            return res.status(400).json({status : "failed", message : "Board not found"});
        }
        const flag = board.members.includes(req.user._id);
        if(!flag){
            return res.status(400).json({status : "failed", message : "User not a member of this board"});
        }
        // const boards = req.user.boards;
        // if(!boards.includes(req.paramas.id)){
        //     return res.status(400).json({status : "failed", message : "User not a member of this board"});
        // }
        if(!board){
            return res.status(400).json({status : "failed", message : "Board not found"});
        }
        board.archived = true;
        await board.save();
        return res.status(200).json({status : "success", message : "Board archived successfully"});
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"});
    }
}

async function unarchiveBoard(req,res){
    try{
        const board = await boardModel.findById(req.params.id);
        
        if(!board){
            return res.status(400).json({status : "failed", message : "Board not found"});
        }
        board.archived = false;
        await board.save();
        return res.status(200).json({status : "success", message : "Board unarchived successfully"});
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"});
    }
}

async function addMember(req,res){
    try{
        const {email} = req.body;
        if(!email){
            return res.status(400).json({status : "failed", message : "Email is required"});
        }
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({status : "failed", message : "User not found"});
        }
        const board = await boardModel.findById(req.params.id);
        if(!board){
            return res.status(400).json({status : "failed", message : "Board not found"});
        }
        const loggedInUser = req.user;
        if(!loggedInUser){
            return res.status(400).json({status : "failed", message : "User not found, not logged in"});
        }
        if(board.owner.toString() !== loggedInUser._id.toString()){
            return res.status(400).json({status : "failed", message : "Only owner can add members"});
        }
        if(board.members.includes(user._id)){
            return res.status(400).json({status : "failed", message : "User already a member of this board"});
        }
        board.members.push(user._id);           //TODO: might await can be required.
        user.boards.push(req.params.id);        
        await board.save();
        await user.save();
        return res.status(200).json({status : "success", message : "Member added successfully", board});
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"})
    }
}

async function removeMember(req,res){
    try{
        const {email} = req.body;
        if(!email){
            return res.status(400).json({status : "failed", message : "Email is required"});
        }
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({status : "failed", message : "User not found"});
        }
        const board = await boardModel.findById(req.params.id);
        if(!board){
            return res.status(400).json({status : "failed", message : "Board not found"});
        }
        const loggedInUser = req.user;
        if(!loggedInUser){
            return res.status(400).json({status : "failed", message : "User not found, not logged in"});
        }
        if(board.owner.toString() !== loggedInUser._id.toString()){
            return res.status(400).json({status : "failed", message : "Only owner can remove members"});
        }
        if(!board.members.includes(user._id)){
            return res.status(400).json({status : "failed", message : "User is not a member of this board"});
        }
        board.members = board.members.filter(member => member.toString() !== user._id.toString());
        await board.save();
        return res.status(200).json({status : "success", message : "Member removed successfully", board});
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"})
    }
}

async function calendar(req, res) {
    try {
        const cards = await cardModel.find({ board: req.params.id });

        const cardsData = cards.map((card) => ({
            name: card.name,
            completed : card.isCompleted,
            daysAlloted: card.daysAlloted,
            createdAt: card.createdAt
        }));
        console.log(cardsData)

        return res.status(200).json({ status: "success", cardsData });
    } catch (e) {
        console.log(e);
        return res.status(400).json({ status: "failed", message: "Something went wrong" });
    }
}

async function getAllMembers(req, res){
    try{
        const board = await boardModel.findById(req.params.id);
        if(!board){
            return res.status(400).json({status : "failed", message : "Board not found"});
        }
        const flag = board.members.includes(req.user._id);
        if(!flag){
            return res.status(400).json({status : "failed", message : "User not a member of this board"});
        }
        return res.status(200).json({status : "success", message : "Board fetched successfully", board});
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"});
    }
}

async function uploadFile(req, res){
    try{
        const board = await boardModel.findById(req.params.id);
        if(!board){
            return res.status(400).json({status : "failed", message : "Board not found"});
        }
        const flag = board.members.includes(req.user._id);
        if(!flag){
            return res.status(400).json({status : "failed", message : "User not a member of this board"});
        }
        let result;
        let imageArray = [];
        if(req.files){
            for(let i=0; i<req.files.sampleFile.length; i++){
                // let file = req.files.sampleFile[i].tempFilePath;
                result = await cloudinary.uploader.upload(req.files.sampleFile[i].tempFilePath, {
                    folder: "teemify",
                });
                imageArray.push({secure_url :result.secure_url, public_id : result.public_id});
            }
        }
        console.log(req.files);
        // let file = req.files.sampleFile;
        // let result = await cloudinary.uploader.upload(file.tempFilePath, {
        //     folder: "teemify",
        // });
        console.log(result);
        let attachment = await Attachment.create({board : req.params.id, user : req.user._id, secure_url : result.secure_url, public_id : result.public_id});
        board.attachments.push(attachment._id);
        await board.save();
        req.user.attachments.push(attachment._id);
        await req.user.save();
        return res.status(200).json({status : "success", message : "File uploaded successfully", imageArray : imageArray, "Name of user" : req.user.name, "Email of user" : req.user.email  });
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"})
    }
}

async function getAttachments(req, res){
    try{
        const board = await boardModel.findById(req.params.id).populate("attachments");
        if(!board){
            return res.status(400).json({status : "failed", message : "Board not found"});
        }
        const flag = board.members.includes(req.user._id);
        if(!flag){
            return res.status(400).json({status : "failed", message : "User not a member of this board"});
        }
        return res.status(200).json({status : "success", message : "Attachments fetched successfully", attachments : board.attachments});
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"})
    }
}


module.exports = {
    createBoard,
    getBoards,
    getBoard,
    updateBoard,
    deleteBoard,
    archiveBoard,
    unarchiveBoard,
    addMember,
    removeMember,
    calendar,
    getAllMembers,
    uploadFile,
    getAttachments

}





