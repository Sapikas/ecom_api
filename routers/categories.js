const express = require('express')
const router = express.Router();
const Category = require('../models/category')

router.get('/', async (req, res)=>{
    try{
        const categoryList = await Category.find()
        if (categoryList){
            res.status(200).json(categoryList)
        }else{
            res.status(500).json({success: false})
        }
    }catch(err){
        res.status(500).json({
            msg: err,
            success: false
        })
    }
})

router.get('/:id', async (req,res)=>{
    try{
        const category = await Category.findById(req.params.id)
        if (!category){
            res.status(404).json({
                success: false,
                msg: "There isn't this category"
            })
        }else{
            res.status(200).json(category)
        }
    }catch(err){
        res.status(404).json({
            msg: err,
            success: false
        })
    }
})

router.post('/', async (req,res)=>{
    try{
        let category = new Category({
            name: req.body.name,
            icon: req.body.icon,
            color: req.body.color
        })
        const savedCategory = await category.save()
        res.status(201).json(savedCategory)
    }catch(err){
        res.status(404).json({
            msg: err,
            success: false
        })
    }
})

router.put('/:id', async (req,res)=>{
    try{
        const categoryUpdate = await Category.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                icon: req.body.icon,
                color: req.body.color
            },
            {
                new: true //return the update document
            }
        )
        if (categoryUpdate){
            res.status(200).json(categoryUpdate)
        }else{
            res.status(404).json({
                success: false,
                msg: "Wrong ID"
            })
        }
    }catch(err){
        res.status(404).json({
            msg: err,
            success: false
        })
    }
})

//api/v1/dsada
router.delete('/:id', async(req,res)=>{
    try{
        const categoryDelete = await Category.findByIdAndRemove(req.params.id)
        if (categoryDelete){
            res.status(200).json({
                success: true,
                message: 'The category is deleted'
            })
        }else{
            res.status(404).json({
                success: false,
                msg: "Category not found"
            })
        }
    }catch(err){
        res.status(404).json({
            msg: err,
            success: false
        })
    }
})

module.exports = router;