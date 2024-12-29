const AWS = require('aws-sdk');
const axios = require('axios');
const lambda = new AWS.Lambda();
require('dotenv').config();


exports.handler = async (event) => {
    try {
        // Extract category from the event input
        const { category } = event;
        if (!category) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Category is required in the input." }),
            };
        }

        // Invoke the getAllProduct Lambda function
        const productsParam = {
            FunctionName: 'promodeAgro-ecommerce-api-prod-demoPrducts', // Adjust the function name
            InvocationType: 'RequestResponse',
        };

        const productss = await lambda.invoke(productsParam).promise();
        const data = JSON.parse(productss.Payload);
        const products = JSON.parse(data.body);

        // Filter products based on the category and map to variant IDs
        const filteredProducts = products.products
            .filter(product => product.category === category)
            .map(product => product.unitPrices[0]?.varient_id)
            .filter(varient_id => varient_id); // Remove undefined IDs

        console.log("Filtered Product Variant IDs:", filteredProducts);

        // Get products from Commerce Manager
        const FR_commerce = await getProductsFromCommerceManager();

        if (!FR_commerce.data) {
            throw new Error("Invalid response: 'data' is missing in FR_commerce.");
        }

        // Match products by retailer_id
        const FR_finalProducts = FR_commerce.data
            .filter(commerceProduct => filteredProducts.includes(commerceProduct.retailer_id))
            .map(commerceProduct => commerceProduct.retailer_id);

        console.log("Final Products for Category:", FR_finalProducts);

        // Return the final products
        return {
            statusCode: 200,
            body: JSON.stringify({
                category,
                finalProducts: FR_finalProducts,
            }),
        };
    } catch (error) {
        console.error("Error processing products:", error.message);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error", error: error.message }),
        };
    }
};

// Function to fetch products from Commerce Manager
async function getProductsFromCommerceManager() {
    try {
        const response = await axios.get(`${process.env.FACEBOOK_GRAPH_API_URL}/${process.env.CATALOG_ID}/products`, {
            params: {
                access_token: process.env.whatsapp_Token,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching products from Commerce Manager:", error.message);
        throw error;
    }
}
