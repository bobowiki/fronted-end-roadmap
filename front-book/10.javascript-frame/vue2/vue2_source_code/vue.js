function Vue(options) {
  this.init(options);
}

function mixinInit(Vue) {
  Vue.prototype.init = function (options) {
    const { state, method, el, render } = options;
    const documentEl = document.querySelector(el);
  };
}

function mixinRender(Vue) {
  Vue.prototype._render = function () {};
}
