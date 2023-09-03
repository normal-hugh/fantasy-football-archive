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

    const weekYear = fileName.split('.csv')[0].split('W')
    const week = weekYear[1]
    const year = weekYear[0]
    console.log(`parsing game results for week ${week} of ${year}`)

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
    const gameLog = (strArr, startingEntry = 0, game = {}, gameNumber = 1) => {
      let entry = startingEntry; // column counter
      let teamA = {};

      const adjTeamName = entry !== 0
        ? strArr[entry]
        : strArr[entry].split('\r')[1].split('\n')[1];
      teamA.name = {
        value: adjTeamName
      };
      entry += 8;

      // team A starting lineup 
      while (!strArr[entry].includes('Points:')) {
        const position = strArr[entry].split('\n')[1].replace('W/R', 'Flex')
        const adjPosition = teamA[`teamA${position}`] ? `teamA${position}2` : `teamA${position}`;
        teamA[adjPosition] = {
          player: strArr[entry + 1],
          points: parseFloat(strArr[entry + 2].split('\n')[0].split('\r')[0])
        }
        entry += 2
        if (teamA.length > 1000) {
          break;
        }
      }

      entry += 8;

      // team A bench 
      let teamABenchCount = 1
      while (!strArr[entry].includes('Points:')) {
        teamA[`teamA${strArr[entry].split('\r')[1].split('\n')[1]}${teamABenchCount}`] = {
          player: strArr[entry + 1],
          points: parseFloat(strArr[entry + 2].split('\n')[0].split('\r')[0])
        }
        entry += 2
        teamABenchCount += 1;
        if (teamA.length > 1000) {
          break;
        }
      }
      entry += 2;

      let teamB = {};

      teamB.name = {
        value: strArr[entry]
      };
      entry += 8;

      // team B starting lineup 
      while (!strArr[entry].includes('Points:')) {
        const position = strArr[entry].split('\n')[1].replace('W/R', 'Flex')
        const adjPosition = teamB[`teamB${position}`] ? `teamB${position}2` : `teamB${position}`;
        teamB[adjPosition] = {
          player: strArr[entry + 1],
          points: parseFloat(strArr[entry + 2].split('\n')[0].split('\r')[0])
        }
        entry += 2
        if (teamB.length > 1000) {
          break;
        }
      }

      entry += 8;

      // team B bench 
      let teamBBenchCount = 1
      while (!strArr[entry].includes('Points:')) {
        teamB[`teamB${strArr[entry].split('\r')[1].split('\n')[1]}${teamBBenchCount}`] = {
          player: strArr[entry + 1],
          points: parseFloat(strArr[entry + 2].split('\n')[0].split('\r')[0])
        }
        entry += 2
        teamBBenchCount += 1;
        if (teamB.length > 1000) {
          break;
        }
      }
      entry += 2;

      const fullGameLog = {
        ...game,
        [gameNumber]: {
          teamA,
          teamB
        }
      }

      if (strArr[entry + 52]) {
        console.log(JSON.stringify(fullGameLog))
        return gameLog(strArr, entry, fullGameLog, gameNumber + 1)
      }
      console.log(JSON.stringify(fullGameLog))
      return fullGameLog;

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