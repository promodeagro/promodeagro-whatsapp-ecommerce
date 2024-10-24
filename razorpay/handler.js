// const crypto = require('crypto');

// module.exports.webhookHandler = async (event) => {

//     const secret = '12345678'

//     console.log(event)

//     const shasum = crypto.createHmac('sha256', secret)
//     // shasum.update(JSON.stringify(req.body))
//     const digest = shasum.digest('hex')

//     console.log(digest, req.headers['x-razorpay-signature'])


// };

const axios = require('axios');

const crypto = require('crypto');
const { type } = require('os');

module.exports.webhookHandler = async (event) => {

    try {
        const secret = '12345678';
        const requestBody = JSON.parse(event.body);
        
        console.log(requestBody);

        const shasum = crypto.createHmac('sha256', secret);
        shasum.update(JSON.stringify(requestBody));
        const digest = shasum.digest('hex');

        console.log('Computed Signature:', digest);
        console.log('Received Signature:', event.headers['x-razorpay-signature']);

        if (requestBody.event === 'payment_link.paid') {
            console.log('Payment confirmed');
            // console.log(requestBody.payload.payment_link.notes)
            // console.log(typeof requestBody.payload.payment_link.notes)
            let orderId = requestBody.payload.payment_link.entity.notes.ecom_order_id
            console.log(orderId)
            updateOrderStatus(orderId,"PLACED")
            console.log(requestBody.payload.payment_link)
            // Perform actions for confirmed payment
        } else {
            console.log('Payment not confirmed');
            // Perform actions for other events or no event
        }
    } catch (error) {
        console.error('Error processing webhook:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
            isBase64Encoded: false,
        };
    }
};




async function updateOrderStatus(orderId, status) {
  try {
    const data = JSON.stringify({
      "status": status
    });

    const config = {
      method: 'put',
      maxBodyLength: Infinity,
      url: ` https://dq5mcoq79b.execute-api.us-east-1.amazonaws.com/updateOrder/${orderId}`,
      headers: { 
        'Content-Type': 'application/json'
      },
      data: data
    };

    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}
