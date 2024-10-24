const https = require("https");
const { sendCatalogMessage, sendPaymentLinkButton } = require("./sendCatalog");
const { getUserAddressFromDatabase, storeUserResponse, createUserInWhatsAppCommerce } = require("./getAddress");
//const { client, connectToDatabase } = require("./db");
const { createPaymentLink } = require("./createPaymentLink")
const { setIncompleteOrderAlertSent, getIncompleteOrderAlertSent, getPreviousIncompleteOrder } = require('./alertOrder')
const { sendButtons } = require('./merge');
const { sendPaymentMethod } = require('./paymentMethod')
const AWS = require('aws-sdk');
require('dotenv').config();
const { sendOrderConfirmation, addOrContinueButtons } = require("./sendOrderConfirmation")
const { sendCategorySelection, sendCategoryCatlog } = require("./sendCategorySelection")
const { fetchProductData, fetchProductDataById } = require("./fetchProducts")
const { getCurrentCart, updateCartInDynamoDB, sendBill } = require("./manageCart")



const {
    sendReply,
    calculateTotalAmount


} = require("./commonFunctions");
const { getcustomer } = require("./customer");
const { addCartItems, getUserByNumber, getCartItems, sendCurrentItems } = require("./manageCartApis.");
const { getAllAddresses, sendAddressMessageWithSavedAddresses, setDefaultAddress, addAddress } = require("./manageAddressApi");
const { createOrder } = require("./manageOrderApis");



