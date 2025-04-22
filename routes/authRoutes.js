const express = require('express');
const { registerUser,
    loginUser,
    getMe,
    logoutUser,
    deleteUser,
    getAllUsers } = require('../controllers/authController');


const authMiddleware = require('../middleware/authMiddlewar');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/me', authMiddleware(), getMe); 
router.post('/logout', authMiddleware(), logoutUser); 
router.delete('/users/:id', authMiddleware('superadmin'), deleteUser); 
router.get('/users', authMiddleware(), getAllUsers); 

module.exports = router;
