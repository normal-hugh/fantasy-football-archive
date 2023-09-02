import { S3 } from "@aws-sdk/client-s3";
import { parse } from "csv-parse/sync";

export const handler = async (event) => {
  console.log('Hello World');
  console.log(`events: ${JSON.stringify(event)}`);

  const s3 = new S3();

  const s3Info = event.Records[0].s3;
  const bucketArn = s3Info.bucket.arn;
  const bucketName = s3Info.bucket.name;
  console.log(`Bucket ARN/name: ${bucketArn}/${bucketName}`);
  const fileName = s3Info.object.key;
  console.log(`fileName: ${fileName}`);

  if (fileName.includes('.csv')) {
    const myCSV = s3.getObject({
      key: fileName,
      bucket: bucketName
    });
    const test = parse(myCSV);
    console.log(test);
  }
};