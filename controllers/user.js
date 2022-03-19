/* User model requirement */
const User = require('../models/user');
const Branch = require('../models/branch');

const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
const bcrypt = require('bcryptjs');
const { Console } = require('console');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.getUsers = async (req, res, next) => {
    const users = await User.findAll({
        attributes: {
            exclude: ['contraseña']
        },
        include: Branch
    });
    if (users == null || users == undefined || users.length <= 0) {
        res.status(404).json({
            message: "No hay usuarios en la base de datos",
            response: users
        });
    } else {
        res.status(200).json({
            response: users
        });
    }
}

exports.getUser = async (req, res, next) => {
    const userId = req.params.userId;
    const user = await User.findByPk(userId, {
        attributes: {
            exclude: ['contraseña']
        },
        include: Branch
    });
    if (user) {
        res.status(200).json({
            response: user
        });
    } else {
        res.status(404).json({
            message: "No coincide ningun usuario con este id",
            response: user
        });
    }
}

exports.createUser = async (req, res, next) => {
  const {nombre, cedula, telefono, email, genero, cargo, sucursal, fechaNacimiento, admin} = req.body;
  let hashPassword = await bcrypt.hash("000000", 10);
  if (!Object.keys(req.body).length || Object.keys(req.body).length < 9) {
      res.status(404).json({
          message: 'El cuerpo de la peticion no debe estar vacio y debe ser enviados todos los campos',
          response: Object.keys(req.body).length
      });
  } else {
    const userDoc = await User.findOne({
      where: {
        correo: email.toLowerCase()
      }
    })
    if (userDoc) {
        res.status(404).json({
          message: 'Ya existe un usuario registrado con este correo',
          response: userDoc.correo
        });
    }
    else {
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
                  nombre: "cambiame",
                  direccion: "cambiame",
                  telefono: "1234567",
                  activa: true
              });
          }
          const response = await User.create(userData);
          const recentUser = await User.findByPk(response.id, {
              attributes: {
                  exclude: ['contraseña']
              },
              include: Branch
          });
          res.status(201).json({
              message: 'usuario creado satisfactoriamente (La contraseña debe ser cambiada por el usuario)',
              response: recentUser
          });

      } else {
          const response = await User.create(userData);
          const recentUser = await User.findByPk(response.id, {
              attributes: {
                  exclude: ['contraseña']
              },
              include: Branch
          });
          res.status(201).json({
              message: 'usuario creado satisfactoriamente (La contraseña debe ser cambiada por el usuario)',
              response: recentUser
          });
      }
    }
  }
}

exports.authUser = async (req, res, next) => {
  const {email, password} = req.body;
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
          let objResponse = {
              ...user.dataValues
          };
          delete objResponse.contraseña;
          res.status(200).json({
              message: "Inicio de sesión exitoso",
              response: objResponse
          });
      } else {
          res.status(404).json({
              message: "Contraseña incorrecta, intente de nuevo",
              response: user.correo
          });
      }
    } else {
        res.status(404).json({
            message: "La contraseña esta siendo recibida como undefined o null",
            response: user.correo
        });
    }
  } else {
    res.status(404).json({
        message: "No existe ningún usuario registrado en la base de datos con este correo",
        response: user
    });
  }
}

exports.resetUser = (req, res, next) => {
  let ResetUrl = process.env.RESET_PASSWORD_URL;
  let hoy = new Date();
  let desface = Math.abs((hoy.getTimezoneOffset())/-60) * 3600000;
  crypto.randomBytes(32, async (error, buffer)=>{
    const token = buffer.toString('hex');
    const { email } = req.query;
    const user = await User.findOne({ where: { correo: email.toLowerCase() } });
    if (email) {
        if (user) {
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
                res.status(200).json({
                    message: "Se ha enviado un correo a tu email para recuperar tu contraseña",
                    response: user,
                    email: mail
                });
            } catch (error) {
                if (error.response) {
                    console.error(error.response.body)
                }
            }
          }
        } else {
            res.status(404).json({
                message: "No existe ningún usuario registrado en la base de datos con este correo",
                today: user
            });
        }
    } else {
        res.status(404).json({
            message: "No se envio ningun email",
            response: email
        });
    }
  });
}

