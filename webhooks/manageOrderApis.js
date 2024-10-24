const axios = require('axios');

async function createOrder(userId, addressId, deliverySlotId, items, paymentMethod) {
  let data = JSON.stringify({
    "addressId": addressId,
    "deliverySlotId": deliverySlotId,
    "items": items,
    "paymentDetails": {
      "method": paymentMethod
    },
    "userId": userId
  });

  console.log(data)

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://9ti4fcd117.execute-api.ap-south-1.amazonaws.com/order',
    headers: { 
      'Content-Type': 'application/json'
    },
    data: data
  };

  try {
    const response = await axios.request(config);
    console.log(JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.error(error);
  }
}




module.exports = {
  createOrder

};

