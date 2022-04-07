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
    const fileSize = parseInt(req.headers['content-length']);
    if (fileSize > 2097152) { // 2 Mb
        cb(null, false);
    }
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

app.set('port', process.env.PORT || 9000);
app.use(bodyParser.json()); // application/json
app.use(
    multer({
        storage: fileStorage,
        limits: {
            fileSize: 2097152, // 2 Mb
        },
        fileFilter: fileFilter
    }).single('image')
);
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(cors({ origin: "*", allowedHeaders: "*", exposedHeaders: "*" }));

app.use('/api', userRoutes);
app.use('/api', branchRoutes);
app.use('/api', productRoutes);
app.use('/api', saleRoutes);
app.use(['/','/api'], (req, res, next)=>{
    const error = new Error('STOCK REST API V.01');
    error.statusCode = 401;
    error.data = 'Necesitas autorización para acceder a nuestros recursos';
    throw error;
});
app.use((error, req, res, next) => {
    const status = error.statusCode || 500;
    const message = error.message || 'Error intentando traer el recurso';
    const data = error.data || null;
    res.status(status).json({
        errors: [{
            data: data,
            message: message
        }]
    });
});

sequelize.sync({force:(process.env.RESET_DB === "true") || false})
.then(() => {
    app.listen(app.get('port'), ()=>{
        console.log("Server running on port: ", app.get('port'));
    });
})
.catch(err => console.log(err));