const dynamodb = new AWS.DynamoDB.DocumentClient();


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
                                let mobileNumber = senderId.slice(2)
                                await createUserInWhatsAppCommerce(mobileNumber)


                                console.log(mobileNumber);
                                const user = await getUserByNumber(mobileNumber);
                                console.log(user)

                                var userId = user.UserId;


                                let incompleteOrderAlertSent = await getIncompleteOrderAlertSent(senderId);

                                console.log("dfedfedfedfedf")

                                console.log(message.type)


                                switch (message.type) {
                                    case 'text':
                                        console.log('Received text message');
                                        // Send catalog options first
                                        // Send catalog options first

                                        // Send catalog options first
                                        const replyMessage = `Welcome to Pramode Agro Farms! 🌾

Thank you for reaching out to us. How can we assist you today?

For immediate assistance, feel free to call our support team at +918897399587. 
We're here to help with any questions or concerns.

Looking forward to serving you! 😊`;

                                        await sendReply(phone_number_id, WHATSAPP_TOKEN, senderId, replyMessage);


                                        // await sendCatalogMessage(senderId, WHATSAPP_TOKEN);
                                        await sendCategorySelection(senderId, WHATSAPP_TOKEN);

                                        console.log("fsdafda")
                                        break;

                                    case 'order':


                                        var products = await fetchProductData();

                                        const productItems = message.order.product_items;
                                        console.log("Items of Cart");
                                        console.log(productItems);

                                        const matchedProducts = productItems.map(cartItem => {
                                            // Find matching product by product_retailer_id
                                            const matchingProduct = products.products.find(product =>
                                                product.unitPrices.some(unitPrice => unitPrice.varient_id === cartItem.product_retailer_id)
                                            );

                                            if (matchingProduct) {
                                                // Get the specific unitPrice entry that matches the cart item
                                                const matchingUnitPrice = matchingProduct.unitPrices.find(unitPrice => unitPrice.varient_id === cartItem.product_retailer_id);
                                                return {
                                                    productId: matchingProduct.id,
                                                    quantity: cartItem.quantity, // Assuming `cartItem.quantity` exists for quantity
                                                    quantityUnits: matchingUnitPrice.qty // Extract the correct unit from matching unitPrice
                                                };
                                            }

                                            return null; // Return null for unmatched products (could be filtered out later)
                                        });

                                        // Filter out any unmatched items (if necessary)
                                        const validMatchedProducts = matchedProducts.filter(item => item !== null);

                                        console.log(validMatchedProducts);



                                        await addCartItems(userId, validMatchedProducts)


                                        var currentCarts = await getCartItems(userId);

                                        console.log(currentCarts.items)


                                        await sendCurrentItems(senderId, WHATSAPP_TOKEN, currentCarts.items)


                                        await addOrContinueButtons(senderId, WHATSAPP_TOKEN);


                                        break


                                    case 'interactive':
                                        if (message.interactive.type === 'button_reply') {
                                            // Handle button reply
                                            const buttonReplyId = message.interactive.button_reply.id;
                                            console.log("REPLY BUTTONS")
                                            switch (buttonReplyId) {
                                                case 'continue_button':
                                                    // Handle continue button action
                                                    // Reset the incomplete order flag
                                                    incompleteOrderAlertSent = false;
                                                    // Update the session to clear incomplete order flag


                                                    session.incompleteOrderAlertSent = false;

                                                    // const responseJson = JSON.parse(message.interactive.nfm_reply.response_json);
                                                    // await storeUserResponse(senderId, responseJson);
                                                    // Save the updated session
                                                    session = await updateSession(senderId, session);
                                                    // Update the incomplete order alert flag in the database
                                                    await setIncompleteOrderAlertSent(senderId, false);

                                                    // Debugging information
                                                    console.log('Debugging information:');
                                                    console.log('message:', message);

                                                    // Check if message.order exists
                                                    if (message.order.product_items && Array.isArray(message.order.product_items) && message.order.product_items.length > 0) {
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
                                                case 'upi_button':


                                                    var currentCarts = await getCartItems(userId);

                                                    console.log(currentCarts.items)

                                                    var currentCarts = await getCartItems(userId);

                                                    let Upi_cartItemsList = currentCarts.items.map(item => ({
                                                        productId: item.ProductId,
                                                        quantityUnits: item.QuantityUnits,
                                                        quantity: item.Quantity
                                                    }));

                                                    console.log(Upi_cartItemsList);


                                                    const order = await createOrder(userId, user.defaultAddressId, "4f24e8cd-b3a4-4ad1-8bd4-6f7bed46e2fe", Upi_cartItemsList, "online");

                                                    console.log(order)
                                                    await sendPaymentLinkButton(senderId, WHATSAPP_TOKEN, order.paymentLink)

                                                    break;

                                                case 'cash_button':

                                                    var currentCarts = await getCartItems(userId);

                                                    console.log(currentCarts.items)

                                                    var currentCarts = await getCartItems(userId);

                                                    let cartItemsList = currentCarts.items.map(item => ({
                                                        productId: item.ProductId,
                                                        quantityUnits: item.QuantityUnits,
                                                        quantity: item.Quantity
                                                    }));

                                                    console.log(cartItemsList);


                                                    await createOrder(userId, user.defaultAddressId, "4f24e8cd-b3a4-4ad1-8bd4-6f7bed46e2fe", cartItemsList, "cash")
                                                    // console.log(Orders)
                                                    // console.log(Orders.orderId)
                                                    // await sendOrderConfirmation(Orders.orderId, senderId, WHATSAPP_TOKEN)
                                                    break;

                                                case 'add':
                                                    await sendCategorySelection(senderId, WHATSAPP_TOKEN);
                                                    break;


                                                case 'continue':
                                                    const userDetail = await getAllAddresses(userId);
                                                    console.log(userDetail)
                                                    await sendAddressMessageWithSavedAddresses(senderId, WHATSAPP_TOKEN, userDetail);
                                                    break;







                                            }
                                        } else if (message.interactive.type === 'nfm_reply') {



                                            const responseJson = JSON.parse(message.interactive.nfm_reply.response_json);

                                            console.log(responseJson.values)
                                            if (responseJson.saved_address_id) {
                                                console.log("existing Address");
                                                await setDefaultAddress(userId, responseJson.saved_address_id)
                                            } else {
                                                console.log("creating new one ")
                                                console.log(userId)
                                              const newAddress =  await addAddress(userId,responseJson.values)
                                                await setDefaultAddress(userId,newAddress.addressId )


                                            }

                                            await sendPaymentMethod(senderId, WHATSAPP_TOKEN);


                                        } else if (message.interactive.type === 'list_reply') {


                                            const buttonReplyId = message.interactive.list_reply.id;
                                            console.log("REPLY BUTTONS")
                                            switch (buttonReplyId) {

                                                case 'Fresh Fruits':
                                                    console.log("fruits Selected")
                                                    var products = await fetchProductData();

                                                    const fruits = products.products
                                                        .filter(product => product.category === "Fresh Fruits")
                                                        .map((product) => product.unitPrices[0].varient_id);


                                                    await sendCategoryCatlog(WHATSAPP_TOKEN, senderId, fruits, "Fresh Fruits")

                                                    break;



                                                case 'Bengali Special':
                                                    console.log("fruits Selected")
                                                    var products = await fetchProductData();


                                                    const Bengali_fruit = products.products
                                                        .filter(product => product.category === "Bengali Special")
                                                        .map((product) => product.unitPrices[0].varient_id);

                                                    console.log(Bengali_fruit);

                                                    await sendCategoryCatlog(WHATSAPP_TOKEN, senderId, Bengali_fruit, "Bengali Special")

                                                    break;

                                                case 'Groceries':
                                                    console.log("fruits Selected")

                                                    var products = await fetchProductData();
                                                    const Groceries = products.products
                                                        .filter(product => product.category === "Groceries")
                                                        .map((product) => product.unitPrices[0].varient_id);

                                                    // console.log(Groceries)

                                                    await sendCategoryCatlog(WHATSAPP_TOKEN, senderId, Groceries, "Groceries")

                                                    break;


                                                case 'Eggs Meat & Fish':
                                                    console.log("fruits Selected")

                                                    var products = await fetchProductData();
                                                    const EGG_Meat = products.products
                                                        .filter(product => product.category === "Eggs Meat & Fish")
                                                        .map((product) => product.unitPrices[0].varient_id);

                                                    console.log(EGG_Meat)

                                                    await sendCategoryCatlog(WHATSAPP_TOKEN, senderId, EGG_Meat, "Eggs")

                                                    break;

                                                case 'Dairy':
                                                    console.log("fruits Selected")

                                                    var products = await fetchProductData();
                                                    console.log(products)

                                                    const Dairy = products.products
                                                        .filter(product => product.category === "Dairy")
                                                        .map((product) => product.unitPrices[0].varient_id);

                                                    console.log(Dairy)

                                                    await sendCategoryCatlog(WHATSAPP_TOKEN, senderId, Dairy, "Dairy")

                                                    break;

                                                case 'Fresh Vegetables':
                                                    console.log("fruits Selected")

                                                    var products = await fetchProductData();
                                                    const Fresh_Vegetables = products.products
                                                        .filter(product => product.category === "Fresh Vegetables")
                                                        .map((product) => product.unitPrices[0].varient_id);

                                                    console.log(Fresh_Vegetables)

                                                    await sendCategoryCatlog(WHATSAPP_TOKEN, senderId, Fresh_Vegetables, "Fresh Vegetables")

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
