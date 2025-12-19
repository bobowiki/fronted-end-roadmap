<!--
  React 函数组件原理与 hooks 源码解读
  目录结构梳理 by Copilot
-->

# 目录

1. [React 函数组件核心概念](#react-函数组件核心概念)
   1. [React 函数组件的本质](#react-函数组件的本质)
   1. [state 更新驱动视图](#state-更新驱动视图)
   1. [虚拟 DOM（Virtual DOM, vdom）](#虚拟-domvirtual-dom-vdom)
1. [JSX](#jsx)
1. [核心 API（Hooks）实现原理](#核心-apihooks实现原理)
   1. [hooks 链表结构原理](#hooks-链表结构原理)
   1. [useState 的实现原理](#usestate-的实现原理)
   1. [useEffect 的实现原理](#useeffect-的实现原理)
   1. [其他 hooks（useRef/useReducer/useMemo 等）](#其他-hooksuserefusereducerusememo-等)
1. [hooks 状态变更与 DOM 更新流程](#hooks-状态变更与-dom-更新流程)
   1. [状态变更到 DOM 更新的整体流程](#状态变更到-dom-更新的整体流程)
   1. [如何定位并更新对应 DOM 元素](#如何定位并更新对应-dom-元素)
   1. [伪代码与流程详解](#伪代码与流程详解)
1. [hooks 链表常见误区与结构说明](#hooks-链表常见误区与结构说明)

## React 函数组件核心概念

### React 函数组件的本质

函数式组件本质上就是一个**接收 props，返回 React 元素（虚拟 DOM）**的普通 JavaScript 函数。

```jsx
function Hello(props) {
  return <div>Hello, {props.name}</div>;
}
```

React 内部会在渲染时调用该函数，拿到返回的虚拟 DOM 描述对象，然后参与后续的 diff 和渲染流程。

### state 更新驱动视图

### 1.1 数据驱动视图的底层机制

React 通过「响应式」的方式管理 UI 状态：

- 组件的 UI 由 state（状态）和 props（属性）决定。
- 当 state 发生变化时，React 会自动重新渲染组件，更新视图。
- 这种方式让开发者只需关注“数据到视图”的映射，而无需手动操作 DOM。

#### 源码片段（伪代码简化版）

```js
// React 内部会在 setState 或 useState 的 setter 被调用时：
function setState(newState) {
  // 1. 更新 state
  // 2. 标记该组件为脏（需要重新渲染）
  // 3. 触发调度，等待本轮事件循环结束后批量更新
  scheduleUpdateOnFiber(fiber);
}
```

#### 批量更新与调度

React 并不是每次 setState 都立即同步更新，而是采用「批量更新」和「异步调度」：

- 多个 setState 会被合并，减少渲染次数。
- 通过调度优先级机制（如 concurrent mode），保证高优先级任务优先执行。

#### 流程图

1. 事件触发 setState
2. 标记组件为脏
3. 进入调度队列
4. 统一批量渲染
5. 生成新 vdom，diff，patch 到真实 DOM

**示例：**

```jsx
import { useState } from "react";
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>点击了 {count} 次</button>;
}
```

### 虚拟 DOM（Virtual DOM, vdom）

### 2.1 虚拟 DOM 的结构

虚拟 DOM 其实就是一个普通的 JS 对象，描述了节点类型、属性、子节点等：

```js
const vnode = {
  type: 'div',
  props: { className: 'box' },
  children: [ ... ]
};
```

### 2.2 diff 算法

每次 state 变化，React 会：

1. 重新执行组件函数，生成新的虚拟 DOM 树
2. 与上一次的虚拟 DOM 树进行对比（diff）
3. 只把变化的部分同步到真实 DOM（patch）

#### diff 伪代码

```js
function diff(oldVNode, newVNode) {
  if (oldVNode.type !== newVNode.type) {
    // 替换整个节点
  } else {
    // 递归对比 props 和 children
  }
}
```

### 2.3 Fiber 架构

React 16 以后引入 Fiber 架构，将虚拟 DOM 抽象为 Fiber 节点，支持异步可中断的渲染。
Fiber 让 React 可以分片渲染、优先级调度，提升大规模应用的性能和响应性。

### JSX

### 3.1 JSX 的本质

JSX 只是语法糖，最终会被 Babel 等工具编译为 React.createElement 调用。

```jsx
const element = <h1>Hello, world!</h1>;
// 编译后：
const element = React.createElement("h1", null, "Hello, world!");
```

### 3.2 React.createElement 源码简析

核心作用：生成一个 JS 对象（虚拟 DOM）

```js
function createElement(type, config, ...children) {
  return {
    type,
    props: { ...config, children },
  };
}
```

### 3.3 JSX 与表达式

JSX 支持在大括号内写任意 JS 表达式，灵活组合 UI。

```jsx
<div>{isLogin ? "欢迎" : "请登录"}</div>
```

**示例：**

```jsx
const element = <h1>Hello, world!</h1>;
// 编译后：
const element = React.createElement("h1", null, "Hello, world!");
```

---

## 核心 API（Hooks）实现原理

本节系统梳理 React hooks 的底层实现机制，包括 hooks 链表结构、useState/useEffect/useRef 等核心 API 的源码伪实现。

### hooks 链表结构原理

在 React 内部，每个函数组件的 fiber 节点上会维护一条 hooks 链表。每调用一次 useState/useEffect/useRef 等 hook，都会在链表上新增一个节点，所有 hooks 共用同一条链表。

### 结构示意

```js
// 每个 hook 节点结构
const hook = {
  memoizedState, // 当前 hook 的 state/effect/ref 等数据
  queue, // 更新队列（部分 hook 有）
  next, // 指向下一个 hook
};

// fiber.memoizedState 指向第一个 hook
let firstHook = fiber.memoizedState;
```

### 挂载与遍历过程（伪代码）

```js
let workInProgressHook = null;
function mountWorkInProgressHook() {
  const hook = { memoizedState: null, queue: [], next: null };
  if (!fiber.memoizedState) {
    fiber.memoizedState = hook; // 第一个 hook
  } else {
    workInProgressHook.next = hook; // 挂到链表尾部
  }
  workInProgressHook = hook;
  return hook;
}
// 每次调用 useState/useEffect/useRef 等，都会执行 mountWorkInProgressHook()
```

### 链表遍历与执行

每次组件 render 时，都会顺序遍历 hooks 链表，依次执行每个 hook 的逻辑，保证顺序和数量一致。

---

### useState 的实现原理

```jsx
const [count, setCount] = useState(0);
```

useState 本质上是为当前组件 fiber 节点挂载一个 state，并返回当前值和更新函数。

#### 伪代码实现

```js
function useState(initialValue) {
  const hook = mountWorkInProgressHook();
  if (hook.memoizedState === null) {
    hook.memoizedState = initialValue;
  }
  // 每次渲染时，处理 queue 里的所有 action
  hook.queue.forEach((action) => {
    hook.memoizedState =
      typeof action === "function" ? action(hook.memoizedState) : action;
  });
  hook.queue = [];
  // setState 只负责入队 action，并调度更新
  const setState = (action) => {
    hook.queue.push(action);
    scheduleUpdateOnFiber();
  };
  return [hook.memoizedState, setState];
}
```

#### 链表执行过程示例

```js
// 模拟 fiber 节点
const fiber = { memoizedState: null };
let workInProgressHook = null;

function mountWorkInProgressHook() {
  const hook = { memoizedState: null, queue: [], next: null };
  if (!fiber.memoizedState) {
    fiber.memoizedState = hook; // 第一个 hook
  } else {
    workInProgressHook.next = hook; // 挂到链表尾部
  }
  workInProgressHook = hook;
  return hook;
}

function useState(initialValue) {
  const hook = mountWorkInProgressHook();
  if (hook.memoizedState === null) {
    hook.memoizedState = initialValue;
  }
  // 每次渲染时，处理 queue 里的所有 action
  hook.queue.forEach((action) => {
    hook.memoizedState =
      typeof action === "function" ? action(hook.memoizedState) : action;
  });
  hook.queue = [];
  // setState 只负责入队 action，并调度更新
  const setState = (action) => {
    hook.queue.push(action);
    scheduleUpdateOnFiber();
  };
  return [hook.memoizedState, setState];
}

function MyComponent() {
  const [count, setCount] = useState(0);
  // fiber.memoizedState -> hook1 { memoizedState: 0, queue: [], next: ... }
  const [flag, setFlag] = useState(false);
  // hook2 { memoizedState: false, queue: [], next: null }
  console.log("count:", count, "flag:", flag);
  return { setCount, setFlag };
}

function render() {
  // 1. 每次 render 前，重置游标，指向 hooks 链表头
  workInProgressHook = fiber.memoizedState;
  // 2. 执行组件函数，组件内每次调用 useState/useEffect 等 hook，都会：
  //    - 取出当前游标指向的 hook 节点
  //    - 执行 queue 里的所有 action，更新 memoizedState
  //    - 游标后移，指向下一个 hook 节点
  // 3. 这样就顺序遍历了整个 hooks 链表，所有 hook 的 queue 都被处理
  MyComponent();
  // 4. 渲染结束后，链表结构不变，所有 hook 的最新 state 已更新
}

// --- 首次渲染 ---
render();
// 输出: count: 0 flag: false
// 链表结构：
// fiber.memoizedState -> hook1 { memoizedState: 0, queue: [], next: hook2 }
// hook2 { memoizedState: false, queue: [], next: null }
// 说明：
// - render() 会顺序执行 MyComponent 内的 useState
// - 每次 useState 都会处理当前 hook 的 queue，更新 state
// - 首次渲染 queue 为空，state 为初始值

// --- 组件更新流程 ---
function scheduleUpdateOnFiber() {
  // 模拟异步批量调度，真实 React 更复杂
  setTimeout(() => {
    render();
  }, 0);
}

const { setCount, setFlag } = MyComponent();
setCount((c) => c + 1); // queue: [c => c + 1]
// 触发 scheduleUpdateOnFiber，稍后 render，遍历链表处理 queue
// 输出: count: 1 flag: false

setFlag((f) => !f); // queue: [f => !f]
// 触发 scheduleUpdateOnFiber，稍后 render，遍历链表处理 queue
// 输出: count: 1 flag: true
```

---

### useEffect 的实现原理

```jsx
useEffect(() => {
  // 副作用逻辑
  return () => {
    /* 清理逻辑 */
  };
}, [dep1, dep2]);
```

#### 伪代码实现

```js
function useEffect(create, deps) {
  const hook = mountWorkInProgressHook();
  hook.memoizedState = { create, deps, destroy: null };
  // 这里只是记录 effect，不会立即执行
  // 统一在 commit 阶段遍历 hooks 链表，执行 effect
}
```

#### 执行流程

1. 渲染阶段收集 effect
2. commit 阶段统一执行所有副作用
3. 依赖变化时先执行上一次的清理函数，再执行新的 effect

---

### 其他 hooks（useRef/useReducer/useMemo 等）

### useRef

```js
function useRef(initialValue) {
  const hook = mountWorkInProgressHook();
  if (hook.memoizedState === null) {
    hook.memoizedState = { current: initialValue };
  }
  return hook.memoizedState;
}
```

---

## hooks 链表常见误区与结构说明

### 常见误区：每种 hook 都有独立链表吗？

> 并不是！所有 hooks（useState、useEffect、useRef、useReducer 等）都共用同一条 hooks 链表。

- 这条链表挂在当前 fiber.memoizedState 上。
- 每次组件 render，都会顺序遍历这条链表，依次处理每个 hook 节点。
- 每个节点的 memoizedState 结构不同，但链表结构是统一的。

#### 示意图：

```
fiber.memoizedState
  ↓
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ useState 节点 │ -> │ useEffect 节点│ -> │ useRef 节点   │ -> null
└───────────────┘    └───────────────┘    └───────────────┘
```

> 只有一条链表，节点类型可以不同，顺序与 hooks 调用顺序严格一致。

## 其他 hooks 的链表实现

实际上，所有 hooks（如 useEffect、useRef、useReducer、useMemo 等）都共用同一条 hooks 链表。

每次组件 render 时，都会顺序执行组件内的所有 hooks 调用（无论是 useState 还是 useEffect 等），每次调用都复用链表上的下一个节点。

---

# React 函数式组件核心概念

本节将系统梳理 React 函数式组件的基础原理，为后续深入源码和 API 实现打下基础。

---

## 0. React 函数组件的本质

函数式组件本质上就是一个**接收 props，返回 React 元素（虚拟 DOM）**的普通 JavaScript 函数。

```jsx
function Hello(props) {
  return <div>Hello, {props.name}</div>;
}
```

React 内部会在渲染时调用该函数，拿到返回的虚拟 DOM 描述对象，然后参与后续的 diff 和渲染流程。

## 1. state 更新驱动视图

### 1.1 数据驱动视图的底层机制

React 通过「响应式」的方式管理 UI 状态：

- 组件的 UI 由 state（状态）和 props（属性）决定。
- 当 state 发生变化时，React 会自动重新渲染组件，更新视图。
- 这种方式让开发者只需关注“数据到视图”的映射，而无需手动操作 DOM。

#### 源码片段（伪代码简化版）

```js
// React 内部会在 setState 或 useState 的 setter 被调用时：
function setState(newState) {
  // 1. 更新 state
  // 2. 标记该组件为脏（需要重新渲染）
  // 3. 触发调度，等待本轮事件循环结束后批量更新
  scheduleUpdateOnFiber(fiber);
}
```

#### 批量更新与调度

React 并不是每次 setState 都立即同步更新，而是采用「批量更新」和「异步调度」：

- 多个 setState 会被合并，减少渲染次数。
- 通过调度优先级机制（如 concurrent mode），保证高优先级任务优先执行。

#### 流程图

1. 事件触发 setState
2. 标记组件为脏
3. 进入调度队列
4. 统一批量渲染
5. 生成新 vdom，diff，patch 到真实 DOM

**示例：**

```jsx
import { useState } from "react";
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>点击了 {count} 次</button>;
}
```

## 2. 虚拟 DOM（Virtual DOM, vdom）

### 2.1 虚拟 DOM 的结构

虚拟 DOM 其实就是一个普通的 JS 对象，描述了节点类型、属性、子节点等：

```js
const vnode = {
  type: 'div',
  props: { className: 'box' },
  children: [ ... ]
};
```

### 2.2 diff 算法

每次 state 变化，React 会：

1. 重新执行组件函数，生成新的虚拟 DOM 树
2. 与上一次的虚拟 DOM 树进行对比（diff）
3. 只把变化的部分同步到真实 DOM（patch）

#### diff 伪代码

```js
function diff(oldVNode, newVNode) {
  if (oldVNode.type !== newVNode.type) {
    // 替换整个节点
  } else {
    // 递归对比 props 和 children
  }
}
```

### 2.3 Fiber 架构

React 16 以后引入 Fiber 架构，将虚拟 DOM 抽象为 Fiber 节点，支持异步可中断的渲染。
Fiber 让 React 可以分片渲染、优先级调度，提升大规模应用的性能和响应性。

## 3. JSX

### 3.1 JSX 的本质

JSX 只是语法糖，最终会被 Babel 等工具编译为 React.createElement 调用。

```jsx
const element = <h1>Hello, world!</h1>;
// 编译后：
const element = React.createElement("h1", null, "Hello, world!");
```

### 3.2 React.createElement 源码简析

核心作用：生成一个 JS 对象（虚拟 DOM）

```js
function createElement(type, config, ...children) {
  return {
    type,
    props: { ...config, children },
  };
}
```

### 3.3 JSX 与表达式

JSX 支持在大括号内写任意 JS 表达式，灵活组合 UI。

```jsx
<div>{isLogin ? "欢迎" : "请登录"}</div>
```

**示例：**

```jsx
const element = <h1>Hello, world!</h1>;
// 编译后：
const element = React.createElement("h1", null, "Hello, world!");
```

---

# 4. 核心 API（Hooks）实现原理

本节系统梳理 React hooks 的底层实现机制，包括 hooks 链表结构、useState/useEffect/useRef 等核心 API 的源码伪实现。

## 4.1 hooks 链表结构原理

在 React 内部，每个函数组件的 fiber 节点上会维护一条 hooks 链表。每调用一次 useState/useEffect/useRef 等 hook，都会在链表上新增一个节点，所有 hooks 共用同一条链表。

### 结构示意

```js
// 每个 hook 节点结构
const hook = {
  memoizedState, // 当前 hook 的 state/effect/ref 等数据
  queue, // 更新队列（部分 hook 有）
  next, // 指向下一个 hook
};

// fiber.memoizedState 指向第一个 hook
let firstHook = fiber.memoizedState;
```

### 挂载与遍历过程（伪代码）

```js
let workInProgressHook = null;
function mountWorkInProgressHook() {
  const hook = { memoizedState: null, queue: [], next: null };
  if (!fiber.memoizedState) {
    fiber.memoizedState = hook; // 第一个 hook
  } else {
    workInProgressHook.next = hook; // 挂到链表尾部
  }
  workInProgressHook = hook;
  return hook;
}
// 每次调用 useState/useEffect/useRef 等，都会执行 mountWorkInProgressHook()
```

### 链表遍历与执行

每次组件 render 时，都会顺序遍历 hooks 链表，依次执行每个 hook 的逻辑，保证顺序和数量一致。

---

## 4.2 useState 的实现原理

```jsx
const [count, setCount] = useState(0);
```

useState 本质上是为当前组件 fiber 节点挂载一个 state，并返回当前值和更新函数。

#### 伪代码实现

```js
function useState(initialValue) {
  const hook = mountWorkInProgressHook();
  if (hook.memoizedState === null) {
    hook.memoizedState = initialValue;
  }
  // 每次渲染时，处理 queue 里的所有 action
  hook.queue.forEach((action) => {
    hook.memoizedState =
      typeof action === "function" ? action(hook.memoizedState) : action;
  });
  hook.queue = [];
  // setState 只负责入队 action，并调度更新
  const setState = (action) => {
    hook.queue.push(action);
    scheduleUpdateOnFiber();
  };
  return [hook.memoizedState, setState];
}
```

#### 链表执行过程示例

```js
// ...existing code...
```

---

## 4.3 useEffect 的实现原理

```jsx
useEffect(() => {
  // 副作用逻辑
  return () => {
    /* 清理逻辑 */
  };
}, [dep1, dep2]);
```

#### 伪代码实现

```js
function useEffect(create, deps) {
  const hook = mountWorkInProgressHook();
  hook.memoizedState = { create, deps, destroy: null };
  // 这里只是记录 effect，不会立即执行
  // 统一在 commit 阶段遍历 hooks 链表，执行 effect
}
```

#### 执行流程

1. 渲染阶段收集 effect
2. commit 阶段统一执行所有副作用
3. 依赖变化时先执行上一次的清理函数，再执行新的 effect

---

## 4.4 其他 hooks（useRef/useReducer/useMemo 等）

### useRef

```js
function useRef(initialValue) {
  const hook = mountWorkInProgressHook();
  if (hook.memoizedState === null) {
    hook.memoizedState = { current: initialValue };
  }
  return hook.memoizedState;
}
```

---

```js
// 模拟 fiber 节点
const fiber = { memoizedState: null };
let workInProgressHook = null;

function mountWorkInProgressHook() {
  const hook = { memoizedState: null, queue: [], next: null };
  if (!fiber.memoizedState) {
    fiber.memoizedState = hook; // 第一个 hook
  } else {
    workInProgressHook.next = hook; // 挂到链表尾部
  }
  workInProgressHook = hook;
  return hook;
}

function useState(initialValue) {
  const hook = mountWorkInProgressHook();
  if (hook.memoizedState === null) {
    hook.memoizedState = initialValue;
  }
  // 每次渲染时，处理 queue 里的所有 action
  hook.queue.forEach((action) => {
    hook.memoizedState =
      typeof action === "function" ? action(hook.memoizedState) : action;
  });
  hook.queue = [];
  // setState 只负责入队 action，并调度更新
  const setState = (action) => {
    hook.queue.push(action);
    scheduleUpdateOnFiber();
  };
  return [hook.memoizedState, setState];
}

function MyComponent() {
  const [count, setCount] = useState(0);
  // fiber.memoizedState -> hook1 { memoizedState: 0, queue: [], next: ... }
  const [flag, setFlag] = useState(false);
  // hook2 { memoizedState: false, queue: [], next: null }
  console.log("count:", count, "flag:", flag);
  return { setCount, setFlag };
}

function render() {
  // 1. 每次 render 前，重置游标，指向 hooks 链表头
  workInProgressHook = fiber.memoizedState;
  // 2. 执行组件函数，组件内每次调用 useState/useEffect 等 hook，都会：
  //    - 取出当前游标指向的 hook 节点
  //    - 执行 queue 里的所有 action，更新 memoizedState
  //    - 游标后移，指向下一个 hook 节点
  // 3. 这样就顺序遍历了整个 hooks 链表，所有 hook 的 queue 都被处理
  MyComponent();
  // 4. 渲染结束后，链表结构不变，所有 hook 的最新 state 已更新
}

// --- 首次渲染 ---
render();
// 输出: count: 0 flag: false
// 链表结构：
// fiber.memoizedState -> hook1 { memoizedState: 0, queue: [], next: hook2 }
// hook2 { memoizedState: false, queue: [], next: null }
// 说明：
// - render() 会顺序执行 MyComponent 内的 useState
// - 每次 useState 都会处理当前 hook 的 queue，更新 state
// - 首次渲染 queue 为空，state 为初始值

// --- 组件更新流程 ---
function scheduleUpdateOnFiber() {
  // 模拟异步批量调度，真实 React 更复杂
  setTimeout(() => {
    render();
  }, 0);
}

const { setCount, setFlag } = MyComponent();
setCount((c) => c + 1); // queue: [c => c + 1]
// 触发 scheduleUpdateOnFiber，稍后 render，遍历链表处理 queue
// 输出: count: 1 flag: false

setFlag((f) => !f); // queue: [f => !f]
// 触发 scheduleUpdateOnFiber，稍后 render，遍历链表处理 queue
// 输出: count: 1 flag: true
```

## 4.2 useEffect 的实现原理

### 基本用法回顾

```jsx
useEffect(() => {
  // 副作用逻辑
  return () => {
    /* 清理逻辑 */
  };
}, [dep1, dep2]);
```

### 原理概述

- useEffect 会在组件渲染后注册副作用回调。
- React 会比较依赖项数组（deps），只有变化时才重新执行 effect。
- effect 的执行和清理在 commit 阶段统一调度。

### 伪代码简化

```js
function useEffect(effect, deps) {
  const hook = mountWorkInProgressHook();
  if (hook.memoizedState === null) {
    hook.memoizedState = initialValue;
  }
  // 关键：每次渲染时，useState 都会顺序执行，取出当前 hook 节点
  //      并依次处理 queue 里的所有 action，更新 state
  //      这样保证了 setState 的 action 能被批量合并处理
  hook.queue.forEach((action) => {
    hook.memoizedState =
      typeof action === "function" ? action(hook.memoizedState) : action;
  });
  hook.queue = [];
  // setState 只负责入队 action，并调度更新
  const setState = (action) => {
    hook.queue.push(action);
    scheduleUpdateOnFiber();
  };
  return [hook.memoizedState, setState];
  hook.memoizedState = pushEffect(
    HookHasEffect | HookPassive,
    create,
    undefined,
    nextDeps
  );
}
```

### 执行流程

1. 渲染阶段收集 effect
2. commit 阶段统一执行所有副作用
3. 依赖变化时先执行上一次的清理函数，再执行新的 effect

---

> 后续可继续深入 useContext、useReducer、useMemo、useCallback 等高级 Hooks 的实现原理。

## hooks 状态变更与 DOM 更新流程

本节详细解释 hooks 链表状态变更后，React 如何确定需要更新哪些 DOM 元素，以及底层的 diff/patch 流程。

### 状态变更到 DOM 更新的整体流程

1. 用户调用 setState（或 setXxx）时，新的 action 被加入对应 hook 节点的 queue。
2. React 通过 scheduleUpdateOnFiber 触发调度，进入 render 阶段。
3. render 阶段顺序遍历 hooks 链表，依次处理 queue，得到最新 state。
4. 组件函数重新执行，生成新的虚拟 DOM 树（vdom）。
5. React 对比新旧 vdom，找出变化的部分（diff）。
6. 只对变化的部分 patch 到真实 DOM。

### 如何定位并更新对应 DOM 元素

- 每个 hooks 节点只负责保存状态，不直接关联具体 DOM。
- 组件 render 时，新的 state 会影响虚拟 DOM 的生成。
- React diff 阶段会递归对比新旧 vdom，定位到具体变化的节点。
- vdom 节点通常有唯一 key 或层级路径，React 能精确找到需要更新的 DOM 元素。
- 最终只 patch 变化的 DOM 节点，未变化的节点不会重新渲染。

### 伪代码与流程详解

```js
// 1. setState 触发
setCount(count => count + 1);
// 2. scheduleUpdateOnFiber 触发调度
function scheduleUpdateOnFiber() {
  // 进入 render 阶段
  render();
}

function render() {
  workInProgressHook = fiber.memoizedState;
  // 重新执行组件函数，生成新的 vdom
  const newVdom = MyComponent();
  // diff 新旧 vdom，找出变化
  diffAndPatch(fiber.oldVdom, newVdom);
  fiber.oldVdom = newVdom;
}

function diffAndPatch(oldVdom, newVdom) {
  if (!oldVdom) {
    mountToDom(newVdom);
    return;
  }
  if (oldVdom.type !== newVdom.type) {
    replaceDom(oldVdom, newVdom);
    return;
  }
  // 对比 props
  patchProps(oldVdom.dom, oldVdom.props, newVdom.props);
  // 递归对比 children
  for (let i = 0; i < newVdom.children.length; i++) {
    diffAndPatch(oldVdom.children[i], newVdom.children[i]);
  }
}

// vdom 节点结构示例
const vdom = {
  type: 'button',
  props: { onClick: ..., children: '点击了 1 次' },
  dom: HTMLButtonElement, // 真实 DOM 引用
  children: []
};
```

> 总结：hooks 链表只负责状态管理，具体 DOM 更新由 vdom diff/patch 机制完成。每次 render 都会生成新的 vdom，React 能自动定位并只更新变化的 DOM 元素。

---
