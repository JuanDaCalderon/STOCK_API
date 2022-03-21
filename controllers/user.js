/* User model requirement */
const User = require('../models/user');
const Branch = require('../models/branch');
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const validator = require('validator');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.getUsers = async (req, res, next) => {
  const currentPage = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 1;
  const users = await User.findAndCountAll({
      attributes: {
          exclude: ['contraseña', 'sucursal_id', 'reset_token', 'reset_token_expiration']
      },
      include: Branch,
      offset: (currentPage - 1) * perPage,
      limit: perPage
  });
  let totalUsers = users.count;
  const lastPage= Math.ceil(totalUsers/perPage);
  if (users == null || users == undefined || users.length <= 0) {
    return res.status(404).json({
      errors: [{
        value: users,
        msg: 'No hay usuarios en la base de datos'
      }]
    });
  }
  else {
    return res.status(200).json({
      msg: 'Usuarios adquiridos correctamente',
      total: totalUsers,
      current_page: currentPage,
      per_page: perPage,
      last_page: lastPage,
      has_next_page: perPage * currentPage < totalUsers,
      has_previous_page: currentPage > 1,
      next_page: (currentPage >= lastPage) ? null : currentPage + 1,
      previous_page: (currentPage <= 1) ? null : currentPage - 1,
      from: (currentPage == 1) ? 1 : ((currentPage - 1) * perPage) + 1,
      to: (currentPage == 1) ? perPage : (currentPage == lastPage) ? totalUsers : ((currentPage - 1) * perPage) + perPage,
      value: users.rows
    });
  }
}

exports.getUser = async (req, res, next) => {
  const userId = req.params.userId;
  const user = await User.findByPk(userId, {
    attributes: {
      exclude: ['contraseña', 'sucursal_id', 'reset_token', 'reset_token_expiration']
    },
    include: Branch
  });
  if (user) {
    return res.status(200).json({
      msg: 'Usuario adquirido correctamente',
      value: user
    });
  }
  else {
    return res.status(404).json({
      errors: [{
        value: user,
        msg: 'No coincide ningun usuario con este id'
      }]
    });
  }
}

exports.createUser = async (req, res, next) => {
  const {nombre, cedula, telefono, email, genero, cargo, sucursal, fechaNacimiento, admin} = req.body;
  const errors = validationResult(req);
  /* If validators */
  if (!Object.keys(req.body).length || Object.keys(req.body).length < 9) {
    return res.status(422).json({
      errors:[{
        value: Object.keys(req.body).length,
        msg: 'El cuerpo de la peticion no debe estar vacio y debe ser enviados todos los campos',
        location: "body"
      }]
    });
  }
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array()
    });
  }
  /* it will create the user */
  let hashPassword = await bcrypt.hash("000000", 10);
  const userData = {
    sucursal_id: sucursal,
    cedula: cedula.toLowerCase(),
    correo: email.toLowerCase(),
    celular: telefono.toLowerCase(),
    contraseña: hashPassword,
    nombre: nombre.toLowerCase(),
    genero: genero.toLowerCase(),
    cargo: cargo.toLowerCase(),
    administrador: admin,
    activo: true,
    fecha_nacimiento: fechaNacimiento,
    fecha_salida: null
  }
  const users = await User.findAll();
  const branch = await Branch.findAll();
  if (users == null || users == undefined || users.length <= 0) {
      if (branch == null || branch == undefined || branch.length <= 0) {
          await Branch.create({
              nombre: "cambiame".toLowerCase(),
              direccion: "cambiame".toLowerCase(),
              telefono: "1234567".toLowerCase(),
              activa: true
          });
      }
      const response = await User.create(userData);
      const recentUser = await User.findByPk(response.id, {
          attributes: {
            exclude: ['contraseña', 'sucursal_id', 'reset_token', 'reset_token_expiration']
          },
          include: Branch
      });
      return res.status(201).json({
        msg: 'usuario creado satisfactoriamente (La contraseña debe ser cambiada por el usuario)',
        value: recentUser
      });
  } else {
      const response = await User.create(userData);
      const recentUser = await User.findByPk(response.id, {
          attributes: {
            exclude: ['contraseña', 'sucursal_id', 'reset_token', 'reset_token_expiration']
          },
          include: Branch
      });
      return res.status(201).json({
        msg: 'usuario creado satisfactoriamente (La contraseña debe ser cambiada por el usuario)',
        value: recentUser,
      });
  }
}

