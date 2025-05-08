const express = require('express');
const { registerUser,
    loginUser,
    getMe,
    logoutUser,
    deleteUser,
    getAllUsers,addUserByAdmin,editUser,getAllUsersPagination} = require('../controllers/authController');


const authMiddleware = require('../middleware/authMiddlewar');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/me', authMiddleware(), getMe); 
router.post('/logout', authMiddleware(), logoutUser); 
router.delete('/users/:id', authMiddleware('superadmin'), deleteUser); 

router.get('/users', authMiddleware(), getAllUsersPagination); 
router.get('/users', authMiddleware(), getAllUsers); 
router.post('/add-user', authMiddleware('superadmin'), addUserByAdmin);

router.patch('/users/:id', authMiddleware('superadmin'), editUser);



module.exports = router;



