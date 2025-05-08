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
        const user = await User.findOne({ email, isDeleted: false });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '90d' }
        );

        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;

        res.status(200).json({
            message: 'Login successful',
            token,
            user: userWithoutPassword
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user.userId, isDeleted: false }).select('-password');
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
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isDeleted = true;
        user.deletedAt = new Date();
        await user.save();

        res.status(200).json({ message: 'User deleted (soft) successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ isDeleted: false }).select('-password');
        res.status(200).json({ users });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const addUserByAdmin = async (req, res) => {
    const { confirmPassword, ...userData } = req.body;

    const { error } = validateUser(req.body, true);
    if (error) {
        const errorMessages = error.details.map(err => err.message);
        return res.status(400).json({ errors: errorMessages });
    }

    try {
        const existingUser = await User.findOne({
            $or: [
                { email: userData.email },
                { username: userData.username }
            ]
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User with this email or username already exists' });
        }

        const newUser = new User(userData);
        await newUser.save();

        const userWithoutPassword = newUser.toObject();
        delete userWithoutPassword.password;

        res.status(201).json({
            message: 'User added successfully',
            user: userWithoutPassword
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const editUser = async (req, res) => {
    const { role, isActive } = req.body;
    const userId = req.params.id;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (role) user.role = role;
        if (isActive !== undefined) user.isActive = isActive;

        await user.save();

        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;

        res.status(200).json({
            message: 'User updated successfully',
            user: userWithoutPassword
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
const getAllUsersPagination = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    try {
        const users = await User.find({ isDeleted: false })
            .select('-password')
            .skip(skip)
            .limit(limit);

        const totalUsers = await User.countDocuments({ isDeleted: false });
        const totalPages = Math.ceil(totalUsers / limit);

        res.status(200).json({
            users,
            currentPage: page,
            totalPages,
            totalUsers
        });
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
    addUserByAdmin,
    editUser,
    getAllUsersPagination

};