exports.authUser = async (req, res, next) => {
  const {email, password} = req.body;
  const errors = validationResult(req);
  if (!Object.keys(req.body).length || Object.keys(req.body).length < 2) {
    return res.status(422).json({
      errors:[{
        value: Object.keys(req.body).length,
        msg: 'El cuerpo de la peticion no debe estar vacio y debe ser enviados todos los campos (Email y Contraseña)',
        location: "body"
      }]
    });
  }
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array()
    });
  }
  const user = await User.findOne({
      where: {
          correo: email.toLowerCase()
      },
      include: Branch
  });
  if (user) {
    if (password) {
      let authFlag = await bcrypt.compare(password, user.contraseña);
      if (authFlag) {
        const token = jwt.sign({
            email: user.email,
            id: user.id
          },
          process.env.PRIVATE_KEY, {
            expiresIn: '12h'
          }
        );
        let objResponse = {
            ...user.dataValues
        };
        delete objResponse.contraseña;
        delete objResponse.sucursal_id;
        delete objResponse.reset_token;
        delete objResponse.reset_token_expiration;
        return res.status(200).json({
          msg: "Inicio de sesión exitoso",
          token: token,
          value: objResponse
        });
      }
      else {
          return res.status(403).json({
            errors:[{
              value: user.correo,
              msg: 'Contraseña incorrecta, intente de nuevo'
            }]
          });
      }
    } else {
        return res.status(422).json({
          errors:[{
            value: user.correo,
            msg: 'La contraseña esta siendo recibida como undefined o null'
          }]
        });
    }
  } else {
    return res.status(404).json({
      errors:[{
        value: user,
        msg: 'No existe ningún usuario registrado en la base de datos con este correo'
      }]
    });
  }
}

