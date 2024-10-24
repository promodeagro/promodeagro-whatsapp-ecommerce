const xlsx = require('xlsx');
const path = require('path');

/**
 * Reads data from an Excel file, processes group names, and stores the processed data in a new Excel file.
 * @param {string} filePath - The path to the Excel file.
 * @param {string} outputFilePath - The path to the new Excel file.
 */
function processAndStoreGroupNames(filePath, outputFilePath) {
  // Read the Excel file
  const workbook = xlsx.readFile(filePath);
  let totalRecords = 0;
  const processedData = [];

  // Iterate over all sheets
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];

    // Convert the sheet to JSON
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    totalRecords += jsonData.length;

    // Process each row
    jsonData.forEach(row => {
      const name = row['Name'] || row['name'];
      const number = row['Number'] || row['number'];
      const tower = row['Tower'] || row['tower'];
      const flat = row['Flat'] || row['flat'];
      let group = row['Group'] || row['group'];

      if (group && group.includes('PBEL')) {
        group = 'PEBEL CITY';
      } else if (group && group.includes('GIRIDHARI EXECUTIVE')) {
        group = 'GIRIDHARI EXECUTIVE';
      } else if (group && group.includes('VASATI ANANDI')) {
        group = 'VASATI ANANDI';
      } else if (group && group.includes('SMR')) {
        group = 'SMR';
      } else {
        group = ''; // Make it empty if it doesn't match any condition
      }

      processedData.push({
        Name: name,
        Tower: tower,
        Flat: flat,
        Number: number,
        Group: group
      });
    });
  });

  // Create a new workbook and worksheet for processed data
  const newWorkbook = xlsx.utils.book_new();
  const newWorksheet = xlsx.utils.json_to_sheet(processedData);

  // Append the new worksheet to the workbook
  xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, 'ProcessedContacts');

  // Write the new workbook to a file
  xlsx.writeFile(newWorkbook, outputFilePath);

  console.log(`Total number of records: ${totalRecords}`);
  console.log(`Processed contacts saved to: ${outputFilePath}`);
}

// Example usage
// const filePath = path.join('/home/umran/Downloads/contacts.xlsx');
const filePath = path.join('/home/umran/Downloads/split-contacts.xlsx');
const outputFilePath = path.join('/home/umran/Downloads/processed-contacts.xlsx');
processAndStoreGroupNames(filePath, outputFilePath);
// Example usage