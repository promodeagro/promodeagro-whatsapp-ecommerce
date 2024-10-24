const axios = require('axios');


async function getAllAddresses(userId) {
    const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://9ti4fcd117.execute-api.ap-south-1.amazonaws.com/getAllAddress/${userId}`,
        headers: {}
    };

    try {
        const response = await axios.request(config);
        console.log(JSON.stringify(response.data));
        return response.data; // Return the response data if needed
    } catch (error) {
        console.error('Error fetching addresses:', error);
        throw error; // Rethrow the error if you want to handle it elsewhere
    }
}


async function sendAddressMessageWithSavedAddresses(toNumber, whatsappToken, userDetails) {
    try {
        let messageData;

        // Check if userDetails contains necessary address information
        if (userDetails && userDetails.addresses && userDetails.addresses.length > 0) {
            console.log("Address Present");
            const savedAddresses = userDetails.addresses.map((address, index) => ({
                "id": address.addressId,
                "value": {
                    "name": address.name,
                    "phone_number": address.phoneNumber,
                    "in_pin_code": address.zipCode, // Changed to use zipCode
                    "floor_number": "", // Add floor_number if needed
                    "building_name": "", // Add building_name if needed
                    "address": address.address,
                    "landmark_area": "", // Add landmark_area if needed
                    "city": "" // Add city if needed
                }
            }));

            messageData = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: toNumber,
                type: "interactive",
                interactive: {
                    type: "address_message",
                    body: {
                        text: "Thanks for your order! Tell us what address you'd like this order delivered to."
                    },
                    action: {
                        name: "address_message",
                        parameters: {
                            country: "IN",
                            saved_addresses: savedAddresses
                        }
                    }
                }
            };
        } else {
            messageData = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: toNumber,
                type: "interactive",
                interactive: {
                    type: "address_message",
                    body: {
                        text: "Thanks for your order! Tell us what address you’d like this order delivered to."
                    },
                    action: {
                        name: "address_message",
                        parameters: {
                            country: "IN"
                        }
                    }
                }
            };
        }

        console.log(messageData);

        const myHeaders = {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + whatsappToken
        };

        console.log("Sending address message with saved addresses to number:", toNumber);

        const response = await axios.post("https://graph.facebook.com/v19.0/208582795666783/messages", messageData, { headers: myHeaders });
        const result = response.data;

        console.log("Address message with saved addresses sent successfully:", result);

        return result;
    } catch (error) {
        console.error('Error sending address message with saved addresses:', error);
        throw error;
    }
}

async function setDefaultAddress(userId, addressId) {
    const data = JSON.stringify({
        userId: userId,
        addressId: addressId
    });

    const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://9ti4fcd117.execute-api.ap-south-1.amazonaws.com/setDefaultAddress',
        headers: {
            'Content-Type': 'application/json'
        },
        data: data
    };

    try {
        const response = await axios.request(config);
        console.log(JSON.stringify(response.data));
        return response.data; // Return the response data if needed
    } catch (error) {
        console.error('Error setting default address:', error);
        throw error; // Rethrow the error if you want to handle it elsewhere
    }
}



async function addAddress(userId, address) {
    console.log(address)
    let data = JSON.stringify({
        "userId": userId,
        "address": {
            "name": address.name,
            "building_name": address.building_name,
            "address": address.address,
            "phoneNumber": address.phone_number,
            "landmark_area": address.landmark_area,
            "zipCode": address.in_pin_code,
            "city": address.city,
            "house_number": address.house_number,
            "floor_number": address.floor_number,
            "state": address.state
        }
    });

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://9ti4fcd117.execute-api.ap-south-1.amazonaws.com/addAddress',
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
    sendAddressMessageWithSavedAddresses,
    addAddress,
    setDefaultAddress,

    getAllAddresses
}