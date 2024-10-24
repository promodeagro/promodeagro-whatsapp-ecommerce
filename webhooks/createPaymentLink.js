const axios = require('axios');

async function createPaymentLink(amount,description,order_id) {
    try {
        const referenceId = 'TS' + Math.floor(Math.random() * 10000); // Generating random reference ID

        custom_attributes = {
            "ecom_order_id": order_id,
        }
        
        
        const data = JSON.stringify({
            "upi_link": "true",
            "amount": amount,
            "currency": "INR",
            "accept_partial": false,
            "expire_by": 1735671600, // Example expiry timestamp
            "reference_id": referenceId,
            "description": description,
            "notes":custom_attributes,
            "notify": {
                "sms": true,
                "email": true
            },
            "reminder_enable": true
        });

        const config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://api.razorpay.com/v1/payment_links',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': 'Basic cnpwX2xpdmVfb3k3VVVDWkpPM21RYmU6eVpYcldIT2xxaGI0Z1prV0FGdUt2OTNw' // Add your authorization token here
            },
            data: data
        };

        const response = await axios.request(config);
        return response.data.short_url; // Returning the response data
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = {
   createPaymentLink
};
