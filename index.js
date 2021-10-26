const { RP2040, USBCDC, ConsoleLogger, LogLevel, GPIOPinState } = require('rp2040js');
const { bootrom } = require('./bootrom');
const { loadUF2 } = require('./load-uf2');
const { flash } = require('./flash');
const fs = require('fs');
const path = require('path');
const ws = require('ws');
const { randomUUID } = require('crypto');
const http = require('http');
const statik = require('node-static');
const open = require('open')
const { Input } = require('./example/input')

const mcu = new RP2040();
mcu.loadBootrom(bootrom);
mcu.logger = new ConsoleLogger(LogLevel.Error);
loadUF2('./kaluma-rpi-pico-1.0.0-beta.6.uf2', mcu);

const cdc = new USBCDC(mcu.usbCtrl);
const sendBufferToPrompt = buffer => {
    for (const byte of buffer) {
        cdc.sendSerialByte(byte);
    }
};
const sendStringToPrompt = string => (
    sendBufferToPrompt(Buffer.from(string + '\r', 'utf8'))
);

cdc.onDeviceConnected = () => {
    for (const pin of Object.values(Input)) {
        mcu.gpio[pin].setInputValue(true);
    }
};

const DIRECTIVE_DISPLAY_START = '###DISPLAY###';
const DIRECTIVE_DISPLAY_END = '###/DISPLAY###';

let lastLineOut = '';
let lastDisplayContents = '';
let displayContents = '';
let displayLock = false;
const decoder = new TextDecoder('utf8');

cdc.onSerialData = data => {
    const chunk = decoder.decode(data);
    const lines = chunk.split('\n');
    lines[0] = lastLineOut + lines[0];
    lastLineOut = lines.pop();
    lines.forEach(line => {
        let index = line.indexOf(DIRECTIVE_DISPLAY_START);
        if (index !== -1) {
            let endIndex = line.indexOf(DIRECTIVE_DISPLAY_END);
            displayLock = true;
            displayContents = line.slice(index + DIRECTIVE_DISPLAY_START.length, endIndex !== -1 ? endIndex : null);
            if (endIndex !== -1) {
                displayLock = false;

                if (displayContents !== lastDisplayContents) {
                    const display = Buffer.from(displayContents.split(',')).toString('base64');
                    const message = JSON.stringify({ display });
                    ([...clients.keys()]).forEach(ws => ws.send(message));
                    lastDisplayContents = displayContents;
                }
            }

            return;
        } else if (displayLock) {
            index = line.indexOf(DIRECTIVE_DISPLAY_END);
            if (index === -1) {
                displayContents += line;
            } else {
                displayContents += line.slice(0, index);
                displayLock = false;

                if (displayContents !== lastDisplayContents) {
                    const display = Buffer.from(displayContents.split(',')).toString('base64');
                    const message = JSON.stringify({ display });
                    ([...clients.keys()]).forEach(ws => ws.send(message));
                    lastDisplayContents = displayContents;
                }
            }

            return;
        }

        console.log('>', line);
    })
}

process.stdin.resume();
process.stdin.setEncoding('utf8');

let lastLineIn = '';
process.stdin.on('data', chunk => {
    const lines = chunk.split('\n');
    lines[0] = lastLineIn + lines[0];
    lastLineIn = lines.pop();
    lines.forEach(sendStringToPrompt);
})

const code = fs.readFileSync(path.join(__dirname, '/example/dist/index.js'), 'utf8');
flash(mcu, code);

mcu.PC = 0x10000000;
mcu.execute();

const Commands = {
    DISPLAY_OFF: 0xAE,
    DISPLAY_ON: 0xAF,
    SET_START_LINE: 0x40,
};

const i2c = mcu.i2c[0];
i2c.onStart = () => i2c.completeStart();
i2c.onConnect = (address, mode) => i2c.completeConnect(true);
/*
i2c.onWriteByte = byte => {
    console.log('onWriteByte', byte.toString(16).padStart(2, '0'));
    i2c.completeWrite(true);
};
*/

sendStringToPrompt('.load');

const wss = new ws.WebSocketServer({ port: 7071 });
const clients = new Map();
wss.on('connection', ws => {
    const id = randomUUID();
    const metadata = { id };
    clients.set(ws, metadata);

    ws.on('message', (data, isBinary) => {
        const message = JSON.parse(data);

        // const metadata = clients.get(ws);
        // console.log(metadata.id, message);

        if (message.display && displayContents) {
            const display = Buffer.from(displayContents.split(',')).toString('base64');
            ws.send(JSON.stringify({ display }));
        }

        if (message.up) {
            const pin = Input[message.up];
            if (pin) mcu.gpio[pin].setInputValue(true);
        }

        if (message.down) {
            const pin = Input[message.down];
            if (pin) mcu.gpio[pin].setInputValue(false);
        }
    });

    ws.on('close', () => clients.delete(ws));
})

const server = new statik.Server(path.join(__dirname, '/static'));
http.createServer((req, res) => server.serve(req, res)).listen(8080);
open('http://localhost:8080', { wait: true });
