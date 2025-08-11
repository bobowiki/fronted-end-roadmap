const PENDING = "PENDING";
const FULFILLED = "FULFILLED";
const REJECTED = "REJECTED";
class MyPromise {
  constructor(executor) {
    executor(this.resolve, this.reject);
  }
  value = null;
  status = PENDING;
  reason = null;
  resolve = (value) => {
    this.value = value;
    this.status = FULFILLED;
    this.onFulfilledCallback && this.onFulfilledCallback(value);
  };
  reject = (reason) => {
    this.reason = reason;
    this.status = REJECTED;
    this.onRejectedCallback && this.onRejectedCallback(reason);
  };
  onFulfilledCallback = null;
  onRejectedCallback = null;

  then = (onFulfilled, onRejected) => {
    if (this.status === FULFILLED) {
      onFulfilled(this.value);
    }
    if (this.status === REJECTED) {
      onRejected(this.reason);
    }
    if (this.status === PENDING) {
      this.onFulfilledCallback = onFulfilled;
      this.onRejectedCallback = onRejected;
    }
  };
}

const p1 = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve(1);
  }, 100);
});

p1.then((res) => {
  console.log(res);
});
