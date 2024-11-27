const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const querystring = require('querystring');

const PORT = 3000;
const users = [];
const sessions = {};

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
        serveFile(res, 'login.html');
    } else if (req.method === 'GET' && req.url.startsWith('/')) {
        serveFile(res, req.url.slice(1));
    } else if (req.method === 'POST' && req.url === '/register') {
        handleRegister(req, res);
    } else if (req.method === 'POST' && req.url === '/login') {
        handleLogin(req, res);
    } else if (req.method === 'GET' && req.url === '/profile') {
        handleGetProfile(req, res);
    } else if (req.method === 'PUT' && req.url === '/profile') {
        handleUpdateProfile(req, res);
    } else if (req.method === 'GET' && req.url.startsWith('/search')) {
        handleSearch(req, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }
});

function serveFile(res, filename) {
    const filePath = path.join(__dirname, filename);
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
        } else {
            const ext = path.extname(filename);
            let contentType = 'text/html';
            if (ext === '.css') contentType = 'text/css';
            if (ext === '.js') contentType = 'text/javascript';
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
}

function handleRegister(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        const formData = querystring.parse(body);
        const { name, username, password, email, gender, dob, bio, relationshipStatus } = formData;

        if (users.some(user => user.username === username)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Username already exists' }));
        } else {
            const newUser = {
                name,
                username,
                password: hashPassword(password),
                email,
                gender,
                dob,
                bio,
                relationshipStatus,
                profileImage: ''
            };
            users.push(newUser);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        }
    });
}

function handleLogin(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        const { username, password } = JSON.parse(body);
        const user = users.find(u => u.username === username && u.password === hashPassword(password));
        if (user) {
            const token = generateToken();
            sessions[token] = username;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, token }));
        } else {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Invalid credentials' }));
        }
    });
}

function handleGetProfile(req, res) {
    const token = getTokenFromHeader(req);
    if (token && sessions[token]) {
        const username = sessions[token];
        const user = users.find(u => u.username === username);
        if (user) {
            const { password, ...userWithoutPassword } = user;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, user: userWithoutPassword }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'User not found' }));
        }
    } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Unauthorized' }));
    }
}

function handleUpdateProfile(req, res) {
    const token = getTokenFromHeader(req);
    if (token && sessions[token]) {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const formData = querystring.parse(body);
            const username = sessions[token];
            const userIndex = users.findIndex(u => u.username === username);
            if (userIndex !== -1) {
                users[userIndex] = { ...users[userIndex], ...formData };
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'User not found' }));
            }
        });
    } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Unauthorized' }));
    }
}

function handleSearch(req, res) {
    const token = getTokenFromHeader(req);
    if (token && sessions[token]) {
        const query = querystring.parse(req.url.split('?')[1]).q;
        const matchedUsers = users.filter(user => 
            user.username.toLowerCase().includes(query.toLowerCase()) ||
            user.name.toLowerCase().includes(query.toLowerCase())
        );
        const sanitizedUsers = matchedUsers.map(({ password, ...user }) => user);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, users: sanitizedUsers }));
    } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Unauthorized' }));
    }
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken() {
    return crypto.randomBytes(16).toString('hex');
}

function getTokenFromHeader(req) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    return null;
}

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
