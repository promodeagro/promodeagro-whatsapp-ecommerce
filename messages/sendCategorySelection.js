const axios = require('axios');

async function sendCategorySelection(number, whatsappToken) {
    try {
        // Step 1: Fetch categories from the API
        const categoryResponse = await axios.get('https://9ti4fcd117.execute-api.ap-south-1.amazonaws.com/category');
        const categories = categoryResponse.data;

        // Step 2: Map categories to WhatsApp interactive list format
        const sections = [
            {
                title: "Categories",
                rows: categories.map((category) => ({
                    id: category.CategoryName, // unique id for each category
                    title: category.CategoryName,
                    description: category.Subcategories.join(", ")
                }))
            }
        ];

        // Step 3: Prepare the message payload
        let data = JSON.stringify({
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": number,
            "type": "interactive",
            "interactive": {
                "type": "list",
                "header": {
                    "type": "text",
                    "text": "Select Category"
                },
                "body": {
                    "text": "Please choose a category."
                },
                "footer": {
                    "text": "Pramode Agro Farms"
                },
                "action": {
                    "button": "View Categories",
                    "sections": sections
                }
            }
        });

        // Step 4: Send the message via WhatsApp API
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://graph.facebook.com/v19.0/208582795666783/messages',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${whatsappToken}`
            },
            data: data
        };

        const response = await axios.request(config);
        console.log(JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        console.error('Error sending categories:', error.message);
        return {
            error: error.message,
            details: error.response ? error.response.data : null
        };
    }
}

// Lambda handler function
exports.handler = async (event) => {
    // Extract the phone number and whatsappToken from the event (e.g., from API Gateway)
    const { number, whatsappToken } = event;

    // Call the sendCategorySelection function
    const result = await sendCategorySelection(number, whatsappToken);

    // Return the response in the expected format
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Category selection sent successfully!',
            data: result
        })
    };
};
