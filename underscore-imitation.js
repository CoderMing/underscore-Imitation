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

  // reduce类的函数
  // 因为reduce和reduceRight只有一个遍历方向的区别
  // 所以可以采用一个函数，来同时实现两个功能
  // 此处传的参数dir 就是一个控制功能
  // dir === 1 -> _.reduce
  // dir === -1 -> _.reduceRight
  function createReduce(dir) {
    // 遍历函数
    // 观察一下他的几个参数，你是否发现和reduce该有的遍历函数（即reduce调用时的第二个参数）
    // 的区别，只不过是多传了index和length
    // 正是这两个东西，配合dir，可以实现同时做reduce和reduceRight的事
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        // 和上面的_.map中的作用一样，实现兼容
        let currentKey = keys ? keys[index] : index

        memo = iteratee(memo, obj[currentKey], currentKey, obj)
      }
      // 返回结果
      return memo
    }
    // 这个时候就返回制作好的reduce函数了
    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4)
      // 此处和上面的map什么的很类似了
      // 唯一的区别就是index，此处通过dir分成了两种情况
      // 正好对应reduce和reduceRight
      let keys = !isArrayLike(obj) && _.keys(obj)
          legth = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1
      // 如果没有给定初始值（即没有第三个参数），就不遍历第一个元素
      // 并把第一个元素抽成第二个的memo
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index]
        index += dir
      }

      return memo
    }
  }
  // 这个时候再定义reduce和reduceRight函数
  // 就水到渠成了
  _.reduce = _.foldl = _.inject = createReduce(1)

  _.reduce = _.flodr = createReduce(-1)

  // 找到某个数组元素
  // 找到了之后就退出，不再继续寻找
  // 找不到的话就返回undefined
  _.find = _.detect = function(obj, predicate, context) {
    let key =   isArrayLike(obj)
              ? _.findIndex(obj, predicate, context)
              : _.findKey(obj, predicate, context)
    // 此处 如果key === void 0，是调用了findKey没找到
    // 如果是-1, 是调用了findIndex没找到
    return  key !== void 0 && key != -1
          ? obj[key]
          : void 0
  }

  // filter方法
  // 筛选数组中的一些数
  _.filter = _.select = function(obj, predicate, context) {
    let results = []
    // 创建通用的遍历函数
    // 实现输入各种类别的数值都能正确判断
    predicate = cb(predicate, context)
    // 遍历函数，将判断成功的函数push进去
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value)
    })
    // 返回结果
    return results
  }

  // 返回数组中所有不满足条件的数值
  // 相当于时filter的补集
  // Que: 这里为什么没有像reduce reduceRight一样，先使用一个函数
  // 然后再将两个方法进行包装？
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(context)), context)
  }

  // tips： 大多数组方法都差不多一个套路
  // 首先判断输入的是不是类数组，或者是对象
  // 然后进行遍历处理（处理过程中分清楚了数组和对象）

  // 和Array.prototype.every一样
  // 如果一个数组/对象里面的所有元素都满足某个条件
  // 就返回true
  // 否则返回false
  _.every = _.all = function(obj, predicate, context) {
    // 更换正确地this
    predicate = cb(predicate, context)
    
    let keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length
    
    for (let index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index
      // 如果有一个点没有满足条件，就返回false
      if (!predicate(obj[currentKey], currentKey, obj))
        return false
    }

    return true
  }

  // Que: 为什么这个地方没有使用像reduce那样的反函数方法？
  // 为什么这个地方没有用下面这个写法？
  // _.some = _.any = function(obj, predicate, context) {
  //   let prevPre = predicate,
  //       predicate = function() {
  //         return !predicate.apply(this, arguments)
  //       }
  //   if (_.every(obj, predicate, context)) {
  //     return false
  //   }
  //   return true
  // }

  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context)

    let keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length
    
    for (let index = 0; index < length; index++) {
      let currentKey = keys ? keys[index] : index

      if (predicate(obj[currentKey], currentKey, obj))
        return true
    }
    
    return true
  }

  // 查找是否具有某个元素
  // 在愚人码头的中文文档中没有给出第三第四个参数的作用
  // 经过测试，第三第四个参数在1.8.3版本下是存在的
  // 作用是从下标为第三个参数的元素开始，一直查找到下标为第四个参数之前的元素（不包括第四个参数）
  _.contaions = _.includes = _.include = function (obj, item, formIndex, guard) {
    // 获取要遍历的元素
    if (!isArrayLike(obj)) obj = _.values(obj)

    // 定位查询的起始位置
    if (typeof formIndex != 'number' || guard) formIndex = 0

    // 定好位置之后，就可以使用_.indexOf来返回值了
    // indexOf方法查到了值就会返回对应的属性名
    // 没查到就返回-1
    // 所以这个地方只需要简简单单地添加一个 >= 0 的判断

    return _.indexOf(obj, item, formIndex) >= 0
  }

  // 数组的遍历函数
  // 对数组的每一个对象都使用某个方法
  // 如果第二个参数是方法的话，就调用第二个参数
  // 如果第二个参数不是数组的话，查找obj（第一个参数）有没有属性名为第二个参数的函数（可以查找原型链）
  // 如果有，就会调用该函数，如果没有，就会报错。
  // 第三个和之后的参数，将会被传到调用的函数中
  // 调用的函数中，this指向是对于当前的元素
  _.invoke = function(obj, method) {
    // 抽取出要传到函数里的arguments
    let args = slice.call(arguments, 2)

    let isFunc = _.isFunction(method)

    return _.map(obj, function(value) {
        // Que： 为什么这个地方会在函数内部进行判断？
        // 如果我在遍历函数之前，就进行判断，岂不是更方便一些？
        let func = isFunc ? method : value(method)
        return func == null ? func : func.apply(value, args)
      })
  }

  // 传入一个 对象/数组 所组成的数组
  // 返回一个数组，内容是传入数组每个元素对应键值的值
  // 如果没有那个键值，就返回undefined
  // 这个也说明了，传入数组和传出数组的length应该是一样的
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key))
  }

  // 筛选有指定键值对的对象
  // 传入一个数组，传出满足条件的元素的数组
  // 这儿的 _.mather 函数，返回值是一个函数
  // 相当于进行了 _.isMatch 的柯里化
  _.where = function(obj, attrs) {
    return _.filter(obj, _.mather(attrs))
  }

  // 根据指定的键值对
  // 选择对象
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // 寻找第一个有指定 key-value 的对象
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs))
  }

  // _.max = function(obj, iteratee, context) {
  //   var result = -Infinity,
  //       lastComputed = -Infinity,
  //       value,
  //       computed

  //   if (iteratee = null && obj != null) {

  //   }
  // }












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

  // // 和_.keys的作用差不多
  // // 差距是提供了原型链上的key-value值
  // _.allKeys = function(obj) {
  //   if (!_isObject(obj)) return []

  // }






  // 返回传入的参数
  // 在各种迭代函数中起到了简化的作用
  _.identity = value => value




  _.has = function(obj, key) {
    return obj != null && hasOwnPeoperty.call(obj, key)
  }















})()