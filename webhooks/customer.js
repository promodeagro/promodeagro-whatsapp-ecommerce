const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoDbClient = new DynamoDBClient({ region: 'us-east-1' });
getcustomer = async (phone) => {
    
    const params = {
        TableName: 'Customers',
        FilterExpression: 'phone = :phone',
        ExpressionAttributeValues: {
            ':phone': { S: phone }
        }
    };

    try {
        const data = await dynamoDbClient.send(new ScanCommand(params));
        const customers = data.Items.map(item => unmarshall(item));

        return {
            statusCode: 200,
            body: { customers }
        };
    } catch (err) {
        console.error('Error retrieving customer:', err);

        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        };
    }
};
module.exports = {
 getcustomer
}