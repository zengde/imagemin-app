/* global node */
'use strict';

const drop = require('./lib/drop-anywhere');

const each = require('each-async');
const fs = require('fs');
const imagemin = require('imagemin');
const path = require('path');
const Spinner = require('./lib/spinner');
const Summary = require('./lib/summary');
const sum = new Summary();

const imageminGifsicle = require('imagemin-gifsicle');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminOptipng = require('imagemin-optipng');
const imageminPngquant = require('imagemin-pngquant');
const imageminSvgo = require('imagemin-svgo');
const imageminJpegRecompress = require('imagemin-jpeg-recompress');

/**
 * Minify images
 *
 * @param {Object} file
 * @param {Function} cb
 * @api private
 */

function minify(file, cb) {
	fs.readFile(file.path, (err, buf) => {
		if (err) {
			cb(err);
			return;
		}
		imagemin([file.path.replace(/\\/g,'/')], {
			destination: path.join(path.dirname(file.path), 'optimized').replace(/\\/g,'/'),
			plugins: [
				imageminGifsicle(),
				imageminJpegtran({
					progressive: true
				}),
				/*
				imageminJpegRecompress({
					quality:'veryhigh',
					progressive: true
				}),
				*/
				imageminOptipng(),
				imageminPngquant({
					quality: [0.65, 0.8]
				}),
				imageminSvgo()
			]
		}).then(files => {
			const [f]=files;
			cb(null, { path: file.path, orig: buf.length, dest: f.data.length });
		}).catch(error => {
			cb(error);
		});
	});
}

/**
 * Create spinner
 *
 * @api private
 */

function spin() {
	let w = document.body.offsetWidth;
	let h = document.body.offsetHeight;
	const s = new Spinner()
		.size(w / 4)
		.light();

	s.el.style.position = 'absolute';
	s.el.style.top = `${(h / 2) - ((w / 4) / 2)}px`;
	s.el.style.left = `${(w / 2) - ((w / 4) / 2)}px`;

	spin.remove = () => {
		document.body.removeChild(s.el);
	};

	window.addEventListener('resize', () => {
		w = document.body.offsetWidth;
		h = document.body.offsetHeight;
	});

	document.body.appendChild(s.el);

	return s;
}

/**
 * Toggle display
 *
 * @param {Element} el
 * @api private
 */

function toggle(el) {
	el = document.querySelector(el);

	if (el.style.display === 'none') {
		el.style.display = 'block';
		return;
	}

	el.style.display = 'none';
}

/**
 * Run
 */

drop(e => {
	let files = [];
	let total = e.items.length;

	toggle('#drop-anywhere');
	spin();
	sum.hide();

	each(e.items, (item, i, done) => {
		minify(item, (err, file) => {
			if (err) {
				done(err);
				return;
			}

			files.push(file);
			done();
		});
	}, err => {
		if (err) {
			console.error(err);
			//  return;
		}

		toggle('#drop-anywhere');
		spin.remove();
		sum.show(files);
		sum.error(total-files.length);

		files = [];
	});

});
