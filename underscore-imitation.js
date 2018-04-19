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

  // underscore的内部方法
  let optimizeCb = function(func, context, argCount) {
    if (context === void 0)
      return func

    switch (argCount == null ? 3 : argCount) {
      case 1:
        return value => func.call(context, value)
      case 2:
        return (val1, val2) => {
          return func.call(context, val1, val2)
        }
      // 一般的遍历器都是使用3个参数的
      case 3:
        return (value, index, collection) => {
          return func.call(context, value, index, collection)
        }
      // reduce，reduceRight
      case 4:
        return (accumulator, value, index, collection) => {
          return func.call(context, accumulator, value, index, collection)
        }
    }

    // 知识点：call会比apply快上很多，所以做这些判断是值得的
    return function(...args) {
      return func.apply(context, args)
    }
  }

  // underscore对回调函数的拓展
  // 我们知道，一般的迭代方法只能是传一个迭代函数
  // 此处对迭代函数进行了二次封装
  // 实现了传各类参数的情况下，都能做一些事情
  let cb = (value, context, argCount) => {
    // 如果什么都没有传，就返回原对象，相当于什么都没做
    // _.each([1, 2, 3]) 
    // => [1 ,2, 3]
    if (value == null) 
      return _.identity
    // 如果传的是function，就正常地返回迭代函数就好
    if (_.isFunction(value))
      return optimizeCb(value, context, argCount)
    // 如果传的是object，就会调用判断方法
    // _.map([{a: 2}, {a: 1}], {a: 1})
    // => [false, true]
    if (_.isObject(value))
      return _.matcher(value)
    // 其实经过上述判断，只会有true, 数字，字符串到这一步
    // 这些东西都是可以直接toString使用了
    // 此处返回一个对象的相关键值
    return _.property(value)
  }

  // 扩展的遍历器函数
  // 相当于curry化了下cb函数
  // 这样做的主要原因是针对各种情况，无法获知当value为函数的时候穿的参数的情况
  // 所以第三个参数为Infinity，这样在optimizeCb中就直接apply了
  // 官方文档中_.iteratee的介绍：
  // var stooges = [{name: 'curly', age: 25}, {name: 'moe', age: 21}, {name: 'larry', age: 23}];
  // _.map(stooges, _.iteratee('age'));
  // => [25, 21, 23];
  _.iteratee = (value, context) => {
    return cb(value, context, Infinity)
  }

  // todo
  let createAssigner = (...args) => {

  }

  // todo
  let baseCreate = prototype => {

  }

  // 经典的闭包函数
  // 返回一个需要一个参数的函数，返回生成的那个函数的属性值
  let property = key => {
    return obj => obj == null ? void 0 : obj[key]
  }

  // Math.pow(2, 53) - 1为js中能精确表示最大的数字
  // 防止数组超出容量
  let MAX_ARRAY_INDEX = Math.pow(2, 53) - 1

  // 闭包函数的应用
  // Que：此处和直接用属性值，有什么区别吗？
  let getLength = property('length')

  // 判断是否是类数组对象
  var isArrayLike = collection => {
    let length = getLength(collection)
    // 下面做的这个判断，是因为在类数组中
    // length不会小于0， 也不会大于MAX_ARRAY_INDEX
    // 测试了下，如果是数组，会直接报错
    // 类数组暂时还没有试过
    return   typeof length === 'number'
          && length >= 0
          && length <= MAX_ARRAY_INDEX
  }



  // Collection Functions
  // 数组或者对象的扩展方法
  // 共 25 个扩展方法
  // --------------------


  _.each = _.forEach = function(obj, iteratee, context) {
    // 相当于绑定this
    iteratee = optimizeCb(iteratee, context)

    let i, length
    // 如果是类数组函数，就遍历下各个值
    // Que：如果是松散数列，Array.prototype.forEach是不会遍历的
    // 但是此方法却会遍历到
    // 有什么方法可以杜绝被遍历到吗？
    if (isArrayLike(obj))
      for (i = 0, length = getLength(obj); i < length; i++)
        iteratee(obj[i], i, obj)

    else {
      // 调用内部方法获取到所有可以遍历的值
      let keys = _.keys(obj)

      for (i = 0, length = getLength(keys); i < length; i++)
        iteratee(obj[keys[i]], keys[i], obj)
    }

    return obj
  }

  _.map = _.collect = function(obj, iteratee, context) {
    // 诸多数组方法都用这个功能
    iteratee = cb(iteratee, context)
    // 先获取到需要遍历的东西
    // 巧妙的过滤非法参数的方法：
    // 如果传进来的不是arrayLike和可遍历（Object）的东西，就让keys的值为false
    // 然后后面获取length属性的时候，就为0了
    let keys = !isArrayLike(obj) && _.keys(obj)
        legth = (keys || obj).length,
        results = Array.length

    for (let index = 0; index < length; index++) {
      // 有keys的话说明传进来的是arrayLike，这时直接传index就好
      // 没keys而且能进行到这一步的话，说明是Object，这时就访问keys的内容
      // 从而实现兼容
      let currentKey = keys ? keys[index] : index
      results[index] = iteratee(obj[currentKey], currentKey, obj)
    }
    //返回新结果
    return results
  }









  // todo
  _.keys = function() {
    if (!_.isObject(obj)) return []
    // 如果有原生，就用原生的
    if (nativeKeys) return nativeKeys(obj)
    
    let keys = []

    for (let key in obj)
      if (_.has(obj, key)) keys.push(key)

    // IE9的bug
    if (hasEnumBug) collectNonEnumProps(obj, keys)
    
    return keys
  }








  // 返回传入的参数
  // 在各种迭代函数中起到了简化的作用
  _.identity = value => value




  _.has = function(obj, key) {
    return obj != null && hasOwnPeoperty.call(obj, key)
  }















})()