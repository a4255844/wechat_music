// pages/songDetail/songDetail.js
import request from '../../utils/request'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isPlay: false, //控制播放开关
    id: '', //歌曲id
    songDetail: [], //歌曲详情
    animation: 'discAnimation .discAnimationPause' //控制动画样式
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // console.log(options);
    //options:用于接收路由跳转的query参数,如果传递的参数是对象,对自动调用toString
    //原生小程序中路由传参,对参数的长度有限制,如果参数长度过长会自动截掉
    const { id } = options
    this.setData({
      id
    })
    const appInstance = getApp() //获取app实例
    if (appInstance) {
      const { musicId, isMusicPlay } = appInstance.globalData
      //页面加载,如果当前id和全局保存的一致,并且播放状态为true,直接修改播放状态为true
      if (musicId === id && isMusicPlay) {
        this.changePlayState(isMusicPlay)
      }
    }




    /* 发送请求获取歌曲详细信息 */
    this.getSongDetail(id)
    //创建全局唯一播放音乐的实例
    this.backgroundAudioManager = wx.getBackgroundAudioManager()

    //监听歌曲暂停状态的回调
    this.backgroundAudioManager.onPause(() => {
      this.changePlayState(false)
    })
    //监听歌曲播放的回调
    this.backgroundAudioManager.onPlay(() => {
      this.changePlayState(true)

    })
    //监听音乐停止的回调
    this.backgroundAudioManager.onStop(() => {
      this.changePlayState(false)

    })
  },
  //修改播放状态的方法
  changePlayState(isPlay) {
    this.setData({
      isPlay
    })
    if (isPlay) {
      setTimeout(() => {
        this.setData({
          animation: 'discAnimation' //等待1s摇杆落下
        })
      }, 1000);
    } else {
      this.setData({
        animation: 'discAnimation .discAnimationPause' //暂停动画
      })
    }
  },
  //获取歌曲详情的回调
  async getSongDetail(ids) {
    const result = await request('/song/detail', { ids })
    if (result.code === 200) {
      this.setData({
        songDetail: result.songs
      })
    }
    //动态修改页面标题的方法
    wx.setNavigationBarTitle({
      title: this.data.songDetail[0].name
    })
  },


  //点击播放按钮的回调
  playMusic() {

    const { id } = this.data
    this.setData({
      isPlay: !this.data.isPlay,

    })
    this.controlMusic(this.data.isPlay, id)

  },
  //控制音乐播放
  async controlMusic(isPlay, id) {
    if (isPlay) {
      //获取请求音乐的url

      const result = await request('/song/url', { id })
      const { url } = result.data[0]
      /* 给实例添加src和title属性歌曲自动播放 */
      this.backgroundAudioManager.src = url
      this.backgroundAudioManager.title = this.data.songDetail[0].name
    } else {

      this.backgroundAudioManager.pause()
    }
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
    /* 
        原因: 页面后退,数据全部销毁了,无法确认在进入该页面时,当前播放的歌曲的状态
        解决:创建一个全局app的实例,把当前歌曲的播放状态和id保存起来,以便下次进入页面验证该歌曲的播放状态
      */
    const appInstance = getApp()  //得到app实例
    const { musicId } = appInstance.globalData
    //判断：如果app的musicId !==当前页面歌曲id，并且当前页面歌曲播放状态为true，在保存当前页面的id和isPlay
    if (musicId !== this.data.id && this.data.isPlay) {
      appInstance.globalData.musicId = this.data.id //保存id到全局app身上
      appInstance.globalData.isMusicPlay = this.data.isPlay //保存id到全局app身上
    }
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