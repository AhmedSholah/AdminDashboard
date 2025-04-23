const { User, validateUser } = require('../models/User');
const jwt = require('jsonwebtoken');

const registerUser = async (req, res) => {
    const { error } = validateUser(req.body);
    if (error) {
        const errorMessages = error.details.map(err => err.message);
        return res.status(400).json({ errors: errorMessages });
    }

    try {
        const user = new User(req.body);
        await user.save();

       
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '90d' }
        );

    
        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;

        res.status(201).json({
            message: 'User registered successfully',
            user: userWithoutPassword,
            token
        });
    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            let message = '';

            if (field === 'email') {
                message = 'Email already exists';
            } else if (field === 'username') {
                message = 'Username already exists';
            } else {
                message = `${field} already exists`;
            }

            return res.status(400).json({ message });
        }

        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '90d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token, 
            user,
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });

       
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '90d' }
        );

        res.status(200).json({ user, token });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const logoutUser = (req, res) => {
   
    res.status(200).json({ message: 'Logout successful' });
};

const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        await User.findByIdAndDelete(userId);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({ users });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    logoutUser,
    deleteUser,
    getAllUsers,
};
