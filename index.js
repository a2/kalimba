const { RP2040, USBCDC, ConsoleLogger, LogLevel, GPIOPinState } = require('rp2040js');
const { bootrom } = require('./bootrom');
const { loadUF2 } = require('./load-uf2');
const { flash } = require('./flash');
const { Input } = require('./example/input');
const { Buffer } = require('buffer');

const canvas = document.querySelector('#display');

async function run(code) {
    const mcu = new RP2040();
    mcu.loadBootrom(bootrom);
    mcu.logger = new ConsoleLogger(LogLevel.Error);
    await loadUF2('./kaluma-rpi-pico-1.0.0-beta.6.uf2', mcu);

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
                        const display = Buffer.from(displayContents.split(','));
                        parseDisplay(canvas, display);
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
                        const display = Buffer.from(displayContents.split(','));
                        parseDisplay(canvas, display);
                        lastDisplayContents = displayContents;
                    }
                }

                return;
            }

            console.log('>', line);
        })
    }

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

    return { mcu, cdc, i2c };
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
            const type = down ? 'down' : 'up';

            if (down == !!downKeys[key])
                return;
            if (down)
                downKeys[key] = true;
            else
                delete downKeys[key];

            const pin = Input[key];
            mcu.gpio[pin].setInputValue(!down);
        }
    };
    document.addEventListener('keydown', handler)
    document.addEventListener('keyup', handler)
})();
