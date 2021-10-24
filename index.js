const { RP2040, USBCDC, ConsoleLogger, LogLevel } = require('rp2040js')
const { bootrom } = require('./bootrom')
const { loadUF2 } = require('./load-uf2')
const ymodem = require('./ymodem')

const mcu = new RP2040()
mcu.loadBootrom(bootrom)
mcu.logger = new ConsoleLogger(LogLevel.Error)
loadUF2('./kaluma-rpi-pico-1.0.0-beta.6.uf2', mcu)

const cdc = new USBCDC(mcu.usbCtrl)
const sendBufferToPrompt = (buffer) => {
    for (let i = 0; i < buffer.length; i++) {
        cdc.sendSerialByte(buffer[i])
    }
}
const sendStringToPrompt = (string) => sendBufferToPrompt(Buffer.from(string + '\r', 'utf8'))

cdc.onDeviceConnected = () => {
    mcu.gpio[24].setInputValue(true)
    mcu.gpio[27].setInputValue(true)
    mcu.gpio[4].setInputValue(true)
    mcu.gpio[3].setInputValue(true)
    mcu.gpio[6].setInputValue(true)
    mcu.gpio[5].setInputValue(true);

    sendStringToPrompt('.flash -w')
    setTimeout(() => {
        // const code = fs.readFileSync(path.join(__dirname, '/example/thumby.js'))
        const code = Buffer.from('board.led(25).on()', 'utf8')
        const FauxSerial = function () {
            let callbacks = {}

            this.on = (event, callback) => {
                if (callbacks[event]) {
                    callbacks[event].push(callback)
                } else {
                    callbacks[event] = [callback]
                }
            }

            this.open = () => {
                cdc.onSerialData = (data) => {
                    // console.log('R >', Buffer.from(data).toString('hex'))
                    if (callbacks['data']) callbacks['data'].forEach(callback => callback(data))
                }

                if (callbacks['open']) callbacks['open'].forEach(callback => callback())
            }

            this.write = data => sendBufferToPrompt(data)
            this.drain = callback => callback && callback(null)

            this.removeListener = (event, callback) => {
                let eventCallbacks = callbacks[event]
                if (eventCallbacks) {
                    const index = eventCallbacks.indexOf(callback)
                    if (index !== -1) {
                        eventCallbacks.splice(index, 1)
                        callbacks[event] = eventCallbacks
                    }
                }
            }

            return this
        }

        mcu.gpio[25].addListener((state, oldState) => {
            console.log(25, state, oldState)
        })

        const serial = new FauxSerial()
        ymodem.transfer(serial, 'usercode', code, (err, result) => {
            cdc.onSerialData = serialDataHandler
        });

        serial.open()
    }, 500)
}

let lastLineOut = ''
const decoder = new TextDecoder('utf8')
const serialDataHandler = data => {
    const chunk = decoder.decode(data)
    const lines = chunk.split('\n')
    lines[0] = lastLineOut + lines[0]
    lastLineOut = lines.pop()
    lines.forEach(line => console.log('>', line))
}
cdc.onSerialData = serialDataHandler

process.stdin.resume()
process.stdin.setEncoding('utf8')

let lastLineIn = ''
process.stdin.on('data', chunk => {
    const lines = chunk.split('\n')
    lines[0] = lastLineIn + lines[0]
    lastLineIn = lines.pop()
    lines.forEach(sendStringToPrompt)
})

mcu.PC = 0x10000000
mcu.execute()
