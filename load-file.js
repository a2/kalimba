const createLittleFS = require('littlefs')
const path = require('path')
const fs = require('fs')
const { btoa } = require('buffer')

const BLOCK_COUNT = 352
const BLOCK_SIZE = 4096
const FLASH_FS_OFFSET = 0xa0000

const flash = new Uint8Array(BLOCK_COUNT * BLOCK_SIZE)
let littlefs, writeFile, config, lfs

async function initialize() {
  console.log("FS setup started")

  littlefs = await createLittleFS({
    wasmBinary: (() => {
      const newFile = path.join(require.resolve('littlefs'), '..', '/littlefs.wasm')
      const contents = fs.readFileSync(newFile)
      return new Uint8Array(contents)
    })()
  })

  function flashRead(cfg, block, off, buffer, size) {
    const start = block * BLOCK_SIZE + off
    littlefs.HEAPU8.set(flash.subarray(start, start + size), buffer)
    return 0
  }

  function flashProg(cfg, block, off, buffer, size) {
    const start = block * BLOCK_SIZE + off
    flash.set(littlefs.HEAPU8.subarray(buffer, buffer + size), start)
    return 0
  }

  function flashErase(cfg, block) {
    const start = block * BLOCK_SIZE
    flash.fill(0xff, start, start + BLOCK_SIZE)
    return 0
  }

  const read = littlefs.addFunction(flashRead, 'iiiiii')
  const prog = littlefs.addFunction(flashProg, 'iiiiii')
  const erase = littlefs.addFunction(flashErase, 'iii')
  const sync = littlefs.addFunction(() => 0, 'ii')

  writeFile = littlefs.cwrap(
    'lfs_write_file',
    ['number'],
    ['number', 'string', 'string', 'number']
  )

  config = littlefs._new_lfs_config(read, prog, erase, sync, BLOCK_COUNT, BLOCK_SIZE)
  lfs = littlefs._new_lfs()
  littlefs._lfs_format(lfs, config)
  littlefs._lfs_mount(lfs, config)
  console.log("FS setup ended")
}

async function loadFileData(fileData, fileName) {
  if (!lfs) await initialize()
  console.log("File loading")
  writeFile(lfs, fileName, fileData, fileData.length)
  console.log("File loaded")
}

module.exports.loadFileData = loadFileData

async function copyFSToFlash(rp2040) {
  if (!lfs) await initialize()
  console.log("Flash FS copy started")

  littlefs._lfs_unmount(lfs)
  littlefs._free(lfs)
  littlefs._free(config)

  rp2040.flash.set(flash, FLASH_FS_OFFSET)

  console.log("Flash FS copy ended")
}

module.exports.copyFSToFlash = copyFSToFlash
