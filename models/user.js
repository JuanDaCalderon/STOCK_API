"use strict";
const { DataTypes, Model } = require("sequelize");
const sequelize = require('../config/database');
const Sucursales = require('./branch');

class User extends Model {
  }
User.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    sucursal_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cedula: {
        type: DataTypes.STRING,
        allowNull: false
    },
    correo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    celular: {
        type: DataTypes.STRING,
        allowNull: false
    },
    contraseña: {
        type: DataTypes.STRING,
        allowNull: false
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    genero: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cargo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    administrador: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    fecha_nacimiento: {
        type: DataTypes.DATE,
        allowNull: false
    },
    fecha_ingreso: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    fecha_salida: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    sequelize,
    timestamps: false,
    tableName: 'users',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
});

User.belongsTo(Sucursales, {foreignKey: 'sucursal_id'});
Sucursales.hasMany(User,{foreignKey: 'sucursal_id'});
module.exports = User;