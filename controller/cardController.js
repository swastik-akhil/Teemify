const boardModel = require('../model/boardModel');
const listModel = require('../model/listModel'); 
const cardModel = require('../model/cardModel');
const User = require('../model/userModel');
const {mailHelper} = require('../utils/emailHelper');
require("dotenv").config();

async function createCard(req,res){
    try{
        const {name, description, boardId, listId, position, daysAlloted} = req.body;
        if(!name || !boardId || !listId || !position){
            return res.status(400).json({status : "failed", message : "All fields are required"});
        }
        const board = await boardModel.findById(boardId);
        if(!board){
            return res.status(400).json({status : "failed", message : "Board not found"});
        }
        const list = await listModel.findById(listId);
        // const list = await req.user.board.lists.find(list => list._id.toString() === listId.toString());         //TODO: check if this works
        if(!list){
            return res.status(400).json({status : "failed", message : "List not found"});
        }
        if(board.lists.includes(listId) === false){
            return res.status(400).json({status : "failed", message : "This list does not belongs to the board provided"});
        }
        // const flag = await board.lists.find(listId => listId === list._id.toString());
        // console.log(flag);
        // if(!flag){
        //     return res.status(400).json({status : "failed", message : "List is not present in the board"});
        // }
        if(board.members.includes(req.user._id) === false){
            return res.status(400).json({status : "failed", message : "User not a member of this board"});
        }
        if(daysAlloted){
            if(daysAlloted <= 0){
                return res.status(400).json({status : "failed", message : "Days alloted cannot be negative or zero"});
            }
            if(typeof daysAlloted !== "number"){
                return res.status(400).json({status : "failed", message : "Days alloted should be a number"});
            }
            const card = await cardModel.create({name, description, board : boardId, list : listId, position, daysAlloted});
            board.cards.push(card._id);
            list.cards.push(card._id);
            await list.save({validateBeforeSave : false});
            return res.status(200).json({status : "success", message : "Card created successfully", card});
        }
        const card = await cardModel.create({name, description, board : boardId, list : listId, position});
        board.cards.push(card._id);
        list.cards.push(card._id);
        await list.save({validateBeforeSave : false});
        return res.status(200).json({status : "success", message : "Card created successfully", card});
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"});
    }
}

async function getCards(req,res){
    try{
        const list = await listModel.findById(req.params.id).populate("cards");
        if(!list){
            return res.status(400).json({status : "failed", message : "List not found"});
        }
        return res.status(200).json({status : "success", message : "Cards fetched successfully", cards : list.cards});
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"});
    }
}

async function updateCard(req,res){
    try{
        const {name, description, position} = req.body;
        // if(!name || !position){
        //     return res.status(400).json({status : "failed", message : "All fields are required"});
        // }
        const card = await cardModel.findById(req.params.id);
        if(!card){
            return res.status(400).json({status : "failed", message : "Card not found"});
        }
        const board = await boardModel.findById(card.board);
        if(!board){
            return res.status(400).json({status : "failed", message : "Board not found"});
        }
        if(board.members.includes(req.user._id) === false){
            return res.status(400).json({status : "failed", message : "User not a member of this board"});
        }
        if(name) card.name = name;
        if(description) card.description = description;
        if(position) card.position = position;
        await card.save({validateBeforeSave : false});
        return res.status(200).json({status : "success", message : "Card updated successfully", card});
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"});
    }
}

async function deleteCard(req,res){
    try{
        const card = await cardModel.findById(req.params.id);
        if(!card){
            return res.status(400).json({status : "failed", message : "Card not found"});
        }
        const list = await listModel.findById(card.list);
        if(!list){
            return res.status(400).json({status : "failed", message : "List not found"});
        }
        list.cards = list.cards.filter(cardId => cardId.toString() !== card._id.toString());
        await list.save({validateBeforeSave : false});
        await cardModel.findByIdAndDelete(req.params.id);
        return res.status(200).json({status : "success", message : "Card deleted successfully"});
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"});
    }
}

async function moveCard(req,res){
    try{
        const {listId, position} = req.body;
        if(!listId || !position){
            return res.status(400).json({status : "failed", message : "All fields are required"});
        }
        const card = await cardModel.findById(req.params.id);
        if(!card){
            return res.status(400).json({status : "failed", message : "Card not found"});
        }
        const list = await listModel.findById(listId);
        if(!list){
            return res.status(400).json({status : "failed", message : "List not found"});
        }
        const oldList = await listModel.findById(card.list);
        if(!oldList){
            return res.status(400).json({status : "failed", message : "List not found"});
        }
        if(listId.toString() === oldList._id.toString()){
            list.cards = list.cards.filter(cardId => cardId.toString() !== card._id.toString());
            list.cards.splice(position,0,card._id);
            await list.save({validateBeforeSave : false});
            return res.status(200).json({status : "success", message : "Card moved successfully", list});
        }else{
            oldList.cards = oldList.cards.filter(cardId => cardId.toString() !== card._id.toString());
            list.cards.splice(position,0,card._id);
            await oldList.save({validateBeforeSave : false});
            await list.save({validateBeforeSave : false});
            return res.status(200).json({status : "success", message : "Card moved successfully", list});
        }
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"});   
    }
}

async function copyCard(req,res){
    try{
        const {listId, position} = req.body;
        if(!listId || !position){
            return res.status(400).json({status : "failed", message : "All fields are required"});
        }
        const card = await cardModel.findById(req.params.id);
        if(!card){
            return res.status(400).json({status : "failed", message : "Card not found"});
        }
        const list = await listModel.findById(listId);
        if(!list){
            return res.status(400).json({status : "failed", message : "List not found"});
        }
        const newCard = await cardModel.create({name : card.name, description : card.description, list : listId, board : card.board, position});
        list.cards.splice(position,0,newCard._id);
        await list.save({validateBeforeSave : false});
        return res.status(200).json({status : "success", message : "Card copied successfully", list});
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"});   
    }
}

