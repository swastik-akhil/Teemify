const User = require("../model/userModel");
const jwt = require("jsonwebtoken");

async function isLoggedIn(req, res, next) {
    try {
        if (req.isAuthenticated()) {
            next();
        }
        
        let token = req.cookies.token;
        if (!token) {
            const headerToken = req.headers.authorization || req.headers.Authorization;
            console.log("header token line 11 ", headerToken);
            if (headerToken && headerToken.startsWith("Bearer ")) {
                token = headerToken.split(" ")[1];
            }
        }

        if (!token) {
            console.log("no token found");
            return res.status(401).json({ errorMessage: "Unauthorized, no token found" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        
        if (!req.user) {
            console.log("line 26 inside req.user")
            return res.status(401).json({ errorMessage: "Unauthorized, no user found" });
        }

        if (!req.user.signupVerification) {
            return res.status(401).json({ errorMessage: "Unauthorized, please verify your email" });
        }

        next();
    } catch (e) {
        console.log(e);
        return res.status(401).json({ errorMessage: "Unauthorized, invalid token" });
    }
}

module.exports = { isLoggedIn };
