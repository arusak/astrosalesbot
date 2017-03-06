const http = require('http');
const iconv = require('iconv-lite');
const Rx = require('rx');

const ignored = [
	'91780', '81406', '84125'
];

const config = require('./config.json');
const Mailer = require('./mailer');
const mailer = new Mailer(config.mailer);

const placeholder = '%OFFSET%';
const urlTemplate = `http://www.astronomy.ru/forum/index.php/board,35.${placeholder}/wap2.html`;

Rx.Observable.from([0, 9, 18])
	.map(offset => urlTemplate.replace(placeholder, offset))
	.flatMap(url => {
		return Rx.Observable.create(function (observer) {
			http.get(url, res => {
				res.on('data', chunk => observer.onNext(chunk))
					.on('end', () => observer.onCompleted());
			})
		});
	})
	.reduce((acc, chunk) => {
		acc.push(chunk);
		return acc;
	}, [])
	.subscribe(chunks => {
		let buffer = Buffer.concat(chunks);
		let decoded = iconv.decode(buffer, 'cp1251');
		let topics = processContent(decoded);

		mailer.sendHtml(config.to, 'Новые объявления о продаже', makeHtml(topics));
	});

function processContent(content) {
	let reUrl = /href="(.+)\/wap2\.html/;
	let reId = /topic,([0-9]+)\.0/;
	let reTitle = /accesskey=\"[0-9]\">(.*)<\/a>/;
	let lines = content.split('\n');
	let topicLinks = lines.filter(line => line.match(/accesskey=\"[1-9]\"/));
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

function makeHtml(json) {
	return json.map(topic => `<p><a href="${topic.url}">${topic.title}</a></p>`).join('\n');
}

