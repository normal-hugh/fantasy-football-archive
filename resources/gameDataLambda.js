import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
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

    const stringArray = objectContent.split(',');
    console.log(stringArray.map((val, i) => `${i}: ${val}`));

    const gameLog = (strArr, startingEntry = 0, game = {}, gameNumber = 1) => {
      let entry = startingEntry; // column counter
      let teamA = {};

      console.log(`NEW ENTRY: ${entry}, ${strArr[entry]}`)

      const adjTeamAName = entry !== 0
        ? strArr[entry].split('\r')[1].split('\n')[1]
        : strArr[entry]
      teamA.name = {
        value: adjTeamAName
      };
      entry += 8;

      // team A starting lineup 
      while (!strArr[entry].includes('Points:')) {
        const position = strArr[entry].includes('\n') ? strArr[entry].split('\n')[1].replace('W/R', 'Flex') : '';
        const adjPosition = teamA[`teamA${position}`] ? `teamA${position}2` : `teamA${position}`;
        teamA[adjPosition] = {
          player: strArr[entry + 1],
          points: parseFloat(strArr[entry + 2].split('\n')[0].split('\r')[0])
        }
        entry += 2
      }

      entry += 8;

      // team A bench 
      let teamABenchCount = 1;
      let teamARESCount = 1;
      while (!strArr[entry].includes('Points:')) {
        const position = strArr[entry].split('\r')[1].split('\n')[1];
        let adjPosition = '';
        if (position === 'BN') {
          adjPosition = `teamABN${teamABenchCount}`
          teamABenchCount++;
        } else {
          adjPosition = `teamARES${teamARESCount}`
          teamARESCount++;
        }
        teamA[adjPosition] = {
          player: strArr[entry + 1],
          points: parseFloat(strArr[entry + 2].split('\n')[0].split('\r')[0])
        }
        entry += 2
      }
      entry += 2;

      let teamB = {};

      const adjTeamBName = entry !== 0
        ? strArr[entry].split('\r')[1].split('\n')[1]
        : strArr[entry]
      teamB.name = {
        value: adjTeamBName
      };
      entry += 8;

      // team B starting lineup 
      while (!strArr[entry].includes('Points:')) {
        const position = strArr[entry].includes('\n') ? strArr[entry].split('\n')[1].replace('W/R', 'Flex') : '';
        const adjPosition = teamB[`teamB${position}`] ? `teamB${position}2` : `teamB${position}`;
        teamB[adjPosition] = {
          player: strArr[entry + 1],
          points: parseFloat(strArr[entry + 2].split('\n')[0].split('\r')[0])
        }
        entry += 2
      }

      entry += 8;

      // team B bench 
      let teamBBenchCount = 1
      let teamBRESCount
      while (!strArr[entry].includes('Points:')) {
        const position = strArr[entry].split('\r')[1].split('\n')[1];
        let adjPosition = '';
        if (position === 'BN') {
          adjPosition = `teamBBN${teamBBenchCount}`
          teamBBenchCount++;
        } else {
          adjPosition = `teamBRES${teamBRESCount}`
          teamBRESCount++;
        }
        teamB[adjPosition] = {
          player: strArr[entry + 1],
          points: parseFloat(strArr[entry + 2].split('\n')[0].split('\r')[0])
        }
        entry += 2
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

    const finalGameLog = JSON.stringify(gameLog(stringArray))

    console.log(`Game Log: ${finalGameLog}`);

    const putParams = {
      Bucket: bucketName,
      Key: `${year}/${week}`,
      Body: finalGameLog,
      ContentType: 'application/json'
    };
    const putObjectCommand = new PutObjectCommand(putParams);
    await s3Client.send(putObjectCommand);

    // try {
    //   await s3.putObject(putParams).promise();
    // } catch (err) {
    //   console.log(err)
    // }
  }
};