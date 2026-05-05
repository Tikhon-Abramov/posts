const usersService = require('./users.service');

async function updateMe(req, res) {
    const user = await usersService.updateMe(req.user.id, req.body);

    res.json(user);
}

async function uploadAvatar(req, res) {
    const result = await usersService.uploadAvatar(req.user.id, req.file);

    res.json(result);
}

module.exports = {
    updateMe,
    uploadAvatar,
};