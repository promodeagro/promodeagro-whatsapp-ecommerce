const axios = require('axios');

exports.handler = async (event) => {
    try {
        console.log('Received event:', JSON.stringify(event));

        if (!event) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing request body' }),
            };
        }

        // const data = JSON.parse(event);

        console.log(event)


        const replyMessage = `Welcome to Pramode Agro Farms! 🌾

Thank you for reaching out to us. How can we assist you today?

For immediate assistance, feel free to call our support team at +918897399587. 
We're here to help with any questions or concerns.

Looking forward to serving you! 😊`;

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

        console.log('sendReply response:', response.data);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Reply sent successfully', data: response.data }),
        };
    } catch (error) {
        console.error('Error in sendReply:', error.response?.data || error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to send the reply', details: error.message }),
        };
    }
};
