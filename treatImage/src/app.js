var aws = require('aws-sdk');
var async = require('async');
var gm = require('gm').subClass({ imageMagick: true });
var easyimg = require('easyimage');
var fs = require('fs');
var awsConfig = require('./config').aws;
aws.config.update(awsConfig);

var MAX_WIDTH = 100;
var MAX_HEIGHT = 100;

var s3 = new aws.S3();

exports.handler = function (event, context, callback) {
    var imagesBucket = event.Records[0].s3.bucket.name;
    var imageName = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
    var imagesOfficialBucket = imagesBucket + '-official';
    var filePath = '';

    var typeMatch = imageName.match(/\.([^.]*)$/);
    if (!typeMatch) {
        callback("Could not determine the image type.");
        return;
    }

    var imageType = typeMatch[1];
    if (imageType !== "jpg" && imageType !== "jpeg") {
        callback('Unsupported image type: ${imageType}');
        return;
    }

    // Utilizando o Graphics Magick (a manipulação da imagem consome da memória)
    // async.waterfall([
    //     function download(next) {
    //         s3.getObject({
    //             Bucket: imagesBucket,
    //             Key: imageName
    //         },
    //         next);
    //     },
    //     function transform(response, next) {
    //         var buffer = new Buffer(response.Body);

    //         gm(response.Body).size(function (err, size) {
    //             var scalingFactor = Math.min(
    //                 MAX_WIDTH / size.width,
    //                 MAX_HEIGHT / size.height
    //             );
    //             var width = scalingFactor * size.width;
    //             var height = scalingFactor * size.height;

    //             this.drawCircle("100, 100, 100, 1")
    //                 .toBuffer(imageType, function (err, buffer) {
    //                     if (err) {
    //                         next(err);
    //                     } else {
    //                         next(null, response.ContentType, buffer);
    //                     }
    //                 });
    //         });
    //     },
    //     function upload(contentType, data, next) {
    //         s3.putObject({
    //             Bucket: imagesOfficialBucket,
    //             Key: imageName,
    //             Body: data,
    //             ContentType: contentType,
    //             ACL: 'public-read'
    //         },
    //         next);
    //     }
    // ], function (err) {
    //     if (err) {
    //         console.error(
    //             'Unable to resize ' + imagesBucket + '/' + imageName +
    //             ' and upload to ' + imagesOfficialBucket + '/' + imageName +
    //             ' due to an error: ' + err
    //         );
    //         callback(null, "message");
    //     } else {
    //         s3.deleteObject({
    //             Bucket: imagesOfficialBucket,
    //             Delete: {
    //                 Objects: [{
    //                     Key: imageName
    //                 }]
    //             }
    //         }, function(err, data) {
    //             console.log(
    //                 'Successfully resized ' + imagesBucket + '/' + imageName +
    //                 ' and uploaded to ' + imagesOfficialBucket + '/' + imageName
    //             );
    //             callback(null, "message");
    //         });
    //     }
    // });

    // Utilizando o Easy Image (a manipulaçao de imagem consome do armazenamento, somente no processo de upload é utilizado memória da máquina)
    async.waterfall([
        function download(next) {
            s3.getObject({
                Bucket: imagesBucket,
                Key: imageName
            },
            next);
        },
        function localSave(response, next) {
            filePath = '/tmp/' + imageName;
            fs.writeFile(filePath, response.Body, (err) => {
                next(null, response);
            });
        },
        function transform(response, next) {
            easyimg.thumbnail({
                src: filePath,
                dst: filePath,
                width: 200,
                height: 200
            }).then(() => {
                next(null)
            });
        },
        function upload(next) {
            var s3UploadOptions = {
                Bucket: imagesOfficialBucket,
                Key: imageName,
                Body: fs.readFileSync(filePath),
                ContentType: 'image/jpeg',
                ACL: 'public-read'
            }

            s3.putObject(s3UploadOptions, function(err, success) {
                if (err) {
                    next(err);
                } else {
                    next(null, success);
                }
            });
        }
    ], function (err) {
        if (err) {
            console.error(
                'Unable to resize ' + imagesBucket + '/' + imageName +
                ' and upload to ' + imagesOfficialBucket + '/' + imageName +
                ' due to an error: ' + err
            );
            callback(null, "message");
        } else {
            s3.deleteObject({
                Bucket: imagesBucket,
                Delete: {
                    Objects: [{
                        Key: imageName
                    }]
                }
            }, function(err, data) {
                console.log(
                    'Successfully resized ' + imagesBucket + '/' + imageName +
                    ' and uploaded to ' + imagesOfficialBucket + '/' + imageName
                );
                callback(null, "message");
            });
        }
    });

};