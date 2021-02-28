// pages/songDetail/songDetail.js
import request from '../../../utils/request'
import PubSub from 'pubsub-js'
import dayjs from 'dayjs'
import Lyric from 'lyric-parser'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isPlay: true, //控制播放开关
    id: '', //歌曲id
    songDetail: [], //歌曲详情
    animation: 'discAnimation .discAnimationPause', //控制动画样式
    songUrl: '', //正在播放歌曲url
    durationTime: '00:00', //歌曲持续时间
    currentTime: '00:00', //当前播放进度
    audioCurrentTimeBarWidth: '0',  //动态控制进度条
    playMode: [
      { type: 'next', icon: 'iconshunxubofang1' },
      { type: 'random', icon: 'iconsuijibofang' },
      { type: 'loop', icon: 'icondanquxunhuan' },
    ], //播放模式列表
    currentMode: 0, //当前播放模式
    PubSubToken: false,  //记录唯一的PubSub的token
    lyricLines: [],
    currentLyricLineId: 0,  //歌词的唯一标示
    isSearch: false, //标记是否是搜索页面的跳转
    is: false

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // console.log(options);
    //options:用于接收路由跳转的query参数,如果传递的参数是对象,对自动调用toString
    //原生小程序中路由传参,对参数的长度有限制,如果参数长度过长会自动截掉

    const { id, isSearch } = options
    if (isSearch) {
      this.setData({
        id,
        isSearch
      })
    } else {
      this.setData({
        id
      })
    }
    //创建全局唯一播放音乐的实例
    this.backgroundAudioManager = wx.getBackgroundAudioManager()

    const appInstance = getApp() //获取app实例
    if (appInstance) {
      const { musicId, isMusicPlay } = appInstance.globalData
      //页面加载,如果当前id和全局保存的一致,并且播放状态为true,直接修改播放状态为true
      if (musicId == id && isMusicPlay) {
        this.changePlayState(isMusicPlay)
        this.setData({
          is: true
        })
        console.log(this.data.is);

      }
    }


    //发请求获取歌曲歌词
    this.getSongLyric(id)
    /* 发送请求获取歌曲详细信息 */
    this.getSongDetail(id)
    //监听歌曲暂停状态的回调
    this.backgroundAudioManager.onPause(() => {

      this.changePlayState(false)
      this.Lyric1.togglePlay()
    })
    //监听歌曲播放的回调
    this.backgroundAudioManager.onPlay(() => {

      this.changePlayState(true)
      this.Lyric1.togglePlay()

    })
    //监听歌曲播放进度的回调
    this.backgroundAudioManager.onTimeUpdate(() => {
      //通过实例身上的currentTime方法获取当前进度时间,单位s,然后通过dayjs进行转换
      const currentTime = dayjs(this.backgroundAudioManager.currentTime * 1000).format('mm:ss')
      //通过实例身上的duration方法获取歌曲总时长,单位s,  计算当前时间的总时间的百分比,得到对应进度条的位置
      const audioCurrentTimeBarWidth = this.backgroundAudioManager.currentTime / this.backgroundAudioManager.duration * 100 + '%'
      //写入data
      this.setData({
        currentTime,
        audioCurrentTimeBarWidth
      })
    })
    //监听音乐停止的回调
    this.backgroundAudioManager.onStop(() => {
      this.changePlayState(false)
    })
    //监听音乐自然播放结束的回调
    this.backgroundAudioManager.onEnded(() => {
      //结束后自动切换下一曲
      const { playMode, currentMode } = this.data
      const type = playMode[currentMode].type
      if (type === 'loop' || this.data.isSearch) { //如果为单曲循环
        const { isPlay, lyricLinesStr } = this.data
        this.controlMusic(isPlay)
        this.Lyric1 = new Lyric(lyricLinesStr, this.handler) //重新解析歌词

      } else {  // next  或  random
        PubSub.publish('switchType', type)
      }
    })
  },
  //切歌的事件回调
  switchMusic(event) {
    if (this.data.isSearch) return

    let { type } = event.currentTarget.dataset
    this.backgroundAudioManager.stop() //切歌先关闭当前音乐
    this.Lyric1.stop() //取消歌词
    this.setData({  //清空歌曲详情
      songDetail: [],
      currentLyricLineId: 0,
      is: false
    })

    //发布消息,和recommendSong页面通信
    /* 
      注意事项: 默认切歌只有 pre 和 next,当前状态内的播模式为'random'时,我们需要修改type = 'random'
                其他播放模式不做修改 
    */
    const { playMode, currentMode } = this.data
    playMode[currentMode].type === 'random' && (type = 'random')
    PubSub.publish('switchType', type)  //发布消息

  },
  //控制播放模式的回调
  handlePlayMode() {
    let { currentMode } = this.data
    currentMode === 2 && (currentMode = -1) //控制下标范围
    this.setData({
      currentMode: ++currentMode   //修改数据
    })
    if (currentMode === 0) {
      wx.showToast({
        title: '列表循环',
        icon: 'none'
      })
    } else if (currentMode === 1) {
      wx.showToast({
        title: '随机播放',
        icon: 'none'
      })
    } else {
      wx.showToast({
        title: '单曲循环',
        icon: 'none'
      })
    }
  },
  //获取歌曲详情和播放地址的回调
  async getSongDetail(ids) {
    wx.showLoading({
      title: '请求数据中',
    })
    const detailResult = await request('/song/detail', { ids })
    const songUrlResult = await request('/song/url', { id: ids })
    const { url } = songUrlResult.data[0]

    if (detailResult.code === 200) {
      const durationTime = dayjs(detailResult.songs[0].dt).format('mm:ss')
      this.setData({
        songDetail: detailResult.songs,
        durationTime,
        songUrl: url,
        isPlay: true,
        id: ids
      })
      if (!url) {
        wx.showToast({
          title: '没有歌曲版权,请尝试别的歌曲',
          icon: 'none'
        })
        return
      }
      //页面加载完毕自动播放歌曲
      wx.hideLoading({
        //数据加载完步,如果当前有播放进度,直接将歌词跳转至当前进度
        success: () => {
          console.log(this.data.is);

          this.data.is && this.Lyric1.seek(this.backgroundAudioManager.currentTime * 1000)
          this.backgroundAudioManager.title = this.data.songDetail[0].name
          this.backgroundAudioManager.src = this.data.songUrl
        }
      })
    }
    //动态修改页面标题的方法
    wx.setNavigationBarTitle({
      title: this.data.songDetail[0].name
    })
  },
  //获取歌词
  async getSongLyric(id) {
    const result = await request('/lyric', { id })
    //创建歌词解析的实例
    this.Lyric1 = new Lyric(result.lrc.lyric, this.handler)
    this.setData({
      lyricLinesStr: result.lrc.lyric,
      lyricLines: this.Lyric1.lines
    })
  },
  // //监听歌词的回调
  handler({ lineNum, txt }) {
    this.setData({
      currentLyricLineId: lineNum - 2
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

  //点击播放/暂停按钮的回调
  playMusic() {
    this.setData({
      isPlay: !this.data.isPlay,
    })
    this.controlMusic(this.data.isPlay)

  },
  //控制音乐播放

  controlMusic(isPlay) {

    if (isPlay) {

      this.backgroundAudioManager.play()
      /* 给实例添加src和title属性歌曲自动播放 */
      // 每次播放,必须指定src和title属性
      // 每次播放,必须指定src和title属性
    } else {
      this.backgroundAudioManager.pause()  //暂停播放
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    const { PubSubToken } = this.data

    //订阅recommedSong页面发布的消息,获取最新的id数据
    /*PubSub的特性: 每次点击切歌都会订阅一次,实际上我们只需要订阅一次就行 */
    if (!PubSubToken) { //如果状态内 PubSubToken 值为 false 再去开启订阅
      const token = PubSub.subscribe('currentId', (msg, data) => {  //订阅获取切歌后最新的id的消息
        console.log('订阅到消息了');
        this.getSongDetail(data)  //根据最新Id获取歌曲详情
        this.getSongLyric(data)
      })
      this.setData({
        PubSubToken: token
      })
    }


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
    //删除已经订阅的PubSub
    PubSub.unsubscribe(this.data.PubSubToken)
    this.Lyric1.stop()
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