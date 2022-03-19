/* Dotenv to bring them back all enviroment variables defined in .env */
require("dotenv").config();
/* Express functionality requirements */
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

/* My routes Requirments */
const branchRoutes = require('./routes/branch');
const userRoutes = require('./routes/user');
const productRoutes = require('./routes/product');
const saleRoutes = require('./routes/sale');

/* Sequelize Requirments */
const sequelize = require('./config/database');

/* Initialize Express */
const app = express();

/* Express Config headers (Port in use, content type of the response and request, json body parser, cors config to all origins) */
app.set('port', process.env.PORT);
app.set('content-type', 'application/json');
app.use(bodyParser.json());
app.use(cors({ origin: "*" }));

/* Middlewares with my routes to define all endpoints */
app.use('/api', userRoutes);
app.use('/api', branchRoutes);
app.use('/api', productRoutes);
app.use('/api', saleRoutes);

/* We run the server once the data base has been created */
sequelize.sync({force:(process.env.RESET_DB === "true")})
.then(() => {
    app.listen(app.get('port'), ()=>{
        console.log("Server running on port: ", app.get('port'));
    });
})
.catch(err => {
    console.log(err);
});




