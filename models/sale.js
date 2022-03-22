"use strict";
const { DataTypes, Model, Sequelize } = require("sequelize");
const sequelize = require('../config/database');
const Productos = require('./product');
const Sucursales = require('./branch');
const Users = require('./user');

class ventaProducto extends Model {
  }
ventaProducto.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    venta_producto_ref_key: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    producto_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cantidad:{
        type: DataTypes.INTEGER,
        allowNull: false
    },
    precio_vendido: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    sequelize,
    timestamps: false,
    tableName: 'ventaproductos',
    indexes: [{
        name: 'fk_venta_producto_ref',
        unique: false,
        fields: ['venta_producto_ref_key']
    }],
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
});

ventaProducto.belongsTo(Productos, {foreignKey: 'producto_id'});
Productos.hasMany(ventaProducto,{foreignKey: 'producto_id'});

class ventasTotal extends Model {
}
ventasTotal.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    venta_producto_ref: {
        type: DataTypes.STRING,
        allowNull: false
    },
    sucursal_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    fecha: {
        type: DataTypes.DATE,
        allowNull: false
    },
    forma_pago: {
        type: DataTypes.STRING,
        allowNull: false
    },
    nombre_cliente: {
        type: DataTypes.STRING,
        allowNull: false
    },
    correo_cliente: {
        type: DataTypes.STRING,
        allowNull: false
    },
    total: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    sequelize,
    timestamps: false,
    tableName: 'ventastotal',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
});

ventasTotal.belongsTo(Users, {foreignKey: 'user_id'});
Users.hasMany(ventasTotal,{foreignKey: 'user_id'});

ventasTotal.belongsTo(Sucursales, {foreignKey: 'sucursal_id'});
Sucursales.hasMany(ventasTotal,{foreignKey: 'sucursal_id'});

ventasTotal.belongsTo(ventaProducto, {foreignKey: 'venta_producto_ref', targetKey: 'venta_producto_ref_key'});
ventaProducto.hasMany(ventasTotal,{foreignKey: 'venta_producto_ref', targetKey: 'venta_producto_ref_key'});

module.exports = {ventaProducto, ventasTotal};