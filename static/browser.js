async function connectToServer() {
    const ws = new WebSocket('ws://localhost:7071/ws');
    return new Promise((resolve, reject) => {
        const timer = setInterval(() => {
            if (ws.readyState === 1) {
                clearInterval(timer);
                resolve(ws);
            }
        }, 10);
    });
}

function parseDisplay(canvas, display) {
    if (!display) return;

    const data = [];
    for (let i = 0; i < display.length; i += 2) {
        const byte = display.substr(i, 2)
        data.push(parseInt(byte, 16))
    }

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fill();

    ctx.fillStyle = '#fff';
    for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < Math.ceil(canvas.height / 8); y++) {
            const byte = data[x + canvas.width * 8 * y]
            for (let dy = 0; dy < Math.min(8, canvas.height - y); dy++) {
                if (byte & (1 << dy)) ctx.fillRect(x, 8 * y + dy, 1, 1);
            }
        }
    }
}

(async () => {
    const canvas = document.querySelector('#display');
    const ws = await connectToServer();
    ws.addEventListener('message', message => {
        const payload = JSON.parse(message.data);
        parseDisplay(canvas, payload.display);
    });
    ws.send(JSON.stringify({ display: true }));
})();
