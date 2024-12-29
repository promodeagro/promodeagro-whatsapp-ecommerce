const axios = require('axios');

exports.handler = async (event) => {
    try {
        console.log('Received event:', JSON.stringify(event));

        // Validate event data
        if (!event || !event.phone_number_id || !event.senderId || !event.orderId || !event.WHATSAPP_TOKEN) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields: phone_number_id, senderId, orderId, WHATSAPP_TOKEN' }),
            };
        }

        const replyMessage = `🎉 Your order with Order ID *${event.orderId}* has been successfully placed! 🎉

        Thank you for choosing us. We’re excited to serve you and ensure you have a delightful experience. 😊
         
        If you have any questions, feel free to reach out. Happy shopping! 🛒`;
        
        const url = `https://graph.facebook.com/v18.0/${event.phone_number_id}/messages`;

        const payload = {
            messaging_product: "whatsapp",
            to: event.senderId,
            text: { body: replyMessage },
        };

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${event.WHATSAPP_TOKEN}`,
        };

        const response = await axios.post(url, payload, { headers });

        console.log('Order confirmation response:', response.data);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Order confirmation sent successfully', data: response.data }),
        };
    } catch (error) {
        console.error('Error in sending order confirmation:', error.response?.data || error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to send the order confirmation', details: error.message }),
        };
    }
};
