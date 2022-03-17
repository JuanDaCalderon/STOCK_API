/* User model requirement */
const User = require('../models/user');
const Branch = require('../models/branch');

const sgMail = require('@sendgrid/mail');
const bcrypt = require('bcryptjs');
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
    const nombre = req.body.nombre; //STRING
    const cedula = req.body.cedula; //STRING
    const telefono = req.body.telefono; //STRING
    const email = req.body.email; //STRING
    const genero = req.body.genero; //STRING
    const cargo = req.body.cargo; //STRING
    const sucursal = req.body.sucursal; //INT
    const fechaNacimiento = req.body.fechaNacimiento; //STRING - '1999-03-30'
    const admin = req.body.admin; //BOOL
    let hashPassword = await bcrypt.hash("000000", 10);

    if (!Object.keys(req.body).length || Object.keys(req.body).length < 9) {
        res.status(404).json({
            message: 'El cuerpo de la peticion no debe estar vacio y debe ser enviados todos los campos',
            response: Object.keys(req.body).length
        });
    } else {
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
            let userId = response.id;
            const recentUser = await User.findByPk(userId, {
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
            let userId = response.id;
            const recentUser = await User.findByPk(userId, {
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

exports.authUser = async (req, res, next) => {
    const email = req.body.email; //STRING
    const password = req.body.password; //STRING
    const user = await User.findOne({
        where: {
            correo: email.toLowerCase()
        },
        include: Branch
    });
    if (user) {
        let authFlag
        if (password) {
            authFlag = await bcrypt.compare(password, user.contraseña);
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

exports.resetUser = async (req, res, next) => {
    const { email } = req.query;
    const user = await User.findOne({ where: { correo: email.toLowerCase() } });
    if (email) {
        if (user) {
            const msg = {
                to: email,
                from: 'stock.app.platform@gmail.com', // Use the email address or domain you verified
                subject: '¿Olvidaste tu contraseña?',
                text: 'Recupera tu contraseña de STOCK',
                html: `
                <!DOCTYPE HTML
                PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
              <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
                xmlns:o="urn:schemas-microsoft-com:office:office">
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
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Source+Sans+Pro:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700;1,900&display=swap" rel="stylesheet">
                <title> STOCK RECOVERY PASSWORD </title>
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
                  body, p, span, a, h1, h2, h3, h4, h5, h6 {
                    font-family: 'Montserrat', sans-serif !important;
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
                    color: #56168c;
                    text-decoration: none;
                  }
                  @media (max-width: 480px) {
                    #u_content_image_1 .v-src-width {
                      width: auto !important;
                    }
                    #u_content_image_1 .v-src-max-width {
                      max-width: 55% !important;
                    }
                    #u_content_image_2 .v-src-width {
                      width: auto !important;
                    }
                    #u_content_image_2 .v-src-max-width {
                      max-width: 60% !important;
                    }
                    #u_content_text_1 .v-container-padding-padding {
                      padding: 30px 30px 30px 20px !important;
                    }
                    #u_content_button_1 .v-container-padding-padding {
                      padding: 10px 20px !important;
                    }
                    #u_content_button_1 .v-size-width {
                      width: 100% !important;
                    }
                    #u_content_button_1 .v-text-align {
                      text-align: left !important;
                    }
                    #u_content_button_1 .v-padding {
                      padding: 15px 40px !important;
                    }
                    #u_content_text_3 .v-container-padding-padding {
                      padding: 30px 30px 80px 20px !important;
                    }
                  }
                </style>
              </head>
              <body class="clean-body u_body"
                style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #56168c;color: #000000">
                <!--[if IE]><div class="ie-container"><![endif]-->
                <!--[if mso]><div class="mso-container"><![endif]-->
                <table
                  style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #56168c;width:100%"
                  cellpadding="0" cellspacing="0">
                  <tbody>
                    <tr>
                      <td
                        style="display:none !important;visibility:hidden;mso-hide:all;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
                        Cambio de contraseña
                      </td>
                    </tr>
                    <tr style="vertical-align: top">
                      <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                        <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #56168c;"><![endif]-->
                        <div class="u-row-container" style="padding: 0px;background-color: #ffffff">
                          <div class="u-row"
                            style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
                            <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: #ffffff;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->
                              <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                              <div class="u-col u-col-100"
                                style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                <div style="width: 100% !important;">
                                  <!--[if (!mso)&(!IE)]><!-->
                                  <div
                                    style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                    <!--<![endif]-->
                                    <table id="u_content_image_1" style="font-family:arial,helvetica,sans-serif;" role="presentation"
                                      cellpadding="0" cellspacing="0" width="100%" border="0">
                                      <tbody>
                                        <tr>
                                          <td class="v-container-padding-padding"
                                            style="overflow-wrap:break-word;word-break:break-word;padding:15px 10px;font-family:arial,helvetica,sans-serif;"
                                            align="left">
                                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                              <tr>
                                                <td class="v-text-align" style="padding-right: 0px;padding-left: 0px;" align="center">
                                                  <a href="https://stock.com" target="_blank">
                                                    <img align="center" border="0" src="https://i.ibb.co/Lg6G12w/image-1.png" alt="STOCK LOGO"
                                                      title="STOCK LOGO"
                                                      style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 20%;max-width: 116px;"
                                                      width="116" class="v-src-width v-src-max-width" />
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
                          <div class="u-row"
                            style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                            <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
                              <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 20px 0px 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                              <div class="u-col u-col-100"
                                style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                <div
                                  style="width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                                  <!--[if (!mso)&(!IE)]><!-->
                                  <div
                                    style="padding: 20px 0px 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                                    <!--<![endif]-->
                                    <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0"
                                      cellspacing="0" width="100%" border="0">
                                      <tbody>
                                        <tr>
                                          <td class="v-container-padding-padding"
                                            style="overflow-wrap:break-word;word-break:break-word;padding:10px 0px 21px;font-family:arial,helvetica,sans-serif;"
                                            align="left">
                                            <table height="0px" align="center" border="0" cellpadding="0" cellspacing="0" width="100%"
                                              style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;border-top: 3px solid #f7f7fa;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                              <tbody>
                                                <tr style="vertical-align: top">
                                                  <td
                                                    style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;font-size: 0px;line-height: 0px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                                    <span>&#160;</span>
                                                  </td>
                                                </tr>
                                              </tbody>
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
                          <div class="u-row"
                            style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
                            <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->
                              <!--[if (mso)|(IE)]><td align="center" width="600" style="background-color: #f7f7fa;width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                              <div class="u-col u-col-100"
                                style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                <div
                                  style="background-color: #f7f7fa;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                                  <!--[if (!mso)&(!IE)]><!-->
                                  <div
                                    style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                                    <!--<![endif]-->
                                    <table id="u_content_text_1" style="font-family:arial,helvetica,sans-serif;" role="presentation"
                                      cellpadding="0" cellspacing="0" width="100%" border="0">
                                      <tbody>
                                        <tr>
                                          <td class="v-container-padding-padding"
                                            style="overflow-wrap:break-word;word-break:break-word;padding:50px 30px 30px 40px;font-family:arial,helvetica,sans-serif;"
                                            align="left">
                                            <div class="v-text-align"
                                              style="color: #333333; line-height: 140%; text-align: left; word-wrap: break-word;">
                                              <p style="font-size: 14px; line-height: 140%;"><span
                                                  style="font-family: 'arial black', 'avant garde', arial; font-size: 14px; line-height: 19.6px;"><strong><span
                                                      style="font-size: 22px; line-height: 30.8px;">Hola!</span></strong></span></p>
                                              <p style="font-size: 14px; line-height: 140%;">&nbsp;</p>
                                              <p style="font-size: 14px; line-height: 140%;">Hemos recibido una solicitud de cambio de
                                                contrase&ntilde;a a este correo, por favor ingresa en el siguiente enlace para generar
                                                una nueva:</p>
                                            </div>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <table id="u_content_button_1" style="font-family:arial,helvetica,sans-serif;" role="presentation"
                                      cellpadding="0" cellspacing="0" width="100%" border="0">
                                      <tbody>
                                        <tr>
                                          <td class="v-container-padding-padding"
                                            style="overflow-wrap:break-word;word-break:break-word;padding:0px 40px 40px;font-family:arial,helvetica,sans-serif;"
                                            align="left">
                                            <div class="v-text-align" align="center">
                                              <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-spacing: 0; border-collapse: collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;font-family:arial,helvetica,sans-serif;"><tr><td class="v-text-align" style="font-family:arial,helvetica,sans-serif;" align="center"><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://stock.com" style="height:47px; v-text-anchor:middle; width:520px;" arcsize="10.5%" stroke="f" fillcolor="#9058bf"><w:anchorlock/><center style="color:#f7f7fa;font-family:arial,helvetica,sans-serif;"><![endif]-->
                                              <a href="https://stock.com" target="_blank" class="v-size-width"
                                                style="box-sizing: border-box;display: inline-block;font-family:arial,helvetica,sans-serif;text-decoration: none;-webkit-text-size-adjust: none;text-align: center;color: #f7f7fa; background-color: #9058bf; border-radius: 5px;-webkit-border-radius: 5px; -moz-border-radius: 5px; width:100%; max-width:100%; overflow-wrap: break-word; word-break: break-word; word-wrap:break-word; mso-border-alt: none;border-top-width: 0px; border-top-style: solid; border-left-width: 0px; border-left-style: solid; border-right-width: 0px; border-right-style: solid; border-bottom-width: 0px; border-bottom-style: solid;">
                                                <span class="v-padding"
                                                  style="display:block;padding:15px 40px;line-height:120%; font-weight: bold;"><span
                                                    style="font-size: 14px; line-height: 16.8px; font-weight: bold;"> RECUPERAR CONTRASEÑA </span></span>
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
                        <div class="u-row-container" style="padding: 0px;background-color: transparent">
                          <div class="u-row"
                            style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                            <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
                              <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 10px 0px 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                              <div class="u-col u-col-100"
                                style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                <div
                                  style="width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                                  <!--[if (!mso)&(!IE)]><!-->
                                  <div
                                    style="padding: 10px 0px 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                                    <!--<![endif]-->
                                    <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0"
                                      cellspacing="0" width="100%" border="0">
                                      <tbody>
                                        <tr>
                                          <td class="v-container-padding-padding"
                                            style="overflow-wrap:break-word;word-break:break-word;padding:10px 0px 21px;font-family:arial,helvetica,sans-serif;"
                                            align="left">
                                            <table height="0px" align="center" border="0" cellpadding="0" cellspacing="0" width="100%"
                                              style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;border-top: 3px solid #f7f7fa;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                              <tbody>
                                                <tr style="vertical-align: top">
                                                  <td
                                                    style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;font-size: 0px;line-height: 0px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                                    <span>&#160;</span>
                                                  </td>
                                                </tr>
                                              </tbody>
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
                console.log(mail);
                res.status(200).json({
                    message: "Se ha enviado un correo a tu email para recuperar tu contraseña",
                    response: user,
                    email: mail
                });
            } catch (error) {
                console.error(error);
                if (error.response) {
                    console.error(error.response.body)
                }
            }
        } else {
            res.status(404).json({
                message: "No existe ningún usuario registrado en la base de datos con este correo",
                response: user
            });
        }
    } else {
        res.status(404).json({
            message: "No se envio ningun email",
            response: email
        });
    }
}

exports.editUser = async (req, res, next) => {
    const userId = req.params.userId; // userId parameter
    const UPDnombre = req.body.nombre; //STRING - SI SE ENVIA ES EL MISMO USER DESDE SU PERFIL QUIEN REALIZO LA PETICION
    const UPDcedula = req.body.cedula; //STRING - SI SE ENVIA ES EL MISMO USER DESDE SU PERFIL QUIEN REALIZO LA PETICION
    const UPDtelefono = req.body.telefono; //STRING
    const UPDemail = req.body.email; //STRING
    const UPDgenero = req.body.genero; //STRING - SI SE ENVIA ES EL MISMO USER DESDE SU PERFIL QUIEN REALIZO LA PETICION
    const UPDcargo = req.body.cargo; //STRING
    const UPDsucursal = req.body.sucursal; //INT
    const UPDfechaNacimiento = req.body.fechaNacimiento; //STRING - '1999-03-30' - SI SE ENVIA ES EL MISMO USER DESDE SU PERFIL QUIEN REALIZO LA PETICION
    const UPDfechaSalida = req.body.fechaSalida; //STRING - '1999-03-30'
    const UPDadmin = req.body.admin; //BOOL
    const UPDactivo = req.body.activo; //BOOL
    let UPDhashPassword = null;
    if (req.body.password !== null && req.body.password !== undefined && req.body.password.length > 0) {
        UPDhashPassword = await bcrypt.hash(req.body.password, 10);
    } //STRING - SI SE ENVIA ES EL MISMO USER DESDE SU PERFIL QUIEN REALIZO LA PETICION
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