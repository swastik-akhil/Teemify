const boardModel = require('../model/boardModel');
const listModel = require('../model/listModel'); 
const User = require('../model/userModel');
const Card = require('../model/cardModel');
require("dotenv").config();

async function createList(req,res){
    try{
        const {name, boardId, position} = req.body;
        if(!name || !boardId || !position){
            return res.status(400).json({status : "failed", message : "All fields are required"});
        }
        if(position < 0){
            return res.status(400).json({status : "failed", message : "Position cannot be negative"});
        }
        const board = await boardModel.findById(boardId);
        if(!board){
            return res.status(400).json({status : "failed", message : "Board not found"});
        }
        if(req.user.boards.includes(boardId) === false){
            return res.status(400).json({status : "failed", message : "User not a member of this board"});
        }
        const list = await listModel.create({name, board : boardId, position});
        board.lists.push(list._id);
        await board.save({validateBeforeSave : false});
        return res.status(200).json({status : "success", message : "List created successfully", list});
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"});
    }
}

async function getLists(req,res){
    try{
        const board = await boardModel.findById(req.params.id).populate({
                path: 'lists',
                model: 'List',  
                populate: {
                path: 'cards',
                model: 'Card'  
            }
        });
        if(!board){
            return res.status(400).json({status : "failed", message : "Board not found"});
        }
        if(board.members.includes(req.user._id) === false){
            return res.status(400).json({status : "failed", message : "User not a member of this board"});
        }
        return res.status(200).json({status : "success", message : "Lists fetched successfully", lists : board.lists});
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"});
    }
}


async function updateList(req,res){
    try{
        const {name, position} = req.body;
        // if(!name || !position){
        //     return res.status(400).json({status : "failed", message : "All fields are required"});
        // }
        const list = await listModel.findById(req.params.id);
        if(!list){
            return res.status(400).json({status : "failed", message : "List not found"});
        }
        if(name) list.name = name;
        if(position) list.position = position;
        await list.save({validateBeforeSave : false});
        return res.status(200).json({status : "success", message : "List updated successfully", list});
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"});
    }
}

async function deleteList(req,res){
    try{
        const list = await listModel.findById(req.params.id);
        if(!list){
            return res.status(400).json({status : "failed", message : "List not found"});
        }
        const board = await boardModel.findById(list.board);
        if(!board){
            return res.status(400).json({status : "failed", message : "Board not found"});
        }
        if(board.members.includes(req.user._id) === false){
            return res.status(400).json({status : "failed", message : "User not a member of this board"});
        }
        board.lists = board.lists.filter((listId) => listId.toString() !== list._id.toString());
        await board.save({validateBeforeSave : false});
        await Card.findByIdAndDelete(list._id);
        // const cards = await Card.find({list : req.params.id});
        // for(let i=0;i<cards.length;i++){
        //     await Card.findByIdAndDelete(cards[i]._id);
        // }

        return res.status(200).json({status : "success", message : "List deleted successfully"});
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"});
    }
}

async function toggleArchiveList(req,res){
    try{
        const list = await listModel.findById(req.params.id);
        if(!list){
            return res.status(400).json({status : "failed", message : "List not found"});
        }
        const board = await boardModel.findById(list.board);
        list.archived = !list.archived;
        await list.save({validateBeforeSave : false});
        return res.status(200).json({status : "success", message : "List archived successfully", list});
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"});
    }
}

async function moveList(req,res){
    try{
        const {sourceIndex, destinationIndex} = req.body;
        if(sourceIndex === destinationIndex){
            return res.status(400).json({status : "failed", message : "Source and destination cannot be same"});
        }
        const board = await boardModel.findById(req.params.id);
        if(!board){
            return res.status(400).json({status : "failed", message : "Board not found"});
        }
        const list = board.lists[sourceIndex];
        board.lists.splice(sourceIndex,1);
        board.lists.splice(destinationIndex,0,list);
        await board.save({validateBeforeSave : false});
        return res.status(200).json({status : "success", message : "List moved successfully", board});
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"});
    }    
}

async function copyList(req,res){
    try{
        const {sourceIndex, destinationIndex} = req.body;
        if(sourceIndex === destinationIndex){
            return res.status(400).json({status : "failed", message : "Source and destination cannot be same"});
        }
        const board = await boardModel.findById(req.params.id).populate("lists");
        if(!board){
            return res.status(400).json({status : "failed", message : "Board not found"});
        }
        const list = board.lists[sourceIndex];
        const newList = await listModel.create({name : list.name, board : list.board, position : destinationIndex});
        board.lists.splice(destinationIndex,0,newList);
        await board.save({validateBeforeSave : false});
        return res.status(200).json({status : "success", message : "List copied successfully", board});
    }catch(e){
        console.log(e);
        return res.status(400).json({status : "failed", message : "Something went wrong"});
    }    
}







module.exports = {
    createList,
    getLists,
    updateList,
    deleteList,
    toggleArchiveList,
    moveList,
    copyList
}