const xlsx = require('xlsx');
const path = require('path');

/**
 * Reads data from an Excel file, splits names, and stores them in a new Excel file.
 * @param {string} filePath - The path to the Excel file.
 * @param {string} outputFilePath - The path to the new Excel file.
 */
function splitNamesAndStoreContacts(filePath, outputFilePath) {
  // Read the Excel file
  const workbook = xlsx.readFile(filePath);
  let totalRecords = 0;
  const processedData = [];

  // Regular expression to match the pattern of one uppercase letter followed by three or four digits
  const pattern = /[A-Z]\d{3,4}$/;

  // Iterate over all sheets
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];

    // Convert the sheet to JSON
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    totalRecords += jsonData.length;

    // Extract and split names
    jsonData.forEach(row => {
      const name = row['Name'] || row['name'] || row['Saved Name'];
      const number = row['Number'] || row['number'] || row['Phone Number'];
      const groupName = row['Group'] || row['group name'] || row['Group Name'];

      let modifiedName = name;
      let tower = '';
      let flat = '';

      if (name && pattern.test(name)) {
        const namePart = name.slice(0, -4);
        tower = name.slice(-4, -3);
        flat = name.slice(-3);

        // Adjust for the case where there are four digits
        if (/\d{4}$/.test(name.slice(-4))) {
          flat = name.slice(-4);
          tower = name.slice(-5, -4);
          modifiedName = name.slice(0, -5).trim();
        } else {
          modifiedName = namePart.trim();
        }
      }

      processedData.push({
        Name: modifiedName,
        Tower: tower,
        Flat: flat,
        Number: number,
        Group: groupName
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
const filePath = path.join('/home/umran/Downloads/filtered-contacts.xlsx');
const outputFilePath = path.join('/home/umran/Downloads/split-contacts.xlsx');
splitNamesAndStoreContacts(filePath, outputFilePath);
