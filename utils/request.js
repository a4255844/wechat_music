import config from './config.js'
export default (url, data = {}, method = 'GET', header = {}) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: config.mobileHost + url,
      data,
      method,
      header,
      success: (res) => {
        //判断如果是登录请求,保存服务器返回的cookies到本地存储
        if (data.isLogin) {
          console.log(res);
          wx.setStorageSync('cookies', res.cookies)
        }
        resolve(res.data)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })

}