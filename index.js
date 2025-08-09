const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const bodyParser = require("body-parser");
app.use(cors());

require('dotenv').config();
app.use(express.json());
// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

var callsInQueue = [
  {
    "id": "0001",
    "name": "Bruschetta",
    "description": "Toasted bread topped with diced tomatoes, garlic, and basil",
    "price": 7.99,
    "imageURL": "https://ibb.co/Nn2Cf7Q4",
    "protein": 3,
    "carbs": 20,
    "calories": 120
  },
  {
    "id": "0002",
    "name": "Mozzarella Sticks",
    "description": "Fried mozzarella cheese served with marinara sauce",
    "price": 8.50,
    "imageURL": "https://ibb.co/kgzDg0Wb",
    "protein": 10,
    "carbs": 15,
    "calories": 290
  },
  {
    "id": "0003",
    "name": "Stuffed Mushrooms",
    "description": "Baked mushrooms filled with cheese and herbs",
    "price": 9.00,
    "imageURL": "https://ibb.co/KjbjshfM",
    "protein": 5,
    "carbs": 8,
    "calories": 110
  },

  {
    "id": "0004",
    "name": "Spring Rolls",
    "description": "Crispy rolls with mixed vegetables and sweet chili sauce",
    "price": 6.75,
    "imageURL": "   https://ibb.co/CsNbps3Z",
    "protein": 4,
    "carbs": 18,
    "calories": 150
  },
  {
    "id": "0005",
    "name": "Chicken Wings",
    "description": "Spicy buffalo chicken wings served with blue cheese dip",
    "price": 10.99,
    "imageURL": "https://ibb.co/Nn2Cf7Q4",
    "protein": 20,
    "carbs": 5,
    "calories": 250
  },
  {
    "id": "0006",
    "name": "Calamari",
    "description": "Fried squid rings served with garlic aioli",
    "price": 11.50,
    "imageURL": "https://ibb.co/kgzDg0Wb",
    "protein": 13,
    "carbs": 10,
    "calories": 210
  },
  {
    "id": "0007",
    "name": "Deviled Eggs",
    "description": "Classic deviled eggs with mustard and paprika",
    "price": 5.99,
    "imageURL": "https://ibb.co/KjbjshfM",
    "protein": 6,
    "carbs": 2,
    "calories": 100
  },

  {
    "id": "0008",
    "name": "Caprese Skewers",
    "description": "Tomato, mozzarella, and basil skewers with balsamic glaze",
    "price": 6.50,
    "imageURL": "  https://ibb.co/CsNbps3Z",
    "protein": 7,
    "carbs": 6,
    "calories": 130
  },
  {
    "id": "0009",
    "name": "Nachos",
    "description": "Tortilla chips with melted cheese, jalapeños, and salsa",
    "price": 8.99,
    "imageURL": "https://ibb.co/Nn2Cf7Q4",
    "protein": 9,
    "carbs": 25,
    "calories": 310
  },
  {
    "id": "0010",
    "name": "Garlic Bread",
    "description": "Toasted bread with garlic butter and herbs",
    "price": 4.99,
    "imageURL": "https://ibb.co/kgzDg0Wb",
    "protein": 4,
    "carbs": 22,
    "calories": 190
  },
  {
    "id": "0011",
    "name": "Onion Rings",
    "description": "Crispy fried onion rings served with ranch dip",
    "price": 6.99,
    "imageURL": "https://ibb.co/KjbjshfM",
    "protein": 3,
    "carbs": 27,
    "calories": 270
  },

  {
    "id": "0012",
    "name": "Shrimp Cocktail",
    "description": "Chilled shrimp served with cocktail sauce",
    "price": 12.99,
    "imageURL": "https://ibb.co/KjbjshfM",
    "protein": 14,
    "carbs": 2,
    "calories": 120
  },
  {
    "id": "0013",
    "name": "Potato Skins",
    "description": "Crispy potato skins topped with cheese and bacon",
    "price": 9.25,
    "imageURL": "https://ibb.co/kgzDg0Wb",
    "protein": 11,
    "carbs": 20,
    "calories": 280
  },
  {
    "id": "0014",
    "name": "Spinach Artichoke Dip",
    "description": "Warm creamy spinach and artichoke dip served with chips",
    "price": 8.75,
    "imageURL": "https://ibb.co/Nn2Cf7Q4",
    "protein": 6,
    "carbs": 12,
    "calories": 210
  },
  {
    "id": "0015",
    "name": "Mini Sliders",
    "description": "Beef sliders with cheese and pickles on mini buns",
    "price": 10.50,
    "imageURL": "https://ibb.co/dw3g7V1B",
    "protein": 18,
    "carbs": 18,
    "calories": 340
  }
];





app.get('/calls', (req, res) => {
    res.status(200).json({
        "calls": callsInQueue
    })
})

app.post('/claim', (req, res) => {
    console.log("Received: " + req.body)
    res.status(200).json({
        "response_status": "00",
        "response": "Your Expenses were recorded"
    })
})

var quantityMock = {}
app.post('/update_quantity', (req, res) => {
    var itemId = req.body['cart_item_id'];
    var newQuantity = req.body['quantity'];

    quantityMock[itemId] = newQuantity;
    console.log("Current map: ", quantityMock);
    res.status(200).json({
        "response_status": "00",
        "response": { "quantity": quantityMock[itemId], "cartItemsCount": 3 }
    })
})

app.get('/options', (req, res) => {
    var query = req.query.query;
    console.log(query);
    res.status(200).json({
        "response_status": "00",
        "options": [
            { "label": "Vegetables", "value": "Vegetables", "options": [] },
            { "label": "Fruits", "value": "Fruits", "options": [] },
        ],
    })
})


//PAGINATION 
app.get('/items', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const lastItem = limit * page;
    console.log(`The current page is ${page} and limit is ${limit}`)

    try {
        var paginationResult = callsInQueue.slice(lastItem - limit, lastItem)
        res.json({
            data: paginationResult,
            total: callsInQueue.length,
            page: page,
            totalPages: Math.ceil(callsInQueue.length / limit),
        });
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});



app.listen(4000, () => {
    console.log('Server running on localhost:4000 ')
})


