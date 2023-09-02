import { App } from 'aws-cdk-lib';
import myStack from './gameDataStack.js';

const app = new App();
new myStack.MyStack(app, 'GameDataStack');
