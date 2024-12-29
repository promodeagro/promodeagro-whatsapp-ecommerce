const axios = require('axios');

const addCartItems = async (userId, cartItems) => {
    // Prepare data
    let data = JSON.stringify({
        "userId": userId,
        "cartItems": cartItems
    });

    // Axios request configuration
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://9ti4fcd117.execute-api.ap-south-1.amazonaws.com/cart/addListOfItems',
        headers: {
            'Content-Type': 'application/json'
        },
        data: data
    };

    // Use try-catch for error handling
    try {
        const response = await axios.request(config);
        console.log(JSON.stringify(response.data));
    } catch (error) {
        console.error(error);
    }
};



async function getUserByNumber(mobileNumber) {
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://9ti4fcd117.execute-api.ap-south-1.amazonaws.com/getUserByNumber?mobileNumber=${mobileNumber}`,
        headers: {}
    };

    try {
        const response = await axios.request(config);

        console.log(JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        console.error('Error fetching user:', error);
    }
}


async function getCartItems(userId) {
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://9ti4fcd117.execute-api.ap-south-1.amazonaws.com/cart/getItems/${userId}`,
        headers: {}
    };

    try {
        const response = await axios.request(config);
        // console.log(JSON.stringify(response.data));
        return response.data
    } catch (error) {
        console.error('Error fetching cart items:', error);
    }
}

async function sendCurrentItems(senderId, token, items) {
    // Check if items is an array and not empty
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Invalid input: items is required and must be a non-empty array');
    }

    try {
        // Format the items into a string (excluding the image)
        let itemsList = items.map(item => 
            `${item.productName}\nPrice: ${item.Subtotal}   Quantity: ${item.Quantity}`
        ).join('\n\n');

        // Create the message body
        let messageBody = `Current items in your cart:\n\n${itemsList}`;

        let data = JSON.stringify({
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": senderId, // Recipient's number
            "type": "text",
            "text": {
                "body": messageBody
            }
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://graph.facebook.com/v19.0/208582795666783/messages',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Bearer token for authorization
            },
            data: data
        };

        const response = await axios.request(config);
        return response.data;
    } catch (error) {
        console.error('Error sending message:', error);
        return { error: error.message };
    }
}

async function sendPreviousCart(senderId, token, items) {
    // Check if items is an array and not empty
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Invalid input: items is required and must be a non-empty array');
    }

    try {
        // Format the items into a string (excluding the image)
        let itemsList = items.map(item => 
            `${item.productName}\nPrice: ${item.Subtotal}   Quantity: ${item.Quantity}`
        ).join('\n\n');

        // Create the message body
        let messageBody = `Privious items in your cart:\n\n${itemsList}`;

        let data = JSON.stringify({
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": senderId, // Recipient's number
            "type": "text",
            "text": {
                "body": messageBody
            }
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://graph.facebook.com/v19.0/208582795666783/messages',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Bearer token for authorization
            },
            data: data
        };

        const response = await axios.request(config);
        return response.data;
    } catch (error) {
        console.error('Error sending message:', error);
        return { error: error.message };
    }
}



module.exports = {
    addCartItems,
    sendPreviousCart,
    getUserByNumber,
    getCartItems,
    sendCurrentItems

};