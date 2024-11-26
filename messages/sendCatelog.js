const axios = require('axios');

exports.handler = async (event) => {
    try {

        console.log(event)
        const { token, phoneNumber, products, title } = event;

        // Helper function to send a batch of products
        async function sendBatch(batch) {
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
                        "text": title
                    },
                    "action": {
                        "catalog_id": "801561144856518",
                        "sections": [
                            {
                                "title": title,
                                "product_items": batch.map(id => ({
                                    "product_retailer_id": id
                                }))
                            }
                        ]
                    }
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

            // Send the request and return the response data
            try {
                const response = await axios.request(config);
                return response.data;
            } catch (error) {
                throw error;
            }
        }

        // Send products in batches of 30
        for (let i = 0; i < products.length; i += 30) {
            const batch = products.slice(i, i + 30);
            await sendBatch(batch);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Messages sent successfully!" }),
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
