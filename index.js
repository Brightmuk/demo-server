import express from 'express'; 
import { v4 as uuidv4 } from 'uuid';
import { generateMockUsers } from './dataGenerator.js';

const app = express();
const PORT = 4000;

app.use(express.json());

let mockUsers = generateMockUsers();

app.post('/api/users/create', (req, res) => {
    const newUser = req.body;
    var apikey = "GrSLGv2WKxzL83WaQSxxSTj9HPQ1sa41OFG";
    if (!newUser || !newUser.name || !newUser.email) {
        return res.status(400).json({ message: "Missing required fields: name, email" });
    }

    const userToCreate = {
        id: uuidv4(),
        ...newUser,
        createdAt: new Date().toISOString(),
        // Set defaults if not provided in the request body
        riskLevel: newUser.riskLevel || 'Low',
        agentStatus: newUser.agentStatus || 'Offline',
        topAlerts: newUser.topAlerts || 0,
        // ... add other defaults as needed
    };

    mockUsers.push(userToCreate);
    // Respond with 201 Created and the new user object
    res.status(201).json(userToCreate); 
});

// 2. READ (GET)
// Endpoint: GET /api/users
// Gets all users
app.get('/api/users', (req, res) => {
    // 1. Parse and validate pagination parameters from query string
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page

    // Ensure page and limit are positive integers
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);

    // 2. Calculate offsets
    const totalUsers = mockUsers.length;
    // Calculate total pages needed based on total users and page size
    const totalPages = Math.ceil(totalUsers / safeLimit);
    
    // Calculate start index for array slicing
    const startIndex = (safePage - 1) * safeLimit;
    const endIndex = startIndex + safeLimit;

    // 3. Slice the array to get the paginated results
    // .slice() returns an empty array if indices are out of bounds, which is correct for empty pages
    const results = mockUsers.slice(startIndex, endIndex);

    // 4. Construct the paginated response object
    const response = {
        totalUsers: totalUsers,
        totalPages: totalPages,
        currentPage: safePage,
        pageSize: safeLimit,
        data: results // The actual list of users for the current page
    };
    
    res.json(response);
});

// Endpoint: GET /api/users/:id
// Gets a single user by ID
app.get('/api/users/:id', (req, res) => {
    const id = req.params.id;
    const user = mockUsers.find(u => u.id === id);

    if (user) {
        res.json(user);
    } else {
        // Respond with 404 Not Found
        res.status(404).json({ message: `User with ID ${id} not found` }); 
    }
});


app.put('/api/users/:id', (req, res) => {
    const id = req.params.id;
    const updatedData = req.body;
    const userIndex = mockUsers.findIndex(u => u.id === id);

    if (userIndex !== -1) {
        // Keep the original ID and createdAt, overwrite other fields
        const originalUser = mockUsers[userIndex];
        mockUsers[userIndex] = {
            ...updatedData,
            id: originalUser.id,
            createdAt: originalUser.createdAt,
        };
        // Respond with the updated user object
        res.json(mockUsers[userIndex]); 
    } else {
        res.status(404).json({ message: `User with ID ${id} not found` });
    }
});


app.delete('/api/users/:id', (req, res) => {
    
    const id = req.params.id;
    const initialLength = mockUsers.length;

    mockUsers = mockUsers.filter(u => u.id !== id);

    if (mockUsers.length < initialLength) {
        // Respond with 204 No Content for a successful deletion
        res.status(204).send(); 
    } else {
        res.status(404).json({ message: `User with ID ${id} not found` });
    }
});


app.listen(PORT, () => {
    console.log(`🚀 Mock User Server listening at http://localhost:${PORT}`);
    console.log(`Total mock users generated: ${mockUsers.length}`);
});