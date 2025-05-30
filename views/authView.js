const userExists = (res) =>
    res.status(400).json({ message: "User already exists" });

const registerSuccess = (res) =>
    res.status(201).json({ message: "User registered" });

const invalidCredentials = (res) =>
    res.status(400).json({ message: "Invalid credentials" });

const loginSuccess = (res, token) => res.status(200).json({ token });

const profile = (res, username) =>
    res.status(200).json({ message: `Hello, ${username}!` });

const serverError = (res, err) =>
    res.status(500).json({ message: "Server error", error: err });

module.exports = {
    userExists,
    registerSuccess,
    invalidCredentials,
    loginSuccess,
    profile,
    serverError,
};
