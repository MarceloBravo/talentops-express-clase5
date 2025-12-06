// src/config/mailer.js
const nodemailer = require('nodemailer');

// Esta función creará un transportador de Nodemailer usando un servicio de email de prueba (Ethereal)
// Es ideal para desarrollo y pruebas sin necesidad de configurar credenciales reales.
async function createTestTransporter() {
  // Crea una cuenta de prueba en Ethereal
  const testAccount = await nodemailer.createTestAccount();

  // Crea el objeto transportador reutilizable usando los datos de la cuenta de prueba
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // usuario generado por Ethereal
      pass: testAccount.pass, // contraseña generada por Ethereal
    },
  });

  console.log(' nodemailer de prueba creado.');
  console.log('Puedes previsualizar los emails enviados en la siguiente URL (se generará una nueva por cada reinicio del servidor):');
  
  // Devuelve el transportador y la URL de previsualización
  return {
    transporter,
    getTestMessageUrl: nodemailer.getTestMessageUrl
  };
}

module.exports = {
  createTestTransporter
};
