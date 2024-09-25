import nodemailer from "nodemailer";
import { config } from "../config/config.js";

const sendEmail = (options) => {
  const transporter = nodemailer.createTransport({
    service: config.mailService,
    auth: {
      user: config.emailUserName,
      pass: config.emailPassword,
    },
    from: config.emailUserName,
  });

  const mailOptions = {
    from: `TejashCreation <${config.emailFrom}>`,
    to: options.to,
    subject: options.subject,
    html: options.emailHtml,
    text: options?.emailText || options.emailHtml,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log(err);
    } else {
      console.log(info);
    }
  });
};

export default sendEmail;
