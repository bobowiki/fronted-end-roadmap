// 手写promise的实现
const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

class MyPromise {
  constructor(executor) {
    executor(this.resolve, this.reject);
  }
  status = PENDING;
  value = undefined;
  reason = null;
  // MyPromise.js

  // MyPromise 类中新增
  // 存储成功回调函数
  onFulfilledCallback = null;
  // 存储失败回调函数
  onRejectedCallback = null;
  resolve = (value) => {
    if (this.status === PENDING) {
      this.status = FULFILLED;
      this.value = value;
      queueMicrotask(() => {
        this.onFulfilledCallback && this.onFulfilledCallback(value);
      });
      // this.onFulfilledCallback && this.onFulfilledCallback(value);
    }
  };
  reject = (reason) => {
    if (this.status === PENDING) {
      this.status = REJECTED;
      this.value = reason;
      queueMicrotask(() => {
        this.onRejectedCallback && this.onRejectedCallback(reason);
      });
      // this.onRejectedCallback && this.onRejectedCallback(reason);
    }
  };
  then = (onFulfilled, onRejected) => {
    // if (this.status === FULFILLED) {
    //   // 失去了异步的特性
    //   // 直接执行成功回调
    //   onFulfilled(this.value);
    // } else if (this.status === REJECTED) {
    //   onRejected(this.value);
    // } else if (this.status === PENDING) {
    // ==== 新增 ====
    // 因为不知道后面状态的变化情况，所以将成功回调和失败回调存储起来
    // 等到执行成功失败函数的时候再传递
    this.onFulfilledCallback = onFulfilled;
    this.onRejectedCallback = onRejected;
    // }
  };
}

const p1 = new MyPromise((resolve, reject) => {
  // resolve(1);
  setTimeout(() => {
    resolve(1);
  }, 1000);
});

p1.then(
  (res) => {
    console.log(res);
  },
  (reason) => {
    console.log(reason);
  }
);
