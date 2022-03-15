require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const branchRoutes = require('./routes/branch');
const userRoutes = require('./routes/user');
const productRoutes = require('./routes/product');
const saleRoutes = require('./routes/sale');
const sequelize = require('./config/database');

const app = express();
app.set('port', process.env.PORT);
app.set('content-type', 'application/json');
app.use(bodyParser.json());
app.use(cors({ origin: "*" }));

app.use(userRoutes);
app.use(branchRoutes);
app.use(productRoutes);
app.use(saleRoutes);

sequelize.sync()
.then(() => {
    app.listen(app.get('port'), ()=>{
        console.log("Server running on port: ", app.get('port'));
    });
})
.catch(err => {
    console.log(err);
});




