# STOCK APP

## Descripción 🚀

_Sistema de inventarios para comerciantes_

Mira **Despliegue** para conocer como desplegar el proyecto.

## Instalación 🔑

* Clona este repositorio en tú máquina local

git clone https://github.com/JuanDaCalderon/STOCK_API.git

_Para instalar las dependencias con node_

* **npm install** - nos genera la carpeta node-modules con las dependencias descritas en el *package.json* instaladas

## Requerimientos 🚀

- node.js v16.14.0
- npm 8.3.1
- mysql (Server, Workbench)

### Base de datos 🔠

* Crear una nueva base de datos

**CREATE DATABASE IF NOT EXISTS stock DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;** ⬅️


## Despliegue 📦

- Desde la carpeta raíz

Create the .env file and add configs

**Cambia las variables de entorno si es necesario** ⤵️

```
NODE_ENV=development

PORT=9000

SENDGRID_API_KEY=********************

DB_HOST=localhost
DB_USERNAME=root
DB_PASSWORD="000000"
DB_NAME=stock

RESET_PASSWORD_URL= ********************
RESET_DB = false
PRIVATE_KEY = ********************

AWS_REGION = ********************
AWS_ACCESS_KEY = ********************
AWS_SECRET_KEY = ********************
AWS_BUCKET = ********************
```

# Correr la aplicación 🏃

**npm start**
*It will run on http://localhost:9000/*

## Construido con 🛠️

* [Javascript](https://developer.mozilla.org/es/docs/Web/JavaScript) - Lenguaje de programación
* [Node](https://nodejs.org/es/) - Manejador de dependencias y motor del servidor
* [Mysql](https://www.mysql.com/) - Base de datos
* [Mocha, Chai, Sinon](https://mochajs.org/)(https://www.chaijs.com/)(https://sinonjs.org/) - Testing (Unitarios y de integración)

## Versionado 📌

V1.0.0

## Autores ✒️

* **Juan David Calderón Jiménez** - - (https://github.com/JuanDaCalderon)

## Gratitud 🎁
---
⌨️ con ❤️ por [JuanDaCalderon](https://github.com/JuanDaCalderon) 😊
