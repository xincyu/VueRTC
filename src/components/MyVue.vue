<template>
  <div class="app-container">
    <div class="join-from">
      <div  class="head-btn">
        <el-button type="primary"  @click="goBack">首页</el-button>
        <p  >{{deviceType}} 在线</p>
      </div>
      <!-- User Form -->
      <div  class="user-form">
        <el-input placeholder="请输入您的通话昵称" v-model="user.userName">
          <template slot="prepend">昵 称</template>
        </el-input>
        <el-button type="primary"  @click="startConn">创建并登入</el-button>
      </div>
      <!-- room form -->
      <el-form :model="user">
        <el-form-item label="">
          <el-input placeholder="您要加入的房间号" v-model="user.roomName">
            <template slot="prepend">房间号</template>
          </el-input>
        </el-form-item>
        <div>
          <el-radio v-model="shareMode" label="video" border>视频通话</el-radio>
          <el-radio v-model="shareMode" label="screen" border>屏幕分享</el-radio>
        </div>
      </el-form>
      <el-button v-show="!login.joinRoom" type="primary" @click="joinRoom" >加入房间</el-button>
      <el-button v-show="login.joinRoom" type="danger" @click="hangUp" >挂断并退出</el-button>
    </div>
    <!-- video-Container  -->
    <div  class="videoContainer">
      <div class="video-box"  v-for="(item,index) in mediaList" :key="`videoBox_${index}`">
        <video :id="item.mediaStreamId" class="video-play" autoplay controls></video>
        <div class="video-title">
          <p  class="title-name">{{item.userName}}</p>
          <p class="title-device">{{item.userInfo.deviceType}} 在线</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// import { QueryPatientByNo } from '@/api/caseManageAPI'
