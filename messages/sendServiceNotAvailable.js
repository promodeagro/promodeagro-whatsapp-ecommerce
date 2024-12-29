const axios = require('axios');

exports.handler = async (event) => {
    try {
        console.log('Received event:', JSON.stringify(event));

        // Validate event data
        if (!event || !event.phone_number_id || !event.senderId || !event.WHATSAPP_TOKEN || !event.in_pin_code) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields: phone_number_id, senderId, WHATSAPP_TOKEN, in_pin_code' }),
            };
        }

        const replyMessage = `🚫 We're sorry! 😞 

        Unfortunately, our service does not currently deliver to your area with pin code *${event.in_pin_code}*. 

        We're constantly expanding our reach and hope to serve you soon! Thank you for your interest. 😊`;

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

        console.log('Service unavailability response:', response.data);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Service unavailability message sent successfully', data: response.data }),
        };
    } catch (error) {
        console.error('Error in sending service unavailability message:', error.response?.data || error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to send the service unavailability message', details: error.message }),
        };
    }
};
