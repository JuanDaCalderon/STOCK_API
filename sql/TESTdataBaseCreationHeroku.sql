#<----------------- CREAR LA BASE DE DATOS DE TESTEO CON SUS RESPECTIVAS TABLAS Y RELACIONES ---------->
#CREATE DATABASE IF NOT EXISTS stockTest DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE heroku_7f71592ced2d98b;
CREATE TABLE IF NOT EXISTS sucursales(
	id INT NOT NULL auto_increment,
    nombre VARCHAR(255) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    telefono VARCHAR(255),
    imagen VARCHAR(255),
    activa TINYINT(1) NOT NULL,
    PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS users(
	id INT NOT NULL auto_increment,
    sucursal_id INT NOT NULL,
    cedula VARCHAR(255) NOT NULL,
    correo VARCHAR(255) NOT NULL,
    celular VARCHAR(255) NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    genero VARCHAR(1),
    cargo VARCHAR(255) NOT NULL,
    imagen VARCHAR(255),
    administrador TINYINT(1) NOT NULL,
    activo TINYINT(1) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    fecha_ingreso DATE NOT NULL,
    fecha_salida DATETIME,
    reset_token VARCHAR(255),
    reset_token_expiration DATETIME,
    PRIMARY KEY (id),
    CONSTRAINT fk_sucursal_id
    FOREIGN KEY (sucursal_id)
    REFERENCES sucursales(id)
);
CREATE TABLE IF NOT EXISTS productos(
	id INT NOT NULL auto_increment,
    nombre VARCHAR(255) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    cantidad INT NOT NULL,
    marca VARCHAR(255) NOT NULL,
    talla VARCHAR(255) NOT NULL,
    categoria VARCHAR(255),
    sucursal_id INT NOT NULL,
    referencia VARCHAR(255) NOT NULL,
    precio_minimo BIGINT NOT NULL,
    disponible TINYINT(1) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_sucursal_id_producto
    FOREIGN KEY (sucursal_id)
    REFERENCES sucursales(id)
);
CREATE TABLE IF NOT EXISTS ventaProductos(
	id INT NOT NULL auto_increment,
    venta_producto_ref_key VARCHAR(255) NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_vendido VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT fk_producto_id
    FOREIGN KEY (producto_id)
    REFERENCES productos(id)
);
ALTER TABLE ventaproductos ADD INDEX fk_venta_producto_ref (venta_producto_ref_key);
CREATE TABLE IF NOT EXISTS ventasTotal(
	id INT NOT NULL auto_increment,
    user_id INT NOT NULL,
    venta_producto_ref VARCHAR(255) NOT NULL,
    sucursal_id INT NOT NULL,
    fecha DATETIME NOT NULL,
    forma_pago VARCHAR(255) NOT NULL,
    nombre_cliente VARCHAR(255) NOT NULL,
    correo_cliente VARCHAR(255) NOT NULL,
    total VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT fk_user_id_ventaproducto
    FOREIGN KEY (user_id)
    REFERENCES users(id),
    CONSTRAINT fk_sucursal_id_venta
    FOREIGN KEY (sucursal_id)
    REFERENCES sucursales(id)
);
ALTER TABLE ventastotal ADD INDEX fk_venta_total_producto_ref (venta_producto_ref);
ALTER TABLE ventastotal ADD CONSTRAINT fk_venta_producto_ref FOREIGN KEY (venta_producto_ref) REFERENCES ventaproductos(venta_producto_ref_key) ON DELETE RESTRICT ON UPDATE RESTRICT;
#<----------------- /CREAR LA BASE DE DATOS CON SUS RESPECTIVAS TABLAS Y RELACIONES ---------->
#<----------------- INSERTA REGISTROS DE PRUEBA A LAS TABLAS ---------->
#INSERT INTO sucursales (nombre, direccion, telefono, activa) VALUES
#('Cedritos', 'Calle 120 con Boyaca', '2650275', TRUE),
#('Kennedy', 'Calle 78 con Av Primera de Mayo', '7596345', TRUE);
#INSERT INTO users (sucursal_id, cedula, correo, celular, contraseña, nombre, genero, cargo, administrador, activo, fecha_nacimiento, fecha_ingreso, fecha_salida) VALUES 
#(1,'1030695338', 'juandacalji@gmail.com', '3124066540', '123456', 'Juan Calderon', 'M', 'Vendedor', TRUE, TRUE, '1999-03-30', '2022-03-02', NULL),
#(2,'245475632', 'user02@gmail.com', '314657895', '123456', 'Pepito Perez', 'M', 'Administrador', TRUE, TRUE, '1998-05-12', '2021-12-18', NULL),
#(1,'7894564445', 'user03@gmail.com', '3168597841', '123456', 'Maria Garcia', 'F', 'Vendedor', FALSE, TRUE, '1999-09-01', '2021-11-13', NULL);
#INSERT INTO productos (nombre, descripcion, cantidad, marca, talla, categoria, sucursal_id, referencia, precio_minimo, disponible) VALUES
#('Camiseta blanca', 'Camiseta blanca manga corta', '5', 'Polo', 'M', 'Camiseta', 1, '231', '60000', TRUE),
#('Camiseta negra', 'Camiseta negra manga corta', '4', 'Polo', 'S', 'Camiseta', 2, '230', '50000', TRUE);
#INSERT INTO ventaproductos (venta_producto_ref_key, producto_id, precio_vendido) VALUES
#(1, 1, '70000'), (1, 1, '75000'), (1, 2, '65000'), (2, 2, '66000'), (2, 1, '55000');
#INSERT INTO ventastotal (user_id, venta_producto_ref, sucursal_id, fecha, forma_pago, nombre_cliente, correo_cliente, total) VALUES
#(1, 1, 1, '2022-03-04', 'Nequi', 'Jorge', 'jorge@gmail.com', '147000'),
#(3, 2, 2, '2022-03-03', 'Efectivo', 'Maria', 'maria@gmail.com', '121000');
#<----------------- /INSERTA REGISTROS DE PRUEBA A LAS TABLAS ---------->