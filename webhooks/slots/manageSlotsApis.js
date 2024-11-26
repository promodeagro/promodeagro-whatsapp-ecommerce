const axios = require('axios');
require('dotenv').config();
const { marshall ,unmarshall } = require("@aws-sdk/util-dynamodb");
const { UpdateItemCommand } = require("@aws-sdk/client-dynamodb");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

// Initialize the DynamoDB client
const dynamoDB = new DynamoDBClient({
});

async function sendDeliverySlots(to, pincode, name, token) {
    try {
        // Fetch delivery slots from the API

        console.log(pincode)
        const slotsResponse = await axios.get(`https://9ti4fcd117.execute-api.ap-south-1.amazonaws.com/slots/${pincode}`);

        if (slotsResponse.status !== 200 || !slotsResponse.data.slots) {
            console.error('Failed to fetch slots:', slotsResponse.data);
            return;
        }

        // Extract slots and format them for WhatsApp
        const slots = slotsResponse.data.slots.map((slot) => {
            const shift = slot.shifts[0]; // Assuming single shift
            const firstSlot = shift?.slots[0]; // Assuming single slot within shift
            return {
                id: firstSlot.id, // Unique ID for the slot
                title: `${firstSlot?.start} - ${firstSlot?.end}`, // Format: "10:00 - 11:00"
                description: `${shift?.name || ''} (${slot.deliveryType})`, // e.g., "morning (next day)"
                // payload: firstSlot.id
            };
        });

        // Create the data payload for WhatsApp
        let data = JSON.stringify({
            "messaging_product": "whatsapp",
            "to": to,
            "type": "interactive",
            "interactive": {
                "type": "list",
                "header": {
                    "type": "text",
                    "text": "Choose Your Delivery Slot",
                },
                "body": {
                    "text": `${name},\nPlease select your preferred delivery slot for ${new Date().toISOString().split('T')[0]}.`,
                },
                "footer": {
                    "text": "Thank you for choosing our service!",
                },
                "action": {
                    "button": "Select Slot",
                    "sections": [
                        {
                            "title": "Available Delivery Slots",
                            "rows": slots,
                        },
                    ],
                },
            },
        });

        console.log(data)
        // WhatsApp API configuration
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://graph.facebook.com/v19.0/208582795666783/messages',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, // Replace with your access token
            },
            data: data,
        };

        // Send the WhatsApp message
        const response = await axios.request(config);
        console.log('WhatsApp message sent:', JSON.stringify(response.data));
    } catch (error) {
        console.error('Error sending WhatsApp message:', error.message || error);
    }
}


async function fetchAllSlots() {
    const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://9ti4fcd117.execute-api.ap-south-1.amazonaws.com/slots',
        headers: {},
    };

    try {
        const response = await axios.request(config);
        console.log('Slots fetched successfully:', JSON.stringify(response.data));
        return response.data; // Return the fetched data
    } catch (error) {
        console.error('Error fetching slots:', error.message || error);
        throw error; // Rethrow the error for further handling
    }
}


async function setDefaultSlot(userId, slotId) {
    const userTableName = process.env.USER_TABLE; // Replace with your actual table name
  
    try {
      // Parameters to update the selectedDefaultId field
      const updateParams = {
        TableName: userTableName,
        Key: marshall({ UserId: userId }), // Ensure 'UserId' matches the table's primary key name
        UpdateExpression: "SET selectedDefaultId = :slotId",
        ExpressionAttributeValues: marshall({
          ":slotId": slotId,
        }),
        ReturnValues: "UPDATED_NEW",
      };
  
      // Execute the update command
      const result = await dynamoDB.send(new UpdateItemCommand(updateParams));
      console.log("Default slot updated successfully:", result);
  
      return result.Attributes ? unmarshall(result.Attributes) : null;
    } catch (error) {
      console.error("Error setting default slot:", error);
      throw new Error("Failed to set default slot");
    }
  }



module.exports = {
    setDefaultSlot,
    fetchAllSlots,
    sendDeliverySlots,
};
