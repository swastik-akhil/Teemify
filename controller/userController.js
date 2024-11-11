const User = require('../model/userModel');
const cookieToken = require('../utils/cookieToken');
const {mailHelper} = require('../utils/emailHelper');
const listModel = require('../model/listModel');
const cardModel = require('../model/cardModel');
const axios = require('axios');
require("dotenv").config();
const crypto = require("crypto");
const {validName, validateEmail, validatePassword} = require("../utils/regex");
async function signup (req,res){
    try{
        const {name, email, password} = req.body;
        if(!name || !email || !password){
            return res.status(400).json({status : "failed", message : "All fields are required"});
        }
        if(!validName(name)){
            return res.status(400).json({status : "failed", message : "Invalid name, provide a correct name, regex"});
        }
        
        if(!validateEmail(email)){
            return res.status(400).json({status : "failed", message : "Invalid email, provide a correct email"});
        }
        if(!validatePassword(password)){
            return res.status(400).json({status : "failed", message : "Password must be atleast 8 characters long, must contain 1 uppercase, 1 lowercase, 1 number and 1 special character"});
        }
        
        const existingUser = await User.findOne({email});
        if(existingUser && !existingUser.signupVerification){
            return res.status(400).json({status : "failed", message : "user already exists, signup verification pending"});
        }
        if(existingUser && existingUser.signupVerification){
            return res.status(400).json({status : "failed", message : "user already exists"})
        }
        
        const user = await User.create({name, email, password});
        
        const signupToken = await user.generateSignupToken();
        await user.save({validateBeforeSave : false});

        const myUrl = `${req.protocol}://${req.get("host")}/api/user/signup/verifySignup/${signupToken}`;
        
        const message = `We received a request to activate your account. Click the link below to activate it:\n ${myUrl}`;
        const options = {
            email : user.email,
            subject : "Account Activation",
            message
        }

        setTimeout(async () => {
            await User.findOneAndDelete({signupVerification: false });
            console.log("User deleted");
        }, 4 * 60 * 1000); // 4 minutes

        try{
            mailHelper(options)
            return res.status(200).json({status : "success", message : "Email sent successfully"});
        }catch(e){
            clearTimeout();
            console.log(e);
            user.signupToken = undefined;
            user.signupTokenExpire = undefined;
            await User.deleteOne({user});
            await user.save({validateBeforeSave : false});
            return res.status(400).json({status : "failed", message : "Something went wrong while sending email"});
        }
        
        // if(!user){
            // await cookieToken(user,res);
        //     return res.status(400).json({status : "failed", message : "Something went wrong while creating your account"});
        // }

        // await cookieToken(user,res);
        // return res.status(200).json({status : "success", message : "Account created successfully", user});
    }catch(error){
        console.log(error);
    }
}

async function signupVerification(req,res){
    try {
        const signupToken = req.params.signupToken;
        const encyrptedToken = crypto
            .createHash("sha256")
            .update(signupToken)
            .digest("hex");
            const user = await User.findOne({signupToken : encyrptedToken, signupTokenExpire : {$gt : Date.now()}})
            if(!user){
                return res.status(400).json({status : "failed", message : "Invalid token or token expired"});
            }

            user.signupVerification = true;
            user.signupToken = undefined;
            user.signupTokenExpire = undefined;
            await user.save();
            await cookieToken(user,req,res);
            return res.redirect("https://team-project-git-master-dhruv-sharmas-projects-a2e88115.vercel.app/dashboard")
    } catch (error) {
        return res.status(400).json({status : "failed", message : "Something went wrong while signup verification"});
    }
        // return res.status(200).json({status : "success", message : "Account activated successfully"})
}


