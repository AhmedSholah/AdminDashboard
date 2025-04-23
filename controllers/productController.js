const axios = require('axios');
const FormData = require('form-data');
const Product = require('../models/Product');

const createProduct = async (req, res) => {
    try {
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'No images uploaded' });
        }

        if (files.length > 4) {
            return res.status(400).json({ message: 'Maximum of 4 images allowed' });
        }

        const uploadedImageUrls = await Promise.all(
            files.map(async (file) => {
                const formData = new FormData();
                formData.append('image', file.buffer.toString('base64'));

                const response = await axios.post(
                    `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
                    formData,
                    { headers: formData.getHeaders() }
                );

                return response.data.data.url;
            })
        );

        const newProduct = new Product({
            ...req.body,
            productImages: uploadedImageUrls,
        });

        await newProduct.save();

        res.status(201).json({ message: 'Product created', product: newProduct });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const updatedData = req.body;

        const existingProduct = await Product.findById(productId);
        if (!existingProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        let updatedImages = [...existingProduct.productImages];

        if (req.files && req.files.length > 0) {
            if (updatedImages.length + req.files.length > 4) {
                return res.status(400).json({ message: 'Maximum of 4 images allowed' });
            }

            const uploadedImageUrls = await Promise.all(
                req.files.map(async (file) => {
                    const formData = new FormData();
                    formData.append('image', file.buffer.toString('base64'));

                    const response = await axios.post(
                        `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
                        formData,
                        { headers: formData.getHeaders() }
                    );

                    return response.data.data.url;
                })
            );

            updatedImages = [...new Set([...updatedImages, ...uploadedImageUrls])];
        }

        if (req.body.productImages) {
            const imagesToKeep = req.body.productImages;
            updatedImages = updatedImages.filter(image => imagesToKeep.includes(image));
        }

        updatedImages = updatedImages.slice(0, 4);

        updatedData.productImages = updatedImages;

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { $set: updatedData },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ message: 'Product updated', product: updatedProduct });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ message: 'Product soft deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


const deleteMultipleProducts = async (req, res) => {
    try {
        const productIds = req.body;

        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ message: 'No product IDs provided' });
        }

        const updatedProducts = await Product.updateMany(
            { _id: { $in: productIds } },
            { isDeleted: true, deletedAt: new Date() }
        );

        if (updatedProducts.nModified === 0) {
            return res.status(404).json({ message: 'No products found for soft deletion' });
        }

        res.status(200).json({ message: 'Products soft deleted', deletedCount: updatedProducts.nModified });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId).where('deleted').ne(true); 

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ product });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().where('deleted').ne(true);

        res.status(200).json({ products });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getPaginatedProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 11;
        const skip = (page - 1) * limit;

        const totalProducts = await Product.countDocuments().where('deleted').ne(true); 
        const totalPages = Math.ceil(totalProducts / limit);

        const products = await Product.find().where('deleted').ne(true)
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            products,
            currentPage: page,
            totalPages,
            totalProducts
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const filterProducts = async (req, res) => {
    try {
        const { productId, name, price, category } = req.query;

        const pipeline = [
            { $match: { deleted: { $ne: true } } } 
        ];

        if (productId) {
            pipeline.push({ $match: { productId } });
        }

        if (price) {
            pipeline.push({ $match: { price: Number(price) } });
        }

        if (category) {
            pipeline.push({ $match: { category } });
        }

        if (name) {
            const cleanedName = name.toLowerCase().replace(/\s+/g, '');
            pipeline.push({
                $addFields: {
                    normalizedName: {
                        $replaceAll: {
                            input: { $toLower: "$name" },
                            find: " ",
                            replacement: ""
                        }
                    }
                }
            });

            pipeline.push({
                $match: {
                    normalizedName: cleanedName
                }
            });
        }

        const products = await Product.aggregate(pipeline);
        res.status(200).json({ products });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const searchByProductName = async (req, res) => {
    try {
        const { name } = req.query;

        if (!name) {
            return res.status(400).json({ message: 'Product name is required' });
        }

        const cleanedName = name.toLowerCase().replace(/\s+/g, '');

        const products = await Product.aggregate([
            { $match: { deleted: { $ne: true } } }, 
            {
                $addFields: {
                    normalizedName: {
                        $replaceAll: {
                            input: { $toLower: "$name" },
                            find: " ",
                            replacement: ""
                        }
                    }
                }
            },
            {
                $match: {
                    normalizedName: cleanedName
                }
            }
        ]);

        res.status(200).json({ products });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = {
    createProduct,
    updateProduct,
    deleteProduct,
    deleteMultipleProducts,
    getProduct,
    getAllProducts,
    getPaginatedProducts,
    filterProducts,
    searchByProductName
};
