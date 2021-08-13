/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    isNetConnected?: Boolean,
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}

interface LooseObject {
  [key: string]: any
}

interface DrawConstructorOption {
  canvas: LooseObject,
  ctx: LooseObject,
  img: LooseObject,
  dWidth: number,
  dHeight: number
}

interface TouchEvent {
  target: {
    offsetLeft: number,
    offsetTop: number
  }
  touches: Array<{ pageX: number, pageY: number }>
}

interface WorkerParam {
  type: string,
  body?: any,
}

interface ImageArrayToGifMsg {
  frames: any[],
  delay: number,
  width: number,
  height: number
}

declare const worker: LooseObject