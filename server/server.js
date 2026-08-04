const http = require('http');
const { env } = require('process');
const url = require('url');

class HeartbeatServer {
    constructor() {
        console.log('Creating new HeartbeatServer instance');

        this.users = new Map();
        this.refresh_interval_seconds = parseInt(env.REFRESH_INTERVAL) || 30;
        this.port = parseInt(env.PORT) || 8080;
        console.log(
            `Refresh interval: ${this.refresh_interval_seconds} seconds`,
        );

        this.runServer(this.port);

        setInterval(() => {
            this.runCleanup();
        }, this.refresh_interval_seconds * 1000);
    }

    runServer(port) {
        console.log('Starting heartbeat server on port ' + port);
        this.serverInstance = http.createServer((req, res) => {
            const parsedUrl = url.parse(req.url, true);
            const uid = parsedUrl.query.uid || req.socket.remoteAddress;
            if (uid) {
                this.processHeartbeat(uid);
            }
            res.writeHead(200, {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*',
            });
            res.end(this.users.size.toString());
        });
        this.serverInstance.listen(port);
        console.log('Heartbeat server started.');
    }

    runCleanup() {
        const oldLen = this.users.size;
        const now = Date.now();
        for (const [uid, timestamp] of this.users.entries()) {
            if (now - timestamp > this.refresh_interval_seconds * 1000) {
                this.users.delete(uid);
                console.log('Deleted stale UID: ' + uid);
            }
        }
        const newLen = this.users.size;
        console.log(
            `Cleaned up ${oldLen - newLen} stale UIDs. New count: ${newLen}`,
        );
    }

    // Called when a heartbeat is received from a UID
    processHeartbeat(uid) {
        this.users.set(uid, Date.now());
    }
}

console.log('Starting app');
new HeartbeatServer();
