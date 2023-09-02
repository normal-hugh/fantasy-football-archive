import { RemovalPolicy, Stack } from "aws-cdk-lib";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import { S3EventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { EventType } from "aws-cdk-lib/aws-s3";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";

class MyStack extends Stack {
  constructor(scope, id) {
    super(scope, id);

    const csvDump = new s3.Bucket(this, 'csvDump', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY
    })

    const gameDB = new ddb.Table(this, 'gameData', {
      partitionKey: { name: 'id', type: ddb.AttributeType.STRING },
    })

    const gameDataParser = new NodejsFunction(this, "GameDataLambda", {
      runtime: Runtime.NODEJS_18_X,
      entry: 'resources/gameDataLambda.js',
      handler: 'handler',
    })

    csvDump.grantRead(gameDataParser);
    gameDB.grantWriteData(gameDataParser);

    gameDataParser.addEventSource(new S3EventSource(csvDump, {
      events: [ EventType.OBJECT_CREATED ],
    }))

  }
}

export default { MyStack }