const axios = require('axios');


// const categories = [
//   {
//     "CategoryName": "Bengali Special",
//     "Subcategories": ["Bengali Groceries", "Bengali Home Needs", "Bengali Vegetables"]
//   },
//   {
//     "CategoryName": "Dairy",
//     "Subcategories": ["Butter & Ghee", "Milk", "Paneer & Khowa"]
//   },
//   {
//     "CategoryName": "Eggs Meat & Fish",
//     "Subcategories": ["Chicken", "Eggs", "Fish", "Mutton"]
//   },
//   {
//     "CategoryName": "Fresh Fruits",
//     "Subcategories": ["Daily Fruits", "Dry Fruits", "Exotic Fruits"]
//   },
//   {
//     "CategoryName": "Fresh Vegetables",
//     "Subcategories": ["Daily Vegetables", "Exotic Vegetables", "Leafy Vegetables"]
//   },
//   {
//     "CategoryName": "Groceries",
//     "Subcategories": ["Cooking Oil", "Daal", "Rice", "Snacks", "Spices"]
//   }
// ];

// async function sendCategorySelection(number, token) {
//   try {
//     console.log("send category");

//     // Constructing the interactive list with categories and subcategories
//     let data = JSON.stringify({
//       "messaging_product": "whatsapp",
//       "recipient_type": "individual",
//       "to": number,
//       "type": "interactive",
//       "interactive": {
//         "type": "list",
//         "header": {
//           "type": "text",
//           "text": "Select Category"
//         },
//         "body": {
//           "text": "Please choose a category to explore subcategories."
//         },
//         "footer": {
//           "text": "Pramode Agro Farms"
//         },
//         "action": {
//           "button": "View Categories",
//           "sections": categories.map(category => ({
//             "title": category.CategoryName,
//             "rows": category.Subcategories.map(subcategory => ({
//               "id": `row_${subcategory.toLowerCase().replace(/\s+/g, '_')}`,
//               "title": subcategory,
//               "description": `Explore items under ${subcategory}`
//             }))
//           }))
//         }
//       }
//     });

//     let config = {
//       method: 'post',
//       url: 'https://graph.facebook.com/v19.0/208582795666783/messages',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`
//       },
//       data: data
//     };


//     console.log(config)

//     const response = await axios.request(config);
//     console.log(response);
//     return response.data;

//   } catch (error) {
//     return {
//       error: error.message,
//       details: error.response ? error.response.data : null
//     };
//   }
// }


// async function sendCategorySelection(number, token) {

//   try {
//     let data = JSON.stringify({
//       "messaging_product": "whatsapp",
//       "recipient_type": "individual",
//       "to": number,
//       "type": "interactive",
//       "interactive": {
//         "type": "list",
//         "header": {
//           "type": "text",
//           "text": "Select Category"
//         },
//         "body": {
//           "text": "Please choose a category to explore subcategories."
//         },
//         "footer": {
//           "text": "Pramode Agro Farms"
//         },
//         "action": {
//           "button": "View Categories",
//           "sections": categories.map(category => ({
//             "title": category.CategoryName,
//             "rows": category.Subcategories.map(subcategory => ({
//               "id": `row_${subcategory.toLowerCase().replace(/\s+/g, '_')}`,
//               "title": subcategory,
//               "description": `Explore items under ${subcategory}`
//             }))
//           }))
//         }
//       }
//     });


//     let config = {
//       method: 'post',
//       url: 'https://graph.facebook.com/v19.0/208582795666783/messages',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`
//       },
//       data: data
//     };

//     const response = await axios.request(config);
//     console.log(response)
//     return response.data;
//   } catch (error) {
//     return {
//       error: error.message,
//       details: error.response ? error.response.data : null
//     };
//   }
// }

async function sendCategorySelection(number, whatsappToken) {
  try {
      // Step 1: Fetch categories from the API
      const categoryResponse = await axios.get('https://9ti4fcd117.execute-api.ap-south-1.amazonaws.com/category');
      const categories = categoryResponse.data;

      // Step 2: Map categories to WhatsApp interactive list format
      const sections = [
          {
              title: "Categories",
              rows: categories.map((category) => ({
                  id: category.CategoryName, // unique id for each category
                  title: category.CategoryName,
                  description: category.Subcategories.join(", ")
              }))
          }
      ];

      // Step 3: Prepare the message payload
      let data = JSON.stringify({
          "messaging_product": "whatsapp",
          "recipient_type": "individual",
          "to": number,
          "type": "interactive",
          "interactive": {
              "type": "list",
              "header": {
                  "type": "text",
                  "text": "Select Category"
              },
              "body": {
                  "text": "Please choose a category."
              },
              "footer": {
                  "text": "Pramode Agro Farms"
              },
              "action": {
                  "button": "View Categories",
                  "sections": sections
              }
          }
      });

      // Step 4: Send the message via WhatsApp API
      let config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: 'https://graph.facebook.com/v19.0/208582795666783/messages',
          headers: { 
              'Content-Type': 'application/json', 
              'Authorization': `Bearer ${whatsappToken}`
          },
          data: data
      };

      const response = await axios.request(config);
      console.log(JSON.stringify(response.data));
      return response.data;
  } catch (error) {
      console.error('Error sending categories:', error.message);
      return {
          error: error.message,
          details: error.response ? error.response.data : null
      };
  }
}

async function sendCategoryCatlog(token, phoneNumber, products, title) {
  // Construct the data object with the provided parameters
  let data = JSON.stringify({
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": phoneNumber,
    "type": "interactive",
    "interactive": {
      "type": "product_list",
      "header": {
        "type": "text",
        "text": "Select Products"
      },
      "body": {
        "text": "Pramode Agro Farms"
      },
      "footer": {
        "text": "Fresh Fruits and Vegetables"
      },
      "action": {
        "catalog_id": "801561144856518",
        "sections": [
          {
            "title": title,
            "product_items": products.map(id => ({
              "product_retailer_id": id
            }))
          }
        ]
      }
    }
  });

  // Construct the config object with the provided token
  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://graph.facebook.com/v19.0/208582795666783/messages',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    data: data
  };

  // Send the request and return the response data
  try {
    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    throw error; // Propagate the error for the caller to handle
  }
}

// Example usage:
// sendWhatsAppMessage(
//   'YOUR_ACCESS_TOKEN',
//   '8317582549',
//   ['788086716268', '19545137084'],
//   'Fruits'
// )
// .then((data) => {
//   console.log(JSON.stringify(data));
// })
// .catch((error) => {
//   console.error(error);
// });





module.exports = {
  sendCategorySelection,
  sendCategoryCatlog
};
