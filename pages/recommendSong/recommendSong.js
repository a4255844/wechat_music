// pages/recommendSong/recommendSong.js
import request from '../../utils/request'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    day: '',
    month: '',
    recommendList: [],  //每日推荐歌单
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //判断用户是否登录,如未登录,跳转到login页面
    const profile = JSON.parse(wx.getStorageSync('profile'))
    if (!profile.nickname) {
      wx.showToast({
        title: '请先登录'
      })
      wx.redirectTo({
        url: "/pages/login/login"
      })
    }
    //计算当前日期数据
    this.setData({
      day: new Date().getDate(),
      month: new Date().getMonth() + 1
    })



    // 读取发送请求需要携带的cookie
    const cookie = wx.getStorageSync('cookies') && wx.getStorageSync('cookies').find(item => item.indexOf('MUSIC_U') !== -1)
    //发送请求
    this.getRecommendSong(cookie)
  },
  async getRecommendSong(cookie) {
    const result = await request('/recommend/songs', {}, "GET", { cookie })
    if (result.code === 200) {
      this.setData({
        recommendList: result.recommend
      })
    }
  },
  handleToDetail(event) {
    const { id } = event.currentTarget
    wx.navigateTo({
      url: '/pages/songDetail/songDetail?id=' + id,

    })
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