import { _isMobile, checkDeviceType } from '../utils'
export default {
  name: 'Myvue',
  data () {
    return {
      loading: false,
      ws: null,
      user: {
        userName: '',
        roomName: ''
      },
      login: {joinRoom: false},
      // 创建视频offer 配置
      offerOptions: {
        offerToReceiveVideo: 1, // true
        offerToReceiveAudio: 1 // true
      },
      agreement: location.protocol === 'http:' ? 'ws://' : 'wss://',
      server: {hostname: '10.10.0.237', wsPort: 8104, host: '10.10.0.237:8104'},
      wsPort: 8104,
      deviceType: null,
      userInfo: {deviceType: null, online: true},
      shareMode: 'video',
      config: {},
      pcList: [], // 保存RTCPeer连接对象表
      localStream: null, // 本地视频流
      mediaList: [] // 保存当前已建立视频连接
      // {userName: 'minsky', mediaStreamId: 123, userInfo: {deviceType: 'iphone'}}
    }
  },
  created () {
    this.initData()
  },
  mounted () {
  },
  methods: {
    /** 初始化数据 */
    initData () {
      // this.deviceType = _isMobile() ? 'mobile' : 'pc'
      this.deviceType = checkDeviceType()
      this.userInfo.deviceType = this.deviceType
      console.log('navigator.userAgent:', _isMobile(), typeof (_isMobile()))
      this.config = {
        iceServers:
        [ // Information about ICE servers - Use your own!
          {
            urls: 'turn:' + this.server.host, // A TURN server：location.host
            username: 'webrtc',
            credential: 'turnserver' // 【RTCPeerConnection 最终包含了 Turn-RTC服务器配置，SDP配置描述 等等】
          }
        ]
      }
    },
    /** 开启连接 */
    startConn () {
      // var ws = new WebSocket(this.agreement + location.hostname + ':' + this.wsPort) // 【由ExPre启动的web服务，会自动注入 location.host 端口号，前端直接使用即可】
      var ws = new WebSocket(this.agreement + this.server.hostname + ':' + this.server.wsPort) // 【由ExPre启动的web服务，会自动注入 location.host 端口号，前端直接使用即可】
      this.ws = ws // WebSocket 对象实例，方便后续使用
      // ws未连接成功 执行哪个？
      ws.onopen = (evt) => {
        console.log('connent WebSocket is ok', this.agreement + this.server.hostname + ':' + this.server.wsPort)// 【连接已建立】
        alert('connent WebSocket is ok', this.agreement + this.server.hostname + ':' + this.server.wsPort)
        const sendJson = JSON.stringify({
          type: 'conn',
          userName: this.user.userName
        })
        ws.send(sendJson) // 注册用户名
      }
      ws.onmessage = (msg) => { // 收到信令服务器返回的消息
        const str = msg.data.toString()
        const json = JSON.parse(str)
        switch (json.type) {
          case 'conn':
            console.log('用户登录成功：', json.userName)
            // userName.disabled = true
            // startConn.disabled = true
            // roomName.disabled = false
            // joinRoom.disabled = false
            // hangUp.disabled = false
            break
          case 'room':
            // 返回房间内所有用户
            this.sendRoomUser(json.roomUserList, 0) // roomUserList[] 为服务器返回的指定房间userName列表
            break
          case 'signalOffer':
            // 收到信令 Offer
            console.log('ws received signalOffer')
            this.signalOffer(json)
            break
          case 'signalAnswer':
            // 收到信令 Answer
            console.log('ws received signalAnswer')
            this.signalAnswer(json)
            break
          case 'iceOffer':
            // 收到iceOffer
            this.addIceCandidates(json)
            break
          case 'close':
            // 收到房间内用户离开
            this.closeRoomUser(json)
            break
          default:
            break
        }
      }
    },

    /** 加入或创建房间 */
    joinRoom  () {
      const userConstraints = {
        audio: {
          noiseSuppression: true,
          echoCancellation: true
        },
        video: {
          width: 1920,
          height: 1080,
          frameRate: 30,
          facingMode: 'user', // { exact: "environment" }
          aspectRatio: {
            ideal: 1.333333 // 3:2 aspect is preferred
          }
        }
      }
      // 调取屏幕
      // const displayConstraints = {
      //   audio: true,
      //   video: {
      //     mandatory: {
      //       chromeMediaSource: 'desktop'
      //     }
      //   }
      // }
      const medias = this.shareMode === 'video'
        ? navigator.mediaDevices.getUserMedia(userConstraints)
        : navigator.mediaDevices.getDisplayMedia(userConstraints)

      medias
        .then((mediastream) => { // 执行回调函数；getUserMedia（videoConstraints，successCallBack(Stream),errorCallBack）,.then+catch形式执行回调函数
          this.localStream = mediastream // 本地视频流
          console.log('开始添加本地視頻')
          this.addUserItem(this.user.userName, this.userInfo, this.localStream.id, this.localStream)
          // 发送房间信息
          const str = JSON.stringify({
            type: 'room',
            roomName: this.user.roomName,
            streamId: this.localStream.id
          })
          this.ws.send(str) // 【发送房间号】
          this.login.joinRoom = true
        })
        .catch((err) => {
          // alert('拉取视频流出现错误')
          console.error('Error: ' + err)
          // console.log('拉取视频流失败', '错误信息:', JSON.stringify(err))
        })
    },

    /** 处理ws房间消息：为（房间内）每个用户创建 RTCPeerConnection */
    sendRoomUser (list, index) {
      console.log('返回房间用户：', list[index])
      this.createWebRTC(list[index], true) // 为每个用户创建 RTCPeer连接对象（后期为连接对象注入相关信息）
      index++
      if (list.length > index) {
        this.sendRoomUser(list, index)
      }
    },

    /** 创建 RTCPeer连接对象 */
    createWebRTC (userName, isOffer) {
      console.log('start createWebRTC(C-RTC) ...')
      const pc = new RTCPeerConnection(this.config) // 创建 RTC 连接对象
      this.pcList.push({ userName, pc }) // AAA 每个用户数组（用户名，RTC连接对象）
      this.localStream.getTracks().forEach((track) => pc.addTrack(track, this.localStream)) // 添加本地视频流到 每一条RTCPeer连接对象
      console.log('C-RTC pcList push end  ...')
      // ---此时仅为组内成员创建了RTC连接，分发了组内的名字---
      // 创建 视频邀请
      if (isOffer) {
        // 与目标建立的RTCpeer连接 --1.创建offer邀请；2.连接设置本地描述；3.向目标userName发送 signalOffer 消息
        pc.createOffer(this.offerOptions).then((offer) => {
          pc.setLocalDescription(offer) // 设置本地 Offer 描述，这里返回参数Offer包含本地连接信息（设置描述之后会触发ice事件）
          const str = JSON.stringify({
            type: 'signalOffer',
            offer,
            userName,
            userInfo: this.userInfo
          }) // BBB 可添加自身其他信息如设备和在线状态
          console.log('C-RTC this.ws is ：', this.ws)
          this.ws.send(str) // 发送 Offer 请求信令。服务端返回同类消息
          console.log('C-RTC signalOffer send over ...')
        })
        // 监听 ice
        pc.addEventListener('icecandidate', (event) => {
          const iceCandidate = event.candidate
          if (iceCandidate) {
            // 发送 iceOffer 请求
            const str = JSON.stringify({
              type: 'iceOffer',
              iceCandidate,
              userName
            })
            this.ws.send(str)
            console.log('C-RTC iceOffer send over ...')
          }
        })
      }
      return pc
    },

    /** 作为回答方：处理邀请信号。接收 Offer 请求信令 */
    signalOffer (json) {
      console.log('start signalOffer ...')
      const { offer, sourceName, sourceInfo, streamId } = json // 发送该请求的源信息
      this.addUserItem(sourceName, sourceInfo, streamId) // 前端添加用户资源；AAA 创建<video>并添加id属性值（为接受到的offer信息msg中的生成的streamId）
      const pc = this.createWebRTC(sourceName) // 为远端创建RTCPeer连接，并设置本地信号（这里的远端本地是相对自身的）
      pc.setRemoteDescription(new RTCSessionDescription(offer)) // 设置远端描述
      console.log(' signalOffer: setRemoteDescription over ...')
      // 创建 Answer 请求
      pc.createAnswer().then((answer) => {
        console.log(' signalOffer: createAnswer over ...')
        pc.setLocalDescription(answer) // 设置本地 Answer 描述
        const str = JSON.stringify({
          type: 'signalAnswer',
          answer, // 回答本地描述信息
          userName: sourceName, // 返回来建立连接的目标用户
          userInfo: this.userInfo
        }) // BBB 可添加自身其他信息如设备和在线状态 userInfo={deviceType:this.deviceType,online:true} ;服务器转发为：sourceInfo
        this.ws.send(str) // 发送 Answer 请求信令
        console.log(' signalOffer: send createAnswer over ...')
      })

      // 监听远端视频流
      pc.addEventListener('addstream', (event) => {
        document.getElementById(event.stream.id).srcObject = event.stream // AAA 获取 event.stream.id，播放远端视频流
      })

      // 监听 ice
      pc.addEventListener('icecandidate', (event) => {
        const iceCandidate = event.candidate
        if (iceCandidate) {
          // 发送 iceOffer 请求
          const str = JSON.stringify({
            type: 'iceOffer',
            iceCandidate,
            userName: sourceName
          })
          this.ws.send(str) // 向目标用户发送 iceOffer，并且【用目标userName的ws连接发送源ws的信息(ICE)】
        }
      })
    },

    /** 作为本地：本地接收 Answer回答方 请求信令 */
    signalAnswer (json) {
      console.log('start signalAnswer  ...')
      const { answer, sourceName, sourceInfo, streamId } = json // 发送该请求的源信息
      this.addUserItem(sourceName, sourceInfo, streamId) // 前端添加用户资源
      const item = this.pcList.find((i) => i.userName === sourceName) // 找到回答方的RTCPeer连接对象
      if (item) {
        const { pc } = item // 这里PC 是回答方（远端）item ：{userName,pc}
        pc.setRemoteDescription(new RTCSessionDescription(answer)) // 设置回答方 RTCPeer连接对象 远端描述
        // 监听远端视频流
        pc.addEventListener('addstream', (event) => { // 设置回答方<video> 的流媒体资源
          document.getElementById(event.stream.id).srcObject = event.stream
        })
        console.log('signalAnswer: setting SDP over  ...')
      }
    },

    /** 为对应用户的RTCPeer连接（PC）添加 ICE连接方式  */
    addIceCandidates (json) {
      const { iceCandidate, sourceName } = json // 为“来消息方” 添加 RTCPeer PC连接ICE方式
      const item = this.pcList.find((i) => i.userName === sourceName)
      if (item) {
        const { pc } = item
        pc.addIceCandidate(new RTCIceCandidate(iceCandidate))
        console.log('add IceCandidate over!')
      }
    },

    /** 添加用户-【添加用户后创建DIV+video元素，生成用户视频窗口】 */
    addUserItem (userName, userInfo, mediaStreamId, src) {
      const media = {userName: userName, userInfo: userInfo, mediaStreamId: mediaStreamId}
      this.mediaList.push(media) // 压入对象注意
      console.log('已添加新用户，当前视频用户列表', JSON.stringify(this.mediaList))
      // nextTick：等待video元素渲染后，再获取其元素ID
      this.$nextTick(() => {
        const exVideo = document.getElementById(mediaStreamId)
        exVideo.muted = true // 关闭本地视频的音频
        src && (exVideo.srcObject = src) // 方法2：vue 的$refs 方法 this.$refs.videoitem_1.srcObject = src
      })
    },

    /** 房间内用户离开 */
    closeRoomUser (json) {
      const { sourceName, streamId } = json
      const index = this.pcList.findIndex((i) => i.userName === sourceName)
      if (index > -1) {
        this.pcList.splice(index, 1)
      }
      // 移除该用户视频框
      this.removeUserItem(sourceName, streamId)
    },

    /** 移除用户 */
    // 清除前端用户视频流,这里是直接清除视频框；可考虑改变 该视频用户的状态，如：item.online = false,离线
    removeUserItem (sourceName, streamId) {
      // 方法一：直接清除
      const index = this.mediaList.findIndex((i) => i.userName === sourceName)
      if (index > -1) {
        this.mediaList.splice(index, 1)
      }
      // 方法二：改状态
      // const item = this.pcList.find((i) => i.userName === sourceName)
      // if (item) {
      //   item.online = false
      // }
    },

    /** 挂断 */
    hangUp () {
      // 禁用按键
      this.login.joinRoom = false
      // userName.disabled = false
      // startConn.disabled = false
      // roomName.disabled = true
      // joinRoom.disabled = true
      // hangUp.disabled = true
      // 停止本地流的生成
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => track.stop())
        this.localStream = null
      }
      // 关闭所有 RTCPeer连接对象
      this.pcList.forEach((element) => {
        element.pc.close()
        element.pc = null
      })
      this.pcList.length = 0
      // 断开ws连接（相当于退出房间了）
      if (this.ws) {
        this.ws.close() // ws发送断开信息，ws处理close信息
        this.ws = null
      }
      // 清除前端所有视频框;
      this.mediaList = [] // 最好赋值空数组，而非长度置0，否则导致渲染延迟问题
      // videoContainer.innerHTML = ''
      console.log('hangUp!')
    },

    goBack () {
      // this.$emit('returnMainApp')
      this.$router.push(
        { path: '/'
        })
    }

  }

}
</script>
<style lang="scss" scoped>

