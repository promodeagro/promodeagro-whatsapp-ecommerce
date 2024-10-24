const axios = require('axios');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

const dynamodb = new AWS.DynamoDB.DocumentClient();

// async function sendAddressMessageWithSavedAddresses(toNumber, whatsappToken, userDetails) {
//     console.log(userDetails);
//     try {
//         let messageData;

//         // Check if userDetails contains necessary address information
//         if (userDetails) {
//             console.log("Address Present")
//             messageData = {
//                 messaging_product: "whatsapp",
//                 recipient_type: "individual",
//                 to: toNumber,
//                 type: "interactive",
//                 interactive: {
//                     type: "address_message",
//                     body: {
//                         text: "Thanks for your order! Tell us what address you'd like this order delivered to."
//                     },
//                     action: {
//                         name: "address_message",
//                         parameters: {
//                             country: "IN",
//                             saved_addresses: [
//                                 {
                                

//                                     "id": "address 1",
//                                     "value": {
//                                         "name": userDetails.values.name,
//                                         "phone_number": userDetails.values.phone_number,
//                                         "in_pin_code": userDetails.values.in_pin_code,
//                                         "floor_number": userDetails.values.floor_number,
//                                         "building_name": userDetails.values.building_name,
//                                         "address": userDetails.values.address,
//                                         "landmark_area": userDetails.values.landmark_area,
//                                         "city": userDetails.values.city
//                                     }

//                                 }
//                             ]
//                         }
//                     }
//                 }
//             };
//         } else {
//             messageData = {
//                 messaging_product: "whatsapp",
//                 recipient_type: "individual",
//                 to: toNumber,
//                 type: "interactive",
//                 interactive: {
//                     type: "address_message",
//                     body: {
//                         text: "Thanks for your order! Tell us what address you’d like this order delivered to."
//                     },
//                     action: {
//                         name: "address_message",
//                         parameters: {
//                             country: "IN"
//                         }
//                     }
//                 }
//             };
//         }

//         console.log(messageData)

//         const myHeaders = {
//             "Content-Type": "application/json",
//             "Authorization": "Bearer " + whatsappToken
//         };
//         console.log("Address");
//         console.log(messageData);

//         const requestOptions = {
//             headers: myHeaders,
//             redirect: 'follow'
//         };

//         console.log("Sending address message with saved addresses to number:", toNumber);

//         const response = await axios.post("https://graph.facebook.com/v19.0/208582795666783/messages", messageData, requestOptions);
//         const result = response.data;

//         console.log("Address message with saved addresses sent successfully:", result);

//         return result;
//     } catch (error) {
//         console.error('Error sending address message with saved addresses:', error);
//         throw error;
//     }
// }


