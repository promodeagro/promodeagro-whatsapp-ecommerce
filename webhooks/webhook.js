const https = require("https");
const { sendCatalogMessage } = require("./sendCatalog");
const { getUserAddressFromDatabase, sendAddressMessageWithSavedAddresses, storeUserResponse } = require("./getAddress");
//const { client, connectToDatabase } = require("./db");
const { setIncompleteOrderAlertSent, getIncompleteOrderAlertSent,getPreviousIncompleteOrder} = require('./alertOrder')
const { sendButtons} = require('./merge');
const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

// Import the getSession and updateSession functions
async function getSession(senderId) {
    const params = {
        TableName: 'sessions',
        Key: {
            'sender_id': senderId
        }
    };

    try {
        const result = await dynamodb.get(params).promise();
        return result.Item ? result.Item.session_data : {};
    } catch (error) {
        console.error('Error getting session from DynamoDB:', error);
        throw error;
    }
}



// Function to update session in DynamoDB
async function updateSession(senderId, newSessionData) {
    try {
        // Fetch existing session data
        const existingSession = await getSession(senderId);

        // Merge existing session data with new session data
        const mergedSession = { ...existingSession, ...newSessionData };

        // Update session in DynamoDB with merged session data
        const params = {
            TableName: 'sessions', // Specify the table name
            Key: { 'sender_id': senderId }, // Define the primary key
            UpdateExpression: 'SET session_data = :data', // Update expression
            ExpressionAttributeValues: {
                ':data': mergedSession // Update with merged session data
            },
            ReturnValues: 'ALL_NEW' // Specify what to return after the update
        };

        const result = await dynamodb.update(params).promise(); // Update item in DynamoDB

        return result.Attributes.session_data; // Return updated session data
    } catch (error) {
        console.error('Error updating session in DynamoDB:', error);
        throw error;
    }
}

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
 

            exports.handler = async (event) => {
               // console.log('Received event:', JSON.stringify(event));
            
                try {
                    if (!event || !event.requestContext || !event.requestContext.http || !event.requestContext.http.method || !event.requestContext.http.path) {
                        console.error('Invalid event:', event);
                        return {
                            statusCode: 400,
                            body: JSON.stringify({ error: 'Invalid event' }),
                        };
                    }
            
                    console.log('Received HTTP method:', event.requestContext.http.method);
            
                    const WHATSAPP_TOKEN = process.env.whatsapp_Token;
            
                    if (event.requestContext.http.method === "GET") {
                        const queryParams = event.queryStringParameters;
                        if (queryParams) {
                            const mode = queryParams["hub.mode"];
                            const verifyToken = queryParams["hub.verify_token"];
                            const challenge = queryParams["hub.challenge"];
            
                            if (mode === "subscribe" && verifyToken === process.env.VERIFY_TOKEN) {
                                return {
                                    statusCode: 200,
                                    body: challenge,
                                    isBase64Encoded: false
                                };
                            } else {
                                const responseBody = "Error, wrong validation token";
                                return {
                                    statusCode: 403,
                                    body: JSON.stringify(responseBody),
                                    isBase64Encoded: false
                                };
                            }
                        } else {
                            const responseBody = "Error, no query parameters";
                            return {
                                statusCode: 403,
                                body: JSON.stringify(responseBody),
                                isBase64Encoded: false
                            };
                        }
                    } else if (event.requestContext.http.method === 'POST') {
                        const body = JSON.parse(event.body);
                    
                        if (body && body.entry) {
                            for (const entry of body.entry) {
                                for (const change of entry.changes) {
                                    const value = change.value;
                    
                                    if (value != null && value.messages != null) {
                                        const phone_number_id = value.metadata.phone_number_id;
                                        console.log('@@' + value + "dm");
                                        for (const message of value.messages) {
                                            const senderId = message.from;
                                            console.log('====================================');
                                            console.log(message);
                                            console.log('====================================');
                                            let session = await getSession(senderId);
                                            if (!session) {
                                                session = {};
                                            }
                                            
                                            let incompleteOrderAlertSent = await getIncompleteOrderAlertSent(senderId);

                                            switch (message.type) {
                                                case 'text':
                                                    console.log('Received text message');
                                                    // Send catalog options first
                                                    const reply_message = 'Welcome TO Synectiks_Farms';
                                                    await sendReply(phone_number_id, WHATSAPP_TOKEN, senderId, reply_message);
                                                    await sendCatalogMessage(senderId, WHATSAPP_TOKEN);
                                                    break;
                                            
                                                case 'order':
                                                    // Check if the order message contains product items
                                                    const productItems = message.order.product_items;
                                                    
                                                    // Store the product items in a variable
                                                    const newCartItems = productItems.map(item => ({
                                                        productId: item.product_retailer_id,
                                                        quantity: item.quantity,
                                                        price: item.item_price,
                                                        // Add other details as needed
                                                    }));
                                                    console.log('New Cart Items:', JSON.stringify(newCartItems));
                                                    // Fetch previous incomplete orders
                                                    const previousOrders = await getPreviousIncompleteOrder(senderId);
                                            
                                                    // Check if there are existing cart items
                                                    if (!session.cart || !session.cart.items) {
                                                        // If no existing cart items, initialize the cart with the new items
                                                        session.cart = { items: newCartItems };
                                                    } else {
                                                        // If existing cart items, append the new items to the existing list
                                                        session.cart.items.push(...newCartItems);
                                                    }
                                                    console.log('Updated Session Cart:', JSON.stringify(session.cart));
                                                    // Update the session
                                                    //session = await updateSession(senderId, session);
                                            
                                                    // Check for incomplete orders after a delay
                                                    setTimeout(async () => {
                                                        try {
                                                            // Fetch the previous incomplete order
                                                            const previousOrder = await getPreviousIncompleteOrder(senderId);
                                                            session = await updateSession(senderId, session);
                                            
                                                            if (session && session.cart && session.cart.items && session.cart.items.length > 0) {
                                                                // Check if there's an incomplete order alert already sent
                                                                if (incompleteOrderAlertSent) {
                                                                    // If incompleteOrderAlertSent is true, send the button template for incomplete order
                                                                    const incompleteOrderTotal = calculateTotalAmount(previousOrder.cart);
                                                                    const incompleteOrderItems = previousOrder.cart.map(item => `${item.quantity} x ${item.productId} - $${item.price}`);
                                                                    const incompleteOrderMessage = `Your previous order is incomplete. Total amount: ${incompleteOrderTotal}. Previous order items: ${incompleteOrderItems.join(', ')}. Please choose an option:`;
                                                    
                                                                    // Define the options with merge and continue buttons
                                                                    const options = {
                                                                        messaging_product: "whatsapp",
                                                                        recipient_type: "individual",
                                                                        to: senderId,
                                                                        type: "interactive",
                                                                        interactive: {
                                                                            type: "button",
                                                                            body: {
                                                                                text: incompleteOrderMessage
                                                                            },
                                                                            action: {
                                                                                buttons: [
                                                                                    {
                                                                                        type: "reply",
                                                                                        reply: {
                                                                                            id: "merge_button",
                                                                                            title: "Merge Order"
                                                                                        }
                                                                                    },
                                                                                    {
                                                                                        type: "reply",
                                                                                        reply: {
                                                                                            id: "continue_button",
                                                                                            title: "Continue Order"
                                                                                        }
                                                                                    }
                                                                                ]
                                                                            }
                                                                        }
                                                                    };
                                                    
                                                                    await sendButtons(WHATSAPP_TOKEN, options);
                                                                } else {
                                                                    // If incompleteOrderAlertSent is false, send the address template directly
                                                                    const userDetails = await getUserAddressFromDatabase(senderId);
                                                                    await sendAddressMessageWithSavedAddresses(senderId, WHATSAPP_TOKEN, userDetails);
                                                                    // Set incompleteOrderAlertSent to true after sending the address template
                                                                    await setIncompleteOrderAlertSent(senderId, true);
                                                                }
                                                            } else {
                                                                // If there are no items in the cart, send the address template directly
                                                                const userDetails = await getUserAddressFromDatabase(senderId);
                                                                await sendAddressMessageWithSavedAddresses(senderId, WHATSAPP_TOKEN, userDetails);
                                                                // Set incompleteOrderAlertSent to true after sending the address template
                                                                await setIncompleteOrderAlertSent(senderId, true);
                                                            }
                                                        } catch (error) {
                                                            console.error('Error processing incomplete order:', error);
                                                        }
                                                    }, 1000);
                                            
                                                    break;
                                            
                                            
                                                    case 'interactive':
    if (message.interactive.type === 'button_reply') {
        // Handle button reply
        const buttonReplyId = message.interactive.button_reply.id;
        switch (buttonReplyId) {
            case 'continue_button':
                // Handle continue button action
                // Reset the incomplete order flag
                incompleteOrderAlertSent = false;
                // Update the session to clear incomplete order flag
                session.incompleteOrderAlertSent = false;
                // Save the updated session
                session = await updateSession(senderId, session);
                // Update the incomplete order alert flag in the database
                await setIncompleteOrderAlertSent(senderId, false);

                // Debugging information
                console.log('Debugging information:');
                console.log('message:', message);

                // Check if message.order exists
                if (message.order && message.order.product_items && Array.isArray(message.order.product_items) && message.order.product_items.length > 0) {
                    // Define newCartItems and print recently added cart items to console
                    const newCartItems = message.order.product_items.map(item => ({
                        productId: item.product_retailer_id,
                        quantity: item.quantity,
                        price: item.item_price
                    }));

                    console.log("Recently added cart items after continuing:", newCartItems);
                    newCartItems.forEach(item => {
                        console.log(`Product ID: ${item.productId}, Quantity: ${item.quantity}, Price: ${item.price}`);
                        // You can add other details as needed
                    });
                    // Update session cart with new items
                    if (!session.cart || !session.cart.items) {
                        session.cart = { items: newCartItems };
                    } else {
                        session.cart.items.push(...newCartItems);
                    }
                } else {
                    console.error('Unable to retrieve valid product items from the continue button action.');
                    console.log('message.order:', message.order);
                }

                // After handling the button response, send the address button
                const userDetails = await getUserAddressFromDatabase(senderId);
                await sendAddressMessageWithSavedAddresses(senderId, WHATSAPP_TOKEN, userDetails);
                break;
        }
    }
    break;

                                                    
            
        
        default:
            // Handle unknown message types gracefully
            console.error('Unknown message type:', message.type);
            break;
        
                                                                                                    }

                                                        // After handling the button response, send the address button
                                                                               
                                            
                                        }
                                    }
                                }
                            }
                        }
                    
                                                return {
                                                    statusCode: 200,
                                                    body: JSON.stringify({ message: 'Done' }),
                                                    isBase64Encoded: false,
                                                };
                                            } else {
                                                const responseBody = 'Unsupported method';
                                                return {
                                                    statusCode: 403,
                                                    body: JSON.stringify(responseBody),
                                                    isBase64Encoded: false,
                                                };
                                            }
                                            } catch (error) {
                                            console.error('Error in handler:', error);
                                            return {
                                                statusCode: 500,
                                                body: JSON.stringify({ error: 'Internal Server Error' }),
                                                isBase64Encoded: false,
                                            };
                                            }
                                            };
                                            

                    function calculateTotalAmount(cartItems) {
                        let totalAmount = 0;
                        for (const item of cartItems) {
                            totalAmount += item.quantity * item.price;
                        }
                        return totalAmount;
                    }
                    // Example implementation of processOrderItems function
                    function formatMergeCartMessage(previousOrderCart) {
                        // Initialize an empty string to store the formatted message
                        let message = 'Previous Order Items:\n';
                    
                        // Loop through each item in the previous order cart
                        previousOrderCart.forEach((item, index) => {
                            // Format the item details
                            const itemDetails = `Product ID: ${item.productId}, Quantity: ${item.quantity}, Price: ${item.price}\n`;
                            // Append the formatted item details to the message
                            message += itemDetails;
                            console.log('message'+message);
                        });
                    
                        // Return the formatted message
                        return message;
                        
                    }
                    
// Example implementation of calculateTotalPrice function
function calculateTotalPrice(orders) {
    // Check if orders is null or undefined
    if (!orders) {
        console.error('Orders is null or undefined');
        return 0; // Return 0 if orders is null or undefined
    }

    // Check if orders is iterable
    if (typeof orders[Symbol.iterator] !== 'function') {
        console.error('Orders is not iterable');
        return 0; // Return 0 if orders is not iterable
    }

    // Initialize total price
    let totalPrice = 0;

    // Loop through each order and accumulate the total price
    for (const order of orders) {
        totalPrice += order.price * order.quantity;
    }

    return totalPrice;
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
