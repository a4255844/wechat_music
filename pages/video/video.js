// pages/video/video.js
import request from '../../utils/request'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    navGroupList: [],  //视频标签列表
    currentNavId: '',  //存储选中的视频标签id
    cookie: '',  //当前页面需要的cookie
    videoList: [], //video视频列表
    currentVid: '', //当前正在播放的视频id
    videoTimeUpdateList: [], //记录所有播放过的视频的播放进度
    triggered: false,  //控制下拉刷新的状态
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //页面加载时,读取本地存储的cookies
    //页面加载完毕,保存相关cookies到data
    const cookie = wx.getStorageSync('cookies') && wx.getStorageSync('cookies').find(item => item.indexOf('MUSIC_U') !== -1)
    if (!cookie) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
    }
    this.setData({
      cookie
    })
    //请求 获取nav 视频标签列表 前14个
    this.getVideoGroupList()
  },
  //获取nav 视频标签列表 前14个
  async getVideoGroupList() {
    const result = await request('/video/group/list')
    const { code, data } = result
    const navGroupList = data.slice(0, 14)
    if (code === 200) {
      this.setData({
        navGroupList,
        currentNavId: navGroupList[0].id
      })
    }
    this.getCurrentVideoList(this.data.currentNavId)
  },
  // 点击获取当前标签的id
  getCurrentId(event) {
    const currentNavId = event.currentTarget.id
    this.setData({
      currentNavId: currentNavId * 1
    })
    this.getCurrentVideoList(this.data.currentNavId)
  },
  //根据当前标签的id获取视频列表,需携带相关cookies
  async getCurrentVideoList(id) {
    wx.showLoading({  //显示正在加载
      title: "正在加载"
    })
    this.setData({ videoList: [] }) //显示加载时,清空当前video列表数据
    const result = await request('/video/group', { id }, 'GET', { cookie: this.data.cookie })
    // console.log(result);
    this.setData({ triggered: false })
    const { code, datas } = result
    if (code === 200) {
      this.setData({
        videoList: datas
      })
    }
    wx.hideLoading() //关闭正在加载

  },
  //视频播放时触发的回调
  /* 
    解决同时播放两个视频的问题
    需求：1. 在点击播放的事件中需要找到上一个播放的视频
          2. 在播放新的视频之前关闭上一个正在播放的视频
          
    思路: 1. 绑定监听视频播放的回调,拿到对应的视频vid并保存到data
          2. 播放时进行判断,如果vid相同则不做处理,如果不同,关闭之前的视频播放
          3. 创建一个全新的VideoContext,挂载this上
            单例模式：
                1. 需要创建多个对象的场景下，通过一个变量接收，始终保持只有一个对象，
                2. 节省内存空间
  */
  handlePlay(event) {
    const vid = event.currentTarget.id

    this.VideoContext = wx.createVideoContext(vid)  //创建一个video的实例
    this.setData({
      currentVid: vid
    })
    const { videoTimeUpdateList } = this.data
    const itemObj = videoTimeUpdateList.find(item => item.id === vid)
    // itemObj && itemObj.id !== vid && this.VideoContext.seek(itemObj.currentTime)
    if (itemObj) {  //如果找到对象,并且id和当前vid不相同
      console.log("从记录点开始播放", itemObj.currentTime);
      this.VideoContext.seek(itemObj.currentTime)
    } else {
      this.VideoContext.play()
    }

  },


  //监听播放时获取播放进度的回调
  handleTimeUpdate(event) {
    const { detail: { currentTime }, currentTarget: { id } } = event  //多层解构赋值
    this.videoTimeObj = { currentTime, id }  //创建一个保存视频进度的对象,挂载到this上

  },
  //监听视频暂停的回调,暂停后更新 记录视频进度的数组
  handlePause() {
    const { videoTimeUpdateList } = this.data
    console.log("暂停了");
    /* 
      遍历保存记录的数组,如果内部存在当前视频的id,则只更新时间
      如果不存在则添加新的对象 
    */
    const itemObj = videoTimeUpdateList.find(item => item.id === this.videoTimeObj.id)
    if (itemObj) {
      itemObj.currentTime = this.videoTimeObj.currentTime
    } else {
      videoTimeUpdateList.push(this.videoTimeObj)
    }
    this.setData({
      videoTimeUpdateList
    })
  },
  //监听视频播放到末尾的回调
  handleEnded() {
    const { videoTimeUpdateList, currentVid } = this.data
    //找到数组内对应id的下标,直接删除
    videoTimeUpdateList.splice(videoTimeUpdateList.findIndex(item => item.id === currentVid), 1)
    this.setData({
      videoTimeUpdateList
    })
  },
  //下拉刷新的回调  scroll-view
  handleRefresher() {
    console.log('下拉刷新');
    this.getCurrentVideoList(this.data.currentNavId)
  },
  // 滚动到底部的回调,请求新的视频列表,并添加到data中的视频列表 scroll-view
  handleTolower() {
    console.log('到底了');
    //模拟列表数据
    const datas = [
      {
        "type": 1,
        "displayed": false,
        "alg": "onlineHotGroup",
        "extAlg": null,
        "data": {
          "alg": "onlineHotGroup",
          "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
          "threadId": "R_VI_62_7EEA8DC0348AE502B4603F4DDE3D37CF",
          "coverUrl": "https://p2.music.126.net/cFizjteuRQXLJGkoh7csEw==/109951163572796786.jpg",
          "height": 720,
          "width": 1280,
          "title": "SAYMYNAME电音节现场！HardTrap领军人物！",
          "description": null,
          "commentCount": 27,
          "shareCount": 53,
          "resolutions": [
            {
              "resolution": 240,
              "size": 38374652
            },
            {
              "resolution": 480,
              "size": 49260077
            },
            {
              "resolution": 720,
              "size": 80507180
            }
          ],
          "creator": {
            "defaultAvatar": false,
            "province": 110000,
            "authStatus": 1,
            "followed": false,
            "avatarUrl": "http://p1.music.126.net/ZBBc2ZQ9lREYsRiKoslYsQ==/109951164424314618.jpg",
            "accountStatus": 0,
            "gender": 1,
            "city": 110101,
            "birthday": 907603200000,
            "userId": 290424442,
            "userType": 4,
            "nickname": "BRBARRY",
            "signature": "Metalstep.Producer.DJ,Guitar",
            "description": "",
            "detailDescription": "",
            "avatarImgId": 109951164424314620,
            "backgroundImgId": 109951164393451460,
            "backgroundUrl": "http://p1.music.126.net/r8WMTxHxpb3mN1tJ0UtI7A==/109951164393451457.jpg",
            "authority": 0,
            "mutual": false,
            "expertTags": null,
            "experts": {
              "1": "音乐视频达人"
            },
            "djStatus": 10,
            "vipType": 11,
            "remarkName": null,
            "avatarImgIdStr": "109951164424314618",
            "backgroundImgIdStr": "109951164393451457",
            "avatarImgId_str": "109951164424314618"
          },
          "urlInfo": {
            "id": "7EEA8DC0348AE502B4603F4DDE3D37CF",
            "url": "http://vodkgeyttp9.vod.126.net/cloudmusic/8006ae61b6247eb552876d7506488cee.mp4?ts=1613640306&rid=F3F8B75A5956846B0714E9DF9C08B366&rl=3&rs=HwgNxeyjllKpzGkqsUCoVMCXfpNlTPLw&sign=03086b82fd0212a1ee257a1a8e347631&ext=rvvN%2FYd8bYrgnprho9xdZnQdLC8w3URqYQV9GV%2BMScNW%2Fg%2BFj%2Ffw4QLVnxFgz7eKRS4g0r0NHyqHYU9bUqKaERCymjw8MunCI41dMUTNCX9uqDlixx0onRJp3gjTvpO3G0Tz%2FmR74nqZR5tTDGN89SAmpOhL%2BnyV82NGfu42PEZWg3jtY1iTOtjMamIIfriFsw1fxyiu8PbIDz5RQkoPGE0%2BIIeNUcXnqlW5Cn%2Fr8OYTIe1Uwrrk8xrQCnzulRWh",
            "size": 80507180,
            "validityTime": 1200,
            "needPay": false,
            "payInfo": null,
            "r": 720
          },
          "videoGroup": [
            {
              "id": 9104,
              "name": "电子",
              "alg": "groupTagRank"
            },
            {
              "id": 14146,
              "name": "兴奋",
              "alg": "groupTagRank"
            },
            {
              "id": 16131,
              "name": "英文",
              "alg": "groupTagRank"
            },
            {
              "id": 4104,
              "name": "电音",
              "alg": "groupTagRank"
            },
            {
              "id": 1100,
              "name": "音乐现场",
              "alg": "groupTagRank"
            },
            {
              "id": 58100,
              "name": "现场",
              "alg": "groupTagRank"
            },
            {
              "id": 5100,
              "name": "音乐",
              "alg": "groupTagRank"
            }
          ],
          "previewUrl": null,
          "previewDurationms": 0,
          "hasRelatedGameAd": false,
          "markTypes": null,
          "relateSong": [],
          "relatedInfo": null,
          "videoUserLiveInfo": null,
          "vid": "7EEA8DC0348AE502B4603F4DDE3D37CF",
          "durationms": 294000,
          "playTime": 64083,
          "praisedCount": 268,
          "praised": false,
          "subscribed": false
        }
      },
      {
        "type": 1,
        "displayed": false,
        "alg": "onlineHotGroup",
        "extAlg": null,
        "data": {
          "alg": "onlineHotGroup",
          "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
          "threadId": "R_VI_62_DAAF8984D7518DBD26F3712F34E83887",
          "coverUrl": "https://p2.music.126.net/iGE4g4Q0yiFPoPnc1Oxylw==/109951164985727078.jpg",
          "height": 1080,
          "width": 1920,
          "title": "风靡全球神曲《Brother Louie》，难忘经典，前奏响起忍",
          "description": "《Brother Louie》是由音乐组合Modern Talking演唱的一首歌曲，因歌曲动听，曾被多种语言翻唱过，其中《路灯下的小姑娘》版广为流传，这首歌被更多人熟知\n\n",
          "commentCount": 10,
          "shareCount": 18,
          "resolutions": [
            {
              "resolution": 240,
              "size": 8702493
            },
            {
              "resolution": 480,
              "size": 14013358
            },
            {
              "resolution": 720,
              "size": 19657195
            },
            {
              "resolution": 1080,
              "size": 48771753
            }
          ],
          "creator": {
            "defaultAvatar": false,
            "province": 610000,
            "authStatus": 0,
            "followed": false,
            "avatarUrl": "http://p1.music.126.net/4Ikx6yfcd067Z8Kq9Na55w==/109951164505548316.jpg",
            "accountStatus": 0,
            "gender": 0,
            "city": 610500,
            "birthday": -2209017600000,
            "userId": 2053482772,
            "userType": 0,
            "nickname": "小琳听音乐0",
            "signature": "",
            "description": "",
            "detailDescription": "",
            "avatarImgId": 109951164505548320,
            "backgroundImgId": 109951162868126480,
            "backgroundUrl": "http://p1.music.126.net/_f8R60U9mZ42sSNvdPn2sQ==/109951162868126486.jpg",
            "authority": 0,
            "mutual": false,
            "expertTags": null,
            "experts": null,
            "djStatus": 0,
            "vipType": 0,
            "remarkName": null,
            "avatarImgIdStr": "109951164505548316",
            "backgroundImgIdStr": "109951162868126486",
            "avatarImgId_str": "109951164505548316"
          },
          "urlInfo": {
            "id": "DAAF8984D7518DBD26F3712F34E83887",
            "url": "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/AWsacLGT_2999664746_uhd.mp4?ts=1613640306&rid=F3F8B75A5956846B0714E9DF9C08B366&rl=3&rs=kTWurnaYsagpPpmeoHiaGXalbVvSBddW&sign=92a2d0339d18f31cce019e5162f8fc78&ext=rvvN%2FYd8bYrgnprho9xdZnQdLC8w3URqYQV9GV%2BMScNW%2Fg%2BFj%2Ffw4QLVnxFgz7eKRS4g0r0NHyqHYU9bUqKaERCymjw8MunCI41dMUTNCX9uqDlixx0onRJp3gjTvpO3G0Tz%2FmR74nqZR5tTDGN89SAmpOhL%2BnyV82NGfu42PEZWg3jtY1iTOtjMamIIfriFsw1fxyiu8PbIDz5RQkoPGE0%2BIIeNUcXnqlW5Cn%2Fr8OYTIe1Uwrrk8xrQCnzulRWh",
            "size": 48771753,
            "validityTime": 1200,
            "needPay": false,
            "payInfo": null,
            "r": 1080
          },
          "videoGroup": [
            {
              "id": -24896,
              "name": "#精选欧美百首经典老歌#",
              "alg": "groupTagRank"
            },
            {
              "id": 9104,
              "name": "电子",
              "alg": "groupTagRank"
            },
            {
              "id": 4104,
              "name": "电音",
              "alg": "groupTagRank"
            },
            {
              "id": 15241,
              "name": "饭制",
              "alg": "groupTagRank"
            },
            {
              "id": 14212,
              "name": "欧美音乐",
              "alg": "groupTagRank"
            },
            {
              "id": 1105,
              "name": "最佳饭制",
              "alg": "groupTagRank"
            },
            {
              "id": 23116,
              "name": "音乐推荐",
              "alg": "groupTagRank"
            },
            {
              "id": 5100,
              "name": "音乐",
              "alg": "groupTagRank"
            }
          ],
          "previewUrl": null,
          "previewDurationms": 0,
          "hasRelatedGameAd": false,
          "markTypes": null,
          "relateSong": [
            {
              "name": "Brother Louie",
              "id": 4175444,
              "pst": 0,
              "t": 0,
              "ar": [
                {
                  "id": 96282,
                  "name": "Modern Talking",
                  "tns": [],
                  "alias": []
                }
              ],
              "alia": [],
              "pop": 100,
              "st": 0,
              "rt": "600902000002792481",
              "fee": 1,
              "v": 138,
              "crbt": null,
              "cf": "",
              "al": {
                "id": 422171,
                "name": "Das Nr. 1 Album",
                "picUrl": "http://p3.music.126.net/kTWxYtptkDewdIG4QsKnJQ==/109951163442815726.jpg",
                "tns": [],
                "pic_str": "109951163442815726",
                "pic": 109951163442815730
              },
              "dt": 218462,
              "h": {
                "br": 320000,
                "fid": 0,
                "size": 8739570,
                "vd": -39955
              },
              "m": {
                "br": 192000,
                "fid": 0,
                "size": 5243760,
                "vd": -37640
              },
              "l": {
                "br": 128000,
                "fid": 0,
                "size": 3495854,
                "vd": -36730
              },
              "a": null,
              "cd": "1",
              "no": 6,
              "rtUrl": null,
              "ftype": 0,
              "rtUrls": [],
              "djId": 0,
              "copyright": 1,
              "s_id": 0,
              "rtype": 0,
              "rurl": null,
              "mst": 9,
              "cp": 7001,
              "mv": 5307802,
              "publishTime": 1275580800007,
              "privilege": {
                "id": 4175444,
                "fee": 1,
                "payed": 0,
                "st": 0,
                "pl": 0,
                "dl": 0,
                "sp": 0,
                "cp": 0,
                "subp": 0,
                "cs": false,
                "maxbr": 320000,
                "fl": 0,
                "toast": false,
                "flag": 1284,
                "preSell": false
              }
            }
          ],
          "relatedInfo": null,
          "videoUserLiveInfo": null,
          "vid": "DAAF8984D7518DBD26F3712F34E83887",
          "durationms": 103520,
          "playTime": 48881,
          "praisedCount": 87,
          "praised": false,
          "subscribed": false
        }
      },
      {
        "type": 1,
        "displayed": false,
        "alg": "onlineHotGroup",
        "extAlg": null,
        "data": {
          "alg": "onlineHotGroup",
          "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
          "threadId": "R_VI_62_58ABB263CA7E0AB40E88CC11354B3430",
          "coverUrl": "https://p2.music.126.net/ZYR5b6X4BgSFJw_yPqqsaQ==/109951164649022925.jpg",
          "height": 540,
          "width": 960,
          "title": "Alan Walker-Darkside（建议佩戴耳机观看）",
          "description": null,
          "commentCount": 33,
          "shareCount": 126,
          "resolutions": [
            {
              "resolution": 240,
              "size": 32236089
            },
            {
              "resolution": 480,
              "size": 48625571
            }
          ],
          "creator": {
            "defaultAvatar": false,
            "province": 650000,
            "authStatus": 1,
            "followed": false,
            "avatarUrl": "http://p1.music.126.net/NmuPtwcKPV968MD1BtVf8w==/109951164588907091.jpg",
            "accountStatus": 0,
            "gender": 1,
            "city": 653200,
            "birthday": 829065600000,
            "userId": 1447720038,
            "userType": 4,
            "nickname": "DjaGirKeliQ",
            "signature": "BEST UYGHUR MUSIC DjaGirKeliQ MeDyà",
            "description": "",
            "detailDescription": "",
            "avatarImgId": 109951164588907090,
            "backgroundImgId": 109951164007785630,
            "backgroundUrl": "http://p1.music.126.net/sHo9eecY61OwkaIBfNRw0g==/109951164007785630.jpg",
            "authority": 0,
            "mutual": false,
            "expertTags": null,
            "experts": null,
            "djStatus": 10,
            "vipType": 11,
            "remarkName": null,
            "avatarImgIdStr": "109951164588907091",
            "backgroundImgIdStr": "109951164007785630",
            "avatarImgId_str": "109951164588907091"
          },
          "urlInfo": {
            "id": "58ABB263CA7E0AB40E88CC11354B3430",
            "url": "http://vodkgeyttp9.vod.126.net/cloudmusic/HBCgeOtE_2886953592_hd.mp4?ts=1613640306&rid=F3F8B75A5956846B0714E9DF9C08B366&rl=3&rs=glOYlKjQzaFbrBZUBdiqxPcVFWnvhuFC&sign=19b5b7111be1563dc8d5bffbd17e8cc5&ext=rvvN%2FYd8bYrgnprho9xdZnQdLC8w3URqYQV9GV%2BMScNW%2Fg%2BFj%2Ffw4QLVnxFgz7eKRS4g0r0NHyqHYU9bUqKaERCymjw8MunCI41dMUTNCX9uqDlixx0onRJp3gjTvpO3G0Tz%2FmR74nqZR5tTDGN89SAmpOhL%2BnyV82NGfu42PEZWg3jtY1iTOtjMamIIfriFsw1fxyiu8PbIDz5RQkoPGE0%2BIIeNUcXnqlW5Cn%2Fr8OYTIe1Uwrrk8xrQCnzulRWh",
            "size": 48625571,
            "validityTime": 1200,
            "needPay": false,
            "payInfo": null,
            "r": 480
          },
          "videoGroup": [
            {
              "id": -33937,
              "name": "#Alan Walker 36首电音【震撼全场】#",
              "alg": "groupTagRank"
            },
            {
              "id": 15249,
              "name": "Alan Walker",
              "alg": "groupTagRank"
            },
            {
              "id": 9136,
              "name": "艾兰·沃克",
              "alg": "groupTagRank"
            },
            {
              "id": 9104,
              "name": "电子",
              "alg": "groupTagRank"
            },
            {
              "id": 4104,
              "name": "电音",
              "alg": "groupTagRank"
            },
            {
              "id": 1100,
              "name": "音乐现场",
              "alg": "groupTagRank"
            },
            {
              "id": 58100,
              "name": "现场",
              "alg": "groupTagRank"
            },
            {
              "id": 5100,
              "name": "音乐",
              "alg": "groupTagRank"
            }
          ],
          "previewUrl": null,
          "previewDurationms": 0,
          "hasRelatedGameAd": false,
          "markTypes": null,
          "relateSong": [
            {
              "name": "Darkside",
              "id": 1296410418,
              "pst": 0,
              "t": 0,
              "ar": [
                {
                  "id": 1045123,
                  "name": "Alan Walker",
                  "tns": [],
                  "alias": []
                },
                {
                  "id": 12143031,
                  "name": "Au/Ra",
                  "tns": [],
                  "alias": []
                },
                {
                  "id": 12073571,
                  "name": "Tomine Harket",
                  "tns": [],
                  "alias": []
                }
              ],
              "alia": [],
              "pop": 100,
              "st": 0,
              "rt": null,
              "fee": 8,
              "v": 16,
              "crbt": null,
              "cf": "",
              "al": {
                "id": 72006345,
                "name": "Darkside",
                "picUrl": "http://p4.music.126.net/DzkYIKQ_bp-5f88qNvWBkQ==/109951163661799170.jpg",
                "tns": [],
                "pic_str": "109951163661799170",
                "pic": 109951163661799170
              },
              "dt": 211931,
              "h": {
                "br": 320000,
                "fid": 0,
                "size": 8477301,
                "vd": -28100
              },
              "m": {
                "br": 192000,
                "fid": 0,
                "size": 5086398,
                "vd": -25600
              },
              "l": {
                "br": 128000,
                "fid": 0,
                "size": 3390946,
                "vd": -24200
              },
              "a": null,
              "cd": "01",
              "no": 1,
              "rtUrl": null,
              "ftype": 0,
              "rtUrls": [],
              "djId": 0,
              "copyright": 1,
              "s_id": 0,
              "rtype": 0,
              "rurl": null,
              "mst": 9,
              "cp": 7001,
              "mv": 10738268,
              "publishTime": 1532620800000,
              "privilege": {
                "id": 1296410418,
                "fee": 8,
                "payed": 0,
                "st": 0,
                "pl": 128000,
                "dl": 0,
                "sp": 7,
                "cp": 1,
                "subp": 1,
                "cs": false,
                "maxbr": 320000,
                "fl": 128000,
                "toast": false,
                "flag": 260,
                "preSell": false
              }
            }
          ],
          "relatedInfo": null,
          "videoUserLiveInfo": null,
          "vid": "58ABB263CA7E0AB40E88CC11354B3430",
          "durationms": 223538,
          "playTime": 188391,
          "praisedCount": 1022,
          "praised": false,
          "subscribed": false
        }
      },
      {
        "type": 1,
        "displayed": false,
        "alg": "onlineHotGroup",
        "extAlg": null,
        "data": {
          "alg": "onlineHotGroup",
          "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
          "threadId": "R_VI_62_F9650068BC8B42F91E915CD8DB3F6ECE",
          "coverUrl": "https://p2.music.126.net/BemMpHpSjyn_qwGswiCW2g==/109951164002543600.jpg",
          "height": 1080,
          "width": 1920,
          "title": "终于找到火遍全网的“敲敲敲”， 搭配抽烟的硬汉，太嚣张",
          "description": "终于找到火遍全网的“敲敲敲”， 搭配抽烟的硬汉，网友：太嚣张",
          "commentCount": 492,
          "shareCount": 791,
          "resolutions": [
            {
              "resolution": 240,
              "size": 15990154
            },
            {
              "resolution": 480,
              "size": 24536505
            },
            {
              "resolution": 720,
              "size": 33723494
            },
            {
              "resolution": 1080,
              "size": 54380622
            }
          ],
          "creator": {
            "defaultAvatar": false,
            "province": 210000,
            "authStatus": 0,
            "followed": false,
            "avatarUrl": "http://p1.music.126.net/nEkh8k3JFqK54dlHVUwrHA==/109951163910951928.jpg",
            "accountStatus": 0,
            "gender": 2,
            "city": 210200,
            "birthday": -2209017600000,
            "userId": 1771079078,
            "userType": 204,
            "nickname": "下饭音乐music",
            "signature": "邀请你来我的音乐party，抓取全球最in音乐给你",
            "description": "",
            "detailDescription": "",
            "avatarImgId": 109951163910951940,
            "backgroundImgId": 109951162868126480,
            "backgroundUrl": "http://p1.music.126.net/_f8R60U9mZ42sSNvdPn2sQ==/109951162868126486.jpg",
            "authority": 0,
            "mutual": false,
            "expertTags": null,
            "experts": {
              "1": "视频达人"
            },
            "djStatus": 0,
            "vipType": 0,
            "remarkName": null,
            "avatarImgIdStr": "109951163910951928",
            "backgroundImgIdStr": "109951162868126486",
            "avatarImgId_str": "109951163910951928"
          },
          "urlInfo": {
            "id": "F9650068BC8B42F91E915CD8DB3F6ECE",
            "url": "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/Dx9rkIt9_2448853897_uhd.mp4?ts=1613640306&rid=F3F8B75A5956846B0714E9DF9C08B366&rl=3&rs=isihYSjHvsJfBemMoEtZtIpDKNwtiSfZ&sign=c3d3f5051b8c547716a94e29151fc1ce&ext=rvvN%2FYd8bYrgnprho9xdZnQdLC8w3URqYQV9GV%2BMScNW%2Fg%2BFj%2Ffw4QLVnxFgz7eKRS4g0r0NHyqHYU9bUqKaERCymjw8MunCI41dMUTNCX9uqDlixx0onRJp3gjTvpO3G0Tz%2FmR74nqZR5tTDGN89SAmpOhL%2BnyV82NGfu42PEZWg3jtY1iTOtjMamIIfriFsw1fxyiu8PbIDz5RQkoPGE0%2BIIeNUcXnqlW5Cn%2Fr8OYTIe1Uwrrk8xrQCnzulRWh",
            "size": 54380622,
            "validityTime": 1200,
            "needPay": false,
            "payInfo": null,
            "r": 1080
          },
          "videoGroup": [
            {
              "id": 25112,
              "name": "音乐科普",
              "alg": "groupTagRank"
            },
            {
              "id": 9104,
              "name": "电子",
              "alg": "groupTagRank"
            },
            {
              "id": 4104,
              "name": "电音",
              "alg": "groupTagRank"
            },
            {
              "id": 14212,
              "name": "欧美音乐",
              "alg": "groupTagRank"
            },
            {
              "id": 23116,
              "name": "音乐推荐",
              "alg": "groupTagRank"
            },
            {
              "id": 5100,
              "name": "音乐",
              "alg": "groupTagRank"
            }
          ],
          "previewUrl": null,
          "previewDurationms": 0,
          "hasRelatedGameAd": false,
          "markTypes": null,
          "relateSong": [],
          "relatedInfo": null,
          "videoUserLiveInfo": null,
          "vid": "F9650068BC8B42F91E915CD8DB3F6ECE",
          "durationms": 166997,
          "playTime": 3479249,
          "praisedCount": 11334,
          "praised": false,
          "subscribed": false
        }
      },
      {
        "type": 1,
        "displayed": false,
        "alg": "onlineHotGroup",
        "extAlg": null,
        "data": {
          "alg": "onlineHotGroup",
          "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
          "threadId": "R_VI_62_5BA78963FED600CA2D8072CABCDA3ABA",
          "coverUrl": "https://p2.music.126.net/UAOLGcnStTY_LQC9TmvAig==/109951163573086031.jpg",
          "height": 720,
          "width": 1280,
          "title": "嗨爆了！Zedd现场演绎热单《Beautiful Now》",
          "description": "嗨爆了！Zedd现场演绎热单《Beautiful Now》",
          "commentCount": 1205,
          "shareCount": 5506,
          "resolutions": [
            {
              "resolution": 240,
              "size": 29911039
            },
            {
              "resolution": 480,
              "size": 42706989
            },
            {
              "resolution": 720,
              "size": 67965956
            }
          ],
          "creator": {
            "defaultAvatar": false,
            "province": 500000,
            "authStatus": 1,
            "followed": false,
            "avatarUrl": "http://p1.music.126.net/KfJZpZygZF6sjmLY0pR-qQ==/109951163656815709.jpg",
            "accountStatus": 0,
            "gender": 1,
            "city": 500101,
            "birthday": 798048000000,
            "userId": 115390585,
            "userType": 4,
            "nickname": "怪兽Sound",
            "signature": "泥嚎，我是一只热爱电音的怪兽，长期致力于分享优质歌曲，音乐资讯、传播正能量。",
            "description": "",
            "detailDescription": "",
            "avatarImgId": 109951163656815710,
            "backgroundImgId": 18888510254061304,
            "backgroundUrl": "http://p1.music.126.net/qX2PR1Z-PgKFCPkWo-RBuA==/18888510254061305.jpg",
            "authority": 0,
            "mutual": false,
            "expertTags": [
              "电子",
              "流行"
            ],
            "experts": null,
            "djStatus": 10,
            "vipType": 11,
            "remarkName": null,
            "avatarImgIdStr": "109951163656815709",
            "backgroundImgIdStr": "18888510254061305",
            "avatarImgId_str": "109951163656815709"
          },
          "urlInfo": {
            "id": "5BA78963FED600CA2D8072CABCDA3ABA",
            "url": "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/sOmkX1F8_1335389580_shd.mp4?ts=1613640306&rid=F3F8B75A5956846B0714E9DF9C08B366&rl=3&rs=YWgiBDghflPuhtLbcyavOVUZmoPbfplp&sign=743fdb5ab8762774f153036ccb1ff53f&ext=rvvN%2FYd8bYrgnprho9xdZnQdLC8w3URqYQV9GV%2BMScNW%2Fg%2BFj%2Ffw4QLVnxFgz7eKRS4g0r0NHyqHYU9bUqKaERCymjw8MunCI41dMUTNCX9uqDlixx0onRJp3gjTvpO3G0Tz%2FmR74nqZR5tTDGN89SAmpOhL%2BnyV82NGfu42PEZWg3jtY1iTOtjMamIIfriFsw1fxyiu8PbIDz5RQkoPGE0%2BIIeNUcXnqlW5Cn%2Fr8Oaekov%2B8plSRt4nkBV1ZomL",
            "size": 67965956,
            "validityTime": 1200,
            "needPay": false,
            "payInfo": null,
            "r": 720
          },
          "videoGroup": [
            {
              "id": -8010,
              "name": "#999+评论#",
              "alg": "groupTagRank"
            },
            {
              "id": 25130,
              "name": "Zedd",
              "alg": "groupTagRank"
            },
            {
              "id": 13172,
              "name": "欧美",
              "alg": "groupTagRank"
            },
            {
              "id": 14146,
              "name": "兴奋",
              "alg": "groupTagRank"
            },
            {
              "id": 9104,
              "name": "电子",
              "alg": "groupTagRank"
            },
            {
              "id": 13164,
              "name": "快乐",
              "alg": "groupTagRank"
            },
            {
              "id": 4104,
              "name": "电音",
              "alg": "groupTagRank"
            },
            {
              "id": 57106,
              "name": "欧美现场",
              "alg": "groupTagRank"
            },
            {
              "id": 4103,
              "name": "演奏",
              "alg": "groupTagRank"
            },
            {
              "id": 1100,
              "name": "音乐现场",
              "alg": "groupTagRank"
            },
            {
              "id": 58100,
              "name": "现场",
              "alg": "groupTagRank"
            },
            {
              "id": 5100,
              "name": "音乐",
              "alg": "groupTagRank"
            }
          ],
          "previewUrl": null,
          "previewDurationms": 0,
          "hasRelatedGameAd": false,
          "markTypes": null,
          "relateSong": [
            {
              "name": "Beautiful Now",
              "id": 32019002,
              "pst": 0,
              "t": 0,
              "ar": [
                {
                  "id": 46376,
                  "name": "Zedd",
                  "tns": [],
                  "alias": []
                },
                {
                  "id": 860113,
                  "name": "Jon Bellion",
                  "tns": [],
                  "alias": []
                }
              ],
              "alia": [],
              "pop": 100,
              "st": 0,
              "rt": null,
              "fee": 1,
              "v": 115,
              "crbt": null,
              "cf": "",
              "al": {
                "id": 3119381,
                "name": "True Colors",
                "picUrl": "http://p3.music.126.net/ze_ggtReuHBLF2o-wUolFw==/109951163221161145.jpg",
                "tns": [],
                "pic_str": "109951163221161145",
                "pic": 109951163221161150
              },
              "dt": 218293,
              "h": {
                "br": 320000,
                "fid": 0,
                "size": 8734346,
                "vd": -26099
              },
              "m": {
                "br": 192000,
                "fid": 0,
                "size": 5240625,
                "vd": -23599
              },
              "l": {
                "br": 128000,
                "fid": 0,
                "size": 3493764,
                "vd": -22300
              },
              "a": null,
              "cd": "1",
              "no": 3,
              "rtUrl": null,
              "ftype": 0,
              "rtUrls": [],
              "djId": 0,
              "copyright": 2,
              "s_id": 0,
              "rtype": 0,
              "rurl": null,
              "mst": 9,
              "cp": 7003,
              "mv": 420471,
              "publishTime": 1431964800007,
              "privilege": {
                "id": 32019002,
                "fee": 1,
                "payed": 0,
                "st": 0,
                "pl": 0,
                "dl": 0,
                "sp": 0,
                "cp": 0,
                "subp": 0,
                "cs": false,
                "maxbr": 999000,
                "fl": 0,
                "toast": false,
                "flag": 1028,
                "preSell": false
              }
            }
          ],
          "relatedInfo": null,
          "videoUserLiveInfo": null,
          "vid": "5BA78963FED600CA2D8072CABCDA3ABA",
          "durationms": 251100,
          "playTime": 2969535,
          "praisedCount": 19614,
          "praised": false,
          "subscribed": false
        }
      },
      {
        "type": 1,
        "displayed": false,
        "alg": "onlineHotGroup",
        "extAlg": null,
        "data": {
          "alg": "onlineHotGroup",
          "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
          "threadId": "R_VI_62_1725506C033B197626FEABE17716D76A",
          "coverUrl": "https://p2.music.126.net/tLU3e8wUrRs4afsm3TejeA==/109951163573715297.jpg",
          "height": 720,
          "width": 1280,
          "title": "HipHop现场究竟有多燥？Pt.3( Travis Scott, A$AP Rock）",
          "description": "HipHop现场究竟有多燥？Pt.3 ( Travis Scott, A$AP Rocky, XXXTentacion, Kanye West...) ",
          "commentCount": 48,
          "shareCount": 71,
          "resolutions": [
            {
              "resolution": 240,
              "size": 151894649
            },
            {
              "resolution": 480,
              "size": 243445776
            },
            {
              "resolution": 720,
              "size": 263639922
            }
          ],
          "creator": {
            "defaultAvatar": false,
            "province": 110000,
            "authStatus": 1,
            "followed": false,
            "avatarUrl": "http://p1.music.126.net/gOs7yWD8uU53OkoeNJZUOg==/18619129906643177.jpg",
            "accountStatus": 0,
            "gender": 1,
            "city": 110101,
            "birthday": 716745600000,
            "userId": 115025640,
            "userType": 4,
            "nickname": "营养怪兽",
            "signature": "微博@营养怪兽 本人就是我",
            "description": "",
            "detailDescription": "",
            "avatarImgId": 18619129906643176,
            "backgroundImgId": 109951162868126480,
            "backgroundUrl": "http://p1.music.126.net/_f8R60U9mZ42sSNvdPn2sQ==/109951162868126486.jpg",
            "authority": 0,
            "mutual": false,
            "expertTags": null,
            "experts": null,
            "djStatus": 10,
            "vipType": 11,
            "remarkName": null,
            "avatarImgIdStr": "18619129906643177",
            "backgroundImgIdStr": "109951162868126486",
            "avatarImgId_str": "18619129906643177"
          },
          "urlInfo": {
            "id": "1725506C033B197626FEABE17716D76A",
            "url": "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/CECg6GPQ_1675667913_shd.mp4?ts=1613640306&rid=F3F8B75A5956846B0714E9DF9C08B366&rl=3&rs=fzFZJNdcJyJjIZOWIZFXvmILqtqLJcju&sign=564f807d4c2159313f3ce6740f284b62&ext=rvvN%2FYd8bYrgnprho9xdZnQdLC8w3URqYQV9GV%2BMScNW%2Fg%2BFj%2Ffw4QLVnxFgz7eKRS4g0r0NHyqHYU9bUqKaERCymjw8MunCI41dMUTNCX9uqDlixx0onRJp3gjTvpO3G0Tz%2FmR74nqZR5tTDGN89SAmpOhL%2BnyV82NGfu42PEZWg3jtY1iTOtjMamIIfriFsw1fxyiu8PbIDz5RQkoPGE0%2BIIeNUcXnqlW5Cn%2Fr8OYTIe1Uwrrk8xrQCnzulRWh",
            "size": 263639922,
            "validityTime": 1200,
            "needPay": false,
            "payInfo": null,
            "r": 720
          },
          "videoGroup": [
            {
              "id": 9104,
              "name": "电子",
              "alg": "groupTagRank"
            },
            {
              "id": 76106,
              "name": "饭制混剪",
              "alg": "groupTagRank"
            },
            {
              "id": 4104,
              "name": "电音",
              "alg": "groupTagRank"
            },
            {
              "id": 3107,
              "name": "混剪",
              "alg": "groupTagRank"
            },
            {
              "id": 57106,
              "name": "欧美现场",
              "alg": "groupTagRank"
            },
            {
              "id": 14212,
              "name": "欧美音乐",
              "alg": "groupTagRank"
            },
            {
              "id": 1105,
              "name": "最佳饭制",
              "alg": "groupTagRank"
            },
            {
              "id": 23116,
              "name": "音乐推荐",
              "alg": "groupTagRank"
            },
            {
              "id": 1100,
              "name": "音乐现场",
              "alg": "groupTagRank"
            },
            {
              "id": 58100,
              "name": "现场",
              "alg": "groupTagRank"
            },
            {
              "id": 5100,
              "name": "音乐",
              "alg": "groupTagRank"
            }
          ],
          "previewUrl": null,
          "previewDurationms": 0,
          "hasRelatedGameAd": false,
          "markTypes": null,
          "relateSong": [],
          "relatedInfo": null,
          "videoUserLiveInfo": null,
          "vid": "1725506C033B197626FEABE17716D76A",
          "durationms": 696018,
          "playTime": 48263,
          "praisedCount": 298,
          "praised": false,
          "subscribed": false
        }
      },
      {
        "type": 1,
        "displayed": false,
        "alg": "onlineHotGroup",
        "extAlg": null,
        "data": {
          "alg": "onlineHotGroup",
          "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
          "threadId": "R_VI_62_FCF198F49AFE778C57C3BC3F7C847373",
          "coverUrl": "https://p2.music.126.net/ZHz-kcQs2H91XKfa5eBvFQ==/109951165136357820.jpg",
          "height": 360,
          "width": 640,
          "title": "最近汤老师专属BGM火了！走路时千万别听，实在太嚣张了",
          "description": "最近这首汤老师专属BGM火了！走路时千万别听，实在太嚣张了!",
          "commentCount": 19,
          "shareCount": 20,
          "resolutions": [
            {
              "resolution": 1080,
              "size": 95209336
            },
            {
              "resolution": 720,
              "size": 43557746
            },
            {
              "resolution": 480,
              "size": 31403185
            },
            {
              "resolution": 240,
              "size": 20311450
            }
          ],
          "creator": {
            "defaultAvatar": false,
            "province": 360000,
            "authStatus": 0,
            "followed": false,
            "avatarUrl": "http://p1.music.126.net/GT6kFliD6ic21Kp8Q32v_A==/109951164035108369.jpg",
            "accountStatus": 0,
            "gender": 2,
            "city": 360700,
            "birthday": 889459200000,
            "userId": 1354661185,
            "userType": 204,
            "nickname": "八神音乐",
            "signature": "最有趣的音乐都在这里",
            "description": "",
            "detailDescription": "",
            "avatarImgId": 109951164035108370,
            "backgroundImgId": 109951162868128400,
            "backgroundUrl": "http://p1.music.126.net/2zSNIqTcpHL2jIvU6hG0EA==/109951162868128395.jpg",
            "authority": 0,
            "mutual": false,
            "expertTags": null,
            "experts": {
              "1": "音乐视频达人"
            },
            "djStatus": 0,
            "vipType": 11,
            "remarkName": null,
            "avatarImgIdStr": "109951164035108369",
            "backgroundImgIdStr": "109951162868128395",
            "avatarImgId_str": "109951164035108369"
          },
          "urlInfo": {
            "id": "FCF198F49AFE778C57C3BC3F7C847373",
            "url": "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/NqKtp5Sn_3057152191_uhd.mp4?ts=1613640306&rid=F3F8B75A5956846B0714E9DF9C08B366&rl=3&rs=HXVaexsADfKGJaFkIBdNrsRduPPVUUWJ&sign=a202b3032675d5fc3ac2881945ba5443&ext=rvvN%2FYd8bYrgnprho9xdZnQdLC8w3URqYQV9GV%2BMScNW%2Fg%2BFj%2Ffw4QLVnxFgz7eKRS4g0r0NHyqHYU9bUqKaERCymjw8MunCI41dMUTNCX9uqDlixx0onRJp3gjTvpO3G0Tz%2FmR74nqZR5tTDGN89SAmpOhL%2BnyV82NGfu42PEZWg3jtY1iTOtjMamIIfriFsw1fxyiu8PbIDz5RQkoPGE0%2BIIeNUcXnqlW5Cn%2Fr8OYTIe1Uwrrk8xrQCnzulRWh",
            "size": 95209336,
            "validityTime": 1200,
            "needPay": false,
            "payInfo": null,
            "r": 1080
          },
          "videoGroup": [
            {
              "id": 9104,
              "name": "电子",
              "alg": "groupTagRank"
            },
            {
              "id": 4104,
              "name": "电音",
              "alg": "groupTagRank"
            },
            {
              "id": 14212,
              "name": "欧美音乐",
              "alg": "groupTagRank"
            },
            {
              "id": 23116,
              "name": "音乐推荐",
              "alg": "groupTagRank"
            },
            {
              "id": 5100,
              "name": "音乐",
              "alg": "groupTagRank"
            }
          ],
          "previewUrl": null,
          "previewDurationms": 0,
          "hasRelatedGameAd": false,
          "markTypes": null,
          "relateSong": [],
          "relatedInfo": null,
          "videoUserLiveInfo": null,
          "vid": "FCF198F49AFE778C57C3BC3F7C847373",
          "durationms": 210347,
          "playTime": 108359,
          "praisedCount": 1018,
          "praised": false,
          "subscribed": false
        }
      },
      {
        "type": 1,
        "displayed": false,
        "alg": "onlineHotGroup",
        "extAlg": null,
        "data": {
          "alg": "onlineHotGroup",
          "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
          "threadId": "R_VI_62_B05744868CF4E957100DB5927260DBDA",
          "coverUrl": "https://p2.music.126.net/R291_TSUjjaEp5C6N68Fyw==/109951163573039422.jpg",
          "height": 720,
          "width": 1280,
          "title": "Something Just Like This",
          "description": "Something Just Like This - The Chainsmokers & Coldplay (Cover by Alexander Stewart)",
          "commentCount": 222,
          "shareCount": 360,
          "resolutions": [
            {
              "resolution": 240,
              "size": 17492236
            },
            {
              "resolution": 480,
              "size": 24954468
            },
            {
              "resolution": 720,
              "size": 39792676
            }
          ],
          "creator": {
            "defaultAvatar": false,
            "province": 360000,
            "authStatus": 0,
            "followed": false,
            "avatarUrl": "http://p1.music.126.net/D6TFB3AfQR3h5fa7MVViOQ==/109951162939894286.jpg",
            "accountStatus": 0,
            "gender": 2,
            "city": 361100,
            "birthday": 811785600000,
            "userId": 27193291,
            "userType": 0,
            "nickname": "木来LilSivan",
            "signature": "",
            "description": "",
            "detailDescription": "",
            "avatarImgId": 109951162939894290,
            "backgroundImgId": 109951162928998740,
            "backgroundUrl": "http://p1.music.126.net/fABaaZKH_h2biMgUhXMHsQ==/109951162928998743.jpg",
            "authority": 0,
            "mutual": false,
            "expertTags": null,
            "experts": null,
            "djStatus": 10,
            "vipType": 0,
            "remarkName": null,
            "avatarImgIdStr": "109951162939894286",
            "backgroundImgIdStr": "109951162928998743",
            "avatarImgId_str": "109951162939894286"
          },
          "urlInfo": {
            "id": "B05744868CF4E957100DB5927260DBDA",
            "url": "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/vowJn7gX_1314326605_shd.mp4?ts=1613640306&rid=F3F8B75A5956846B0714E9DF9C08B366&rl=3&rs=bthIdpTKCfitiKNkmZSLBKMDRyvlcPlg&sign=efd72cceea03bf2664c1155538aef22c&ext=rvvN%2FYd8bYrgnprho9xdZnQdLC8w3URqYQV9GV%2BMScNW%2Fg%2BFj%2Ffw4QLVnxFgz7eKRS4g0r0NHyqHYU9bUqKaERCymjw8MunCI41dMUTNCX9uqDlixx0onRJp3gjTvpO3G0Tz%2FmR74nqZR5tTDGN89SAmpOhL%2BnyV82NGfu42PEZWg3jtY1iTOtjMamIIfriFsw1fxyiu8PbIDz5RQkoPGE0%2BIIeNUcXnqlW5Cn%2Fr8OYTIe1Uwrrk8xrQCnzulRWh",
            "size": 39792676,
            "validityTime": 1200,
            "needPay": false,
            "payInfo": null,
            "r": 720
          },
          "videoGroup": [
            {
              "id": -17225,
              "name": "#【健身运动】必备单曲#",
              "alg": "groupTagRank"
            },
            {
              "id": 13251,
              "name": "The Chainsmokers",
              "alg": "groupTagRank"
            },
            {
              "id": 58109,
              "name": "国外达人",
              "alg": "groupTagRank"
            },
            {
              "id": 57112,
              "name": "英文翻唱",
              "alg": "groupTagRank"
            },
            {
              "id": 9104,
              "name": "电子",
              "alg": "groupTagRank"
            },
            {
              "id": 4104,
              "name": "电音",
              "alg": "groupTagRank"
            },
            {
              "id": 60100,
              "name": "翻唱",
              "alg": "groupTagRank"
            },
            {
              "id": 12100,
              "name": "流行",
              "alg": "groupTagRank"
            },
            {
              "id": 5100,
              "name": "音乐",
              "alg": "groupTagRank"
            }
          ],
          "previewUrl": null,
          "previewDurationms": 0,
          "hasRelatedGameAd": false,
          "markTypes": null,
          "relateSong": [
            {
              "name": "Something Just Like This",
              "id": 461347998,
              "pst": 0,
              "t": 0,
              "ar": [
                {
                  "id": 893484,
                  "name": "The Chainsmokers",
                  "tns": [],
                  "alias": []
                },
                {
                  "id": 89365,
                  "name": "Coldplay",
                  "tns": [],
                  "alias": []
                }
              ],
              "alia": [],
              "pop": 100,
              "st": 0,
              "rt": null,
              "fee": 8,
              "v": 99,
              "crbt": null,
              "cf": "",
              "al": {
                "id": 35196287,
                "name": "Something Just Like This",
                "picUrl": "http://p4.music.126.net/ggnyubDdMxrhpqYvpZbhEQ==/3302932937412681.jpg",
                "tns": [],
                "pic": 3302932937412681
              },
              "dt": 247626,
              "h": {
                "br": 320000,
                "fid": 0,
                "size": 9907766,
                "vd": -22100
              },
              "m": {
                "br": 192000,
                "fid": 0,
                "size": 5944677,
                "vd": -19600
              },
              "l": {
                "br": 128000,
                "fid": 0,
                "size": 3963133,
                "vd": -18200
              },
              "a": null,
              "cd": "1",
              "no": 1,
              "rtUrl": null,
              "ftype": 0,
              "rtUrls": [],
              "djId": 0,
              "copyright": 1,
              "s_id": 0,
              "rtype": 0,
              "rurl": null,
              "mst": 9,
              "cp": 7001,
              "mv": 5449021,
              "publishTime": 1487952000000,
              "privilege": {
                "id": 461347998,
                "fee": 8,
                "payed": 0,
                "st": 0,
                "pl": 128000,
                "dl": 0,
                "sp": 7,
                "cp": 1,
                "subp": 1,
                "cs": false,
                "maxbr": 999000,
                "fl": 128000,
                "toast": false,
                "flag": 260,
                "preSell": false
              }
            }
          ],
          "relatedInfo": null,
          "videoUserLiveInfo": null,
          "vid": "B05744868CF4E957100DB5927260DBDA",
          "durationms": 153785,
          "playTime": 584995,
          "praisedCount": 3627,
          "praised": false,
          "subscribed": false
        }
      }
    ]
    const { videoList } = this.data
    //将视频最新的数据更新到原有的视频列表中
    videoList.push(...datas)
    this.setData({
      videoList
    })

  },
  //跳转到搜索页面
  handleToSearch() {
    wx.navigateTo({
      url: '/pages/search/search'
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
    console.log("下拉刷新");
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function ({ from }) {
    if (from === "button") {
      return {  //自定义分享的内容
        title: '自定义的来自button转发',
        path: '/pages/video/video',
        imageUrl: '/static/images/nvsheng.jpg'
      }
    } else {
      return {  //自定义分享的内容
        title: 'menu的转发',
        path: '/pages/video/video',
        imageUrl: '/static/images/nvsheng.jpg'
      }
    }
  }
})