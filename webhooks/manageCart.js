const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const axios = require('axios');

// Helper function to get the current cart from DynamoDB
async function getCurrentCart(senderId) {
    const params = {
        TableName: 'sessions',
        Key: { 'sender_id': senderId }, // Define the primary key

    };

    try {
        const data = await dynamoDB.get(params).promise();
        return data.Item ? data.Item.cart : null;
    } catch (error) {
        console.error('Error fetching current cart:', error);
        throw error;
    }
}

// Helper function to update the cart in DynamoDB
async function updateCartInDynamoDB(senderId, cart) {
    const params = {
        TableName: 'sessions',
        Key: { 'sender_id': senderId }, // Define the primary key
        UpdateExpression: 'set cart = :cart',
        ExpressionAttributeValues: {
            ':cart': cart
        }
    };

    try {
        await dynamoDB.update(params).promise();
    } catch (error) {
        console.error('Error updating cart in DynamoDB:', error);
        throw error;
    }
}

async function sendCurrentItems(number, token, items) {
    try {
      // Format the items into a string
      let itemsList = items.map(item => `${item.name}\nPrice: ${item.price} quantity: ${item.quantity}`).join('\n\n');
  
      let data = JSON.stringify({
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": number,
        "type": "text",
        "text": {
          "body": `Current items in your cart:\n\n${itemsList}`
        }
      });
  
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
  
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      console.error(error);
      return { error: error.message };
    }
  }


async function sendBill(number, token, items) {
  try {
    // Format the items into a string
    let itemsList = items.map(item => `${item.name}\nPrice: ${item.price} quantity: ${item.quantity}`).join('\n\n');

    let data = JSON.stringify({
      "messaging_product": "whatsapp",
      "recipient_type": "individual",
      "to": number,
      "type": "text",
      "text": {
        "body": `Current items in your cart:\n\n${itemsList}`
      }
    });

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

    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
}

// async function sendBill(number, token, items) {
//   try {
//     // Calculate the total price and format the items into a string
//     let totalPrice = 0;
//     let itemsList = items.map(item => {
//       let subtotal = item.price * item.quantity;
//       totalPrice += subtotal;
//       return `${item.name}\nPrice: ${item.price}\nQuantity: ${item.quantity}\nSubtotal: ${subtotal}`;
//     }).join('\n\n');

//     let data = JSON.stringify({
//       "messaging_product": "whatsapp",
//       "recipient_type": "individual",
//       "to": number,
//       "type": "text",
//       "text": {
//         "body": `Current items in your cart:\n\n${itemsList}\n\nTotal: ${totalPrice}`
//       }
//     });

//     let config = {
//       method: 'post',
//       maxBodyLength: Infinity,
//       url: 'https://graph.facebook.com/v19.0/208582795666783/messages',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`
//       },
//       data: data
//     };

//     const response = await axios.request(config);
//     return response.data;
//   } catch (error) {
//     console.error(error);
//     return { error: error.message };
//   }
// }

async function sendBill(number, token, items) {
  try {
    // Calculate the total price and format the items into a string
    let totalPrice = 0;
    let itemsList = items.map(item => {
      let price = parseFloat(item.price);
      let quantity = parseInt(item.quantity);
      let subtotal = price * quantity;
      totalPrice += subtotal;

      // Return the formatted string for each item
      return `${item.name.padEnd(20)} ${price.toFixed(2).padStart(6)} ${quantity.toString().padStart(8)} ${subtotal.toFixed(2).padStart(8)}`;
    }).join('\n');

    // Format the bill content
    let billContent = `
* Your Bill *

Item                 Price  Qty  Subtotal
----------------------------------------
${itemsList}
----------------------------------------
Total: ${totalPrice.toFixed(2).padStart(8)}
`;

    let data = JSON.stringify({
      "messaging_product": "whatsapp",
      "recipient_type": "individual",
      "to": number,
      "type": "text",
      "text": {
        "body": billContent.trim()
      }
    });

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

    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
}




module.exports = {
    getCurrentCart,
    updateCartInDynamoDB,
    sendCurrentItems,
    sendBill

  };
  