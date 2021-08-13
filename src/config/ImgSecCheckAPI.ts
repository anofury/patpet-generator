const ImgSecCheckRes = {
  PASS: {
    code: 0
  },
  NOT_PASS: {
    code: 1,
    title: '生成失败',
    content: '该图片涉嫌违规，无法使用'
  },
  IMG_ERR: {
    code: 2,
    title: '解析失败',
    content: '图片解析异常，请排查网络'
  },
  SERVER_ERR: {
    code: 3,
    title: '解析错误',
    content: '图片解析异常，请重试'
  },
  PARAM_ERR: {
    code: -1,
    title: '解析错误',
    content: '图片解析错误，请重试'
  },
  NET_ERR: {
    code: -2,
    title: '网络错误',
    content: '安全检测失败，请检查网络'
  },
  COM_ERR: {
    code: -3,
    title: '生成失败',
    content: '发生未知错误，请联系开发者'
  }
}

export default ImgSecCheckRes