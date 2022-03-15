"use strict";
const { DataTypes, Model } = require("sequelize");
const sequelize = require('../config/database');

class Sucursal extends Model {
  }
Sucursal.init({
    id:{
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    nombre:{
        type: DataTypes.STRING,
        allowNull: false
    },
    direccion:{
        type: DataTypes.STRING,
        allowNull: false
    },
    telefono:{
        type: DataTypes.STRING,
        allowNull: true
    },
    activa:{
        type: DataTypes.BOOLEAN,
        allowNull: false
    }
}, {
    sequelize,
    timestamps: false,
    tableName: 'sucursales',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
});

module.exports = Sucursal;