async function login(req,res){
    try {
        const {email, password} = req.body;
    
        if(!email || !password){
            return res.status(400).json({status : "failed", message : "All fields are required"});
        }
        if(!validateEmail(email)){
            return res.status(400).json({status : "failed", message : "Invalid email, provide a correct email"});
        }

        const user = await User.findOne({email}).select("+password").populate({
            path : "boards",
            populate : {
                path : "lists",
                populate : {
                    path : "cards"
                },
            }
       })
        // console.log(user)
        if(!user){
            return res.status(400).json({status : "failed", message : "Invalid credentials"});
        }
        if(!user.signupVerification){
            return res.status(400).json({status : "failed", message : "Please verify your email"});
        }
        const flag = await user.checkPassword(password);
        // console.log(`flag: ${flag}`)
        if(!flag){
            return res.status(400).json({status : "failed", message : "Email or password does not match"});
        }
        
        await cookieToken(user,req, res);
        
        return res.status(200).json({status : "success", message : "Logged in successfully", user: user});
    }
    catch(err){
        console.log(err);
    }
}

async function logout(req,res){
    if(req.isAuthenticated()){
        req.logout();
        res.status(200).json({succeess : true, message : "logout success"});
    }
    req.logout((err) => console.log(err));
    res.cookie("token", null, {
        expires : new Date(Date.now()),
        httpOnly : true
    })
    res.header('Authorization', null);
    res.status(200).json({succeess : true, message : "logout success"});
}

async function sendResetPasswordEmail(req,res){
    const {email} = req.body;
    if(!email){
        return res.status(400).json({status : "failed", message : "Email is required"});
    }

    const user = await User.findOne({email});
    if(!user){
        return res.status(400).json({status : "failed", message : "No user found with this email"});
    }
    
    if(!user.signupVerification){
        return res.status(400).json({status : "failed", message : "You are not a registered user"});
    }

    const forgotToken = await user.generateForgotPasswordToken();
    await user.save({validateBeforeSave : false});

    const myUrl = `${req.protocol}://${req.get("host")}/api/user/password/loginWithoutPassword/${forgotToken}`;
    const message = `We received a request to reset your password.The OTP is\n ${forgotToken}\nTo login without password click the link below:\n ${myUrl}`;
    const options = {
        email : user.email,
        subject : "Reset Password",
        message
    }

    try{
        mailHelper(options)
        return res.status(200).json({status : "success", message : "Email sent successfully"});
    }catch(e){
        console.log(e);
        user.forgotPasswordToken = undefined;
        user.forgotPasswordExpire = undefined;
        await user.save({validateBeforeSave : false});
        return res.status(400).json({status : "failed", message : "Something went wrong while sending email"});
    }

}

// async function loginWithoutPassword(req,res){
//     const token = req.params.forgotToken;
//     const user = await User.findOne({forgotPasswordToken : token, forgotPasswordExpire : {$gt : Date.now()}});
//     if(!user){
//         return res.status(400).json({status : "failed", message : "Invalid token or token expired"});
//     }
//     if(user && user.signupVerification === false){
//         return res.status(400).json({status : "failed", message : "You are not a registered user"});
//     }
//     await cookieToken(user,res);
//     user.forgotPasswordToken = undefined;
//     user.forgotPasswordExpire = undefined;
//     // await user.save();
//     user.save()
//     .then(() => {
//         // User saved successfully
//     })
//     .catch((error) => {
//         console.error(error);
//     });
//     return res.redirect("https://google.com/");
//     // return res.status(200).json({status : "success", message : "Logged in successfully", user: user});
// }

async function resetPassword(req,res){
    const token = req.body.token;
        
    const user = await User.findOne({forgotPasswordToken : token, forgotPasswordExpire : {$gt : Date.now()}}).select("+password");
    if(!user){
        return res.status(400).json({status : "failed", message : "Invalid token or token expired"});
    }
    if(!validatePassword(req.body.password)){
        return res.status(400).json({status : "failed", message : "Password must be atleast 8 characters long, must contain 1 uppercase, 1 lowercase, 1 number and 1 special character"});
    }
    // const pass = user.password;
    const {password} = req.body;
    const passwordCheck = await user.checkPassword(password);
    if(passwordCheck){
        return res.status(400).json({status : "failed", message : "New password and old password cannot be same"});
    }

    user.password = password;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpire = undefined;
    await user.save();
    
    cookieToken(user,res);

    return res.status(200).json({status : "success", message : "Password reset successfully, you can go ahead"});
    
}