async function addMember(req,res){
    try{
        const {email} = req.body;
        if(!email) return res.status(400).json({status : "failed", message : "All fields are required"});
        const userId = await User.findOne({email : email});
        if(!userId){
            return res.status(400).json({status : "failed", message : "User not found"});
        }
        const card = await cardModel.findById(req.params.id);
        if(!card){
            return res.status(400).json({status : "failed", message : "Card not found"});
        }
        const user = await User.findById(userId);
        if(!user){
            return res.status(400).json({status : "failed", message : "User not found"});
        }
        const board = await boardModel.findById(card.board);
        if(board.owner._id.toString() !== req.user._id.toString()){
            return res.status(400).json({status : "failed", message : "Only owner can add or assign members to the card"});
        }
        let flag = true;
        if(board.members.includes(userId) === false){
            board.members.push(userId);
            await board.save({validateBeforeSave : false});
            flag = false;
        }
        card.members.push(userId);
        await card.save({validateBeforeSave : false});
        if(flag) flag = `of the board ${board.name} `; 
        else flag = "";
        const message = `You have been added to the card ${card.name} ${flag}by ${req.user.name}`;
        const options = {
            email : user.email,
            subject : "Added to card",
            message
        }
        try{
            mailHelper(options)
            return res.status(200).json({status : "success", message : "Email sent successfully"});
        }catch(e){
            console.log(e);
            return res.status(400).json({status : "failed", message : "Something went wrong while sending email"});
        }

        // return res.status(200).json({status : "success", message : "Member added successfully", card});   
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"});       
    }
}

async function removeMember(req,res){
    try{
        const {email} = req.body;
        if(!email) return res.status(400).json({status : "failed", message : "All fields are required"});
        const userId = await User.findOne({email : email})
        if(!userId){
            return res.status(400).json({status : "failed", message : "No user Found"});
        }
        const card = await cardModel.findById(req.params.id);
        if(!card){
            return res.status(400).json({status : "failed", message : "Card not found"});
        }
        const board = await boardModel.findById(card.board);
        if(board.owner._id.toString() !== req.user._id.toString()){
            return res.status(400).json({status : "failed", message : "Only owner can remove members from the card"});
        }
        card.members = card.members.filter(member => member.toString() !== userId.toString());
        await card.save({validateBeforeSave : false});
        return res.status(200).json({status : "success", message : "Member removed successfully", card});   
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"});       
    }
}

async function addDueDate(req,res){
    try{
        const {daysAlloted} = req.body;
        if(!daysAlloted){
            return res.status(400).json({status : "failed", message : "All fields are required"});
        }
        if(typeof daysAlloted !== "number"){
            return res.status(400).json({status : "failed", message : "Days alloted should be a number"});
        }
        if(daysAlloted <= 0){
            return res.status(400).json({status : "failed", message : "Days alloted cannot be negative or zero"});
        }
        const card = await cardModel.findById(req.params.id);
        if(!card){
            return res.status(400).json({status : "failed", message : "Card not found"});   
        }
        const board = await boardModel.findById(card.board._id);
        if(board.members.includes(req.user._id) === false){
            return res.status(400).json({status : "failed", message : "User not a member of this board"});
        }
        card.daysAlloted = daysAlloted;
        await card.save({validateBeforeSave : false});
        return res.status(200).json({status : "success", message : "Due date added successfully", card});   
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"});       
    }
}

async function removeDueDate(req,res){
    try{
        const card = await cardModel.findById(req.params.id);
        if(!card){
            return res.status(400).json({status : "failed", message : "Card not found"});   
        }
        const board = await boardModel.findById(card.board._id);
        if(board.members.includes(req.user._id) === false){
            return res.status(400).json({status : "failed", message : "User not a member of this board"});
        }
        card.daysAlloted = undefined;
        await card.save({validateBeforeSave : false});
        return res.status(200).json({status : "success", message : "Due date removed successfully", card});   
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"});       
    }
}

async function toggleMarkCardComplete(req,res){
    try {
        const card = await cardModel.findById(req.params.id);
        if(!card){
            return res.status(400).json({status : "failed", message : "Card not found"});   
        }
        const board = await boardModel.findById(card.board._id);
        if(board.members.includes(req.user._id) === false){
            return res.status(400).json({status : "failed", message : "User not a member of this board"});
        }
        card.isCompleted = !card.isCompleted;
        await card.save({validateBeforeSave : false});
        const cardStatus = card.isCompleted ? "completed" : "incomplete";
        return res.status(200).json({status : "success", message : cardStatus, card});
    } catch (e) {
        console.log(e)
    }
}

async function toggleArchiveCard(req,res){
    try{
        const card = await cardModel.findById(req.params.id);
        if(!card){
            return res.status(400).json({status : "failed", message : "Card not found"});
        }
        const board = await boardModel.findById(card.board._id);
        if(board.members.includes(req.user._id) === false){
            return res.status(400).json({status : "failed", message : "User not a member of this board"});
        }
        card.isArchived = !card.isArchived;
        await card.save({validateBeforeSave : false});
        const cardStatus = card.isArchived ? "archived" : "unarchived";
        return res.status(200).json({status : "success", message : cardStatus, card});
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"});   
    }
}

module.exports = {
    createCard,
    getCards,
    updateCard,
    deleteCard,
    moveCard,
    copyCard,
    addMember,
    removeMember,
    addDueDate,
    removeDueDate,
    toggleMarkCardComplete,
    toggleArchiveCard
}


