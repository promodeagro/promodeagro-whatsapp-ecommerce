const axios = require('axios');

async function sendOrderConfirmation(orderId, number, token) {
  try {

    let data = JSON.stringify({
      "messaging_product": "whatsapp",
      "recipient_type": "individual",
      "to": number,
      "type": "text",
      "text": {
        "body": `*#ORDER ID ${orderId}*\nORDER CREATED SUCCESSFULLY`
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

    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
}




async function addOrContinueButtons(number, token) {

  try {

    let data = JSON.stringify({
      "messaging_product": "whatsapp",
      "recipient_type": "individual",
      "to": number,
      "type": "interactive",
      "interactive": {
        "type": "button",
        "body": {
          "text": "Would You like to continue or add more items"
        },
        "action": {
          "buttons": [
            {
              "type": "reply",
              "reply": {
                "id": "add",
                "title": "add More Items"
              }
            },
            {
              "type": "reply",
              "reply": {
                "id": "continue",
                "title": "Continue"
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

    const response = await axios.request(config);
    console.log(response)
    return response.data;
  } catch (error) {
    return {
      error: error.message,
      details: error.response ? error.response.data : null
    };
  }
}




async function mergeOrContinueWithCart(number, token) {

  try {

    let data = JSON.stringify({
      "messaging_product": "whatsapp",
      "recipient_type": "individual",
      "to": number,
      "type": "interactive",
      "interactive": {
        "type": "button",
        "body": {
          "text": "Would you like to merge your previous cart with the current one or continue with the current cart?"
        },
        "action": {
          "buttons": [
            {
              "type": "reply",
              "reply": {
                "id": "mergecart",
                "title": "Merge Cart"
              }
            },
            {
              "type": "reply",
              "reply": {
                "id": "continuecurrent",
                "title": "Current Cart"
              }
            }
          ]
        }
      }
    });
    console.log(data)
    let config = {
      method: 'post',
      url: 'https://graph.facebook.com/v19.0/208582795666783/messages',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      data: data
    };

    const response = await axios.request(config);
    console.log(response)
    return response.data;
  } catch (error) {
    return {
      error: error.message,
      details: error.response ? error.response.data : null
    };
  }
}



module.exports = {
  mergeOrContinueWithCart,
  sendOrderConfirmation,
  addOrContinueButtons
};
