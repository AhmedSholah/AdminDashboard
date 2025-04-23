const jwt = require('jsonwebtoken');

const authMiddleware = (requiredRole = null) => {
    return (req, res, next) => {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;

            if (requiredRole && req.user.role !== requiredRole && req.user.role !== 'superadmin') {
                return res.status(403).json({ message: 'Forbidden, insufficient rights' });
            }

            next();
        } catch (err) {
            return res.status(401).json({ message: 'Token is not valid' });
        }
    };
};

module.exports = authMiddleware;
