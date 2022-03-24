const s3 = require('aws-sdk/clients/s3');
const fs = require('fs');

const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

const storage = new s3({
    region,
    accessKeyId,
    secretAccessKey,
})

const getBuckets = () => {
    /* return new Promise((resolve, reject) => {
        storage.listBuckets()
            .then(buckets => {
                return resolve(buckets);
            })
            .catch(error => {
                return reject(error);
            })
    }); */
}

const uploadToBucket = (bucketName, file) => {
    const fileStream = fs.createReadStream(file.path.replace("\\" ,"/"));
    const params = {
        Bucket: bucketName,
        Key: file.filename,
        Body: fileStream
    }
    return storage.upload(params).promise();
}

module.exports = {
    uploadToBucket
}