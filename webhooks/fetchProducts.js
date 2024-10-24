const axios = require('axios');
const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function fetchProductData() {
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'https://9ti4fcd117.execute-api.ap-south-1.amazonaws.com/product?userId=',
    headers: { }
  };

  try {
    const response = await axios.request(config);

    // console.log(response)
    return response.data;
  } catch (error) {
    throw error; // Propagate the error for the caller to handle
  }
}


const fetchProductDataById = async (id) => {
  const params = {
    TableName: 'Products', 
    Key: {
      'id': id 
    }
  };

  try {
    const data = await dynamodb.get(params).promise();
    return data.Item; // Assuming you want to return the fetched item
  } catch (error) {
    console.error('Error fetching product data:', error);
    throw error; // Re-throw the error for handling elsewhere
  }
}

const fetchProductsForCart = async (currentCart) => {
  try {
    // Create an array of promises for fetching product data
    const productPromises = currentCart.items.map(async (e) => {
      const product = await fetchProductDataById(e.productId);
      console.log(product)

      
      // return product;
    });

    // Wait for all promises to resolve
    // const products = await Promise.all(productPromises);

    // Log all fetched products
    // products.forEach(product => console.log(product));
  } catch (error) {
    console.error('Error fetching products for cart:', error);
  }
};



module.exports = {
    fetchProductData,
    fetchProductDataById,
    fetchProductsForCart
};
