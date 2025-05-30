const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const authView = require("../views/authView");

const register = (req, res) => {
    const { username, password } = req.body;

    userModel.findUserByUsername(username, async (err, users) => {
        if (users.length > 0) return authView.userExists(res);

        const hashed = await bcrypt.hash(password, 10);
        userModel.createUser(username, hashed, (err) => {
            if (err) return authView.serverError(res, err);
            return authView.registerSuccess(res);
        });
    });
};

const login = (req, res) => {
    const { username, password } = req.body;

    userModel.findUserByUsername(username, async (err, users) => {
        if (err || users.length === 0) return authView.invalidCredentials(res);

        const valid = await bcrypt.compare(password, users[0].password);
        if (!valid) return authView.invalidCredentials(res);

        const token = jwt.sign({ id: users[0].id, username }, process.env.JWT_SECRET, { expiresIn: "1h" });
        return authView.loginSuccess(res, token);
    });
};

const profile = (req, res) => {
    return authView.profile(res, req.user.username);
};

module.exports = { register, login, profile };
