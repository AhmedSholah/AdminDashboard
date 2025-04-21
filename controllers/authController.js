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
        res.status(201).json({ message: 'User registered successfully', user });

    } catch (err) {
        if (err.code === 11000) {
            // الحقل المكرر موجود هنا
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
            { expiresIn: '90 day' }
        );

        res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { registerUser, loginUser };