exports.resetUser = (req, res, next) => {
  const { email } = req.query;
  const errors = validationResult(req);
  if (!email) {
    return res.status(422).json({
      errors:[{
        value: email,
        msg: 'El email del usuario no ha sido adquirido como query param (Probablemente este vacio)',
        param: 'email',
        location: "query"
      }]
    });
  }
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array()
    });
  }
  let ResetUrl = process.env.RESET_PASSWORD_URL;
  let hoy = new Date();
  let desface = Math.abs((hoy.getTimezoneOffset())/-60) * 3600000;
  crypto.randomBytes(32, async (error, buffer) => {
    const token = buffer.toString('hex');
    const user = await User.findOne({where:{correo: email.toLowerCase()}});
    user.reset_token = token;
    user.reset_token_expiration = (Date.now() - desface) + 3600000;
    const userExp = await user.save();
    if (userExp) {
      const msg = {
        to: email,
        from: 'stock.app.platform@gmail.com', // Use the email address or domain you verified
        subject: '¿Olvidaste tu contraseña?',
        text: 'Recupera tu contraseña de STOCK',
        html: `
        <!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
        <head>
          <!--[if gte mso 9]>
            <xml>
              <o:OfficeDocumentSettings>
                <o:AllowPNG/>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          <![endif]-->
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="x-apple-disable-message-reformatting">
          <!--[if !mso]><!-->
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <!--<![endif]-->
          <style type="text/css">
            @media only screen and (min-width: 620px) {
              .u-row {
                width: 600px !important;
              }
              .u-row .u-col {
                vertical-align: top;
              }
              .u-row .u-col-100 {
                width: 600px !important;
              }
            }
            @media (max-width: 620px) {
              .u-row-container {
                max-width: 100% !important;
                padding-left: 0px !important;
                padding-right: 0px !important;
              }
              .u-row .u-col {
                min-width: 320px !important;
                max-width: 100% !important;
                display: block !important;
              }
              .u-row {
                width: calc(100% - 40px) !important;
              }
              .u-col {
                width: 100% !important;
              }
              .u-col>div {
                margin: 0 auto;
              }
            }
            body {
              margin: 0;
              padding: 0;
            }
            table,
            tr,
            td {
              vertical-align: top;
              border-collapse: collapse;
            }
            p {
              margin: 0;
            }
            .ie-container table,
            .mso-container table {
              table-layout: fixed;
            }
            * {
              line-height: inherit;
            }
            a[x-apple-data-detectors='true'] {
              color: inherit !important;
              text-decoration: none !important;
            }
            table,
            td {
              color: #000000;
            }
            a {
              color: #ffffff !important;
              text-decoration: none;
            }
            @media (max-width: 480px) {
              #u_content_image_1 .v-container-padding-padding {
                padding: 25px 10px 10px !important;
              }
              #u_content_image_1 .v-src-width {
                width: auto !important;
              }
              #u_content_image_1 .v-src-max-width {
                max-width: 32% !important;
              }
              #u_content_image_1 .v-text-align {
                text-align: center !important;
              }
              #u_content_heading_2 .v-container-padding-padding {
                padding: 50px 40px 30px !important;
              }
              #u_content_heading_2 .v-font-size {
                font-size: 58px !important;
              }
              #u_content_image_2 .v-container-padding-padding {
                padding: 10px 10px 30px !important;
              }
              #u_content_image_2 .v-src-width {
                width: 100% !important;
              }
              #u_content_image_2 .v-src-max-width {
                max-width: 100% !important;
              }
              #u_content_text_1 .v-container-padding-padding {
                padding: 40px 15px 70px 20px !important;
              }
              #u_content_heading_3 .v-container-padding-padding {
                padding: 50px 15px 20px !important;
              }
              #u_content_heading_3 .v-font-size {
                font-size: 16px !important;
              }
            }
          </style>
          <!--[if !mso]><!-->
          <link href="https://fonts.googleapis.com/css?family=Montserrat:400,700&display=swap" rel="stylesheet" type="text/css">
          <!--<![endif]-->
        </head>
        <body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #f6f6f6;color: #000000">
          <!--[if IE]><div class="ie-container"><![endif]-->
          <!--[if mso]><div class="mso-container"><![endif]-->
          <table style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #f6f6f6;width:100%" cellpadding="0" cellspacing="0">
            <tbody>
              <tr style="vertical-align: top">
                <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                  <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #f6f6f6;"><![endif]-->
                  <div class="u-row-container" style="padding: 0px;background-color: transparent">
                    <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                      <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                        <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
                        <!--[if (mso)|(IE)]><td align="center" width="600" style="background-color: #ffffff;width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                        <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                          <div style="background-color: #ffffff;width: 100% !important;">
                            <!--[if (!mso)&(!IE)]><!-->
                            <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                              <!--<![endif]-->
                              <table id="u_content_image_1" style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                <tbody>
                                  <tr>
                                    <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:22px 10px 20px 50px;font-family:arial,helvetica,sans-serif;" align="left">
                                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                        <tr>
                                          <td class="v-text-align" style="padding-right: 0px;padding-left: 0px;" align="center">
                                            <a href="https://unlayer.com" target="_blank">
                                              <img align="center" border="0" src="https://i.ibb.co/Lg6G12w/image-1.png"
                                                alt="Logo" title="Logo"
                                                style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 20%;max-width: 108px;"
                                                width="108" class="v-src-width v-src-max-width" />
                                            </a>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <!--[if (!mso)&(!IE)]><!-->
                            </div>
                            <!--<![endif]-->
                          </div>
                        </div>
                        <!--[if (mso)|(IE)]></td><![endif]-->
                        <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                      </div>
                    </div>
                  </div>
                  <div class="u-row-container" style="padding: 0px;background-color: transparent">
                    <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                      <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                        <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
                        <!--[if (mso)|(IE)]><td align="center" width="600" style="background-color: #ffffff;width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                        <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                          <div style="background-color: #ffffff;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                            <!--[if (!mso)&(!IE)]><!-->
                            <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                              <!--<![endif]-->
                              <table id="u_content_heading_2" style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                <tbody>
                                  <tr>
                                    <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:50px 40px 10px;font-family:arial,helvetica,sans-serif;" align="left">
                                      <h1 class="v-text-align v-font-size" style="margin: 0px; color: #2f3448; line-height: 120%; text-align: center; word-wrap: break-word; font-weight: normal; font-family: 'Montserrat',sans-serif; font-size: 36px;">
                                        <strong>RECUPERA TU CONTRASE&Ntilde;A!</strong>
                                      </h1>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <table id="u_content_image_2" style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                <tbody>
                                  <tr>
                                    <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
                                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                        <tr>
                                          <td class="v-text-align" style="padding-right: 0px;padding-left: 0px;" align="center">
                                            <img align="center" border="0" src="https://i.ibb.co/vqFzKx6/email-Image.png"
                                              alt="Hero Image" title="Hero Image"
                                              style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 70%;max-width: 406px;"
                                              width="406" class="v-src-width v-src-max-width" />
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <!--[if (!mso)&(!IE)]><!-->
                            </div>
                            <!--<![endif]-->
                          </div>
                        </div>
                        <!--[if (mso)|(IE)]></td><![endif]-->
                        <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                      </div>
                    </div>
                  </div>
                  <div class="u-row-container" style="padding: 0px;background-color: transparent">
                    <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                      <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                        <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
                        <!--[if (mso)|(IE)]><td align="center" width="600" style="background-color: #ffffff;width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                        <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                          <div style="background-color: #ffffff;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                            <!--[if (!mso)&(!IE)]><!-->
                            <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                              <!--<![endif]-->
                              <table id="u_content_text_1" style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                <tbody>
                                  <tr>
                                    <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:40px 55px;font-family:arial,helvetica,sans-serif;" align="left">
                                      <div class="v-text-align" style="color: #536475; line-height: 180%; text-align: left; word-wrap: break-word;">
                                        <p style="line-height: 180%; font-size: 14px; text-align: justify;">
                                          <strong>
                                            <span style="font-size: 18px; line-height: 32.4px; font-family: Montserrat, sans-serif;">
                                              FECHA: ${hoy.getFullYear()}${" / "}${hoy.getMonth()+1}${" / "}${hoy.getDate()}
                                              <br>
                                              HORA ACTUAL: ${hoy.getHours()}${" : "}${hoy.getMinutes()}${" : "}${hoy.getSeconds()} ${(hoy.getHours()<=12)?': AM':': PM'}
                                            </span>
                                          </strong><br />
                                          <strong>
                                            <span style="font-size: 20px; line-height: 36px; font-family: Montserrat, sans-serif;">
                                              ${userExp.nombre.toUpperCase()}
                                            </span>
                                          </strong><br />
                                          <span style="font-family: Montserrat, sans-serif; font-size: 14px; line-height: 25.2px;">
                                            <span style="font-size: 16px; line-height: 28.8px;">Hemos recibido una solicitud de
                                              cambio de contrase&ntilde;a a este correo, por favor ingresa en el siguiente
                                              enlace para generar una nueva:
                                            </span>
                                            </span></p>
                                        <p style="line-height: 180%; font-size: 14px; text-align: right;">
                                          <span style="font-size: 12px; line-height: 21.6px;"><em>
                                              <span style="font-family: Montserrat, sans-serif; line-height: 21.6px; font-size: 12px;">
                                                <span style="line-height: 21.6px; font-size: 12px;">Recuerda que el link expira en
                                                  una hora.
                                                </span>
                                              </span></em>
                                          </span>
                                        </p>
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                <tbody>
                                  <tr>
                                    <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:20px 10px 30px;font-family:arial,helvetica,sans-serif;" align="left">
                                      <div class="v-text-align" align="center">
                                        <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-spacing: 0; border-collapse: collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;font-family:arial,helvetica,sans-serif;"><tr><td class="v-text-align" style="font-family:arial,helvetica,sans-serif;" align="center"><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="http://localhost:9000/reset/password/" style="height:38px; v-text-anchor:middle; width:240px;" arcsize="10.5%" stroke="f" fillcolor="#56168c"><w:anchorlock/><center style="color:#FFFFFF;font-family:arial,helvetica,sans-serif;"><![endif]-->
                                        <a href="${ResetUrl}${token}" target="_blank" style="box-sizing: border-box;display: inline-block;font-family:arial,helvetica,sans-serif;text-decoration: none;-webkit-text-size-adjust: none;text-align: center;color: #FFFFFF; background-color: #56168c; border-radius: 4px;-webkit-border-radius: 4px; -moz-border-radius: 4px; width:auto; max-width:100%; overflow-wrap: break-word; word-break: break-word; word-wrap:break-word; mso-border-alt: none;">
                                          <span style="display:block;padding:10px;line-height:130%;"><span style="font-size: 14px; line-height: 16.8px;">GENERAR NUEVA
                                              CONTRASE&Ntilde;A</span></span>
                                        </a>
                                        <!--[if mso]></center></v:roundrect></td></tr></table><![endif]-->
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <!--[if (!mso)&(!IE)]><!-->
                            </div>
                            <!--<![endif]-->
                          </div>
                        </div>
                        <!--[if (mso)|(IE)]></td><![endif]-->
                        <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                      </div>
                    </div>
                  </div>
                  <div class="u-row-container" style="color: #ffffff !important; padding: 0px;background-color: transparent">
                    <div class="u-row" style="color: #ffffff !important; Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                      <div style="color: #ffffff !important; border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                        <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
                        <!--[if (mso)|(IE)]><td align="center" width="600" style="background-color: #56168c;width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                        <div class="u-col u-col-100" style="color: #ffffff !important; max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                          <div style="color: #ffffff !important; background-color: #56168c;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                            <!--[if (!mso)&(!IE)]><!-->
                            <div style="color: #ffffff !important; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                              <!--<![endif]-->
                              <table id="u_content_heading_3" style="font-family:arial,helvetica,sans-serif; color: #ffffff !important;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                <tbody>
                                  <tr>
                                    <td class="v-container-padding-padding" style="text-align: center; overflow-wrap:break-word;word-break:break-word;padding:50px 10px;font-family:arial,helvetica,sans-serif; color: #ffffff !important;" align="center">
                                      <span class="v-text-align v-font-size" style="margin: 0px; color: #ffffff !important; line-height: 140%; text-align: center; word-wrap: break-word; font-weight: normal; font-family: 'Montserrat',sans-serif; font-size: 22px;">
                                        www.stock.com
                                      </span>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <!--[if (!mso)&(!IE)]><!-->
                            </div>
                            <!--<![endif]-->
                          </div>
                        </div>
                        <!--[if (mso)|(IE)]></td><![endif]-->
                        <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                      </div>
                    </div>
                  </div>
                  <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
                </td>
              </tr>
            </tbody>
          </table>
          <!--[if mso]></div><![endif]-->
          <!--[if IE]></div><![endif]-->
        </body>
        </html>
          `,
      };
      try {
          const mail = await sgMail.send(msg);
          return res.status(200).json({
            msg: "Se ha enviado un correo a tu email para recuperar tu contraseña",
            value: user,
             email: mail
          });
      } catch (error) {
        return res.status(500).json({
          msg: "Hubo un error intentando enviar el correo de recuperación, por favor intenta de nuevo en unos minutos",
          value: error.response
        });
      }
    }
  });
}

