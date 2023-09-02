import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
// import { parse } from "csv-parse/sync";
// import fs from 'fs';

export const handler = async (event) => {
  console.log('Hello World');
  console.log(`events: ${JSON.stringify(event)}`);

  const s3Client = new S3Client();

  const s3Info = event.Records[0].s3;
  const bucketArn = s3Info.bucket.arn;
  const bucketName = s3Info.bucket.name;
  console.log(`Bucket ARN/name: ${bucketArn}/${bucketName}`);
  const fileName = s3Info.object.key;
  console.log(`fileName: ${fileName}`);

  if (fileName.includes('.csv')) {
    console.log('STAGE 1');
    const params = {
      Key: fileName,
      Bucket: bucketName
    };
    const getObjectCommand = new GetObjectCommand(params);
    const response = await s3Client.send(getObjectCommand);

    const streamToString = (stream) => {
      return new Promise((resolve, reject) => {
          const chunks = [];
          stream.on('data', chunk => chunks.push(chunk));
          stream.on('error', reject);
          stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      });
    };

    const objectContent = await streamToString(response.Body);
    console.log(`Object content: ${objectContent}`);


    console.log(`response: ${JSON.stringify(objectContent)}`);
    console.log(`response body: ${objectContent.Body}`);

  }
};