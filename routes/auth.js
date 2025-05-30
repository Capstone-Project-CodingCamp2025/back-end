const express = require("express");
const router = express.Router();
const authPresenter = require("../presenters/authPresenter");
const authenticateToken = require("../middleware/auth");

router.post("/register", authPresenter.register);
router.post("/login", authPresenter.login);
router.get("/profile", authenticateToken, authPresenter.profile);

module.exports = router;