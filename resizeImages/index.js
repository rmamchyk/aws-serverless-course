const im = require('imagemagick');
const fs = require('fs');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const { promisify } = require('util');
const AWS = require('aws-sdk');

const resizeAsync = promisify(im.resize);
const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);

AWS.config.update({ region: 'eu-central-1' });
const s3 = new AWS.S3();

exports.handler = async (event) => {
    const filesProcessed = event.Records.map(async (record) => {
        const bucket = record.s3.bucket.name;
        const filename = record.s3.object.key;

        // Get file from S3
        const s3GetParams = {
            Bucket: bucket,
            Key: filename
        };
        const inputData = await s3.getObject(s3GetParams).promise();

        // Resize the file
        const tempFile = os.tmpdir() + '/' + uuidv4() + '.jpg';
        const resizeArgs = {
            srcData: inputData.Body,
            dstPath: tempFile,
            width: 150
        };
        await resizeAsync(resizeArgs);

        // Read the resized file
        const resizedData = await readFileAsync(tempFile);

        // Upload the new file to s3
        const targetFilename = filename.substring(0, filename.lastIndexOf('.')) + '-small.jpg';
        const s3PutParams = {
            Bucket: bucket + '-dest',
            Key: targetFilename,
            Body: new Buffer(resizedData),
            ContentType: 'image/jpeg'
        };
        await s3.putObject(s3PutParams).promise();

        return await unlinkAsync(tempFile);
    });

    await Promise.all(filesProcessed);
    console.log('done');
    return 'done';
};
