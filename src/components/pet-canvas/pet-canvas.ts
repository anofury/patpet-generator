
import CanvasControlor from './Controlor'
import { PET_CONFIG, DEFAULT_IMG } from '../../config/pet'
const Controlor = new CanvasControlor()
let chosenImageSrc = ''

Component({
  behaviors: [],
  properties: {
    cId: String,
    cWidth: {
      type: Number,
      value: 112
    },
    cHeight: {
      type: Number,
      value: 112
    },
    bWidth: {
      type: Number,
      value: 150
    },
    bHeight: {
      type: Number,
      value: 150
    },
    chosenImage: {
      type: String,
      value: ''
    }
  },
  data: {},
  pageLifetimes: {
    show() {
      Controlor.beginPetPet()
    },
    hide() {
      Controlor.stopPetPet()
    }
  },
  lifetimes: {
    ready: function () {
      setTimeout(() => {
        this.createSelectorQuery()
          .select(`#${this.properties.cId}`)
          .fields({ node: true, size: true, })
          .exec((res: AnyArray) => {
            const canvas = res[0].node
            const ctx = canvas.getContext('2d', {
              antialias: false,
              powerPreference: "low-power",
            })

            Controlor
              .initConfig(PET_CONFIG)
              .initCanvas(canvas, ctx, this.properties.cWidth, this.properties.cHeight)
              .then(() => {
                this.loadImage(DEFAULT_IMG)
              })
              .catch((err: object) => {
                console.log(err)
                wx.showToast({
                  title: '图片加载失败'
                })
              })
          })
      }, 200)
    }
  },
  observers: {
    "chosenImage": function (imageSrc: string) {
      if (imageSrc) {
        this.loadImage(imageSrc)
        chosenImageSrc = imageSrc
      }
    }
  },
  methods: {
    onTouchStart(event: TouchEvent) {
      const startTouch: any = event.touches[0]
      const scaleX = this.properties.cWidth / this.properties.bWidth
      const scaleY = this.properties.cHeight / this.properties.bHeight
      Controlor.watchImage(startTouch.x * scaleX, startTouch.y * scaleY)
    },
    onTouchMove(event: TouchEvent) {
      const moveTouch: any = event.touches[0]
      const scaleX = this.properties.cWidth / this.properties.bWidth
      const scaleY = this.properties.cHeight / this.properties.bHeight
      Controlor.dragImage(moveTouch.x * scaleX, moveTouch.y * scaleY)
    },
    onTouchEnd() {
      Controlor.cancelWatchImage()
    },
    getImageDataArray() {
      return new Promise(resolve => {
        Controlor
          .getImageDataArray()
          .then((result: []) => {
            resolve(result)
          })
      })
    },
    getDelay() {
      return Controlor.getDelay()
    },
    getRect() {
      return Controlor.getRect()
    },
    emitChange(funcName: string, value: number | boolean) {
      (Controlor as any)[funcName](value)
    },
    loadImage(src: string, param?: LooseObject) {
      Controlor
        .loadImage(src || chosenImageSrc || DEFAULT_IMG, param)
        .then(() => {
          Controlor.beginPetPet(true)
        })
        .catch((err: object) => {
          console.log(err)
          wx.showToast({
            title: '图片读取失败'
          })
        })
    }
  }
})