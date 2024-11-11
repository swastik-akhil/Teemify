const express = require("express");
const router = express.Router();
const{createList,
    getLists,
    updateList,
    deleteList,
    toggleArchiveList,
    moveList,
    copyList} = require("../controller/listController");
const { isLoggedIn } = require("../middleware/userMiddleware");

router.route("/createList").post(isLoggedIn, createList);
router.route("/getLists/:id").get(isLoggedIn, getLists);
router.route("/updateList/:id").post(isLoggedIn, updateList);
router.route("/deleteList/:id").delete(isLoggedIn, deleteList);
router.route("/toggleArchiveList/:id").post(isLoggedIn, toggleArchiveList);
router.route("/moveList/:id").post(isLoggedIn, moveList);
router.route("/copyList/:id").post(isLoggedIn, copyList);



















module.exports = router;
