const express = require('express');
const path = require('path');
const app = express();
const port = 4500;

// Serve static files
app.use(express.static(__dirname));

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log('\nServer running at:');
    console.log(`- Local: http://localhost:${port}`);
    
    // Get local IP address
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                console.log(`- Network: http://${net.address}:${port}`);
            }
        }
    }
});