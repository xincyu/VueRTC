/** 功能函数 */

/**
 *
 * @returns is mobile?
 */
function _isMobile () {
  let flag =
  navigator.userAgent.match(
    /(chrome|phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i)
  return flag
}

function checkDeviceType () {
  let userDevice = navigator.userAgent
  var device
  if (userDevice.search(RegExp(/iphone/i)) > 0) {
    device = 'iphone'
  } else if (userDevice.search(RegExp(/Android/i)) > 0) {
    device = 'Android'
  } else if (userDevice.search(RegExp(/iPad/i)) > 0) {
    device = 'iPad'
  } else if (userDevice.search(RegExp(/iOS/i)) > 0) {
    device = 'iOS'
  } else {
    device = 'Windows'
  }
  return device
}

module.exports = {
  _isMobile,
  checkDeviceType
}
