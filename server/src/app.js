const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const aws = require('aws-sdk');
const awsConfig = require('./config').aws;
const port = process.env.PORT || 3000;

let app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

aws.config.update(awsConfig);

app.get('/signS3', function (req, res) {
    const s3 = new aws.S3();
    const fileName = req.query['file-name'];
    const s3Params = {
        Bucket: awsConfig.bucketName,
        Key: fileName,
        Expires: 60,
        ContentType: 'image/jpeg',
        ACL: 'public-read'
    };

    s3.getSignedUrl('putObject', s3Params, (err, data) => {
        if (err) {
            console.log('err', err);
            return res.status(422).json(err);
        }
        const returnData = {
            signedRequest: data,
            url: `https://${awsConfig.bucketName}.s3.amazonaws.com/${fileName}`
        };
        return res.status(200).json(returnData);
    });
});

app.listen(port, () => {
    console.log('Server running at port:' + port + '/');
});