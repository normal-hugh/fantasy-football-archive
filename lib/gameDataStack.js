import { Construct } from "constructs";
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import { RemovalPolicy, Stack } from "aws-cdk-lib";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import { S3EventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { EventType } from "aws-cdk-lib/aws-s3";

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

    const gameDataParser = new Function(this, "WidgetHandler", {
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset("resources"),
      handler: "gameDataHandler.main",
      environment: {
      }
    });

    csvDump.grantRead(gameDataParser);
    gameDB.grantWriteData(gameDataParser);

    gameDataParser.addEventSource(new S3EventSource(csvDump, {
      events: [ EventType.OBJECT_CREATED ],
    }))

  }
}

export default { MyStack }