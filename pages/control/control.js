// control.js
//获取应用实例
const app = getApp()

Page({

  data: {
    msg: '静止',
    errMsg: '',
    animationData: {},
    rockerOriginX: '',
    rockerOriginY: '',
    rockerCurX: '',
    rockerCurY: '',
    rockerTop: '',
    rockerLeft: '',
    initTimer: null,
    DeviceId: '',
    devices: [],
    cnntState: '',
    writeServicweId: '',
    writeCharacteristicsId: '',
    SERVICE_UUID: '',
    CHARACTERISTIC_UUID: '',
    services: '',
    available: false,
    sendVal: '51',
    tempVal: '',
    AccelerometerState: false,
    AccelerometerFlag: false,
    x: '',
    y: '',
    z: ''
  },

  onLoad: function () {
    var _this = this
    _this.initBle()
    _this.onCnntState()
    // _this.onBleState()
  },



  // ArrayBuffer转16进度字符串示例
  ab2hex: function (buffer) {
    var hexArr = Array.prototype.map.call(
      new Uint8Array(buffer),
      function (bit) {
        return ('00' + bit.toString(16)).slice(-2)
      }
    )
    return hexArr.join('');
  },



  //初始化蓝牙
  initBle: function () {
    var _this = this
    wx.openBluetoothAdapter({
      success: function (res) {
        console.log("初始化蓝牙成功" + res.errMsg)
      },
      complete: function () {
        _this.getBleState()
      }
    })
  },



  //获取本机蓝牙适配器状态
  getBleState: function () {
    var _this = this
    wx.getBluetoothAdapterState({
      success: function (res) {
        //蓝牙没开提示打开蓝牙,相反则监听蓝牙的状态变化并搜索附近的设备
        if (!res.available) {
          console.log('getBleState:蓝牙未开启')
          wx.showModal({
            title: '警告',
            content: '蓝牙未开启',
            cancelText: '取消',
            confirmText: '确定'
          })
        } else {
          _this.setData({
            available: true
          })
          console.log('getBleState:蓝牙已开启')
        }
      },
      complete: function () {
        if (_this.data.available || _this.data.cnntState == '') {
          _this.startDiscovery()
        }
        _this.onBleState()
      }
    })
  },



  //监听本机蓝牙适配器的状态
  onBleState: function () {
    var _this = this
    wx.onBluetoothAdapterStateChange(function (res) {
      console.log('onBleState:进入监听本机蓝牙状态')
      if (!res.available) {
        console.log('onBleState:本机蓝牙未开启')
        //将连接状态设为false
        _this.setData({
          cnntState: false,
          DeviceId: '',
          available: false
        })
        wx.showToast({
          title: '蓝牙已关闭',
          duration: 1500,
          mask: true
        })
      } else {
        console.log('onBleState:本机蓝牙已开启')
        //如果设备开启 且连接状态为false时搜索设备
        _this.setData({
          available: true
        })
        if (_this.data.cnntState == false || _this.data.cnntState == '') {
          _this.startDiscovery()
        }
      }
    })
  },



  //搜索附近的蓝牙设备
  startDiscovery: function () {
    var _this = this
    wx.startBluetoothDevicesDiscovery({
      //可能是micbit设备没有广播uuid所以搜索设备时把uuid写死无效
      // services: ['6E400001-B5A3-F393-E0A9-E50E24DCCA9E'],
      success: function (res) {
        console.log('startDiscovery:', res)
        _this.getAllDevices()
        wx.showLoading({
          title: '正在搜索设备',
          mask: true
        })
      },
      complete: function () {

      }
    })
  },



  //获取搜索到的所有蓝牙设备
  getAllDevices: function () {
    var _this = this
    wx.getBluetoothDevices({
      success: function (res) {
        console.log("getAllDevices:", res.devices)
        _this.setData({
          devices: res.devices
        })
        console.log(_this.data.devices)
        try {
          for (var i = 0; i < _this.data.devices.length; i++) {
            if (_this.data.devices[i].localName == 'BBC micro:bit [tapup]') {
              _this.setData({
                DeviceId: _this.data.devices[i].deviceId
              })
            }
          }
        } catch (err) {

        }
        _this.createCnnt()
      },
      complete: function () {

      }
    })
  },



  //监听寻找新设备
  onDeviceFound: function () {
    var _this = this
    wx.onBluetoothDeviceFound(function (devices) {
      console.log(devices)
      console.log("设备名称------------------------------------------" + devices.devices[0].localName)
      try {
        if (devices.devices[0].localName == 'BBC micro:bit [tapup]') {
          _this.setData({
            DeviceId: devices.devices[0].deviceId
          })
          wx.hideLoading()
          _this.createCnnt()
        }
      } catch (err) {

      }

    })
  },



  //若之前连接过某个蓝牙设备，可传入deviceId直接尝试连接
  createCnnt: function () {
    var _this = this
    console.log("传入的deviceId--------------------------------------------" + _this.data.DeviceId)
    wx.createBLEConnection({
      deviceId: _this.data.DeviceId,
      success: function (res) {
        console.log(res)
        console.log('蓝牙连接成功' + res.errMsg)
        //关闭蓝牙搜索
        wx.stopBluetoothDevicesDiscovery({
          success: function (res) {
            console.log(res)
            console.log('关闭蓝牙搜索' + res.errMsg)
            wx.hideLoading()
          }
        })
        _this.setData({
          cnntState: true,
          SERVICE_UUID: '6E400001-B5A3-F393-E0A9-E50E24DCCA9E',
          CHARACTERISTIC_UUID: '6E400003-B5A3-F393-E0A9-E50E24DCCA9E'
        })
        wx.getBLEDeviceServices({
          deviceId: _this.data.DeviceId,
          success: function (res) {
            _this.setData({
              services: res.services
            })
          },
          complete: function () {
            wx.getBLEDeviceCharacteristics({
              deviceId: _this.data.DeviceId,
              serviceId: '6E400001-B5A3-F393-E0A9-E50E24DCCA9E',
              success: function (res) {
                for (var i = 0; i < res.characteristics.length; i++) {
                  if (res.characteristics[i].uuid.indexOf("6E400003") == 0) {
                    _this.setData({
                      writeServicweId: _this.data.services[0].uuid,
                      writeCharacteristicsId: res.characteristics[i].uuid,
                    })
                  }
                }
              }
            })
          }
        })
      },
      fail: function () {
        console.log('连接设备失败')
      },
      complete: function () {
        console.log('连接设备结束')
      }
    })
  },



  //断开与蓝牙的连接
  closeCnnt: function () {
    var _this = this
    wx.closeBLEConnection({
      deviceId: _this.data.DeviceId[0],
      success: function (res) {
        console.log('断开与蓝牙的连接' + res.errMsg)
      }
    })
  },



  //根据uuid获取处于已连接状态的设备
  getCntedDevice: function () {
    var _this = this
    wx.getConnectedBluetoothDevices({
      success: function (res) {
        console.log(res)
      }
    })
  },



  //监听蓝牙连接状态的改变事件 包括主动断开 设备丢失 连接异常
  onCnntState: function () {
    var _this = this
    wx.onBLEConnectionStateChange(function (res) {
      console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`)
      _this.setData({
        errMsg: `device ${res.deviceId} state has changed, connected: ${res.connected}`
      })
      if (res.connected == false) {
        _this.setData({
          DeviceId: [],
          available: false,
          cnntState: false
        })
        _this.getBleState()
      }
    })
  },



  //页面隐藏
  onHide: function () {

  },



  //页面卸载
  onUnLoad: function () {

  },



  //页面
  onReady: function () {

  },



  //switch切换
  switchTap: function (e) {
    var _this = this
    console.log('switch发生change事件,携带值为===============================', e.detail.value)
    this.setData({
      AccelerometerState: e.detail.value,

    })
    if (_this.data.AccelerometerState) {
      wx.onAccelerometerChange(function (res) {
        _this.setData({
          x: res.x * 1000,
          y: res.y * 1000,
          z: res.z
        })

        if (_this.data.x > 200 && Math.abs(_this.data.y) < 200) {
          _this.setData({
            msg: '向右走',
            tempVal: '44'    //D
          })
          console.log('======================原点' + _this.data.rockerOriginX + '/' + _this.data.rockerOriginY + '================================')
          console.log('======================右偏' + (_this.data.x / Math.abs(_this.data.x)) * 100 + '================================')
          _this.setData({
            rockerTop: _this.data.rockerOriginY + 'px',
            rockerLeft: _this.data.rockerOriginX + (_this.data.x / Math.abs(_this.data.x)) * 100 + 'px'
          })
        }

        if (_this.data.x < -200 && Math.abs(_this.data.y) < 200) {
          _this.setData({
            msg: '向左走',
            tempVal: '41'    //A
          })
          console.log('======================原点' + _this.data.rockerOriginX + '/' + _this.data.rockerOriginY + '================================')
          console.log('======================左偏' + (_this.data.x / Math.abs(_this.data.x)) * 100 + '================================')
          _this.setData({
            rockerTop: _this.data.rockerOriginY + 'px',
            rockerLeft: _this.data.rockerOriginX + (_this.data.x / Math.abs(_this.data.x)) * 100 + 'px'
          })
        }

        if (_this.data.y > 200 && Math.abs(_this.data.x) < 200) {
          _this.setData({
            msg: '向前走',
            tempVal: '57'   //W
          })
          console.log('======================原点' + _this.data.rockerOriginX + '/' + _this.data.rockerOriginY + '================================')
          console.log('======================前倾' + (_this.data.y / Math.abs(_this.data.y)) * 100 + '================================')
          _this.setData({
            rockerTop: _this.data.rockerOriginY - (_this.data.y / Math.abs(_this.data.y)) * 100 + 'px',
            rockerLeft: _this.data.rockerOriginX + 'px'
          })
        }

        if (_this.data.y < -200 && Math.abs(_this.data.x) < 200) {
          _this.setData({
            msg: '向后走',
            tempVal: '53'   //S
          })
          console.log('======================原点' + _this.data.rockerOriginX + '/' + _this.data.rockerOriginY + '================================')
          console.log('======================后倾' + (_this.data.y / Math.abs(_this.data.y)) * 100 + '================================')
          _this.setData({
            rockerTop: _this.data.rockerOriginY - (_this.data.y /Math.abs(_this.data.y)) * 100 + 'px',
            rockerLeft: _this.data.rockerOriginX + 'px'
          })
        }

        if (Math.abs(_this.data.x) < 50 && Math.abs(_this.data.y) < 50) {
          _this.setData({
            msg: '停止',
            tempVal: '51'
          })
          _this.setData({
            rockerTop: _this.data.rockerOriginY + 'px',
            rockerLeft: _this.data.rockerOriginX + 'px'
          })
        }

        if (_this.data.tempVal !== '' && _this.data.sendVal !== _this.data.tempVal) {
          _this.setData({
            sendVal: _this.data.tempVal
          })
          console.log('================================move发送数据' + _this.data.sendVal + '===================================')
          _this.sendData()
        }

      })

      wx.startAccelerometer({
        interval: 'normal',
        success: function () {

        }
      })
    } else {
      wx.stopAccelerometer()
      _this.setData({
        rockerTop: _this.data.rockerOriginY + 'px',
        rockerLeft: _this.data.rockerOriginX + 'px',
        msg: '停止',
        sendVal: '51',
        tempVal: ''
      })
    }
  },



  //触摸摇杆
  rockerStart: function (event) {
    console.log(event)
    var _this = this
    _this.setData({
      rockerOriginX: event.currentTarget.offsetLeft,
      rockerOriginY: event.currentTarget.offsetTop,
      AccelerometerFlag: true
    })

    console.log('摇杆的原点:' + '-------' + _this.data.rockerOriginX + '-------' + _this.data.rockerOriginY)
  },



  rockerMove: function (event) {
    var _this = this
    //如果重力模式关闭 可以滑动
    if (_this.data.AccelerometerState == false) {
      if (Math.abs(event.touches[0].clientX - _this.data.rockerOriginX) < 30) {
        if (event.touches[0].clientY - _this.data.rockerOriginY > 80) {
          _this.setData({
            msg: '向后退',
            tempVal: '53'   //S
          })
        } else if (event.touches[0].clientY - _this.data.rockerOriginY < -80) {
          _this.setData({
            msg: '前进',
            tempVal: '57'   //W
          })
        }
        _this.setData({
          rockerTop: event.touches[0].clientY + 'px',
          rockerLeft: _this.data.rockerOriginX + 'px'
        })
      } else if (Math.abs(event.touches[0].clientY - _this.data.rockerOriginY) < 30) {
        if (event.touches[0].clientX - _this.data.rockerOriginX > 80) {
          _this.setData({
            msg: '向右走',
            tempVal: '44'    //D
          })
        } else if (event.touches[0].clientX - _this.data.rockerOriginX < -80) {
          _this.setData({
            msg: '向左走',
            tempVal: '41'    //A
          })
        }
        _this.setData({
          rockerTop: _this.data.rockerOriginY + 'px',
          rockerLeft: event.touches[0].clientX + 'px'
        })
      }
      if (_this.data.tempVal !== '' && _this.data.sendVal !== _this.data.tempVal) {
        _this.setData({
          sendVal: _this.data.tempVal
        })
        console.log('================================move发送数据' + _this.data.sendVal + '===================================')
        _this.sendData()
      }
    }
  },



  rockerEnd: function () {
    var _this = this
    if (_this.data.AccelerometerState == false) {
      this.setData({
        rockerTop: this.data.rockerOriginY + 'px',
        rockerLeft: this.data.rockerOriginX + 'px',
        msg: '停止',
        sendVal: '51',
        tempVal: ''
      })
      console.log('================================end发送数据' + _this.data.sendVal + '===================================')
      _this.sendData()
    }
  },



  //蓝牙发送数据
  sendData: function () {
    var _this = this
    var buffer = new ArrayBuffer(2)
    var val1 = parseInt(_this.data.sendVal, 16)
    var val2 = parseInt('23', 16)
    var dataView = new DataView(buffer)
    dataView.setInt8(0, val1)
    dataView.setInt8(1, val2)
    console.log("传入的deviceId--------------------------------------------" + _this.data.DeviceId)
    console.log("传入的serviceId--------------------------------------------" + _this.data.SERVICE_UUID)
    console.log("传入的characteristicId--------------------------------------------" + _this.data.writeCharacteristicsId)
    wx.writeBLECharacteristicValue({
      deviceId: _this.data.DeviceId,
      serviceId: _this.data.SERVICE_UUID,
      characteristicId: _this.data.writeCharacteristicsId,
      value: buffer,
      success: function (res) {
        console.log('发送成功:' + res.errMsg)
      }
    })
  },



  toAccelerometer: function () {
    var _this = this
    wx.navigateTo({
      url: '/pages/Accelerometer/Accelerometer'
    })
  }



})