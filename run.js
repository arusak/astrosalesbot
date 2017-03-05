const http = require('http');
const iconv = require('iconv-lite');
const nodemailer = require("nodemailer");
const ignored = [
	'91780', '81406', '84125'
];

const config = require('./config.json');

const smtpTransport = nodemailer.createTransport({
	service: "gmail",
	host: "smtp.gmail.com",
	auth: config.auth
});

http.get('http://www.astronomy.ru/forum/index.php/board,35.0/wap2.html', (res) => {
	let content = '';
	let chunks = [];
	res.on('data', (chunk) => {
		console.log(`Received ${chunk.length} bytes of data.`);
		chunks.push(chunk);
	});
	res.on('end', () => {
		let buffer = Buffer.concat(chunks);
		let decoded = iconv.decode(buffer, 'cp1251');
		let topics = processContent(decoded);

		sendMail(formatLetter(topics));
	})

});

function processContent(content) {
	let reUrl = /href="(.+)\/wap2\.html/;
	let reId = /topic,([0-9]+)\.0/;
	let reTitle = /accesskey=\"[0-9]\">(.*)<\/a>/;
	let lines = content.split('\n');
	let topicLinks = lines.filter(line => line.match(/accesskey=\"[1-9]\"/));
	//console.log(topicLinks);
	let topics = topicLinks.reduce((result, link) => {
		let topic = {
			url: link.match(reUrl)[1],
			id: link.match(reId)[1],
			title: link.match(reTitle)[1]
		};

		result.push(topic);
		return result;
	}, []);

	return topics.filter(topic => !ignored.includes(topic.id));
}

function formatLetter(json) {
	return json.map(topic => `<p><a href="${topic.url}">${topic.title}</a></p>`).join('\n');
}

function sendMail(html) {
	let mailOptions = {
		to: config.to,
		subject: 'Astronomy sales digest',
		html
	};

	smtpTransport.sendMail(mailOptions, function (error, response) {
		if (error) {
			console.log(error);
			res.end("error");
		} else {
			console.log("Message sent: " + response.message);
			res.end("sent");
		}
	});
}