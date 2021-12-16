const express = require('express');
const router = express.Router();
const Product = require('../models/product')
const Category = require('../models/category')
const mongoose = require('mongoose');
const multer = require('multer')

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype]
        let uploadError = new Error('invalid img type')
        if (isValid){
            uploadError = null
        }
      cb(uploadError, 'public/uploads')
    },
    filename: function (req, file, cb) {
      const fileName = file.originalname.replace(' ', '-')
      const extension = FILE_TYPE_MAP[file.mimetype]
      cb(null, `${fileName}-${Date.now()}.${extension}`)
    }
  })
  
  const uploadOptions = multer({ storage: storage })

router.get('/', async (req,res)=>{
    //localhost:3000/api/v1/products?categories=2345,2134554
    let filter = {}
    if (req.query.categories){
        filter = {category: req.query.categories.split(',')}
    }
    try{
        const products = await Product.find(filter)//.select('name image -_id') //με το select επιλέγουμε ποια στοιχεια του json θελουν να εμφανίζονται
        res.status(201).json(products)
    }catch(err){
        res.status(500).json({
            msg: err,
            success: false
        })
    }
})

router.get('/:id', async (req,res)=>{
    try{
        const product = await Product.findById(req.params.id).populate('category') // με το populate βλεπουμε τα details
        if (!product){
            return res.status(500).json({success:false})
        }
        res.status(201).json(product)
    }catch(err){
        res.status(404).json({
            msg: err,
            success: false
        })
    }
})

router.put('/:id', uploadOptions.single('image'), async (req,res)=>{
    if (!mongoose.isValidObjectId(req.params.id)){
        return res.status(400).send('Invalid Product ID')
    } //εαν το id ειναι μεγαλυρεο ή μικροτερο απο τα απαραιτητητα ψηφια , αντι για try catch δλδ

    try{
        const category = await Category.findById(req.body.category)
        if (!category) return res.status(400).send('Invalid Category')
    }catch(err){
        return res.status(404).json({
            msg: err,
            success: false
        })
    }

    const product = await Product.findById(req.params.id)

    const file = req.file;
    let imagepath;

    if (file){
        const fileName = req.file.filename //π.χ image-2322323
        const basePath = `${req.protocol}://${req.get('host')}/public/upload/` //req.protocol = http:// , req.get('host') = localhost:3000
        imagepath = `${basePath}${fileName}`
    }else{
        imagepath = product.image
    }

    const productUpdate = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: imagepath,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured
        },
        {
            new: true //return the update document
        }
    )
    if(!productUpdate){
        return res.status(500).send('The product cannot be updated')
    }
    res.send(productUpdate)
})

router.post('/', uploadOptions.single('image'), async (req,res)=>{
    try{
        const category = await Category.findById(req.body.category)
        if (!category) return res.status(400).send('Invalid Category')
    }catch(err){
        return res.status(404).json({
            msg: err,
            success: false
        })
    }
    const file = req.file
    if (!file){
        return res.status(400).send('No img in the req')
    }
    const fileName = req.file.filename //π.χ image-2322323
    const basePath = `${req.protocol}://${req.get('host')}/public/upload/` //req.protocol = http:// , req.get('host') = localhost:3000
    try{
        const product = new Product({
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: `${basePath}${fileName}`,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured
        })
        const saveProduct = await product.save()
        if (!product){
            return res.status(500).send('The product cannot be created')
        }
        res.status(201).json(saveProduct)
    }catch(err){
        res.status(500).json({
            msg: err,
            success: false
        })
    }
})

router.delete('/:id', async (req,res)=>{
    try{
        const product = await Product.findByIdAndDelete(req.params.id) 
        if (!product){
            return res.status(500).json({success:false})
        }
        res.status(201).json(product)
    }catch(err){
        res.status(404).json({
            msg: err,
            success: false
        })
    }
})

router.get('/get/count', async (req,res)=>{
    const productCount = await Product.countDocuments()
    if(!productCount){
        res.status(500).json({
            success: false
        })
    }
    res.status(201).json({
        productCount: productCount
    })
})

router.get('/get/featured/:count', async (req,res)=>{
    const count = req.params.count ? req.params.count : 0
    const productFeatured= await Product.find({isFeatured: true}).limit(+count)

    if(!productFeatured){
        res.status(500).json({
            success: false
        })
    }
    res.status(200).json(productFeatured)
})

router.put('/gallery-images/:id', uploadOptions.array('images', 10), async (req,res)=>{
    if (!mongoose.isValidObjectId(req.params.id)){
        return res.status(400).send('Invalid Product ID')
    } 
    const files = req.files
    let imagesPaths = []
    const basePath = `${req.protocol}://${req.get('host')}/public/upload/`
    if (files){
        files.map(file => {
            imagesPaths.push(`${basePath}${file.fileName}`)
        })
    }

    const productUpdate = await Product.findByIdAndUpdate(
        req.params.id,
        {
            images: imagesPaths
        },
        {
            new: true //return the update document
        }
    )
    if (!productUpdate){
        return res.status(500).send('The product cannot be updated')
    }
    res.send(productUpdate)
})

module.exports = router;