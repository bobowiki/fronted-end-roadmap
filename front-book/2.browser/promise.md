https://juejin.cn/post/6945319439772434469?searchId=20250711151831D31A12ADA3731ED39932

我们都知道 Js 是单线程都，但是一些高耗时操作就带来了进程阻塞问题。为了解决这个问题，Js 有两种任务的执行模式：同步模式（Synchronous）和异步模式（Asynchronous）。

在异步模式下，创建异步任务主要分为宏任务与微任务两种。ES6 规范中，宏任务（Macrotask） 称为 Task， 微任务（Microtask） 称为 Jobs。宏任务是由宿主（浏览器、Node）发起的，而微任务由 JS 自身发起。

[promise 源码路径](./code/promise.js)
