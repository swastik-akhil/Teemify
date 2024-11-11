const express = require("express");
const router = express.Router();
const {createCard, getCards, updateCard, deleteCard, moveCard, copyCard, addMember, removeMember, addDueDate, toggleMarkCardComplete, toggleArchiveCard} = require("../controller/cardController");
const { isLoggedIn } = require("../middleware/userMiddleware");

router.route("/createCard").post(isLoggedIn, createCard);
router.route("/getCards/:id").get(isLoggedIn, getCards);
router.route("/updateCard/:id").post(isLoggedIn, updateCard); 
router.route("/deleteCard/:id").delete(isLoggedIn, deleteCard);
// router.route("/toggleArchiveCard/:id").get(isLoggedIn, toggleArchiveCard); 
router.route("/moveCard/:id").post(isLoggedIn, moveCard);               //needs card Id in params
router.route("/copyCard/:id").post(isLoggedIn, copyCard);               //needs card Id in params
router.route("/addMember/:id").post(isLoggedIn, addMember);             //needs card Id in params
router.route("/removeMember/:id").post(isLoggedIn, removeMember);       //needs card Id in params
router.route("/addDueDate/:id").post(isLoggedIn, addDueDate);          //needs card Id in params
router.route("/toggleMarkCardComplete/:id").get(isLoggedIn, toggleMarkCardComplete);     //needs card Id in params
router.route("/toggleArchiveCard/:id").get(isLoggedIn, toggleArchiveCard);     //needs card Id in params
















module.exports = router;
