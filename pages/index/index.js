// pages/index/index.js
import request from '../../utils/request'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    banners: [],  //轮播图数据
    recommends: [],  //推荐歌单数据
    tops: []  //热门排行榜数据
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function () {
    //请求轮播图列表
    const bannerList = await request('/banner', { type: 1 })
    const { code, banners } = bannerList
    if (code === 200) {
      this.setData({
        banners
      })
    }
    //请求推荐歌单列表
    const recommendList = await request('/personalized', { limit: 10 })
    if (recommendList.code === 200) {
      this.setData({
        recommends: recommendList.result
      })
    }
    //请求排行榜列表
    /* 
    *  需求分析:
          1.根据idx的值获取数据
          2.idx的取值范围是0-20,我们需要的是0-4
          3.需要发送5次请求
    *
    * * */
    let index = 0
    const resultArr = []
    while (index < 5) {
      const topsData = await request('/top/list', { idx: index++ })
      resultArr.push({ name: topsData.playlist.name, tracks: topsData.playlist.tracks.slice(0, 3) })
      // 渲染5次,用户体验较好,不会出现长时间等待没有数据
      this.setData({
        tops: resultArr
      })
    }
    //渲染一次,用户体验差,性能优
    // this.setData({
    //   tops: resultArr
    // })

  },
  handleToRecommendSong() {
    //判断用户是否登录,如未登录,跳转到login页面
    const profile = wx.getStorageSync('profile') && JSON.parse(wx.getStorageSync('profile'))
    if (!profile.nickname) {
      wx.navigateTo({
        url: "/pages/login/login"
      })
    } else {
      wx.navigateTo({
        url: '/songPackage/pages/recommendSong/recommendSong'
      })
    }
  },
  handleToOther() {
    wx.navigateTo({
      url: "/otherPackage/pages/other/other"
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