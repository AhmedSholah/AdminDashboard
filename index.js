const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes'); 
const productRoutes =require('./routes/productRoutes')
const { connectDB } = require('./config/db');


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); 

connectDB();

app.use('/api/auth', authRoutes); 

app.use('/api/products', productRoutes); 

// app.use('/api/orders', orderRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
