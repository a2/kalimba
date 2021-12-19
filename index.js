const { RP2040, USBCDC, ConsoleLogger, LogLevel } = require('rp2040js');
const { bootrom } = require('./bootrom');
const { loadUF2 } = require('./load-uf2');
const { Input } = require('./example/input');
const { Buffer } = require('buffer');

const canvas = document.querySelector('#display');

async function run(code) {
    const mcu = new RP2040();
    mcu.loadBootrom(bootrom);
    mcu.logger = new ConsoleLogger(LogLevel.Error);
    await loadUF2('./kaluma-rp2-pico-1.0.0-beta.10.uf2', mcu);

    const cdc = new USBCDC(mcu.usbCtrl);
    const sendBufferToPrompt = buffer => {
        for (let byte of buffer) {
            cdc.sendSerialByte(byte);
        }
    };
    const sendStringToPrompt = string => (
        sendBufferToPrompt(Buffer.from(string + '\r', 'utf8'))
    );

    cdc.onDeviceConnected = () => {
        for (let pin of Object.values(Input)) {
            mcu.gpio[pin].setInputValue(true);
        }
    };

    let lastLineOut = '';
    const decoder = new TextDecoder('utf8');
    cdc.onSerialData = data => {
        const chunk = decoder.decode(data);
        const lines = chunk.split('\n');
        lines[0] = lastLineOut + lines[0];
        lastLineOut = lines.pop();
        lines.forEach(line => {
            console.log(line);
        });
    }

    mcu.flash.set(Buffer.from(code + '\x00', 'utf8'), 0x100000);
    mcu.PC = 0x10000000;
    mcu.execute();

    const i2c = mcu.i2c[0];
    i2c.onStart = () => i2c.completeStart();
    i2c.onConnect = () => i2c.completeConnect(true);

    let buffer = [];
    let displayLock = false;
    i2c.onWriteByte = byte => {
        buffer.push(byte);
        if (!displayLock && buffer.length > 4) buffer.shift();

        if (buffer[0] === 0 && buffer[1] === 28 && buffer[2] === 0 && buffer[3] === 99) {
            displayLock = true;
            buffer = [];
        }

        if (displayLock && buffer.length == 363) {
            buffer.splice(258, 1);
            buffer.splice(129, 1);
            buffer.splice(0, 1);
            parseDisplay(canvas, buffer);
            displayLock = false;
            buffer = [];
        }

        i2c.completeWrite(true);
    };

    sendStringToPrompt('.load');

    return { mcu, cdc };
};

function parseDisplay(canvas, data) {
    if (!data) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';

    for (let y = 0; y < Math.ceil(canvas.height / 8); y++) {
        for (let x = 0; x < canvas.width; x++) {
            const byte = data[y * canvas.width + x];
            for (let dy = 0; dy < 8; dy++) {
                if (byte & (1 << dy)) ctx.fillRect(x, 8 * y + dy, 1, 1);
            }
        }
    }
}

(async () => {
    const code = await fetch('code.js').then(res => res.text());
    const { mcu } = await run(code);

    const downKeys = {};
    const keyMap = {
        'KeyW': 'UP',
        'KeyA': 'LEFT',
        'KeyS': 'DOWN',
        'KeyD': 'RIGHT',

        'ArrowUp': 'UP',
        'ArrowLeft': 'LEFT',
        'ArrowRight': 'RIGHT',
        'ArrowDown': 'DOWN',

        'KeyZ': 'A',
        'Comma': 'A',

        'KeyX': 'B',
        'Period': 'B',
    };
    const handler = event => {
        const key = keyMap[event.code];
        if (key) {
            const down = event.type === 'keydown';
            if (down == downKeys[key]) {
                return;
            }

            downKeys[key] = down;

            const pin = Input[key];
            mcu.gpio[pin].setInputValue(!down);
        }
    };
    document.addEventListener('keydown', handler);
    document.addEventListener('keyup', handler);
})();
