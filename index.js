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

var expenses = [
    {
        "name": "Perfueme de eu",
        "extras": {
            "price": 16500,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Cabinet Closee",
        "extras": {
            "price": 7000,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Base guitar",
        "extras": {
            "price": 18000,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Wide Desk",
        "extras": {
            "price": 14000,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Armchair",
        "extras": {
            "price": 12500,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Bed Table",
        "extras": {
            "price": 17500,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "TV Stand",
        "extras": {
            "price": 14000,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Bench",
        "extras": {
            "price": 5000,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Nightstand",
        "extras": {
            "price": 9500,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Side Table",
        "extras": {
            "price": 15500,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Stool",
        "extras": {
            "price": 6500,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Cabinet",
        "extras": {
            "price": 15500,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Bench",
        "extras": {
            "price": 13500,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Wardrobe",
        "extras": {
            "price": 6500,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Recliner",
        "extras": {
            "price": 5500,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Sofa",
        "extras": {
            "price": 9000,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Dining Table",
        "extras": {
            "price": 14500,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Dining Table",
        "extras": {
            "price": 17000,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Bookcase",
        "extras": {
            "price": 17000,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Desk",
        "extras": {
            "price": 7500,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Desk",
        "extras": {
            "price": 11500,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Ottoman",
        "extras": {
            "price": 16000,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Table",
        "extras": {
            "price": 12500,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Dining Table",
        "extras": {
            "price": 9000,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Ottoman",
        "extras": {
            "price": 9000,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Cabinet",
        "extras": {
            "price": 18000,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Chair",
        "extras": {
            "price": 10500,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Desk",
        "extras": {
            "price": 10500,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Desk",
        "extras": {
            "price": 12000,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Couch",
        "extras": {
            "price": 9000,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Cabinet",
        "extras": {
            "price": 15500,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Couch",
        "extras": {
            "price": 13000,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Bench",
        "extras": {
            "price": 5000,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Chair",
        "extras": {
            "price": 5500,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Bench",
        "extras": {
            "price": 18000,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Nightstand",
        "extras": {
            "price": 9000,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Side Table",
        "extras": {
            "price": 7000,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Nightstand",
        "extras": {
            "price": 12000,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    },
    {
        "name": "Wardrobe",
        "extras": {
            "price": 19500,
            "quantity": "1 set",
            "image": "https://i.ibb.co/K6xv7bw/Bed.webp"
        }
    }];



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

app.post('/expenses', (req, res) => {
    res.status(200).json({
        "response_status": "00",

        "response": expenses
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
        var paginationResult = expenses.slice(lastItem - limit, lastItem)
        res.json({
            data: paginationResult,
            total: expenses.length,
            page: page,
            totalPages: Math.ceil(expenses.length / limit),
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


