const path = require('path');
const fs = require('fs');
require("dotenv").config();

const express = require('express');
const bodyParser = require('body-parser');
const sequelize = require('./config/database');
const multer = require('multer');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const branchRoutes = require('./routes/branch');
const userRoutes = require('./routes/user');
const productRoutes = require('./routes/product');
const saleRoutes = require('./routes/sale');

const app = express();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        let today = new Date();
        cb(null, `${today.toDateString().replace(/ /g,'_')}_${file.originalname}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {
    flags: 'a'
});

app.use(helmet());
app.use(compression());
app.use(morgan('combined',{stream:accessLogStream}));

app.set('port', process.env.PORT);
app.use(bodyParser.json()); // application/json
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(cors({ origin: "*", allowedHeaders: "*", exposedHeaders: "*" }));
/* app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Methods',
        'OPTIONS, GET, POST, PUT, PATCH, DELETE'
    );
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
}); */

app.use('/api', userRoutes);
app.use('/api', branchRoutes);
app.use('/api', productRoutes);
app.use('/api', saleRoutes);
app.use(['/','/api'], (req, res, next)=>{
    return res.status(401).json({
        name: 'STOCK REST API V.01',
        errors: [{
            msg: 'Endpoint no encontrado',
            requirments: 'Necesitas un Token-Authorization para acceder a nuestros recursos'
        }]
    });
});


sequelize.sync({force:(process.env.RESET_DB === "true")})
.then(() => {
    app.listen(app.get('port'), ()=>{
        console.log("Server running on port: ", app.get('port'));
    });
})
.catch(err => console.log(err) );