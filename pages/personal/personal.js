// pages/personal/personal.js
import request from '../../utils/request'
/* 定义计算触摸移动距离的变量 */
let startY = 0  //手指开始触摸的坐标
let moveY = 0  //手指移动的距离坐标
let moveDistance = 0  //计算移动的位置 =  moveY - startY
Page({

  /**
   * 页面的初始数据
   */
  data: {
    coverTransform: 'translateY(0) translateZ(0)',  //coverContainer标签未移动前的位置
    coverTransition: '', //添加过渡的属性
    profile: {},   //用户信息
    playRecords: []  //用户播放记录
  },

  handleTouchstart(event) {
    //得到起始坐标
    startY = event.touches[0].clientY

    this.setData({
      coverTransition: '' //每次开始触摸,清空过渡属性
    })
  },
  handleTouchmove(event) {
    //得到移动时的坐标
    moveY = event.touches[0].clientY
    moveDistance = moveY - startY  //计算移动的距离
    // console.log(moveDistance);
    if (moveDistance < 80 && moveDistance > 0) {
      this.setData({
        coverTransform: `translateY(${moveDistance}rpx) translateZ(0)` //实时计算并更新coverContainer标签的位置
      })
    }
  },
  handleTouchend() {
    //手指松开,恢复到原来位置,设置过渡
    this.setData({
      coverTransform: 'translateY(0) translateZ(0)', //恢复原来位置
      coverTransition: '0.5s'  //设置过渡
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },
  //跳转到登录页面
  handleGoLogin() {
    if (this.data.profile.nickname) {
      return
    }
    wx.reLaunch({
      url: '/pages/login/login'
    })
  },
  //获取用户播放记录
  async getUserPlayRecord(userId) {
    if (!userId) return
    const result = await request('/user/record', { uid: userId, type: 0 })
    const { code, allData } = result

    if (code === 200) {
      this.setData({
        playRecords: allData.slice(0, 10)
      })
    } else {
      wx.showToast({
        title: '未获取播放记录',
        icon: 'none'
      })
    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    const profile = wx.getStorageSync('profile') && JSON.parse(wx.getStorageSync('profile'))
    this.setData({
      profile
    })
    this.getUserPlayRecord(profile.userId)
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