exports.editUser = async (req, res, next) => {
  const { token, recovery } = req.query;
  const errors = validationResult(req);
  if (!Object.keys(req.body).length) {
    return res.status(422).json({
      errors: [{
        value: Object.keys(req.body).length,
        msg: 'El cuerpo de la peticion no debe estar vacio',
        location: "body"
      }]
    });
  }
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array()
    });
  }
  const hoy = new Date();
  const desface = Math.abs((hoy.getTimezoneOffset())/-60) * 3600000;
  const hora_actual = (Date.now() - desface);
  const userId = req.params.userId;
  const UPDnombre = req.body.nombre;
  const UPDcedula = req.body.cedula;
  const UPDtelefono = req.body.telefono;
  const UPDemail = req.body.email;
  const UPDgenero = req.body.genero;
  const UPDcargo = req.body.cargo;
  const UPDsucursal = req.body.sucursal;
  const UPDfechaNacimiento = req.body.fechaNacimiento;
  const UPDfechaSalida = req.body.fechaSalida;
  const UPDadmin = req.body.admin;
  const UPDactivo = req.body.activo;
  let UPDhashPassword = null;

  if (recovery == true || recovery.toLowerCase() == "true") {
    const userToken = await User.findOne({
      where: {
        reset_token: token
      },
      attributes: {
        exclude: ['contraseña', 'sucursal_id']
      },
    })
    if (userToken) {
      token_exp = new Date(userToken.reset_token_expiration);
      token_flag = hora_actual <= token_exp ? true : false;
      if (token_flag) {
        if (req.body.password !== null && req.body.password !== undefined && req.body.password.length > 0) {
          if (validator.isStrongPassword(req.body.password)){
            UPDhashPassword = await bcrypt.hash(req.body.password, 10);
            userToken.contraseña = UPDhashPassword;
            const response = await userToken.save();
            if(response){
              return res.status(201).json({
                msg: "Contraseña correctamente actualizada",
                value: response
              });
            }
          }
          else {
            return res.status(422).json({
              errors: [{
                value: "*********",
                msg: 'Contraseña muy debil',
                requirements: 'La contraseña debe tener minimo 8 caracteres, 1 minuscula, 1 mayuscula, 1 numero y 1 simbolo',
                param: "password",
                location: "body"
              }]
            });
          }
        }
        else {
          return res.status(422).json({
            errors: [{
              value: req.body.password,
              msg: 'La nueva contraseña no ha sido recibida o esta vacia',
              param: "password",
              location: "body"
            }],
          });
        }
      }
      else {
        return res.status(403).json({
          errors: [{
            value: userToken,
            msg: 'Ha expirado el tiempo del token, debes generar uno nuevo'
          }]
        });
      }
    }
    else {
      return res.status(401).json({
        errors: [{
          value: userToken,
          msg: 'el Token de accesso es incorrecto'
        }]
      });
    }
  }
  else {
    const user = await User.findByPk(userId);
    const errors = [];
    if (UPDsucursal !== null && UPDsucursal !== undefined && UPDsucursal.length > 0) {
        user.sucursal_id = UPDsucursal;
    }
    if (UPDcedula !== null && UPDcedula !== undefined && UPDcedula.length > 0) {
        user.cedula = UPDcedula;
    }
    if (UPDemail !== null && UPDemail !== undefined && UPDemail.length > 0) {
      if (validator.isEmail(UPDemail)) {
        user.correo = UPDemail;
      }
      else {
        let error = {
          value: UPDemail,
          msg: 'Formato de Email Invalido',
          param: "email",
          location: "body"
        }
        errors.push(error);
      }
    }
    if (UPDtelefono !== null && UPDtelefono !== undefined && UPDtelefono.length > 0) {
      if (validator.isLength(UPDtelefono, { min: 9 })) { user.celular = UPDtelefono; }
      else {
        let error = {
          value: UPDtelefono,
          msg: 'El número de teléfono debe contener al menos 10 digitos',
          param: "telefono",
          location: "body"
        }
        errors.push(error);
      }
    }
    if (req.body.password !== null && req.body.password !== undefined && req.body.password.length > 0) {
      if (validator.isStrongPassword(req.body.password)) {
        UPDhashPassword = await bcrypt.hash(req.body.password, 10);
        user.contraseña = UPDhashPassword;
      }
      else {
        let error = {
          value: "*********",
          msg: 'Contraseña muy debil',
          requirements: 'La contraseña debe tener minimo 8 caracteres, 1 minuscula, 1 mayuscula, 1 numero y 1 simbolo',
          param: "password",
          location: "body"
        }
        errors.push(error);
      }
    }
    if (UPDnombre !== null && UPDnombre !== undefined && UPDnombre.length > 0) {
      if (validator.isLength(UPDnombre, { min: 12 })) { user.nombre = UPDnombre; }
      else {
        let error = {
          value: UPDnombre,
          msg: 'El nombre debe tener minimo 12 caracteres',
          param: "nombre",
          location: "body"
        }
        errors.push(error);
      }
    }
    if (UPDgenero !== null && UPDgenero !== undefined && UPDgenero.length > 0) {
        user.genero = UPDgenero;
    }
    if (UPDcargo !== null && UPDcargo !== undefined && UPDcargo.length > 0) {
        user.cargo = UPDcargo;
    }
    if (UPDadmin !== null && UPDadmin !== undefined) {
      if (validator.isBoolean(UPDadmin.toString())) { user.administrador = UPDadmin; }
      else {
        let error = {
          value: UPDadmin,
          msg: 'El campo "admin" debe ser un boolean',
          param: "admin",
          location: "body"
        }
        errors.push(error);
      }
    }
    if (UPDactivo !== null && UPDactivo !== undefined) {
      if (validator.isBoolean(UPDactivo.toString())) { user.activo = UPDactivo; }
      else {
        let error = {
          value: UPDactivo,
          msg: 'El campo "activo" debe ser un boolean',
          param: "activo",
          location: "body"
        }
        errors.push(error);
      }
    }
    if (UPDfechaNacimiento !== null && UPDfechaNacimiento !== undefined && UPDfechaNacimiento.length > 0) {
        user.fecha_nacimiento = UPDfechaNacimiento;
    }
    if (UPDfechaSalida !== null && UPDfechaSalida !== undefined && UPDfechaSalida.length > 0) {
        user.fecha_salida = UPDfechaSalida;
    }
    /* RETURN ERRORS */
    if (errors.length > 0) {
      return res.status(422).json({
        errors: errors
      });
    }
    const response = await user.save();
    const recentUser = await User.findByPk(userId, {
        attributes: {
            exclude: ['contraseña', 'sucursal_id', 'reset_token', 'reset_token_expiration']
        },
        include: Branch
    });
    if (response) {
      return res.status(201).json({
        msg: 'usuario Actualizado correctamente',
        value: recentUser
      });
    } else {
      return res.status(500).json({
        errors: [{
          msg: 'Error intentando actualizar el usuario',
          value: response
        }]
      });
    }
  }
}

exports.deleteUser = async (req, res, next) => {
    const userId = req.params.userId;
    const user = await User.findByPk(userId, {
        attributes: {
            exclude: ['contraseña', 'sucursal_id', 'reset_token', 'reset_token_expiration']
        },
        include: Branch
    });
    if (user) {
        const response = await user.destroy({
            attributes: {
                exclude: ['contraseña', 'sucursal_id', 'reset_token', 'reset_token_expiration']
            },
            include: Branch
        });
        if (response) {
          return res.status(200).json({
            msg: 'Usuario eliminado correctamente',
            value: response
          });
        }
    }
    else {
      return res.status(404).json({
        errors: [{
          value: user,
          msg: 'No coincide ningun usuario con este id'
        }]
      });
    }
}