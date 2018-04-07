(() => {
  // 保存this，方便跨环境
  let root = this
  // 看看之前有没有_
  let previousUnderscore = root._
  // 便于压缩，因为压缩的时候可以压缩变量名，但不能压缩xx.prototype
  let
    ArrayProto = Array.prototype,
    ObjProto   = Object.prototype,
    FuncProto  = Function.prototype

  // 同样是缓存变量
  // 还有一个功能是减少查找原型链的次数
  let
    push = ArrayProto.push,
    slice = ArrayProto.slice,
    toString = ObjProto.toString,
    hasOwnPeoperty = ObjProto.hasOwnPeoperty

  // 优先使用原生的代码
  let
    nativeIsArray = Array.isArray,
    nativeKeys = Object.keys,
    nativeBind = FuncProto.bind,
    nativeCreate = Object.create

  // Que：ctor是干什么的？
  let Ctor = function(){}

  // OOP形式的调用
  // 就相当于把一半调用的第一个参数
  // 拉成现在的this了
  // _([1, 2, 3]).each(alert) 和下面
  // _.each([1, 2, 3], alert) 完全等价
  let _ = function(obj) {
    // _(_([1])) 和_([1])等价
    if (obj instanceof _)
      return obj
    // 无 new 调用的实现
    // 知识点：使用new与不使用new时 this 的区别
    if (!(this instanceof _))
      return new _(obj)

    this._wrapped = obj
  }

  // 当前环境判断，并正确地输出
  // 同时兼容node，Browser的环境
  // https://www.jianshu.com/p/09ffac7a3b2c
  if (typeof exports !== 'undefined') {
    // node端
    // Que：这里为什么要判断是不是有module.exports？
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _
    }
    exports._ = _
  } else {
    // 浏览器环境
    root._ = _
  }

  // 当前版本号
  _.VERSION = '1.8.3-DM'













})()