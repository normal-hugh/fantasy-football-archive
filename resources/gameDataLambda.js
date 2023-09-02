import { S3 } from "@aws-sdk/client-s3";

export const handler = async (event) => {
  console.log('Hello World');
  console.log(`events: ${JSON.stringify(event)}`);
};