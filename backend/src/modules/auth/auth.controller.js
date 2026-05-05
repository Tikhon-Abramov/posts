const authService = require('./auth.service');

async function register(req, res) {
    const result = await authService.register(req.body);

    res.status(201).json(result);
}

async function login(req, res) {
    const result = await authService.login(req.body);

    res.json(result);
}

async function getMe(req, res) {
    const user = await authService.getMe(req.user.id);

    res.json(user);
}

async function changePassword(req, res) {
    const result = await authService.changePassword(req.user.id, req.body);

    res.json(result);
}

module.exports = {
    register,
    login,
    getMe,
    changePassword,
};