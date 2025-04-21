const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Joi = require('joi');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username can\'t be longer than 30 characters'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        match: [/\S+@\S+\.\S+/, 'Please use a valid email address'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
    },
    role: {
        type: String,
        enum: ['admin', 'superadmin'],
        default: 'admin',
    },

    avatar: {
        type: String,
        default: "https://i.ibb.co/TVstPXp/default-Image.jpg"
    },
}, { timestamps: true });


userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10); 
    next();
});

const User = mongoose.model('User', userSchema);

const validateUser = (user) => {
    const schema = Joi.object({
        username: Joi.string()
            .min(3).max(30)
            .required().messages({
                'string.base': 'Username must be a string',
                'string.empty': 'Username cannot be empty',
                'string.min': 'Username must be at least 3 characters long',
                'string.max': 'Username cannot be longer than 30 characters',
                'any.required': 'Username is required',
            }),
        
        email: Joi.string()
            .email().required()
            .messages({
                'string.base': 'Email must be a string',
                'string.empty': 'Email cannot be empty',
                'string.email': 'Please provide a valid email address',
                'any.required': 'Email is required',
            }),

        password: Joi.string()
            .min(8).max(20)
            .pattern(/^(?=.*[a-z])/, 'lowercase')
            .pattern(/^(?=.*[A-Z])/, 'uppercase')
            .pattern(/^(?=.*\d)/, 'number')
            .pattern(/^(?=.*[@$!%*?&])/, 'special character')
            .required()
            .messages({
                'string.base': 'Password must be a string',
                'string.empty': 'Password cannot be empty',
                'string.min': 'Password must be at least 8 characters long',
                'string.max': 'Password cannot be longer than 20 characters',
                'string.pattern.name': 'Password must include at least one {#name}',
                'any.required': 'Password is required',
            }),

        confirmPassword: Joi.any()
            .valid(Joi.ref('password'))
            .required()
            .messages({
                'any.only': 'Confirm password does not match password',
                'any.required': 'Confirm password is required',
            }),

        role: Joi.string()
            .valid('admin', 'superadmin')
            .default('admin')
            .messages({
                'string.base': 'Role must be a string',
                'any.only': 'Role must be either admin or superadmin',
            }),
    });

    return schema.validate(user, { abortEarly: false });
};

module.exports = { User, validateUser };