async function updatePassword(req,res){
    const userId = req.user.id
    const user = await User.findById(userId).select("+password")
    const {password, newPassword, confirmPassword} = req.body;
    
    if(!password || !newPassword || !confirmPassword){
        return res.status(400).json({status : "failed", message : "All fields are required"});
    }

    if(!validatePassword(req.body.password) && !validatePassword(req.body.confirmPassword)){
        return res.status(400).json({status : "failed", message : "Password must be atleast 8 characters long, must contain 1 uppercase, 1 lowercase, 1 number and 1 special character"});
    }
    if(req.body.password !== req.body.confirmPassword){
        return res.status(400).json({status : "failed", message : "Password and confirm password does not match"});
    }
    
    if(newPassword !== confirmPassword){
        return res.status(400).json({status : "failed", message : "New password and confirm password does not match"});
    }
    
    if(password === newPassword){
        return res.status(400).json({status : "failed", message : "New password and old password cannot be same"});
    }
    
    const flag = await user.checkPassword(password);
    if(!flag){
        return res.status(400).json({status : "failed", message : "Incorrect Password"});
    }

    user.password = newPassword;
    await user.save();

    const clientIP = req.ip; // Assuming you're using Express, this gets the client's IP address
    const geoLocationApiUrl = `https://ipinfo.io/${clientIP}/json`;
    
    try{    
        const response = await axios.get(geoLocationApiUrl);

        console.log('Geolocation API Response:', response.data);

        if (response.status === 200 && response.data && response.data.city && response.data.region && response.data.country) {
            const locationInfo = `${response.data.city}, ${response.data.region}, ${response.data.country}`;
            message = `Your password has been updated at ${new Date()} from ${locationInfo}. If it's not you, please contact support.`;
        } else {
            message = `Your password has been updated at ${new Date()}. If it's not you, please contact support.`;
        }
        const options = {
            email : user.email,
            subject : "Password Updated",
            message : message
        }
        try {
            mailHelper(options);
        } catch (error) {
            console.log("error while sending mail", error);
        }

    }catch(e){
        console.log("error while fetching location");
        console.log(e);
    }



    return res.status(200).json({status : "success", message : "Password updated successfully"});
}

async function darkMode(req,res){
    const userId = req.user.id;
    const user = await User.findById(userId);
    user.darkMode = !user.darkMode;
    await user.save();
    return res.status(200).json({status : "success", message : "Dark mode updated successfully"});
}

async function addUserDetails(req,res){
    const user = req.user;
    const {skills, experience, totalProjects, language, gender} = req.body;
    user.skills = skills;
    user.experience = experience;
    user.totalProjects = totalProjects;
    user.language = language;
    user.gender = gender;
    await user.save();
    return res.status(200).json({status : "success", message : "User details updated successfully"});
}

async function getUserDetails(req,res){
    const userId = req.params.id;
    const user = await User.findById(userId)
    return res.status(200).json({status : "success", message : "User details fetched successfully", "name" : user.name, "email" : user.email, "skill" : user.skills, "experience" : user.experience, });

}



module.exports = {signup, login, logout, sendResetPasswordEmail, resetPassword, updatePassword, signupVerification, darkMode, addUserDetails, getUserDetails}


// const search = async (req, res,next) => {
//     const query = req.query.q;
//     try {
//         const boards = await Board
//             .aggregate([
//                 {
//                     $search: {
//                         "index": "name",
//                         "text": {
//                           "path": "name",
//                           "query": query,
//                           "fuzzy": {}
//                         }
//                     }
//                 }
//             ])
//             .exec();
//         const lists = await List
//             .aggregate([
//                 {
//                     $search: {
//                         "index": "name",
//                         "text": {
//                           "path": "name",
//                           "query": query,
//                           "fuzzy": {}
//                         }
//                     }
//                 },
                
//             ])
//             .exec();
  
//         const cards = await Card
//             .aggregate([
//                 {
//                     $search: {
//                         "index": "name",
//                         "text": {
//                           "path": "name",
//                           "query": query,
//                           "fuzzy": {}
//                         }
//                     }
//                 },
//             ])
//             .exec();
//         res.json({
//           success : true,
//           data: {
//             boards, lists, cards
//           }
//         });
//     } catch (error) {
//         next(error);
//     }
//   };