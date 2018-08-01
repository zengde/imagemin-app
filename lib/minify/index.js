/* global node */
'use strict';

var each = require('each-async');
var fs = node('fs');
var Imagemin = node('imagemin');

const imageminPngquant = require('imagemin-pngquant');
const imageminJpegRecompress = require('imagemin-jpeg-recompress');

var path = node('path');

/**
 * Minify images
 *
 * @param {Array} files
 * @param {Function} cb
 * @api public
 */

module.exports = function (files, cb) {
    var arr = [];

    each(files, function (file, i, next) {
        fs.readFile(file.path, function (err, buf) {
            if (err) {
                return next(err);
            }

            Imagemin.buffer(buf, {
                plugins: [
                    imageminJpegRecompress({
                        quality:'low',
                        progressive: true
                    }),
                    imageminPngquant({quality: '65-80'})
                ]
            })
            .then(outBuffer => {
                var optimizedpath=path.dirname(file.path)+'/optimized';

                if(!fs.existsSync(optimizedpath)){
                    fs.mkdirSync(optimizedpath)
                }
                fs.writeFile(path.join(optimizedpath, path.basename(file.path)), outBuffer,  "binary",function(err) {
                    if(err) {
                        return next(err);
                    } else {
                        arr.push({ path: file.path, orig: buf.length, dest: outBuffer.length });
                        next();
                    }
                });
            }).catch(err => {
                return next(err);
            })

        });
    }, function (err) {
        if (err) {
            return cb(err);
        }

        cb(null, arr);
    });

};
