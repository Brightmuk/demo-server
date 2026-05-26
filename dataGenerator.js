// dataGenerator.js

import { v4 as uuidv4 } from 'uuid';

/**
 * Converts a string to a format suitable for use as an ID/slug.
 * @param {string} str 
 * @returns {string}
 */
const slugify = (str) => {
    return str.toLowerCase().replace(/\s+/g, '.');
};

/**
 * Generates an array of mock user objects.
 * @returns {Array<Object>}
 */
function generateMockUsers() {
    const users = [];

    const firstNames = ['Alex', 'Ben', 'Chris', 'Dana', 'Erin', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack', 'Kelly', 'Liam'];
    const lastNames = ['Smith', 'Jones', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson'];
    const riskLevels = ['High', 'Medium', 'Low'];
    const agentStatuses = ['Online', 'Offline', 'Connecting'];
    const agentVersions = ['v2.1.0', 'v2.1.1', 'v2.0.5', 'v1.9.3'];
    const intentCategories = ['Billing', 'Security', 'Maintenance', 'Support', 'Sales'];
    const now = new Date();

    for (let i = 0; i < 50; i++) {
        // Generate random name and email
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const fullName = `${firstName} ${lastName}`;
        // Add a random number (0-999) to the email to ensure better uniqueness
        const emailSlug = slugify(firstName) + '.' + slugify(lastName);
        const email = `${emailSlug}${Math.floor(Math.random() * 1000)}@corp.com`;

        // Generate random values for other fields
        const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
        const agentStatus = agentStatuses[Math.floor(Math.random() * agentStatuses.length)];
        const agentVersion = agentVersions[Math.floor(Math.random() * agentVersions.length)];
        const intentCategory = intentCategories[Math.floor(Math.random() * intentCategories.length)];
        const topAlerts = Math.floor(Math.random() * 15); // 0 to 14 alerts
        
        // Generate random creation date within the last 30 days
        const daysAgo = Math.floor(Math.random() * 30);
        const hoursAgo = Math.floor(Math.random() * 24);
        const createdAt = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000));

        users.push({
            // Use UUID for a robust, unique ID
            id: uuidv4(), 
            name: fullName,
            email: email,
            riskLevel: riskLevel,
            agentStatus: agentStatus,
            agentVersion: agentVersion,
            topIntentCategory: intentCategory,
            topAlerts: topAlerts,
            // Convert Date object to ISO string
            createdAt: createdAt.toISOString(), 
        });
    }

    return users;
}

export { generateMockUsers };