.videoContainer{
  margin-top: 20px;
  border: 1px solid #c5c5c5;
  min-height: 661px;
    display: flex;
    flex-wrap: wrap;  // 弹性换行
    justify-content: center;
  .video-box{
    border: 1px solid #c5c5c5;
    min-height: 100px;
    height: 324px;
    width: 22%;
    // padding: 10px 10px;
    margin: 10px 10px;
    .video-title{
      position: relative;
      .title-name{
        margin: 0;
        font-size: 1.15rem;
        font-weight: bold;
      }
      .title-device{
        margin: 0;
        position: absolute;
        right: 0;
        top: 0;
        font-size: 12px;
        background: #81fbd4;
        color: #037128;
        padding: 0 9px;
      }
    }
    .video-play{
      width:100%;
      height: 90%;
      object-fit: fill;
    }
  }
}

@media screen and (max-width: 766px) {
  // screen pixel lower max-width css
  .videoContainer{
    margin-top: 20px;
    border: 1px solid #c5c5c5;
    min-height: 661px;
      display: flex;
      flex-wrap: wrap;  // 弹性换行
      justify-content: center;
    .video-box{
      border: 1px solid #c5c5c5;
      min-height: 100px;
      height: 324px;
      width: 89%;
      margin: 10px 10px;
      .video-title{
        .title-name{
          margin: 0;
        }
        .title-device{
          margin: 0;
        }
    }
    }
  }
}
</style>
