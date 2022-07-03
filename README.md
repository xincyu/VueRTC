# Vue-RTCMany

> A Vue.js WebRTC project


## Study List

### 加入房间
  todo


### 应答方（回复方）

todo
### 本地方（邀约方）
todo

### 断开连接
  + 主动断开 hangup( )
    1. 清除本地流 localStream
      ``` javascript
        if (this.localStream) {
            this.localStream.getTracks().forEach((track) => track.stop())
            this.localStream = null
          }
      ```
    2. 关闭所有 RTCPeer连接对象
   
      ``` javascript
      this.pcList.forEach((element) => {
            element.pc.close()
            element.pc = null
          })
      ```
    3. 断开Ws连接

      ```javascript
        if (this.ws) {
          this.ws.close() // ws发送断开信息，ws处理close信息
          this.ws = null
        } 
      ```
  + 被动挂断（异常关闭）
    > 被动挂断的异常会出现 1、本地流自动关闭；2、RTCPeer连接对象丢失；3、服务器监听到ws.close会自动丢弃该ws,并广播close信息，触发函数closeRoomUser（）：移除离开用户的RTCPeer连接，并清除视频框；
  > 注意： 
     1. 同名账户，由于转发signaloffer之类的消息是避开自身name的，所以同名的账户不能接受到对方的offer请求；
     2. 服务器转发offer类消息若去掉 # item.userName != ws.userName  # 限制，则会出现3个视频框（一个本地的，一个回答方，一个本地方（回答方的视角））


## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report

# run unit tests
npm run unit

# run e2e tests
npm run e2e

# run all tests
npm test
```

For a detailed explanation on how things work, check out the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).
