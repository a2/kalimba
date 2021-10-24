const XIP_BASE = 0x10000000
const FLASH_PAGE_SIZE = 0x100
const HEADER_FLASH_OFFSET = 0x100000
const HEADER_FLASH_SIZE = FLASH_PAGE_SIZE
const CODE_FLASH_OFFSET = HEADER_FLASH_OFFSET + HEADER_FLASH_SIZE

const flashRangeProgram = (mcu, base, data, size) => {
    const buffer = Buffer.from(data)
    for (let k = 0; k < size; k++) {
        mcu.writeUint8(XIP_BASE + base + k, buffer[k])
    }
}

/*
const calculateChecksum = (mcu, base, size) => {
    const modulo = (a, b) => a - Math.floor(a / b) * b
    const toUint32 = (x) => modulo(~~x, Math.pow(2, 32))
    
    let checksum = 0
    for (let k = 0; k < size; k++) {
        const u8 = mcu.readUint8(XIP_BASE + base + k)
        checksum = toUint32(checksum + u8)
    }
    
    return toUint32((checksum ^ 0xFFFFFFFF) + 1)
}
*/

const calculateChecksum = () => 0

const flash = (mcu, code) => {
    if (typeof code === 'string') code = Buffer.from(code, 'utf8')

    let codeOffset = 0
    let remainingDataSize = 0
    let pageOffset = 0

    const buff8 = new Uint8Array(FLASH_PAGE_SIZE)
    let size = code.length
    while (size >= FLASH_PAGE_SIZE) {
        buff8.fill(0)
        buff8.set(code.subarray(pageOffset, pageOffset + FLASH_PAGE_SIZE - remainingDataSize), remainingDataSize)
        flashRangeProgram(mcu, CODE_FLASH_OFFSET + codeOffset, buff8, FLASH_PAGE_SIZE)
        pageOffset += FLASH_PAGE_SIZE
        codeOffset += FLASH_PAGE_SIZE
        size -= FLASH_PAGE_SIZE
    }

    if (size > 0) {
        buff8.fill(0)
        buff8.set(code.subarray(pageOffset, pageOffset + size))
        remainingDataSize = size
    }

    if (remainingDataSize) {
        flashRangeProgram(mcu, CODE_FLASH_OFFSET + codeOffset, buff8, FLASH_PAGE_SIZE)
        codeOffset += remainingDataSize
    }

    const buff32 = new Uint32Array(HEADER_FLASH_SIZE / 4)
    buff32[0] = codeOffset
    buff32[1] = calculateChecksum(mcu, CODE_FLASH_OFFSET, codeOffset)
    flashRangeProgram(mcu, HEADER_FLASH_OFFSET, buff32, HEADER_FLASH_SIZE)
}

module.exports.flash = flash
