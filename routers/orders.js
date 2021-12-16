const express = require('express')
const router = express.Router();
const Order = require('../models/order')
const OrderItem = require('../models/order-item')

router.get('/', async (req, res)=>{
    try{
        const orderList = await Order.find().populate('user', 'name').sort({'dateOrdered': -1}) //{dateOrdered: -1} means from newest to oldest
        if (orderList){
            res.status(200).json(orderList)
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

router.get('/:id', async (req, res)=>{
    try{
        let count = 0;
        const orderList = await Order.findById(req.params.id)
        .populate('user', 'name')
        .populate({path: 'orderItems', populate: 'product'})
        if (orderList){
            res.status(200).json(orderList)
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

router.post('/', async (req,res)=>{
    const orderItemsId = Promise.all(req.body.orderItems.map(async orderItem =>{
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product
        })

        newOrderItem = await newOrderItem.save();

        return newOrderItem._id
    }))

    const orderItemsIdPromise = await orderItemsId

    const totalPrices = await Promise.all(orderItemsIdPromise.map(async orderItemId => {
        const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price')
        const totalPrice = orderItem.product.price * orderItem.quantity
        return totalPrice
    }))

    const totalPrice = totalPrices.reduce(((a,b)=> a+b))

    let order = new Order({
        orderItems: orderItemsIdPromise,
        shippingAddress1: req.body.shippingAddress1,
        shippingAddress2: req.body.shippingAddress2,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user
    })
    const savedOrder= await order.save()
    if (!savedOrder){
        return res.status(400).send('The order cannot be created')
    }
    res.status(201).json(savedOrder)
})

router.put('/:id', async (req,res)=>{
    try{
        const orderUpdate = await Order.findByIdAndUpdate(
            req.params.id,
            {
                status: req.body.status
            },
            {
                new: true //return the update document
            }
        )
        if (orderUpdate){
            res.status(200).json(orderUpdate)
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
        const order = await Order.findById(req.params.id)
        if (order){
            order.orderItems.map(async id => {
                await OrderItem.findByIdAndRemove(id)
            })
        }else{
            return res.status(404).json({
                success: false,
                msg: "Order not found"
            })
        }

        await Order.findByIdAndRemove(req.params.id) //check στο udemy explaining the Solution for then
        res.status(200).json({
            success: true,
            message: 'The order is deleted'
        })
    }catch(err){
        res.status(404).json({
            msg: err,
            success: false
        })
    }
})

router.get('/get/totalsales', async (req,res)=>{
    const totalSales = await Order.aggregate([
        {$group: {_id: null, totalSales : { $sum: '$totalPrice'}}}
    ])

    if(!totalSales){
        return res.status(400).send('The order sales cannot be generated')
    }

    res.send({totalSales: totalSales.pop().totalSales})
})

router.get('/get/count', async (req,res)=>{
    const orderCount = await Order.countDocuments()
    if(!orderCount){
        res.status(500).json({
            success: false
        })
    }
    res.status(201).json({
        orderCount: orderCount
    })
})

router.get('/get/userorders/:userid', async (req,res)=>{
    const userOrderCount = await Order.find({user: req.params.userid}).populate('user', 'name').sort({'dateOrdered': -1})
    if(!userOrderCount){
        res.status(500).json({
            success: false
        })
    }
    res.status(201).json({
        userOrderCount: userOrderCount
    })
})

module.exports = router;