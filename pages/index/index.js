//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    index: 0,
    imagePos: "translateX(0rpx)",
    animationData: {},
    logoTimer: ''
  },
  //事件处理函数
  bindViewTap: function() {

  },

  onReady: function () {
    var _this = this
    
    //logo动画
    function logoShow () {
      // console.log(_this.data.index)
      clearInterval(_this.data.logoTimer)
      if (_this.data.index < 18) {
        _this.setData({
          index: _this.data.index + 1
        })
      } else {
        _this.setData({
          index: 0
        })
      }
      _this.setData({
        imagePos: "translateX(" + "-" + 260 * _this.data.index + "rpx)",
        logoTimer: setInterval(logoShow, 350)
      })
    }
    logoShow()

    //slogen动画
    var animation = wx.createAnimation({
      duration: 3000,
      timingFunction: 'ease'
    })
    this.animation = animation
    animation.opacity(1).bottom(300 + 'rpx').step()

    this.setData({
      animationData: animation.export()
    })

  },

  onUnload: function () {
    clearInterval(this.data.logoTimer)
  },

  onShow: function () {

  },

  toControl: function () {
    var _this = this
    wx.redirectTo({
      url: '/pages/control/control'
    })
  }

})
