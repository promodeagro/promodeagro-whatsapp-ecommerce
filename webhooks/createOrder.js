const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
require('dotenv').config(); // If you are using environment variables from a .env file

const REGION = 'us-east-1'; // Replace with your desired region
const FUNCTION_NAME = 'arn:aws:lambda:us-east-1:851725323791:function:promodeAgro-ecommerce-api-prod-orderProcesStepFunctionCall'; // Replace with your Lambda function name

const lambdaClient = new LambdaClient({ region: REGION });

const createOrder = async (payload) => {
    try {
        const params = {
            FunctionName: FUNCTION_NAME,
            Payload: JSON.stringify(payload),
        };

        const command = new InvokeCommand(params);
        const response = await lambdaClient.send(command);

        // Decode and parse the Lambda response
        const responsePayload = JSON.parse(Buffer.from(response.Payload).toString());
        return responsePayload;
    } catch (error) {
        console.error('Error invoking Lambda function:', error);
        throw new Error(error.message);
    }
};
module.exports = {

  createOrder,

};
