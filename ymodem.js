const path = require('path')
const crc16 = require('crc').crc16xmodem

const PACKET_SIZE = 128
const SOH = 0x01 // 128 byte blocks
const STX = 0x02 // 1K blocks
const EOT = 0x04
const ACK = 0x06
const NAK = 0x15
const CA = 0x18 // 24
const CRC16 = 0x43 // 67 "C"
// const ABORT1 = 0x41 // 65
// const ABORT2 = 0x61 // 97

/**
 * Make file header payload from file path and size
 * @param {string} filePath
 * @param {number} fileSize
 * @return {Buffer}
 */
function makeFileHeader(filePath, fileSize) {
  var payload = Buffer.alloc(PACKET_SIZE, 0x00)
  var offset = 0
  if (filePath) {
    var filename = path.basename(filePath)
    payload.write(filename, offset)
    offset = filename.length + 1
  }
  if (fileSize) {
    payload.write(fileSize.toString() + ' ', offset)
  }
  return payload
}

/**
 * Split buffer into multiple smaller buffers of the given size
 * @param {Buffer} buffer
 * @param {number} size
 * @param {number} fixedSize
 * @return {Array<Buffer>}
 */
function splitBuffer(buffer, size, fixedSize) {
  if (buffer.byteLength > size) {
    var array = []
    var start = 0
    var end = start + size - 1
    while (start < buffer.byteLength) {
      if (end >= buffer.byteLength) {
        end = buffer.byteLength - 1
      }
      var chunk = Buffer.alloc(fixedSize || (end - start + 1), 0xff)
      buffer.copy(chunk, 0, start, end + 1)
      array.push(chunk)
      start = start + size
      end = start + size - 1
    }
    return array
  } else {
    var buf = Buffer.alloc(fixedSize || size, 0xff)
    buffer.copy(buf, 0, 0, buffer.byteLength)
    return [buf]
  }
}

/**
 * Transfer a file to serial port using ymodem protocol
 * @param {SerialPort} serial
 * @param {string} filename
 * @param {Buffer} buffer
 * @param {function} callback
 * @param {function} progressCallback
 */
function transfer(serial, filename, buffer, callback, progressCallback) {
  var queue = []
  var totalBytes = 0
  var writtenBytes = 0
  var seq = 0
  var session = false
  var sending = false
  var finished = false

  /* Send buffer to the serial port */
  function sendBuffer(buffer) {
    serial.write(buffer)
    // var chunks = splitBuffer(buffer, 256)
    // chunks.forEach(chunk => {
    //   serial.write(chunk, 'binary')
    //   serial.drain(function (err) {
    //     if (err) {
    //       close()
    //     }
    //   })
    // })
  }

  /* Send packet */
  function sendPacket() {
    if (seq < queue.length) {
      // make a packet (3 for packet header, YModem.PACKET_SIZE for payload, 2 for crc16)
      var packet = Buffer.alloc(3 + PACKET_SIZE + 2)
      // header
      packet[0] = SOH
      packet[1] = seq
      packet[2] = 0xff - packet[1]
      // payload
      var payload = queue[seq]
      payload.copy(packet, 3)
      // crc16
      var crc = crc16(payload)
      packet.writeUInt16BE(crc, packet.byteLength - 2)
      // send
      sendBuffer(packet)
    } else {
      // send EOT
      if (sending) {
        sendBuffer(Buffer.from([EOT]))
      }
    }
  }

  /* Handler for data from Ymodem */
  function handler(data) {
    for (var i = 0; i < data.byteLength; i++) {
      if (!finished) {
        var ch = data[i]
        if (ch === CRC16) {
          if (!sending) {
            sendPacket()
            sending = true
          }
        } else if (ch === ACK) {
          if (!session) {
            close()
          }
          if (sending) {
            if (seq < queue.length) {
              if (writtenBytes < totalBytes) {
                writtenBytes = (seq + 1) * PACKET_SIZE
                if (writtenBytes > totalBytes) {
                  writtenBytes = totalBytes
                }
                if (progressCallback) {
                  progressCallback({
                    writtenBytes: writtenBytes,
                    totalBytes: totalBytes
                  })
                }
              }
              seq++
              sendPacket()
            } else { /* send complete */
              if (session) {
                /* file sent successfully */
              }
              sending = false
              session = false
              // send null header for end of session
              var endsession = Buffer.alloc(PACKET_SIZE + 5, 0x00)
              endsession[0] = SOH
              endsession[1] = 0x00
              endsession[2] = 0xff
              sendBuffer(endsession)
            }
          }
        } else if (ch === NAK) {
          sendPacket()
        } else if (ch === CA) {
          close()
        }
      }
    }
  }

  /* Finish transmittion */
  function close(err) {
    session = false
    sending = false
    serial.removeListener('data', handler)
    if (!finished && callback) {
      if (err) {
        callback(err)
      } else {
        callback(null, {
          filePath: filename,
          totalBytes: totalBytes,
          writtenBytes: writtenBytes
        })
      }
    }
    finished = true
  }

  // Make file header payload
  totalBytes = buffer.byteLength
  var headerPayload = makeFileHeader(filename, totalBytes)
  queue.push(headerPayload)

  // Make file data packets
  var payloads = splitBuffer(buffer, PACKET_SIZE, PACKET_SIZE)
  payloads.forEach(payload => {
    queue.push(payload)
  })

  // Start to transfer
  session = true
  serial.on('data', handler)
}

exports.transfer = transfer
