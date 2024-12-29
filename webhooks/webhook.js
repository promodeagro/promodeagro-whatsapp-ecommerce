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
const lambda = new AWS.Lambda({ region: 'ap-south-1' }); // Replace with your region

const { sendOrderConfirmation, addOrContinueButtons, mergeOrContinueWithCart } = require("./sendOrderConfirmation")
const { sendCategorySelection, sendCategoryCatlog } = require("../messages/sendCategorySelection")
const { fetchProductData, fetchProductDataById, getProductsFromCommerceManager } = require("./fetchProducts")
const { getCurrentCart, updateCartInDynamoDB, sendBill } = require("./manageCart")
const axios = require('axios');



const {
    sendReply,
    calculateTotalAmount


} = require("./commonFunctions");
const { getcustomer } = require("./customer");
const { addCartItems, getUserByNumber, getCartItems, sendCurrentItems, sendPreviousCart } = require("./manageCartApis.");
const { getAllAddresses, sendAddressMessageWithSavedAddresses, setDefaultAddress, addAddress } = require("./manageAddressApi");
const { createOrder } = require("./manageOrderApis");
const { sendDeliverySlots, fetchAllSlots, setDefaultSlot } = require("./slots/manageSlotsApis");



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
                                // await createUserInWhatsAppCommerce(mobileNumber)


                                // Prepare the payload for invoking sendReply
                                const createUserpayload = {
                                    mobileNumber: mobileNumber

                                };



                                const createUserParams = {
                                    FunctionName: 'promodeagro-whatsapp-ecommerce-dev-createUserInWhatsappCommerce', // Adjust the function name based on your environment
                                    InvocationType: 'RequestResponse', // Use 'Event' for async invocation
                                    Payload: JSON.stringify(createUserpayload),
                                };


                                const createUserresult = await lambda.invoke(createUserParams).promise();
                                console.log(createUserresult)


                                console.log(mobileNumber);
                                const user = await getUserByNumber(mobileNumber);
                                console.log(user)

                                var userId = user.UserId;




                                console.log("dfedfedfedfedf")

                                console.log(message.type)


                                switch (message.type) {
                                    case 'text':


                                        const removePayload = {
                                            pathParameters: {
                                                userId: userId,
                                            }
                                        }

                                        const removeCartItemsParams = {
                                            FunctionName: 'promodeAgro-ecommerce-api-prod-removeAllItems', // Adjust the function name based on your environment
                                            InvocationType: 'RequestResponse', // Use 'Event' for async invocation
                                            Payload: JSON.stringify(removePayload),

                                        }
                                        const removeItemresult = await lambda.invoke(removeCartItemsParams).promise();
                                        console.log(removeItemresult)


                                        console.log('Received text message');
                                        // Prepare the payload for invoking sendReply
                                        const payload = {
                                            phone_number_id,
                                            WHATSAPP_TOKEN,
                                            senderId,
                                        };



                                        const params = {
                                            FunctionName: 'promodeagro-whatsapp-ecommerce-dev-sendResply', // Adjust the function name based on your environment
                                            InvocationType: 'RequestResponse', // Use 'Event' for async invocation
                                            Payload: JSON.stringify(payload),
                                        };


                                        const result = await lambda.invoke(params).promise();
                                        console.log(result)

                                        console.log('Text message handled successfully');
                                        const userDetails = await getAllAddresses(userId);
                                        console.log("address")
                                        console.log(userDetails)

                                        const categorySelectionparams = {
                                            FunctionName: 'promodeagro-whatsapp-ecommerce-dev-sendCategorySelection', // Adjust the function name based on your environment
                                            InvocationType: 'RequestResponse', // Use 'Event' for async invocation
                                            Payload: JSON.stringify({
                                                whatsappToken: WHATSAPP_TOKEN,
                                                number: senderId,

                                            }),
                                        };


                                        const categoriesSelectionResult = await lambda.invoke(categorySelectionparams).promise();

                                        console.log(categoriesSelectionResult)


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
                                                    // // Reset the incomplete order flag
                                                    // incompleteOrderAlertSent = false;
                                                    // // Update the session to clear incomplete order flag


                                                    // session.incompleteOrderAlertSent = false;

                                                    // // const responseJson = JSON.parse(message.interactive.nfm_reply.response_json);
                                                    // // await storeUserResponse(senderId, responseJson);
                                                    // // Save the updated session
                                                    // session = await updateSession(senderId, session);
                                                    // // Update the incomplete order alert flag in the database
                                                    // await setIncompleteOrderAlertSent(senderId, false);

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
                                                    // const userDetails = await getAllAddresses(userId);
                                                    // console.log("address")
                                                    // console.log(userDetails)
                                                    // await sendAddressMessageWithSavedAddresses(senderId, WHATSAPP_TOKEN, userDetails);

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



                                                    const UPI_slotId = user.selectedDefaultId;

                                                    const order = await createOrder(userId, user.defaultAddressId, UPI_slotId, Upi_cartItemsList, "online");
                                                    console.log(order)
                                                    await sendPaymentLinkButton(senderId, WHATSAPP_TOKEN, order.paymentLink);
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

                                                    const slotId = user.selectedDefaultId;

                                                    const Cashorder = await createOrder(userId, user.defaultAddressId, slotId, cartItemsList, "cash")
                                                    console.log(Cashorder)
                                                    const orderId = Cashorder.orderId;
                                                    const payload = {
                                                        phone_number_id,
                                                        senderId,
                                                        orderId,
                                                        WHATSAPP_TOKEN
                                                    };



                                                    const params = {
                                                        FunctionName: 'promodeagro-whatsapp-ecommerce-dev-sendOrderConfermation', // Adjust the function name based on your environment
                                                        InvocationType: 'RequestResponse', // Use 'Event' for async invocation
                                                        Payload: JSON.stringify(payload),
                                                    };


                                                    const result = await lambda.invoke(params).promise();
                                                    console.log(result)
                                                    // console.log(Orders)
                                                    // console.log(Orders.orderId)
                                                    // await sendOrderConfirmation(Orders.orderId, senderId, WHATSAPP_TOKEN)
                                                    break;

                                                case 'add':
                                                    const categorySelectionparams = {
                                                        FunctionName: 'promodeagro-whatsapp-ecommerce-dev-sendCategorySelection', // Adjust the function name based on your environment
                                                        InvocationType: 'RequestResponse', // Use 'Event' for async invocation
                                                        Payload: JSON.stringify({
                                                            whatsappToken: WHATSAPP_TOKEN,
                                                            number: senderId,

                                                        }),
                                                    };


                                                    const categoriesSelectionResult = await lambda.invoke(categorySelectionparams).promise();
                                                    console.log(categoriesSelectionResult)
                                                    break;


                                                case 'continue':

                                                    //     var oldItems = await getCartItems(userId);


                                                    //     if (oldItems.items && oldItems.items.length > 0) {
                                                    //         console.log("Old Items")
                                                    //         console.log(oldItems)

                                                    //         await sendPreviousCart(senderId, WHATSAPP_TOKEN, oldItems.items)
                                                    //     }

                                                    //     var curret = await getCartItems(userId);


                                                    //     if (curret.items && curret.items.length > 0) {
                                                    //         console.log("curret Items")
                                                    //         console.log(curret)

                                                    //         await sendCurrentItems(senderId, WHATSAPP_TOKEN, curret.items)
                                                    //     }


                                                    //    const test =  await mergeOrContinueWithCart(senderId,WHATSAPP_TOKEN);
                                                    const userDetails = await getAllAddresses(userId);

                                                    await sendAddressMessageWithSavedAddresses(senderId, WHATSAPP_TOKEN, userDetails);

                                                    // const seletedAddress = await axios.get(`https://9ti4fcd117.execute-api.ap-south-1.amazonaws.com/getDefaultAddress/${userId}`);

                                                    // console.log(seletedAddress)
                                                    // await sendDeliverySlots(mobileNumber, seletedAddress.data.zipCode, seletedAddress.data.name, WHATSAPP_TOKEN);



                                                    break;







                                            }
                                        } else if (message.interactive.type === 'nfm_reply') {



                                            const responseJson = JSON.parse(message.interactive.nfm_reply.response_json);

                                            console.log(responseJson.values)
                                            if (responseJson.saved_address_id) {
                                                console.log("existing Address");
                                                await setDefaultAddress(userId, responseJson.saved_address_id)

                                                console.log(responseJson)
                                            } else {
                                                console.log("creating new one ")
                                                console.log(userId)
                                                const newAddress = await addAddress(userId, responseJson.values)
                                                await setDefaultAddress(userId, newAddress.addressId)

                                            }
                                            const slotsResponse = await axios.get(`https://9ti4fcd117.execute-api.ap-south-1.amazonaws.com/slots/${responseJson.values.in_pin_code}`);
                                            console.log(slotsResponse)
                                            if (slotsResponse.data.slots && slotsResponse.data.slots.length > 0) {
                                                console.log("available slots")
                                                await sendDeliverySlots(mobileNumber, responseJson.values.in_pin_code, responseJson.values.name, WHATSAPP_TOKEN);
                                                // const categorySelectionparams = {
                                                //     FunctionName: 'promodeagro-whatsapp-ecommerce-dev-sendCategorySelection', // Adjust the function name based on your environment
                                                //     InvocationType: 'RequestResponse', // Use 'Event' for async invocation
                                                //     Payload: JSON.stringify({
                                                //         whatsappToken: WHATSAPP_TOKEN,
                                                //         number: senderId,

                                                //     }),
                                                // };


                                                // const categoriesSelectionResult = await lambda.invoke(categorySelectionparams).promise();

                                                // console.log(categoriesSelectionResult)


                                            } else {

                                                const pincode = responseJson.values.in_pin_code;
                                                const payload = {
                                                    phone_number_id: phone_number_id,
                                                    senderId: senderId,
                                                    WHATSAPP_TOKEN: WHATSAPP_TOKEN,
                                                    in_pin_code: pincode

                                                };


                                                console.log(pincode)
                                                const params = {
                                                    FunctionName: 'promodeagro-whatsapp-ecommerce-dev-sendServcieNotAvailable', // Adjust the function name based on your environment
                                                    InvocationType: 'RequestResponse', // Use 'Event' for async invocation
                                                    Payload: JSON.stringify(payload),
                                                };


                                                const result = await lambda.invoke(params).promise();
                                                console.log(result)
                                                console.log("not available slots")

                                            }




                                            // await sendPaymentMethod(senderId, WHATSAPP_TOKEN);


                                        } else if (message.interactive.type === 'list_reply') {


                                            const buttonReplyId = message.interactive.list_reply.id;
                                            console.log("REPLY BUTTONS")
                                            const allSlots = await fetchAllSlots();
                                            // console.log(allSlots);

                                            let matchedSlot = null;

                                            // Loop to find the matched slot dynamically
                                            for (const slot of allSlots.slots) {
                                                for (const shift of slot.shifts) {
                                                    for (const slotDetails of shift.slots) {
                                                        if (slotDetails.id === buttonReplyId) {
                                                            matchedSlot = slotDetails;
                                                            break;
                                                        }
                                                    }
                                                    if (matchedSlot) break;
                                                }
                                                if (matchedSlot) break;
                                            }
                                            console.log(matchedSlot)

                                            if (!matchedSlot) {
                                                console.log("No matching slot found.");
                                            } else {
                                                // Perform actions based on the matched slot
                                                console.log("Matched Slot ID:", matchedSlot.id);

                                                // Use `if-else` instead of `switch` for dynamic conditions
                                                if (buttonReplyId === matchedSlot.id) {
                                                    console.log("Slots matched with ID:", matchedSlot.id);
                                                    await setDefaultSlot(userId, matchedSlot.id)
                                                    await sendPaymentMethod(senderId, WHATSAPP_TOKEN);



                                                    // Add your logic here for the matched slot
                                                } else {
                                                    console.log("No matching case for the button reply ID.");
                                                }
                                            }

                                            switch (buttonReplyId) {





                                                case 'Fresh Fruits':
                                                    console.log("fruits Selected")

                                                    const productsParam = {
                                                        FunctionName: 'promodeagro-whatsapp-ecommerce-dev-filterCategories', // Adjust the function name based on your environment
                                                        InvocationType: 'RequestResponse', // Use 'Event' for synchronous invocation
                                                        Payload: JSON.stringify({ category: "Fresh Fruits" }), // Replace with the appropriate payload
                                                    };

                                                    try {
                                                        const productss = await lambda.invoke(productsParam).promise();
                                                        const response = JSON.parse(productss.Payload);
                                                        const data = JSON.parse(response.body);
                                                        const filtredProducts = data.finalProducts;




                                                        const catelogParam = {
                                                            FunctionName: 'promodeagro-whatsapp-ecommerce-dev-sendCatelog', // Adjust the function name based on your environment
                                                            InvocationType: 'RequestResponse', // Use 'Event' for synchronous invocation
                                                            Payload: JSON.stringify({
                                                                token: WHATSAPP_TOKEN, // Add your authorization token here
                                                                phoneNumber: senderId, // Replace with the recipient's phone number
                                                                products: filtredProducts, // Replace with the list of product IDs
                                                                title: 'Fresh Fruits' // Add the appropriate title here
                                                            }), // Replace with the appropriate payload
                                                        };

                                                        const sendMessage = await lambda.invoke(catelogParam).promise();

                                                        // Check if the response contains the expected structure
                                                        console.log("Filtered Categories Response:", sendMessage);
                                                    } catch (error) {
                                                        console.error("Error invoking Lambda function:", error.message);
                                                        throw error;
                                                    }

                                                    break;

                                                case 'Bengali Special':
                                                    console.log("Bengali Special Selected");

                                                    const bengaliSpecialParam = {
                                                        FunctionName: 'promodeagro-whatsapp-ecommerce-dev-filterCategories',
                                                        InvocationType: 'RequestResponse',
                                                        Payload: JSON.stringify({ category: "Bengali Special" }),
                                                    };

                                                    try {
                                                        const productss = await lambda.invoke(bengaliSpecialParam).promise();
                                                        const response = JSON.parse(productss.Payload);
                                                        const data = JSON.parse(response.body);
                                                        const filteredProducts = data.finalProducts;

                                                        const catelogParam = {
                                                            FunctionName: 'promodeagro-whatsapp-ecommerce-dev-sendCatelog',
                                                            InvocationType: 'RequestResponse',
                                                            Payload: JSON.stringify({
                                                                token: WHATSAPP_TOKEN,
                                                                phoneNumber: senderId,
                                                                products: filteredProducts,
                                                                title: 'Bengali Special'
                                                            }),
                                                        };

                                                        const sendMessage = await lambda.invoke(catelogParam).promise();
                                                        console.log("Filtered Categories Response:", sendMessage);
                                                    } catch (error) {
                                                        console.error("Error invoking Lambda function:", error.message);
                                                        throw error;
                                                    }
                                                    break;

                                                case 'Groceries':
                                                    console.log("Groceries Selected");

                                                    const groceriesParam = {
                                                        FunctionName: 'promodeagro-whatsapp-ecommerce-dev-filterCategories',
                                                        InvocationType: 'RequestResponse',
                                                        Payload: JSON.stringify({ category: "Groceries" }),
                                                    };

                                                    try {
                                                        const productss = await lambda.invoke(groceriesParam).promise();
                                                        const response = JSON.parse(productss.Payload);
                                                        const data = JSON.parse(response.body);
                                                        const filteredProducts = data.finalProducts;

                                                        const catelogParam = {
                                                            FunctionName: 'promodeagro-whatsapp-ecommerce-dev-sendCatelog',
                                                            InvocationType: 'RequestResponse',
                                                            Payload: JSON.stringify({
                                                                token: WHATSAPP_TOKEN,
                                                                phoneNumber: senderId,
                                                                products: filteredProducts,
                                                                title: 'Groceries'
                                                            }),
                                                        };

                                                        const sendMessage = await lambda.invoke(catelogParam).promise();
                                                        console.log("Filtered Categories Response:", sendMessage);
                                                    } catch (error) {
                                                        console.error("Error invoking Lambda function:", error.message);
                                                        throw error;
                                                    }
                                                    break;

                                                case 'Eggs Meat & Fish':
                                                    console.log("Eggs Meat & Fish Selected");

                                                    const eggsMeatFishParam = {
                                                        FunctionName: 'promodeagro-whatsapp-ecommerce-dev-filterCategories',
                                                        InvocationType: 'RequestResponse',
                                                        Payload: JSON.stringify({ category: "Eggs Meat & Fish" }),
                                                    };

                                                    try {
                                                        const productss = await lambda.invoke(eggsMeatFishParam).promise();
                                                        const response = JSON.parse(productss.Payload);
                                                        const data = JSON.parse(response.body);
                                                        const filteredProducts = data.finalProducts;

                                                        const catelogParam = {
                                                            FunctionName: 'promodeagro-whatsapp-ecommerce-dev-sendCatelog',
                                                            InvocationType: 'RequestResponse',
                                                            Payload: JSON.stringify({
                                                                token: WHATSAPP_TOKEN,
                                                                phoneNumber: senderId,
                                                                products: filteredProducts,
                                                                title: 'Eggs Meat & Fish'
                                                            }),
                                                        };

                                                        const sendMessage = await lambda.invoke(catelogParam).promise();
                                                        console.log("Filtered Categories Response:", sendMessage);
                                                    } catch (error) {
                                                        console.error("Error invoking Lambda function:", error.message);
                                                        throw error;
                                                    }
                                                    break;

                                                case 'Dairy':
                                                    console.log("Dairy Selected");

                                                    const dairyParam = {
                                                        FunctionName: 'promodeagro-whatsapp-ecommerce-dev-filterCategories',
                                                        InvocationType: 'RequestResponse',
                                                        Payload: JSON.stringify({ category: "Dairy" }),
                                                    };

                                                    try {
                                                        const productss = await lambda.invoke(dairyParam).promise();
                                                        const response = JSON.parse(productss.Payload);
                                                        const data = JSON.parse(response.body);
                                                        const filteredProducts = data.finalProducts;

                                                        const catelogParam = {
                                                            FunctionName: 'promodeagro-whatsapp-ecommerce-dev-sendCatelog',
                                                            InvocationType: 'RequestResponse',
                                                            Payload: JSON.stringify({
                                                                token: WHATSAPP_TOKEN,
                                                                phoneNumber: senderId,
                                                                products: filteredProducts,
                                                                title: 'Dairy'
                                                            }),
                                                        };

                                                        const sendMessage = await lambda.invoke(catelogParam).promise();
                                                        console.log("Filtered Categories Response:", sendMessage);
                                                    } catch (error) {
                                                        console.error("Error invoking Lambda function:", error.message);
                                                        throw error;
                                                    }
                                                    break;

                                                case 'Fresh Vegetables':
                                                    console.log("Fresh Vegetables Selected");

                                                    const freshVegetablesParam = {
                                                        FunctionName: 'promodeagro-whatsapp-ecommerce-dev-filterCategories',
                                                        InvocationType: 'RequestResponse',
                                                        Payload: JSON.stringify({ category: "Fresh Vegetables" }),
                                                    };

                                                    try {
                                                        const productss = await lambda.invoke(freshVegetablesParam).promise();
                                                        const response = JSON.parse(productss.Payload);
                                                        const data = JSON.parse(response.body);
                                                        const filteredProducts = data.finalProducts;

                                                        const catelogParam = {
                                                            FunctionName: 'promodeagro-whatsapp-ecommerce-dev-sendCatelog',
                                                            InvocationType: 'RequestResponse',
                                                            Payload: JSON.stringify({
                                                                token: WHATSAPP_TOKEN,
                                                                phoneNumber: senderId,
                                                                products: filteredProducts,
                                                                title: 'Fresh Vegetables'
                                                            }),
                                                        };

                                                        const sendMessage = await lambda.invoke(catelogParam).promise();
                                                        console.log("Filtered Categories Response:", sendMessage);
                                                    } catch (error) {
                                                        console.error("Error invoking Lambda function:", error.message);
                                                        throw error;
                                                    }
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
