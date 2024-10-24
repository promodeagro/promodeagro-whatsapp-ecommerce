const xlsx = require('xlsx');
const path = require('path');
const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
  region: 'us-east-1',
});

// Create DynamoDB service object
const dynamodb = new AWS.DynamoDB.DocumentClient();

/**
 * Generates a unique 5-digit ID.
 * @returns {string} A 5-digit unique ID.
 */
function generateUniqueId() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

/**
 * Reads data from an Excel file, processes it, and stores it in DynamoDB.
 * @param {string} filePath - The path to the Excel file.
 * @param {string} tableName - The name of the DynamoDB table.
 */
async function readExcelAndStoreInDynamoDB(filePath, tableName) {
  // Read the Excel file
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert the sheet to JSON
  const jsonData = xlsx.utils.sheet_to_json(worksheet);

  // Process data and create items for DynamoDB
  const items = jsonData.map(row => {
    return {
      id: generateUniqueId(), // Generate a unique 5-digit id
      name: row['Name'] || '',
      flat: row['Flat'] || '',
      Tower: row['Tower'] || '',
      number: row['Number'] || '',
      area: row['Group'] || ''
    };
  });

  // Store each item in DynamoDB
  for (const item of items) {
    const params = {
      TableName: tableName,
      Item: item
    };

    try {
      await dynamodb.put(params).promise();
      console.log(`Successfully inserted item: ${JSON.stringify(item)}`);
    } catch (error) {
      console.error(`Failed to insert item: ${JSON.stringify(item)}, Error: ${error}`);
    }
  }

  console.log('All items processed and stored in DynamoDB.');
}

// Example usage
const filePath = path.join('/home/umran/Downloads/processed-contacts.xlsx');
const tableName = 'Customers';
readExcelAndStoreInDynamoDB(filePath, tableName);
