// app.ts
App<IAppOption>({
  globalData: {
    isNetConnected: true
  },
  onLaunch() {
    wx.onNetworkStatusChange(res => {
      this.globalData.isNetConnected = res.isConnected
    })
  },
})