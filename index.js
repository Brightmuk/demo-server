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

var appetizers = [
  {
    "id": "0001",
    "name": "Bruschetta",
    "description": "Toasted bread topped with diced tomatoes, garlic, and basil",
    "price": 7.99,
    "imageURL": "https://images.unsplash.com/photo-1603133872879-6fb0f52f4f9f",
    "protein": 3,
    "carbs": 20,
    "calories": 120
  },
  {
    "id": "0002",
    "name": "Mozzarella Sticks",
    "description": "Fried mozzarella cheese served with marinara sauce",
    "price": 8.50,
    "imageURL": "https://images.unsplash.com/photo-1617191519704-8e3e73d9e351",
    "protein": 10,
    "carbs": 15,
    "calories": 290
  },
  {
    "id": "0003",
    "name": "Stuffed Mushrooms",
    "description": "Baked mushrooms filled with cheese and herbs",
    "price": 9.00,
    "imageURL": "https://images.unsplash.com/photo-1613145990877-cd9b60f777ed",
    "protein": 5,
    "carbs": 8,
    "calories": 110
  },
  {
    "id": "0004",
    "name": "Spring Rolls",
    "description": "Crispy rolls with mixed vegetables and sweet chili sauce",
    "price": 6.75,
    "imageURL": "https://images.unsplash.com/photo-1604908177225-054f6d3de7c3",
    "protein": 4,
    "carbs": 18,
    "calories": 150
  },
  {
    "id": "0005",
    "name": "Chicken Wings",
    "description": "Spicy buffalo chicken wings served with blue cheese dip",
    "price": 10.99,
    "imageURL": "https://images.unsplash.com/photo-1600891964599-f61ba0e24092",
    "protein": 20,
    "carbs": 5,
    "calories": 250
  },
  {
    "id": "0006",
    "name": "Calamari",
    "description": "Fried squid rings served with garlic aioli",
    "price": 11.50,
    "imageURL": "https://images.unsplash.com/photo-1562967916-eb82221dfb36",
    "protein": 13,
    "carbs": 10,
    "calories": 210
  },
  {
    "id": "0007",
    "name": "Deviled Eggs",
    "description": "Classic deviled eggs with mustard and paprika",
    "price": 5.99,
    "imageURL": "https://images.unsplash.com/photo-1562967914-93577d3e52e0",
    "protein": 6,
    "carbs": 2,
    "calories": 100
  },
  {
    "id": "0008",
    "name": "Caprese Skewers",
    "description": "Tomato, mozzarella, and basil skewers with balsamic glaze",
    "price": 6.50,
    "imageURL": "https://images.unsplash.com/photo-1608222351219-0f2b77bdc7fa",
    "protein": 7,
    "carbs": 6,
    "calories": 130
  },
  {
    "id": "0009",
    "name": "Nachos",
    "description": "Tortilla chips with melted cheese, jalapeños, and salsa",
    "price": 8.99,
    "imageURL": "https://images.unsplash.com/photo-1585238342023-78b9f0e37732",
    "protein": 9,
    "carbs": 25,
    "calories": 310
  },
  {
    "id": "0010",
    "name": "Garlic Bread",
    "description": "Toasted bread with garlic butter and herbs",
    "price": 4.99,
    "imageURL": "https://images.unsplash.com/photo-1601312370509-6c48aab8c985",
    "protein": 4,
    "carbs": 22,
    "calories": 190
  },
  {
    "id": "0011",
    "name": "Onion Rings",
    "description": "Crispy fried onion rings served with ranch dip",
    "price": 6.99,
    "imageURL": "https://images.unsplash.com/photo-1626435528790-98b8cb99a32d",
    "protein": 3,
    "carbs": 27,
    "calories": 270
  },
  {
    "id": "0012",
    "name": "Shrimp Cocktail",
    "description": "Chilled shrimp served with cocktail sauce",
    "price": 12.99,
    "imageURL": "https://images.unsplash.com/photo-1624469715581-61a1db62b9eb",
    "protein": 14,
    "carbs": 2,
    "calories": 120
  },
  {
    "id": "0013",
    "name": "Potato Skins",
    "description": "Crispy potato skins topped with cheese and bacon",
    "price": 9.25,
    "imageURL": "https://images.unsplash.com/photo-1600793009187-cc9aa5620810",
    "protein": 11,
    "carbs": 20,
    "calories": 280
  },
  {
    "id": "0014",
    "name": "Spinach Artichoke Dip",
    "description": "Warm creamy spinach and artichoke dip served with chips",
    "price": 8.75,
    "imageURL": "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f",
    "protein": 6,
    "carbs": 12,
    "calories": 210
  },
  {
    "id": "0015",
    "name": "Mini Sliders",
    "description": "Beef sliders with cheese and pickles on mini buns",
    "price": 10.50,
    "imageURL": "https://images.unsplash.com/photo-1625941421876-1f1a983727de",
    "protein": 18,
    "carbs": 18,
    "calories": 340
  }
];


app.get('/user', (req, res) => {
    console.log('Called...')
    res.status(200).json({
        "type": "success",
        "data": {
            "name": "Bright Mukonesi",
            "age": "24",
            "nationality": "Kenyan",
            "points": 99,
            "avatar": "https://07c0-41-90-177-88.ngrok-free.app/songs/jireh_provider/art.jpg"
        }
    })
})

app.get('/appetizers', (req, res) => {
    res.status(200).json({
        "request": appetizers
    })
})
app.post('/upload-expenses', (req, res) => {
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

app.get('/suggestion', (req, res) => {
    var query = req.query.query;
    console.log(query);
    res.status(200).json({
        "response_status": "00",
        "response": suggestions
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
        var paginationResult = appetizers.slice(lastItem - limit, lastItem)
        res.json({
            data: paginationResult,
            total: appetizers.length,
            page: page,
            totalPages: Math.ceil(appetizers.length / limit),
        });
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.get("/auth/google/login", (req, res) => {
  res.status(200).send(`
  <h2>Submit Your Details</h2>
  <form action="/submit" method="POST">
    <label>Name:</label>
    <input type="text" name="name" required><br><br>
    
    <label>Email:</label>
    <input type="email" name="email" required><br><br>

    <button type="submit">Submit</button>
  </form>
`);
});

app.get("/login", (req, res) => {
  setTimeout(() => {
    res.redirect('/auth/google/login');
  }, 2000);
});

// Handle form submission
app.post("/submit", (req, res) => {
    const { name, email } = req.body;
    console.log(req.body);
    // Simple response (store in memory or database if needed)
    res.redirect(`myapp://auth?token=${appToken}`);
    // res.status(200).json({
    //     "response": {
    //         "data_source": {
    //             "cols": [
    //                 {
    //                     "label": "status",
    //                     "type": "string",
    //                     "value": "status"
    //                 }

    //             ],
    //             "rows": [
    //                 [
    //                     "PAID"
    //                 ]
    //             ],
    //             "lines": [],
    //             "groups": [],
    //             "data": [],
    //             "min_id": 0,
    //             "max_id": 0,
    //             "row_count": 4
    //         }
    //     }
    // })
});


app.listen(4000, () => {
    console.log('Server running on localhost:4000 ')
})


