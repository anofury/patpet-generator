
const GIFEncoder = require('./lib/GIFEncoder.js')

function ImageArrayToGif(body: ImageArrayToGifMsg) {
  const imageParts = gifAddFrame(body)
  let gifLen: number = 0, offset: number = 0

  imageParts.forEach((frame: any) => {
    gifLen += (frame.data.length - 1) * frame.pageSize + frame.cursor
  })
  gifLen += imageParts[imageParts.length - 1].pageSize - imageParts[imageParts.length - 1].cursor

  const gifBody = new Uint8Array(gifLen)
  imageParts.forEach((frame: any) => {
    frame.data.forEach((page: [], i: number) => {
      gifBody.set(page, offset)
      if (i === frame.data.length - 1)
        offset += frame.cursor
      else
        offset += frame.pageSize
    })
  })
  return ArrayBufferToBase64(gifBody)
}

function gifAddFrame(body: ImageArrayToGifMsg) {
  const { frames, delay, width, height } = body
  const imageParts: any = []

  frames.forEach((frame, index) => {
    const gifCreator = new GIFEncoder(width, height)

    if (index === 0) {
      gifCreator.writeHeader()
    } else gifCreator.firstFrame = false

    gifCreator.setRepeat(0)
    gifCreator.setDelay(delay)
    gifCreator.setTransparent(0x00ff00)
    // gifCreator.setQuality(10)
    // gifCreator.setGlobalPalette(true)
    frame.data = optimizeFrameColors(frame.data)
    gifCreator.addFrame(frame.data)

    if (index === frames.length - 1) {
      gifCreator.finish()
    }

    const stream = gifCreator.stream()

    imageParts.push({
      data: stream.pages,
      cursor: stream.cursor,
      pageSize: stream.constructor.pageSize
    })
  })

  return imageParts
}

function optimizeFrameColors(data: any) {
  data.length = Object.keys(data).length
  const dataArr: any = [].slice.call(data)

  for (let i = 0; i < dataArr.length; i += 4) {
    dataArr[i + 1] = dataArr[i + 1] > 250 ? 250 : dataArr[i + 1]
    if (dataArr[i + 3] < 120) {
      dataArr[i + 0] = 0
      dataArr[i + 1] = 255
      dataArr[i + 2] = 0
    }
    dataArr[i + 3] = 255
  }

  return dataArr
}

function ArrayBufferToBase64(array: any) {
  let length = array.byteLength
  let table = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
    'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
    'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
    'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f',
    'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
    'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
    'w', 'x', 'y', 'z', '0', '1', '2', '3',
    '4', '5', '6', '7', '8', '9', '+', '/'];
  let base64Str = '', i
  for (i = 0; length - i >= 3; i += 3) {
    let num1 = array[i]
    let num2 = array[i + 1]
    let num3 = array[i + 2]
    base64Str += table[num1 >>> 2]
      + table[((num1 & 0b11) << 4) | (num2 >>> 4)]
      + table[((num2 & 0b1111) << 2) | (num3 >>> 6)]
      + table[num3 & 0b111111]
  }
  let lastByte = length - i
  if (lastByte === 1) {
    let lastNum1 = array[i]
    base64Str += table[lastNum1 >>> 2] + table[((lastNum1 & 0b11) << 4)] + '=='
  } else if (lastByte === 2) {
    let lastNum1 = array[i]
    let lastNum2 = array[i + 1]
    base64Str += table[lastNum1 >>> 2]
      + table[((lastNum1 & 0b11) << 4) | (lastNum2 >>> 4)]
      + table[(lastNum2 & 0b1111) << 2]
      + '='
  }
  return base64Str
}

module.exports = { ImageArrayToGif }