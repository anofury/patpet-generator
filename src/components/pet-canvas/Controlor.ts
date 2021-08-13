const handImageInfo = { src: '../../images/sprite.png', sObj: null, sWidth: 112, sHeight: 112, count: 5 }
const targetImageInfo = { oObj: null, oWidth: 0, oHeight: 0, width: 0, height: 0 }
const targetImagePotion = { dx: 0, dy: 0, translateX: 0, translateY: 0 }
const targetStartPoint = { x: 0, y: 0 }

let requestAnimationFrameID: number = -1
let petTimerID: number = -1

const PADLEFT = 0.2
const PADTOP = 0.2
const BORDER_LIMIT = 40

export default class CanvasControlor {
  canvas: LooseObject = {}
  ctx: LooseObject = {}
  watch: boolean = false
  delay: number = this._speedToDelay(8)
  range: number = 2
  scale: number = this._sizeToScale(5)
  flip: boolean = false
  frameIndex: number = 1
  imageDataArray: string[] = []

  initConfig(CONFIG: LooseObject) {
    this.delay = this._speedToDelay(CONFIG.speed)
    this.range = CONFIG.range
    this.scale = this._sizeToScale(CONFIG.size)
    this.flip = CONFIG.flip
    return this
  }

  initCanvas(canvas: LooseObject, ctx: LooseObject, width: number, height: number): Promise<any> {
    this.canvas = canvas
    this.ctx = ctx
    this.canvas.width = width
    this.canvas.height = height
    this.changeSmooth(false)
    return new Promise((resolve, reject) => {
      this
        ._creatImage(handImageInfo.src)
        .then((handImage: any) => {
          handImageInfo.sObj = handImage
          resolve()
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  changeSpeed(newSpeed: number) {
    this.delay = this._speedToDelay(newSpeed)
    this.beginPetPet(true)
  }

  changingRange(newRange: number) {
    this.range = newRange
  }

  changeRange(newRange: number) {
    this.range = newRange
    this.beginPetPet(true)
  }

  changingSize(newSize: number) {
    const newScale = this._sizeToScale(newSize)
    if (newScale !== this.scale) {
      this.scale = newScale
      this.changeScale()
    }
  }

  changeSize(newSize: number) {
    const newScale = this._sizeToScale(newSize)
    this.scale = newScale
    this.changeScale()
    this.beginPetPet(true)
  }

  changeScale() {
    const { width, height } = targetImageInfo
    targetImageInfo.oWidth = this.canvas.width * (1 - PADLEFT) * this.scale
    targetImageInfo.oHeight = this.canvas.width * (1 - PADLEFT) * (height / width) * this.scale
  }

  changeFlip(newFlip: boolean) {
    this.flip = Boolean(newFlip)
  }

  changeSmooth(newSmooth: boolean) {
    if (newSmooth) {
      this.ctx.imageSmoothingEnabled = true
      this.ctx.imageSmoothingQuality = 'medium'
    } else {
      this.ctx.imageSmoothingEnabled = false
    }
  }

  stopPetPet() {
    clearTimeout(petTimerID)
    petTimerID = -1
  }

  getDelay() {
    return this.delay
  }

  getRect() {
    return {
      width: this.canvas.width,
      height: this.canvas.height
    }
  }

  loadImage(src: string, param?: LooseObject) {
    const _this = this

    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: src,
        success(getImageInfoRes) {
          const { width, height } = getImageInfoRes

          _this
            ._creatImage(src)
            .then((targetImage: any) => {
              if (param && param.reset) {
                targetImagePotion.dx = _this.canvas.width * PADLEFT
                targetImagePotion.dy = _this.canvas.height * PADTOP
              } else {
                targetImagePotion.dx = targetImagePotion.dx || _this.canvas.width * PADLEFT
                targetImagePotion.dy = targetImagePotion.dy || _this.canvas.height * PADTOP
              }

              targetImageInfo.oObj = targetImage
              targetImageInfo.width = width
              targetImageInfo.height = height
              _this.changeScale()
              resolve()
            })
            .catch(err => {
              reject(err)
            })
        },
        fail(err) {
          reject(err)
        }
      })
    })
  }

  beginPetPet(stateChange: boolean = false) {
    const { sObj, sWidth, sHeight, count } = handImageInfo
    const { oObj, oWidth, oHeight } = targetImageInfo
    const { dx, dy, translateX, translateY } = targetImagePotion

    this.stopPetPet()

    if (stateChange) {
      this.imageDataArray.length = 0
      this.frameIndex = 1
    }

    petTimerID = setTimeout(() => {
      if (this.frameIndex > count) this.frameIndex = 1
      const newRange = 1 + (this.range - 5) / 5
      const targetTransform = [
        { tWidth: 0, tHeight: 0, tX: 0, tY: 0 },
        {
          tWidth: sWidth * 0.2 * newRange, tHeight: -sHeight * 0.25 * newRange,
          tX: -2, tY: sHeight * 0.25 * newRange * 0.5 + 2
        },
        {
          tWidth: sWidth * 0.25 * newRange, tHeight: -sHeight * 0.35 * newRange,
          tX: -4, tY: sHeight * 0.35 * newRange * 0.5 + 4
        },
        {
          tWidth: sWidth * 0.2 * newRange, tHeight: -sHeight * 0.15 * newRange,
          tX: -3, tY: sHeight * 0.15 * newRange * 0.5 - 2
        },
        { tWidth: 0, tHeight: 0, tX: -1, tY: 0 },
      ]
      const orderTransform = targetTransform[this.frameIndex - 1]
      const fWidth = orderTransform.tWidth
      const fHeight = orderTransform.tHeight
      const pX = orderTransform.tX
      const pY = orderTransform.tY

      try {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.ctx.globalAlpha = 1

        if (this.flip) {
          this.ctx.save()
          this.ctx.translate(dx + translateX - fWidth * 0.5 + pX + (oWidth + fWidth) / 2, 0)
          this.ctx.scale(-1, 1)
          this.ctx.drawImage(oObj, (oWidth + fWidth) / 2 * -1, dy + translateY - fHeight * 0.5 + pY, oWidth + fWidth, oHeight + fHeight)
          this.ctx.restore()
        } else {
          this.ctx.drawImage(oObj, dx + translateX - fWidth * 0.5 + pX, dy + translateY - fHeight * 0.5 + pY, oWidth + fWidth, oHeight + fHeight)
        }

        this.ctx.drawImage(sObj, (this.frameIndex - 1) * sWidth, 0, sWidth, sHeight, 0, -fHeight * 0.5, this.canvas.width, this.canvas.height)

        if (this.imageDataArray.length < count) {
          this.imageDataArray.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height))
        }

        this.frameIndex++
        this.beginPetPet()
      } catch (error) {
        this.beginPetPet()
      }
    }, this.delay)
  }

  beginMove() {
    const { sObj, sWidth, sHeight } = handImageInfo
    const { oObj, oWidth, oHeight } = targetImageInfo
    const { dx, dy, translateX, translateY } = targetImagePotion

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.globalAlpha = 1

    if (this.flip) {
      this.ctx.save()
      this.ctx.translate(dx + translateX + oWidth / 2, 0)
      this.ctx.scale(-1, 1)
      this.ctx.drawImage(oObj, oWidth / 2 * -1, dy + translateY, oWidth, oHeight)
      this.ctx.restore()
    } else {
      this.ctx.drawImage(oObj, dx + translateX, dy + translateY, oWidth, oHeight)
    }

    this.ctx.globalAlpha = 0.7
    this.ctx.drawImage(sObj, (this.frameIndex - 2) * sWidth, 0, sWidth, sHeight, 0, 0, this.canvas.width, this.canvas.height)
    this._cancelAnimationFrame()
  }

  watchImage(startX: number, startY: number) {
    const { oWidth, oHeight } = targetImageInfo
    const { dx, dy } = targetImagePotion
    if (
      startX >= dx
      && startX <= dx + oWidth
      && startY >= dy
      && startY <= dy + oHeight
    ) {
      this.stopPetPet()
      this.watch = true
      targetStartPoint.x = startX
      targetStartPoint.y = startY
      this.dragImage(startX, startY)
    } else {
      this.watch = false
      targetStartPoint.x = 0
      targetStartPoint.y = 0
    }
  }

  dragImage(moveX: number, moveY: number) {
    if (this.watch) {
      const { dx, dy } = targetImagePotion
      let translateX = (moveX - targetStartPoint.x) / 2
      let translateY = (moveY - targetStartPoint.y) / 2

      if (dx + translateX <= 0 && Math.abs(dx + translateX) + BORDER_LIMIT >= targetImageInfo.oWidth)
        translateX = BORDER_LIMIT - targetImageInfo.oWidth - dx
      else if (dx + translateX >= 0 && dx + translateX + BORDER_LIMIT >= this.canvas.width)
        translateX = this.canvas.width - BORDER_LIMIT - dx

      if (dy + translateY <= 0 && Math.abs(dy + translateY) + BORDER_LIMIT >= targetImageInfo.oHeight)
        translateY = BORDER_LIMIT - targetImageInfo.oHeight - dy
      else if (dy + translateY >= 0 && dy + translateY + BORDER_LIMIT >= this.canvas.height)
        translateY = this.canvas.height - BORDER_LIMIT - dy

      targetImagePotion.translateX = translateX
      targetImagePotion.translateY = translateY
      if (requestAnimationFrameID === -1) {
        requestAnimationFrameID = this.canvas.requestAnimationFrame(this.beginMove.bind(this))
      }
    }
  }

  getImageDataArray(): Promise<any> {
    this.beginPetPet(true)
    return new Promise((resolve) => {
      const waitTimeID = setInterval(() => {
        if (this.imageDataArray.length === handImageInfo.count) {
          clearInterval(waitTimeID)
          resolve(this.imageDataArray)
        }
      }, this.delay)
    })
  }

  cancelWatchImage() {
    this.watch = false
    targetStartPoint.x = 0
    targetStartPoint.y = 0
    targetImagePotion.dx += targetImagePotion.translateX
    targetImagePotion.dy += targetImagePotion.translateY
    targetImagePotion.translateX = 0
    targetImagePotion.translateY = 0
    this._cancelAnimationFrame()
    this.beginPetPet(true)
  }

  _cancelAnimationFrame() {
    this.canvas.cancelAnimationFrame(requestAnimationFrameID)
    requestAnimationFrameID = -1
  }

  _creatImage(src: string) {
    const img = this.canvas.createImage()
    return new Promise((resolve, reject) => {
      img.onload = () => {
        resolve(img)
      }
      img.onerror = (err: any) => {
        reject(err)
      }
      img.src = src
    })
  }

  _speedToDelay(grate: number) {
    return (11 - grate) * 20
  }

  _sizeToScale(size: number) {
    return 1 + (size - 5) / 10
  }
}