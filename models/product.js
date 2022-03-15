"use strict";
const { DataTypes, Model } = require("sequelize");
const sequelize = require('../config/database');
const Sucursales = require('./branch');

class Producto extends Model {
  }
Producto.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    marca: {
        type: DataTypes.STRING,
        allowNull: false
    },
    talla: {
        type: DataTypes.STRING,
        allowNull: false
    },
    categoria: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sucursal_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    referencia: {
        type: DataTypes.STRING,
        allowNull: false
    },
    precio_minimo: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    disponible: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    }
}, {
    sequelize,
    timestamps: false,
    tableName: 'productos',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
});

Producto.belongsTo(Sucursales, {foreignKey: 'sucursal_id'});
Sucursales.hasMany(Producto,{foreignKey: 'sucursal_id'});
module.exports = Producto;