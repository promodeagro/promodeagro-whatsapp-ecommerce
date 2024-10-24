const axios = require('axios');

async function sendPaymentMethod(number, token) {
  let data = JSON.stringify({
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": number,
    "type": "interactive",
    "interactive": {
      "type": "button",
      "body": {
        "text": "Select Payment Method"
      },
      "action": {
        "buttons": [
          {
            "type": "reply",
            "reply": {
              "id": "upi_button",
              "title": "UPI"
            }
          },
          {
            "type": "reply",
            "reply": {
              "id": "cash_button",
              "title": "COD"
            }
          }
        ]
      }
    }
  });

  let config = {
    method: 'post',
    url: 'https://graph.facebook.com/v19.0/208582795666783/messages',
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}`
    },
    data: data
  };

  try {
    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    return {
      error: error.message,
      details: error.response ? error.response.data : null
    };
  }
}

module.exports = {
  sendPaymentMethod
};
