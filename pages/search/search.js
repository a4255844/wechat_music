// pages/search/search.js
import request from '../../utils/request'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    searchDefault: '', //搜索默认关键字
    hotList: [], //热搜榜
    searchList: [], //搜索模糊匹配列表
    keyWord: '', //用户输入的input value
    historyList: [] //搜索历史列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getSearchDefault() //请求获取搜索关键字
    this.getHotSearchList() //获取热搜榜列表
    const historyList = wx.getStorageSync('historyList')
    if (historyList) {
      this.setData({
        historyList
      })
    }

  },
  //获取默认搜索关键字
  async getSearchDefault() {
    const result = await request('/search/default')
    this.setData({
      searchDefault: result.data.showKeyword
    })
  },
  //获取热搜榜数据
  async getHotSearchList() {
    const result = await request('/search/hot/detail')
    this.setData({
      hotList: result.data
    })
  },
  async getSearchList(value) {
    const searchList = await request('/search', { keywords: value, limit: 10 })
    const { code, result } = searchList
    if (code === 200) {
      this.setData({
        searchList: result.songs,
        keyWord: value
      })
    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },
  //监听输入框变化
  handleInputChange(event) {
    const value = event.detail.value.trim() //去除空格
    if (this.timeId) {  //函数防抖
      clearTimeout(this.timeId)
    } else {

      value && this.getSearchList(value)
    }


    if (!value) {
      this.setData({
        keyWord: ''
      })
      return
    }

    this.timeId = setTimeout(() => {
      console.log('防抖');

      this.getSearchList(value)
      this.timeId = null //拿到数据删除timeId属性
    }, 300);
  },
  //清空输入框
  handleClearInput() {
    this.setData({
      keyWord: ''
    })
  },
  //点击歌曲,储存搜索记录并跳转至播放
  handlePlay(event) {
    const { id, name } = event.currentTarget.dataset
    const { historyList } = this.data
    //判断数组内是否有当前name,如果有将其删掉,最后统一添加到数组最前方
    const index = historyList.findIndex(item => item.id === id)
    if (index !== -1) {
      historyList.splice(index, 1)
    }
    //添加搜索记录到数组最前方
    historyList.unshift({ name, id })
    this.setData({
      historyList,
    })
    //写入本地缓存
    wx.setStorageSync('historyList', historyList)

    wx.navigateTo({
      url: `/songPackage/pages/songDetail/songDetail?id=${id}&isSearch=${true}`
    })
  },
  //清空历史记录列表
  handleClearHistory() {
    wx.showModal({
      title: '确定删除吗?',
      success: res => {
        if (res.confirm) {
          console.log(this);
          this.setData({
            historyList: []
          })
          wx.removeStorageSync('historyList')
        }
      }
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