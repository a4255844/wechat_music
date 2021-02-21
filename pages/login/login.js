// pages/login/login.js
import request from '../../utils/request'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    phone: '',
    password: ''
  },
  handleInput(event) { //双向数据绑定的回调
    //获取提前设定的id类型
    const type = event.target.id
    //通过data-type获取提前设定的数据,类型为object key为 data-后面的
    // const type = event.target.dataset.type
    this.setData({ //写入data
      [type]: event.detail.value
    })
  },
  async handleLogin() {
    const { phone, password } = this.data

    if (!(phone && password)) {
      wx.showToast({
        title: '手机号或密码不能为空',
        icon: "none"
      })
      return
    }
    //正则匹配手机号和密码
    const phoneReg = /^(0|86|17951)?(13[0-9]|15[012356789]|166|17[3678]|18[0-9]|14[57])[0-9]{8}$/
    const passwordReg = /^.{6,20}$/i
    if (!phoneReg.test(phone)) {
      wx.showToast({
        title: '手机号格式不正确!',
        icon: "none"
      })
      return
    }
    if (!passwordReg.test(password)) {
      wx.showToast({
        title: '密码格式不正确!',
        icon: "none"
      })
      return
    }
    //前端验证完成,发送ajax请求,并携带一个是否为登录请求的参数,以便返回数据时获取cookies
    const result = await request('/login/cellphone', { phone, password, isLogin: true })
    const { code, profile, token } = result
    //后端验证
    if (code === 200) {
      wx.showToast({
        title: '登陆成功'
      })
      wx.setStorageSync("profile", JSON.stringify(profile)) //保存数据到本地储存
      wx.switchTab({  //跳转到个人中心
        url: "/pages/personal/personal"
      })
    } else if (code === 501) {
      wx.showToast({
        title: '账户不存在,请确认!',
        icon: "none"
      })
    } else if (code === 502) {
      wx.showToast({
        title: '密码错误!',
        icon: "none"
      })
    } else {
      wx.showToast({
        title: '登陆失败,请重试!',
        icon: "none"
      })
    }


  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})