async function sendAddressMessageWithSavedAddresses(toNumber, whatsappToken, userDetailsArray) {
    try {
        let messageData;

        // Check if userDetailsArray contains necessary address information
        if (userDetailsArray && userDetailsArray.length > 0) {
            console.log("Address Present");
            const savedAddresses = userDetailsArray.map((userDetails, index) => ({
                "id": `address ${index + 1}`,
                "value": {
                    "name": userDetails.values.name,
                    "phone_number": userDetails.values.phone_number,
                    "in_pin_code": userDetails.values.in_pin_code,
                    "floor_number": userDetails.values.floor_number,
                    "building_name": userDetails.values.building_name,
                    "address": userDetails.values.address,
                    "landmark_area": userDetails.values.landmark_area,
                    "city": userDetails.values.city
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

        const requestOptions = {
            headers: myHeaders,
            redirect: 'follow'
        };

        console.log("Sending address message with saved addresses to number:", toNumber);

        const response = await axios.post("https://graph.facebook.com/v19.0/208582795666783/messages", messageData, requestOptions);
        const result = response.data;

        console.log("Address message with saved addresses sent successfully:", result);

        return result;
    } catch (error) {
        console.error('Error sending address message with saved addresses:', error);
        throw error;
    }
}


async function createUserInWhatsAppCommerce(mobileNumber) {
    const data = JSON.stringify({ mobileNumber });
  
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://9ti4fcd117.execute-api.ap-south-1.amazonaws.com/createUserInWhatsaapCommerce',
      headers: { 
        'Content-Type': 'application/json'
      },
      data: data
    };
  
    try {
      const response = await axios.request(config);
      console.log(JSON.stringify(response.data));
      return response.data; // Return the response data for further use if needed
    } catch (error) {
      console.error(error);
      throw error; // Optionally rethrow the error for handling at a higher level
    }
  }
  

async function getUserAddressFromDatabase(senderId) {
    try {
        const params = {
            TableName: 'users',
            Key: { 'phone_number': senderId }
        };

        const result = await dynamodb.get(params).promise();

        if (!result.Item) {
            return null;
        }

        return result.Item.details;
    } catch (error) {
        console.error('Error fetching user address details from DynamoDB:', error);
        throw error;
    }
}

// async function storeUserResponse(phoneNumber, userDetails) {
//     const tableName = 'users';

//     const getParams = {
//         TableName: tableName,
//         Key: {
//             'phone_number': phoneNumber
//         }
//     };

//     try {
//         const data = await dynamodb.get(getParams).promise();
//         if (data.Item) {
//             // Customer exists, update the item with new details
//             const updateParams = {
//                 TableName: tableName,
//                 Key: {
//                     'phone_number': phoneNumber
//                 },
//                 UpdateExpression: 'SET #details = list_append(if_not_exists(#details, :empty_list), :newDetails)',
//                 ExpressionAttributeNames: {
//                     '#details': 'details'
//                 },
//                 ExpressionAttributeValues: {
//                     ':newDetails': [userDetails],
//                     ':empty_list': []
//                 },
//                 ReturnValues: 'UPDATED_NEW'
//             };

//             const updateResult = await dynamodb.update(updateParams).promise();
//             console.log("Updated item:", JSON.stringify(updateResult, null, 2));
//         } else {
//             // Customer does not exist, create a new item
//             const putParams = {
//                 TableName: tableName,
//                 Item: {
//                     'phone_number': phoneNumber,
//                     'details': [userDetails]
//                 }
//             };

//             const putResult = await dynamodb.put(putParams).promise();
//             console.log("Added item:", JSON.stringify(putResult, null, 2));
//         }
//     } catch (err) {
//         console.error("Error handling item:", JSON.stringify(err, null, 2));
//     }
// }

async function storeUserResponse(phoneNumber, userDetails) {
    const tableName = 'users';

    const getParams = {
        TableName: tableName,
        Key: {
            'phone_number': phoneNumber
        }
    };

    try {
        const data = await dynamodb.get(getParams).promise();
        console.log(data)
        if (data.Item) {
            // Customer exists, check for duplicate details
            const existingDetails = data.Item.details || [];
            const isDuplicate = existingDetails.some(detail => {
                return detail.values.house_number === userDetails.values.house_number ||
                    detail.values.floor_number === userDetails.values.floor_number
            });

            if (!isDuplicate) {
                // New details, update the item with new details
                const updateParams = {
                    TableName: tableName,
                    Key: {
                        'phone_number': phoneNumber
                    },
                    UpdateExpression: 'SET #details = list_append(#details, :newDetails)',
                    ExpressionAttributeNames: {
                        '#details': 'details'
                    },
                    ExpressionAttributeValues: {
                        ':newDetails': [userDetails]
                    },
                    ReturnValues: 'UPDATED_NEW'
                };

                const updateResult = await dynamodb.update(updateParams).promise();
                console.log("Updated item:", JSON.stringify(updateResult, null, 2));
            } else {
                console.log("Details already exist, not adding.");
            }
        } else {
            // Customer does not exist, create a new item
            const putParams = {
                TableName: tableName,
                Item: {
                    'phone_number': phoneNumber,
                    'details': [userDetails]
                }
            };

            const putResult = await dynamodb.put(putParams).promise();
            console.log("Added item:", JSON.stringify(putResult, null, 2));
        }
    } catch (err) {
        console.error("Error handling item:", JSON.stringify(err, null, 2));
    }
}


const phoneNumber = '918317582549';
const userDetailsFormatted = {
    values: {
        in_pin_code: '500008',
        building_name: 'snmsmsmsm',
        landmark_area: 'snnsnsmsm',
        address: 'hshsnns',
        tower_number: 'sjnsmsmm',
        city: 'sjnsnsm',
        name: 'Umran 2',
        phone_number: '8317582549',
        house_number: 'scasxsnsnsnsnn',
        floor_number: 'shjsvcdmdfsks',
        state: 'sjmsmsm'
    }
};

storeUserResponse(phoneNumber, userDetailsFormatted);


module.exports = {
    sendAddressMessageWithSavedAddresses,
    getUserAddressFromDatabase,
    storeUserResponse,
    createUserInWhatsAppCommerce
};
