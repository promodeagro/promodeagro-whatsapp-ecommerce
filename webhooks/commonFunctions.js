const https = require("https");

const AWS = require('aws-sdk');

require('dotenv').config();

// AWS.config.update({
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//     region: process.env.AWS_REGION
// });

const dynamodb = new AWS.DynamoDB.DocumentClient();




// Define the sendReply function
async function sendReply(phone_number_id, whatsapp_token, to, reply_message) {
    try {
        const json = {
            messaging_product: "whatsapp",
            to: to,
            text: { body: reply_message },
        };

        const data = JSON.stringify(json);
        const path = `/v18.0/${phone_number_id}/messages`;

        const options = {
            host: "graph.facebook.com",
            path: path,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + whatsapp_token
            }
        };

        // Use a promise to handle the http request
        const response = await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let str = "";
                res.on("data", (chunk) => {
                    str += chunk;
                });
                res.on("end", () => {
                    resolve(str);
                });
            });

            req.on("error", (e) => {
                reject(e);
            });

            req.write(data);
            req.end();
        });

        // You can handle the response here if needed

        return response;
    } catch (error) {
        console.error('Error in sendReply:', error);
        throw error;
    }
}




function formatMergeCartMessage(previousOrderCart) {
    // Initialize an empty string to store the formatted message
    let message = 'Previous Order Items:\n';

    // Loop through each item in the previous order cart
    previousOrderCart.forEach((item, index) => {
        // Format the item details
        const itemDetails = `Product ID: ${item.productId}, Quantity: ${item.quantity}, Price: ${item.price}\n`;
        // Append the formatted item details to the message
        message += itemDetails;
        console.log('message' + message);
    });

    // Return the formatted message
    return message;

}


function mergeCarts(currentCart, previousOrderCart) {
    // Check if previousOrderCart.items is an array
    if (!Array.isArray(previousOrderCart.items)) {
        previousOrderCart.items = [];
    }
    // Merge the current cart items with the previous incomplete order cart items
    const mergedItems = [...currentCart.items, ...previousOrderCart.items];
    // Return the merged cart object
    return { items: mergedItems };
}

function calculateTotalAmount(cartItems) {
    let totalAmount = 0;
    for (const item of cartItems) {
        totalAmount += item.quantity * item.price;
    }
    return totalAmount;
}



module.exports = {
    sendReply,
    formatMergeCartMessage,
    mergeCarts,
    calculateTotalAmount
}