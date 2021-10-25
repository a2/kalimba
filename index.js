const { RP2040, USBCDC, ConsoleLogger, LogLevel, GPIOPinState } = require('rp2040js')
const { bootrom } = require('./bootrom')
const { loadUF2 } = require('./load-uf2')
const { flash } = require('./flash')
const fs = require('fs')
const path = require('path')

const mcu = new RP2040()
mcu.loadBootrom(bootrom)
mcu.logger = new ConsoleLogger(LogLevel.Error)
loadUF2('./kaluma-rpi-pico-1.0.0-beta.6.uf2', mcu)

const cdc = new USBCDC(mcu.usbCtrl)
const sendBufferToPrompt = buffer => {
    for (const byte of buffer) {
        cdc.sendSerialByte(byte)
    }
}
const sendStringToPrompt = string => (
    sendBufferToPrompt(Buffer.from(string + '\r', 'utf8'))
)

cdc.onDeviceConnected = () => {
    mcu.gpio[24].setInputValue(true)
    mcu.gpio[27].setInputValue(true)
    mcu.gpio[4].setInputValue(true)
    mcu.gpio[3].setInputValue(true)
    mcu.gpio[6].setInputValue(true)
    mcu.gpio[5].setInputValue(true)
}

let lastLineOut = ''
const decoder = new TextDecoder('utf8')
cdc.onSerialData = data => {
    const chunk = decoder.decode(data)
    const lines = chunk.split('\n')
    lines[0] = lastLineOut + lines[0]
    lastLineOut = lines.pop()
    lines.forEach(line => console.log('>', line))
}

process.stdin.resume()
process.stdin.setEncoding('utf8')

let lastLineIn = ''
process.stdin.on('data', chunk => {
    const lines = chunk.split('\n')
    lines[0] = lastLineIn + lines[0]
    lastLineIn = lines.pop()
    lines.forEach(sendStringToPrompt)
})

const code = fs.readFileSync(path.join(__dirname, '/example/dist/index.js'), 'utf8')
flash(mcu, code)

mcu.PC = 0x10000000
mcu.execute()

const Commands = {
    DISPLAY_OFF: 0xAE,
    DISPLAY_ON: 0xAF,
    SET_START_LINE: 0x40,
}

const i2c = mcu.i2c[0]
i2c.onStart = () => i2c.completeStart()
i2c.onConnect = (address, mode) => i2c.completeConnect(true)
i2c.onWriteByte = byte => {
    console.log('onWriteByte', ('00' + byte.toString(16)).slice(-2))
    i2c.completeWrite(true)
}

sendStringToPrompt('.load')