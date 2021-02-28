// pages/recommendSong/recommendSong.js
import request from '../../../utils/request'
import PubSub from 'pubsub-js'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    day: '',
    month: '',
    recommendList: [],  //每日推荐歌单
    index: 0 //当前选中的音乐下标
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //判断用户是否登录,如未登录,跳转到login页面
    const profile = wx.getStorageSync('profile') && JSON.parse(wx.getStorageSync('profile'))
    if (!profile.nickname) {
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
    wx.showLoading({
      title: '请求中'
    })
    const result = await request('/recommend/songs', {}, "GET", { cookie })
    if (result.code === 200) {
      this.setData({
        recommendList: result.recommend
      })
    }
    wx.hideLoading()
  },
  //跳转到对应歌曲详情页
  handleToDetail(event) {
    let { musicid, index } = event.currentTarget.dataset
    this.setData({
      index
    })
    wx.navigateTo({
      url: '/songPackage/pages/songDetail/songDetail?id=' + musicid,
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    //订阅pubsub发布的消息,来自songDetail,实现页面间的通信,必须先订阅后发布才生效
    PubSub.subscribe('switchType', (msg, data) => {
      //通过当前歌曲的下标,来获取上一首或下一首的下标,并通过下标获取对应id发布给songDetail页面
      let { index } = this.data
      const { recommendList } = this.data
      if (data === 'pre') {
        index < 1 && (index = recommendList.length)
        index -= 1   //如果为pre 自减一
      } else if (data === 'next') {
        index >= recommendList.length - 1 && (index = -1)
        index += 1 //next 自加一
      } else {  //random  随机
        //获取歌曲列表数组长度-1范围内的下标
        let randomIndex = Math.round(Math.random() * (recommendList.length - 1))
        while (randomIndex === index) { //如果随机的下标和当前歌曲下标一致,重新随机
          randomIndex = Math.round(Math.random() * (recommendList.length - 1))
        }
        index = randomIndex  //把不重复的下标赋值给index
      }
      this.setData({  //将最新的下标写入data,以便下次读取
        index
      })
      //发布消息,把歌曲id传递给songDetail
      PubSub.publish('currentId', recommendList[index].id)
    })
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