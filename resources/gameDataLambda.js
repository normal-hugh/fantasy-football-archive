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
    console.log(`Object content: ${typeof objectContent}`);

    const stringArray = objectContent.split(',');
    console.log(`
      0: ${stringArray[0]}\n
      1: ${stringArray[1]}\n
      2: ${stringArray[2]}\n
      3: ${stringArray[3]}\n
      4: ${stringArray[4]}\n
      5: ${stringArray[5]}\n
      6: ${stringArray[6]}\n
      7: ${stringArray[7]}\n
      8: ${stringArray[8]}\n
      9: ${stringArray[9]}\n
      10: ${stringArray[10]}\n
      11: ${stringArray[11]}\n
      12: ${stringArray[12]}\n
      13: ${stringArray[13]}\n
      14: ${stringArray[14]}\n
      15: ${stringArray[15]}\n
      16: ${stringArray[16]}\n
      17: ${stringArray[17]}\n
      18: ${stringArray[18]}\n
      19: ${stringArray[19]}\n
      20: ${stringArray[20]}\n
    `)
    const gameLog = (strArr, startingEntry = 0) => {
      let entry = startingEntry; // column counter
      let teamA = {};

      teamA.name = {
        value: strArr[entry]
      };
      entry += 8;

      // team A starting lineup 
      while (!strArr[entry].includes('Points:')) {
        teamA[`teamA${strArr[entry].split('\n')[1]}`] ={
          player: strArr[entry + 1],
          points: parseInt(strArr[entry + 2].split('\n')[0].split('\r')[0])
        }
        entry += 2
        if (teamA.length > 1000) {
          break;
        }
      }
      console.log(`teamA: ${JSON.stringify(teamA)}`);

      entry += 8;

      // team A bench 
      let teamABenchCount = 1
      while (!strArr[entry].includes('Points:')) {
        teamA[`${strArr[entry].split('\r')[1].split('\n')[1]}${teamABenchCount}`] = {
          player: strArr[entry + 1],
          points: parseInt(strArr[entry + 2].split('\n')[0].split('\r')[0])
        }
        entry += 2
        teamABenchCount += 1;
        if (teamA.length > 1000) {
          break;
        }
      }
      console.log(`teamA with bench: ${JSON.stringify(teamA)}`);
      entry += 2;

      let teamB = {};

      teamB.name = {
        value: strArr[entry]
      };
      entry += 8;

      // team B starting lineup 
      while (!strArr[entry].includes('Points:')) {
        teamB[`teamB${strArr[entry].split('\n')[1]}`] ={
          player: strArr[entry + 1],
          points: parseInt(strArr[entry + 2].split('\n')[0].split('\r')[0])
        }
        entry += 2
        if (teamB.length > 1000) {
          break;
        }
      }
      console.log(`teamB: ${JSON.stringify(teamB)}`);

      entry += 8;

      // team B bench 
      let teamBBenchCount = 1
      while (!strArr[entry].includes('Points:')) {
        teamB[`${strArr[entry].split('\r')[1].split('\n')[1]}${teamBBenchCount}`] = {
          player: strArr[entry + 1],
          points: parseInt(strArr[entry + 2].split('\n')[0].split('\r')[0])
        }
        entry += 2
        teamBBenchCount += 1;
        if (teamB.length > 1000) {
          break;
        }
      }
      console.log(`teamB with bench: ${JSON.stringify(teamB)}`);
      entry += 2;

      return {
        teamA,
        teamB
      }

    }

    console.log(`Game Log: ${JSON.stringify(gameLog(stringArray))}`);

    /**
     * 3 rows 52 columns
     * year (docname)
     * week (docname)
     * TeamAPos1 r5c1
     * TeamAPos2 r6c1
     * TeamAPos3 ...
     * TeamAPos4
     * TeamAPos5
     * TeamAPos6
     * TeamAPos7
     * TeamAPos8
     * TeamAPos9 r13c1
     * TeamABN1
     * TeamABN2
     * TeamABN3
     * TeamABN4
     * TeamABN5
     * TeamABN6
     * TeamABN7
     * TeamABN8
     */
  }
};