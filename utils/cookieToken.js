require("dotenv").config();
const cookieToken = async (user,req, res,next)=>{
    try{
        if(!user) {
            console.log("user not found");
            return ;
        }
        let token = await user.generateToken();
        // console.log(token)
        const options = {
            expiresIn : new Date(Date.now() + process.env.COOKIE_TIME),
            httpOnly : false
        }
        
        res.setHeader('Authorization', `Bearer ${token}`);

        user.password = undefined;
        user.token = token;
        // console.log("cookieToken", token);
        return res.cookie("token", token, options);

        // next()
    }catch(e){
        console.log(e);
    }
}

module.exports = cookieToken;
