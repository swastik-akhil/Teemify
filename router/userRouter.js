const express = require("express");
const router = express.Router();
const {signup, signupVerification, login, logout, sendResetPasswordEmail,resetPassword, updatePassword, darkMode, addUserDetails, getUserDetails} = require("../controller/userController");
const {isLoggedIn} = require("../middleware/userMiddleware");
const paymentStatus = require("../middleware/paymentStatus");
const passport = require("../config/passportConfig");
const {checkout, paymentVerification} = require("../controller/paymentController");

router.route("/signup/")
    .post(signup);

router.route("/signup/verifySignup/:signupToken/")
    .get(signupVerification);

router.route("/login/")
    .post(login);

router.route("/logout/")
    .get(logout)

router.route("/password/resetEmail/")
    .post(sendResetPasswordEmail)                   //send reset password OTP store it into db and then 

router.route("/password/resetPassword/")
    .post(resetPassword)

// router.route("/password/loginWithoutPassword/:forgotToken")
//     .get(loginWithoutPassword)


router.route("/password/updatePassword/")
    .post(isLoggedIn, updatePassword)

router.route("/darkMode/")
    .get(isLoggedIn, darkMode)

router.route("/addUserDetails/")
    .post(isLoggedIn, addUserDetails)

router.route("/getUserDetails/:id")
    .get(isLoggedIn, getUserDetails)

router.get("/googleOAuth", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/googleOAuth/callback", passport.authenticate("google", {failureRedirect: "/",}), 
async (req, res, next) => {
        console.log("inside callback, success");
        const newUser = req.user;
        let token = await newUser.generateToken();
        const options = {
            expiresIn : new Date(Date.now() + process.env.COOKIE_TIME),
            httpOnly : false
        }
        res.setHeader('Authorization', `Bearer ${token}`);

        newUser.password = undefined;
        newUser.token = token;
        res.cookie("token", token, options);
        res.redirect("https://team-project1-b2j1-dhruv-sharmas-projects-a2e88115.vercel.app/dashboard");
        next();
    });
// payments
router.post("/createOrder/", isLoggedIn, paymentStatus.notCompleted ,checkout)
router.post("/checkPayment/", isLoggedIn, paymentVerification)


// router.route("/sendIndividualMessage/:id")
//     .post(isLoggedIn, sendIndividualMessage)


module.exports = router;