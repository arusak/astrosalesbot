const nodemailer = require('nodemailer');

module.exports = class Mailer {
	constructor(config) {
		this.smtpTransport = nodemailer.createTransport(config);
	}

	sendHtml(to, subject, html) {
		let mailOptions = {
			to,
			subject,
			html
		};

		this.smtpTransport.sendMail(mailOptions, function (error, response) {
			if (!error) {
				console.log("Message sent: " + response.message);
				res.end("sent");
			} else {
				console.log(error);
				res.end("error");
			}
		});
	}
};