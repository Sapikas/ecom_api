const express = require('express')
const router = express.Router();
const User = require('../models/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

router.get('/', async (req, res)=>{
    try{
        const userList = await User.find().select('-passwordHash')
        if (userList){
            res.status(200).json(userList)
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
        const user = await User.findById(req.params.id).select('-passwordHash')
        if (!user){
            res.status(404).json({
                success: false,
                msg: "There are't user"
            })
        }else{
            res.status(200).json(user)
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
        let user = new User({
            name: req.body.name,
            email: req.body.email,
            passwordHash: bcrypt.hashSync(req.body.passwordHash,10),
            phone: req.body.phone,
            isAdmin: req.body.isAdmin,
            apartment: req.body.apartment,
            zip: req.body.zip,
            city: req.body.city,
            country: req.body.country
        })
        const savedUser = await user.save()
        res.status(201).json(savedUser)
    }catch(err){
        res.status(404).json({
            msg: err,
            success: false
        })
    }
})

router.put('/:id', async (req,res)=>{
    try{
        const userFind = await User.findById(req.params.id)
        const userUpdate = await User.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name ? req.body.name : userFind.name,
                email: req.body.email ? req.body.email : userFind.email,
                passwordHash: req.body.passwordHash ? bcrypt.hashSync(req.body.passwordHash,10) : userFind.passwordHash,
                phone: req.body.phone ? req.body.phone : userFind.phone,
                isAdmin: req.body.isAdmin ? req.body.isAdmin : userFind.isAdmin,
                street: req.body.street ? req.body.street : userFind.street,
                apartment: req.body.apartment ? req.body.apartment : userFind.apartment,
                zip: req.body.zip ? req.body.zip : userFind.zip,
                city: req.body.city ? req.body.city : userFind.city,
                country: req.body.country ? req.body.country : userFind.country
            },
            {
                new: true //return the update document
            }
        )
        if (userUpdate){
            res.status(200).json(userUpdate)
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

router.delete('/:id', async(req,res)=>{
    try{
        const userDelete = await User.findByIdAndRemove(req.params.id)
        if (userDelete){
            res.status(200).json({
                success: true,
                message: 'The usery is deleted'
            })
        }else{
            res.status(404).json({
                success: false,
                msg: "User not found"
            })
        }
    }catch(err){
        res.status(404).json({
            msg: err,
            success: false
        })
    }
})

router.post('/login', async (req,res)=>{
    const user = await User.findOne({email: req.body.email})
    const secret = process.env.secret
    if (!user){
        return res.status(400).send('The user not found')
    }

    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)){
        const token = jwt.sign(
            //payload
            {
                userId: user.id,
                isAdmin: user.isAdmin
            }, //end payload
            secret,
            {expiresIn: '1d'}
            )
        res.status(200).json({token: token})
    }else{
        res.status(400).send('Password is wrong')
    }
})

router.post('/register', async (req,res)=>{
    const login = await User.find({email: req.body.email})
    if (login.length != 0){
        return res.status(400).send('The email already exists')
    }

    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.passwordHash,10),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country
    })

    const savedUser = await user.save()
    
    if (!savedUser){
        return res.status(400).send('the user cannot be created!')
    }

    res.send(savedUser)
})

router.get('/get/count', async (req,res)=>{
    const userCount = await User.countDocuments()
    if(!userCount){
        res.status(500).json({
            success: false
        })
    }
    res.status(201).json({
        userCount: userCount
    })
})

module.exports = router;