exports.editUser = async (req, res, next) => {
  const hoy = new Date();
  const desface = Math.abs((hoy.getTimezoneOffset())/-60) * 3600000;
  const hora_actual = (Date.now() - desface);
  const { token, recovery } = req.query;
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
  if (req.body.password !== null && req.body.password !== undefined && req.body.password.length > 0) {
      UPDhashPassword = await bcrypt.hash(req.body.password, 10);
  }
  if(recovery !== null && recovery !== undefined){
    if (recovery == true || recovery == "true") {
      if (token !== null && token !== undefined && token.length > 1) {
        const userToken = await User.findOne({
          where: {
            reset_token: token
          },
          attributes: {
            exclude: ['contraseña']
          },
        })
        if(userToken){
          token_exp = new Date(userToken.reset_token_expiration);
          token_flag = hora_actual <= token_exp ? true : false;
          if (token_flag) {
            if (UPDhashPassword !== null && UPDhashPassword !== undefined && UPDhashPassword.length > 1) {
                userToken.contraseña = UPDhashPassword;
                const response = await userToken.save();
                if(response){
                  res.status(200).json({
                      message: "Contraseña correctamente actualizada",
                      response: response
                  });
                }
            }
            else{
              res.status(404).json({
                  message: 'La nueva contraseña no ha sido recibida o esta vacia'
              });
            }
          }
          else{
            res.status(404).json({
                message: 'Ha expirado el tiempo del token, debes generar uno nuevo'
            });
          }
        }
        else{
          res.status(404).json({
              message: 'el Token de accesso es incorrecto'
          });
        }
      }
      else{
        res.status(404).json({
            message: 'el Token de accesso no ha sido recibido'
        });
      }
    }
    else{
      if (!Object.keys(req.body).length) {
          res.status(404).json({
              message: 'El cuerpo de la peticion no debe estar vacio',
              response: Object.keys(req.body).length
          });
      } else {
          const user = await User.findByPk(userId);
          if (UPDsucursal !== null && UPDsucursal !== undefined) {
              user.sucursal_id = UPDsucursal;
          }
          if (UPDcedula !== null && UPDcedula !== undefined) {
              user.cedula = UPDcedula;
          }
          if (UPDemail !== null && UPDemail !== undefined) {
              user.correo = UPDemail;
          }
          if (UPDtelefono !== null && UPDtelefono !== undefined) {
              user.celular = UPDtelefono;
          }
          if (UPDhashPassword !== null && UPDhashPassword !== undefined) {
              user.contraseña = UPDhashPassword;
          }
          if (UPDnombre !== null && UPDnombre !== undefined) {
              user.nombre = UPDnombre;
          }
          if (UPDgenero !== null && UPDgenero !== undefined) {
              user.genero = UPDgenero;
          }
          if (UPDcargo !== null && UPDcargo !== undefined) {
              user.cargo = UPDcargo;
          }
          if (UPDadmin !== null && UPDadmin !== undefined) {
              user.administrador = UPDadmin;
          }
          if (UPDactivo !== null && UPDactivo !== undefined) {
              user.activo = UPDactivo;
          }
          if (UPDfechaNacimiento !== null && UPDfechaNacimiento !== undefined) {
              user.fecha_nacimiento = UPDfechaNacimiento;
          }
          if (UPDfechaSalida !== null && UPDfechaSalida !== undefined) {
              user.fecha_salida = UPDfechaSalida;
          }
          const response = await user.save();
          const recentUser = await User.findByPk(userId, {
              attributes: {
                  exclude: ['contraseña']
              },
              include: Branch
          });
          if (response) {
            res.status(201).json({
                message: 'usuario Actualizado correctamente',
                response: recentUser
            });
          } else {
            res.status(404).json({
                message: 'Error intentando actualizar el usuario'
            });
          }
      }
    }
  }
  else{
    res.status(404).json({
        message: 'El query param "Recovery" debe estar definido'
    });
  }
}

exports.deleteUser = async (req, res, next) => {
    const userId = req.params.userId;
    const user = await User.findByPk(userId, {
        attributes: {
            exclude: ['contraseña']
        },
        include: Branch
    });
    if (user) {
        const response = await user.destroy({
            attributes: {
                exclude: ['contraseña']
            },
            include: Branch
        });
        if (response) {
            res.status(200).json({
                message: "Usuario eliminado correctamente",
                response: response
            });
        }
    } else {
        res.status(404).json({
            message: "No coincide ningun usuario con este id",
            response: user
        });
    }
}