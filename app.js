const express = require('express');
const app = express();
require('dotenv/config')
const PORT = process.env.PORT || 3000
const api = process.env.API_URL
const morgan = require('morgan')
const mongoose = require('mongoose')
const productsRouter = require('./routers/products')
const cors = require('cors')
const categoryRouter = require('./routers/categories')
const userRouter = require('./routers/users');
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler')
const orderRouter = require('./routers/orders')

app.use(cors())
app.options('*', cors())

//middleware
app.use(express.json());
app.use(morgan('tiny')) //the ms in console
app.use(authJwt())
app.use('/public/uploads', express.static(__dirname + '/public/uploads'))
app.use(errorHandler)

//Routers
app.use(`${api}/products`, productsRouter)
app.use(`${api}/categories`, categoryRouter)
app.use(`${api}/users`, userRouter)
app.use(`${api}/orders`, orderRouter)

app.get('/', (req,res)=>{
    res.send('Hello World')
})

mongoose.connect(process.env.DB_CONNECTION)
.then(()=>{
    console.log('DB CONNECTED');
})
.catch((err)=>{
    console.log(err);
})

app.listen(3000, ()=>{
    console.log(`server is listening on port ${PORT}`);
})