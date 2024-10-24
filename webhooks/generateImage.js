const { createCanvas } = require('canvas');
const fs = require('fs');

async function generateBillImage(items) {
    // Calculate the total price and format the items into a string
    let totalPrice = 0;
    let itemsList = items.map(item => {
        let price = parseFloat(item.price);
        let quantity = parseInt(item.quantity);
        let subtotal = price * quantity;
        totalPrice += subtotal;

        // Return the formatted details for each item
        return {
            name: item.name,
            price: price.toFixed(2),
            quantity: quantity.toString(),
            subtotal: subtotal.toFixed(2)
        };
    });

    // Find the longest item name length for dynamic canvas width
    const longestItemNameLength = Math.max(...items.map(item => item.name.length));

    // Calculate the required canvas width and height
    const canvasWidth = 800;
    const lineHeight = 36;
    const padding = 40;
    const itemTableHeight = (items.length + 1) * lineHeight; // Adjusted for the items and total section
    const totalSectionHeight = 2 * lineHeight; // Space for total line and text
    const canvasHeight = itemTableHeight + 5 * padding + totalSectionHeight;

    // Create canvas and context
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    gradient.addColorStop(0, '#ffffff'); // White
    gradient.addColorStop(1, '#f2f2f2'); // Light gray
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Header
    ctx.fillStyle = '#333333';
    ctx.font = '28px Arial';
    ctx.fillText('Your Bill', padding, padding);

    // Table headers
    ctx.font = '18px Arial';
    ctx.fillText('Item', padding, padding + 2 * lineHeight);
    ctx.fillText('Price', 400, padding + 2 * lineHeight);
    ctx.fillText('Qty', 500, padding + 2 * lineHeight);
    ctx.fillText('Subtotal', 600, padding + 2 * lineHeight);

    // Table rows
    ctx.font = '16px Arial';
    itemsList.forEach((item, index) => {
        const y = padding + (3 + index) * lineHeight;
        ctx.fillStyle = index % 2 === 0 ? '#f2f2f2' : '#ffffff'; // Alternate row colors
        ctx.fillRect(padding, y - 20, canvasWidth - 2 * padding, lineHeight);
        ctx.fillStyle = '#333333';
        ctx.fillText(item.name, padding, y);
        ctx.fillText(item.price, 400, y);
        ctx.fillText(item.quantity, 500, y);
        ctx.fillText(item.subtotal, 600, y);
    });

    // Total line
    ctx.fillStyle = '#333333';
    ctx.fillRect(padding, padding + itemTableHeight + 4 * padding, canvasWidth - 2 * padding, 2);

    // Total text
    ctx.font = '18px Arial'; // Font size for total amount
    ctx.fillText(`Total: $${totalPrice.toFixed(2)}`, 600, padding + itemTableHeight + 4.5 * padding + lineHeight);

    // Save the image to a file
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync('bill.png', buffer);
    console.log('Bill image generated and saved as bill.png');
}

// Example usage
const items = [
    { name: 'Banana x', price: 40, quantity: 5 },
    { name: 'Watermelon', price: 3500, quantity: 4 },
    { name: 'Curry Leaves', price: 100, quantity: 1 },

    { name: 'Banana x', price: 40, quantity: 5 },
    { name: 'Watermelon', price: 3500, quantity: 4 },
    { name: 'Curry Leaves', price: 100, quantity: 1 },

    { name: 'Banana x', price: 40, quantity: 5 },
    { name: 'Watermelon', price: 3500, quantity: 4 },
    { name: 'Curry Leaves', price: 100, quantity: 1 },

    { name: 'Banana x', price: 40, quantity: 5 },
    { name: 'Watermelon', price: 3500, quantity: 4 },
    { name: 'Curry Leaves', price: 100, quantity: 1 },

    { name: 'Banana x', price: 40, quantity: 5 },
    { name: 'Watermelon', price: 3500, quantity: 4 },
    { name: 'Curry Leaves', price: 100, quantity: 1 },
    { name: 'Banana x', price: 40, quantity: 5 },
    { name: 'Watermelon', price: 3500, quantity: 4 },
    { name: 'Curry Leaves', price: 100, quantity: 1 },
    { name: 'Banana x', price: 40, quantity: 5 },
    { name: 'Watermelon', price: 3500, quantity: 4 },
];

generateBillImage(items);
