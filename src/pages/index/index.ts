// index.ts
import { PET_CONFIG, DEFAULT_IMG } from '../../config/pet'
import ImgSecCheckRes from '../../config/ImgSecCheckAPI'
import { formatTime } from '../../utils/util'

const GifHeader: string = 'data:image/gif;base64,'
const WorkerPath: string = '/workers/createGIF/index.js'
let GlobalPathName: string
let CanvasEle: any
let fromTimeline: boolean = false
let passFilePathCache: string = 'none'

Page({
  data: {
    speed: PET_CONFIG.speed,
    range: PET_CONFIG.range,
    size: PET_CONFIG.size,
    flip: PET_CONFIG.flip,
    smooth: PET_CONFIG.smooth,
    chosenImagePath: '',
    resultBase64: '',
    drawing: false,
  },
  onLoad() {
    fromTimeline = wx.getLaunchOptionsSync().scene === 1154
  },
  onReady() {
    CanvasEle = this.selectComponent('#petcanvas')
  },
  // onShareAppMessage() {
  //   return {
  //     title: '咦！你的头像看起来很好玩吖~'
  //   }
  // },
  // onShareTimeline() {
  //   return {
  //     title: '咦！你的头像看起来很好玩吖~'
  //   }
  // },
  onReset() {
    for (let prop in PET_CONFIG) {
      const funcName = 'change' + prop[0].toUpperCase() + prop.slice(1)
      CanvasEle.emitChange(funcName, PET_CONFIG[prop])
      CanvasEle.loadImage('', { reset: true })
      this.setData({ [prop]: PET_CONFIG[prop] })
    }
    this.setData({
      resultBase64: '',
      drawing: false,
    })
  },
  onChooseImage() {
    const _this = this

    if (fromTimeline) {
      wx.showModal({
        title: '无法打开相册',
        content: '请“前往小程序”使用相册功能',
        showCancel: false,
        confirmText: '我知道了',
        fail(err) {
          console.log(err)
        }
      })
      return
    }

    wx.chooseImage({
      count: 1,
      sizeType: [/*'original',*/ 'compressed'],
      sourceType: ['album', 'camera'],
      success(chooseImageRes) {
        const tempFilePath = chooseImageRes.tempFilePaths[0]
        _this.setData({
          chosenImagePath: tempFilePath,
          resultBase64: ''
        })
      },
      fail(err) {
        console.log(err)
        const isUserCancel = err.errMsg.indexOf('cancel') !== -1

        if (!isUserCancel) {
          wx.showToast({
            title: '图片加载失败',
            icon: 'none'
          })
        }
      }
    })
  },
  onConvertToGif() {
    if (this.data.drawing) return

    const _this = this
    const hadUseConvert = wx.getStorageSync('hadUseConvert')
    if (!hadUseConvert) {
      wx.showModal({
        title: '提示',
        content: '为维护健康文明的网络环境，该功能会对图片进行安全检测',
        cancelText: '取消',
        confirmText: '继续',
        success(res) {
          if (res.confirm) {
            wx.setStorage({
              key: 'hadUseConvert',
              data: 1
            })
            _this.convertToGif()
          }
        },
        fail(err) {
          console.log(err)
        }
      })
    } else {
      _this.convertToGif()
    }
  },
  onPreviewImage() {
    wx.previewImage({
      urls: [wx.env.USER_DATA_PATH + GlobalPathName],
      fail(err) {
        console.log(err)
        wx.showToast({
          title: '图片预览失败',
          icon: 'none'
        })
      }
    })
  },
  onSaveGifToPhotosAlbum() {
    const _this = this

    if (fromTimeline) {
      wx.showModal({
        title: '无法保存到相册',
        content: '请“前往小程序”使用相册功能，或者在图片预览中长按保存',
        cancelText: '我知道了',
        confirmText: '预览图片',
        success(res) {
          if (res.confirm) {
            _this.onPreviewImage()
          }
        },
        fail(err) {
          console.log(err)
        }
      })
      return
    }

    const delayTimer = setTimeout(() => {
      wx.showLoading({
        title: '保存中..'
      })
    }, 200)

    wx.saveImageToPhotosAlbum({
      filePath: wx.env.USER_DATA_PATH + GlobalPathName,
      success(res) {
        console.log(res)
        clearTimeout(delayTimer)
        wx.showToast({
          title: '保存成功',
        })
      },
      fail(err) {
        console.log(err)
        clearTimeout(delayTimer)
        const isUserCancel = err.errMsg.indexOf('cancel') !== -1
        const isAuthDeny = err.errMsg.indexOf('auth') !== -1

        if (isAuthDeny) {
          wx.hideLoading()
          wx.showModal({
            title: '保存失败',
            content: '请在右上角菜单“设置”中授予“相册”使用权限',
            showCancel: false,
            confirmText: '我知道了',
            fail(err) {
              console.log(err)
            }
          })
        } else if (!isUserCancel) {
          wx.showToast({
            title: '保存失败',
            icon: 'none'
          })
        } else {
          wx.hideLoading()
        }
      }
    })
  },
  onSetClipBoard(event: any) {
    const clipData = event.currentTarget.dataset && event.currentTarget.dataset.clip
    if (clipData) {
      wx.setClipboardData({
        data: clipData,
        success(res) {
          console.log(res)
          wx.showToast({
            title: '已复制网址'
          })
        },
        fail(err) {
          console.log(err)
        }
      })
    }
  },
  saveToLocalTemp(pathName: string = GlobalPathName) {
    const FileSystemManager = wx.getFileSystemManager()
    const { resultBase64 } = this.data

    FileSystemManager.readdir({
      dirPath: wx.env.USER_DATA_PATH,
      success(res) {
        res.files.forEach((el) => {
          if (/mpexport_pet_(\d+).gif/.test(el)) {
            FileSystemManager.unlink({
              filePath: `${wx.env.USER_DATA_PATH}/${el}`,
              success(res) {
                console.log(res)
              }
            })
          }
        })
      }
    })

    FileSystemManager.writeFile({
      filePath: wx.env.USER_DATA_PATH + pathName,
      data: resultBase64.slice(GifHeader.length),
      encoding: 'base64',
      success: res => {
        console.log(res)
      }
    })
  },
  changeHandler(event: any) {
    const prop = event.target.dataset.prop
    const funcName = event.type + prop[0].toUpperCase() + prop.slice(1)
    const value = event.detail.value
    this.setData({ [prop]: value })
    CanvasEle.emitChange(funcName, value)

    if (prop === 'smooth' && value) {
      try {
        const hadUseSmooth = wx.getStorageSync('hadUseSmooth')
        if (!hadUseSmooth) {
          wx.showModal({
            title: '提示',
            content: '该属性在增强图片平滑度的同时，也会增加图片的模糊度',
            showCancel: false,
            confirmText: '不再提醒',
            fail(err) {
              console.log(err)
            }
          })
          wx.setStorage({
            key: 'hadUseSmooth',
            data: 1
          })
        }
      } catch (err) {
        console.log(err)
      }
    }
  },
  async convertToGif() {
    this.setData({
      resultBase64: '',
      drawing: false
    })

    if (this.getImgSecCheckCount() >= 30) {
      wx.showModal({
        title: '生成失败',
        content: '今日生成图片的次数已达上限',
        showCancel: false,
        confirmText: '我知道了'
      })
      return
    }

    const _this = this
    const delayTimer = setTimeout(() => {
      wx.showLoading({
        title: '图片检测中..'
      })
    }, 200)
    const ImgCheckResult = await this.doImgSecCheck()
    wx.hideLoading()
    clearTimeout(delayTimer)
    if (ImgCheckResult.code) {
      wx.showModal({
        title: ImgCheckResult.title,
        content: ImgCheckResult.content,
        showCancel: false,
        confirmText: '我知道了',
        success(res) {
          if (res.confirm && ImgCheckResult === ImgSecCheckRes.NOT_PASS) {
            _this.setData({
              chosenImagePath: DEFAULT_IMG
            })
          }
        }
      })
      return
    }

    this.setData({
      drawing: true
    })

    const GifWorker = wx.createWorker(WorkerPath)
    if (!GifWorker) {
      wx.showToast({
        title: '生成失败',
        icon: 'none'
      })
      this.setData({
        resultBase64: '',
        drawing: false
      })
      return
    }
    CanvasEle
      .getImageDataArray()
      .then((imageDataArray: string[]) => {
        GifWorker.onMessage(result => {
          const wResult = result.message

          switch (wResult.type) {
            case 'generate:done':
              GlobalPathName = `/mpexport_pet_${new Date().getTime()}.gif`
              this.setData({
                resultBase64: GifHeader + wResult.data,
                drawing: false
              })
              this.saveToLocalTemp()
              break
            case 'generate:error':
              this.setData({
                drawing: false,
              })
              wx.showToast({
                title: '生成失败',
                icon: 'none'
              })
              break
            default:
              console.log(wResult)
              break
          }
          GifWorker.terminate()
        })

        GifWorker.postMessage({
          type: 'generate:start',
          body: {
            frames: imageDataArray,
            delay: CanvasEle.getDelay(),
            ...CanvasEle.getRect()
          }
        })
      })
  },
  doImgSecCheck(): any {
    const chosenImagePath = this.data.chosenImagePath
    if (!chosenImagePath || chosenImagePath === DEFAULT_IMG) {
      console.log('[info] 测试图片无需安全校验')
      return Promise.resolve(ImgSecCheckRes.PASS)
    }
    if (passFilePathCache === chosenImagePath) {
      console.log('[info] 校验已通过的图片无需再次安全校验')
      return Promise.resolve(ImgSecCheckRes.PASS)
    }

    const app = getApp()
    if (!app.globalData.isNetConnected) {
      return Promise.resolve(ImgSecCheckRes.NET_ERR)
    }

    // 接口过期，下线处理
    return Promise.resolve(ImgSecCheckRes.PASS)
    return new Promise(resolve => {
      wx.serviceMarket.invokeService({
        service: 'wxee446d7507c68b11',
        api: 'imgSecCheck',
        data: {
          "Action": "ImageModeration",
          "Scenes": ["PORN", "POLITICS", "TERRORISM"],
          "ImageUrl": new wx.serviceMarket.CDN({
            type: 'filePath',
            filePath: chosenImagePath,
          }),
          "Config": "",
          "Extra": ""
        },
      }).then((res: LooseObject) => {
        const response = res.data.Response
        if (response.Error) {
          console.log(response)
          switch (response.Error) {
            case 'FailedOperation.DownLoadError':
            case 'FailedOperation.ImageDecodeFailed':
            case 'FailedOperation.TooLargeFileError':
              resolve(ImgSecCheckRes.IMG_ERR)
              break;
            default:
              resolve(ImgSecCheckRes.SERVER_ERR)
              break;
          }
        } else if (response.Suggestion === "PASS") {
          this.setImgSecCheckCount()
          passFilePathCache = chosenImagePath
          resolve(ImgSecCheckRes.PASS)
        } else {
          resolve(ImgSecCheckRes.NOT_PASS)
        }
      }).catch((err: object) => {
        console.log(err)
        resolve(ImgSecCheckRes.PARAM_ERR)
      })
    })
  },
  setImgSecCheckCount(storageKey: string = `imgSecCheckCount_${formatTime(new Date())}`) {
    this.clearUsedImgSecCheckCount()
    const count = wx.getStorageSync(storageKey)
    if (typeof count === 'number') {
      wx.setStorage({
        key: storageKey,
        data: count + 1
      })
    } else {
      wx.setStorage({
        key: storageKey,
        data: 1
      })
    }
  },
  getImgSecCheckCount(storageKey: string = `imgSecCheckCount_${formatTime(new Date())}`) {
    this.clearUsedImgSecCheckCount()
    const count = wx.getStorageSync(storageKey)
    if (typeof count === 'number') {
      return count
    } else {
      wx.setStorage({
        key: storageKey,
        data: 0
      })
      return 0
    }
  },
  clearUsedImgSecCheckCount(storageKey: string = `imgSecCheckCount_${formatTime(new Date())}`) {
    const storageInfo = wx.getStorageInfoSync()
    if (storageInfo && storageInfo.keys.length) {
      const storageInfoKeys = storageInfo.keys
      storageInfoKeys.forEach(item => {
        if (/imgSecCheckCount_\d{8}$/.test(item) && item !== storageKey) {
          wx.removeStorageSync(item)
        }
      })
    }
  },
})