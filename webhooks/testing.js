const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

const REGION = 'us-east-1'; // Replace with your region
const TABLE_NAME = 'sessions'; // Replace with your table name

const dynamoDBClient = new DynamoDBClient({ region: REGION });

cartRemove = async (event) => {
    const { sender_id } = event.pathParameters; // Assuming sessionId is passed as a path parameter

    if (!sender_id) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Invalid input. "sessionId" is required.' }),
        };
    }

    try {
        const params = {
            TableName: TABLE_NAME,
            Key: {
                sender_id: { S: sender_id },
            },
            UpdateExpression: 'REMOVE cart',
            ReturnValues: 'UPDATED_NEW',
        };

        const command = new UpdateItemCommand(params);
        const result = await dynamoDBClient.send(command);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Cart emptied successfully.', result }),
        };
    } catch (error) {
        console.error('Failed to empty cart:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};


(async () => {
    const event = {
        pathParameters: {
            sender_id: '918317582549', // Replace with a valid sessionId
        },
    };

    try {
        const result = await cartRemove(event);
        console.log(result);
    } catch (error) {
        console.error('Error:', error);
    }
})();
