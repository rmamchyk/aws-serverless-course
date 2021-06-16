const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-central-1' });

const dynamodb = new AWS.DynamoDB.DocumentClient();

const tableName = process.env.TABLE_NAME;

exports.handler = async (event) => {
    const userid = event.pathParameters.userid;

    const data = await dynamodb.get({
        TableName: tableName,
        Key: {
            userid
        }
    }).promise();

    if (data.Item) {
        return {
            statusCode: 200,
            body: JSON.stringify(data.Item)
        };
    } else {
        return {
            statusCode: 404,
            body: JSON.stringify({
                message: 'User not found.'
            })
        }
    }
}