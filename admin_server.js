const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/admin.html') {
        fs.readFile(path.join(__dirname, 'admin.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading admin.html');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } else if (req.url.startsWith('/run-action')) {
        const urlParams = new URL(req.url, `http://${req.headers.host}`);
        const action = urlParams.searchParams.get('type');
        
        if (!['notes', 'open', 'close'].includes(action)) {
            res.writeHead(400);
            res.end('Invalid action');
            return;
        }

        console.log(`Running manual action: ${action}`);
        
        // Step 1: Run engine.js
        const engineCmd = `node scripts/daily_challenge/engine.js ${action}`;
        
        exec(engineCmd, (err, stdout, stderr) => {
            let output = `[ENGINE STDOUT]\n${stdout}\n[ENGINE STDERR]\n${stderr}\n`;
            
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, output }));
                return;
            }

            // Step 2: Git Push
            const gitCmd = `git add 1.json scripts/daily_challenge/tracker.json && git commit -m "chore: manual ${action} update" && git push origin main`;
            
            exec(gitCmd, (gitErr, gitStdout, gitStderr) => {
                output += `\n[GIT STDOUT]\n${gitStdout}\n[GIT STDERR]\n${gitStderr}`;
                
                if (gitErr) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Engine success, but Git failed', output }));
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: `Successfully updated ${action} and pushed to GitHub`, output }));
                }
            });
        });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Admin server running at http://localhost:${PORT}`);
});
