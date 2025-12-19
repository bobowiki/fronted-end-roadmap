# 目录
- [目录](#目录)
- [React 函数组件核心概念](#react-函数组件核心概念)
  - [React 函数组件的本质](#react-函数组件的本质)
  - [state 更新驱动视图](#state-更新驱动视图)
    - [数据驱动视图的底层机制](#数据驱动视图的底层机制)
    - [批量更新与调度](#批量更新与调度)
    - [流程图](#流程图)
  - [虚拟 DOM（Virtual DOM, vdom）](#虚拟-domvirtual-dom-vdom)
    - [虚拟 DOM 的结构](#虚拟-dom-的结构)
    - [diff 算法](#diff-算法)
  - [Fiber 架构](#fiber-架构)
    - [一、Fiber 架构的核心目标（为什么要有 Fiber）](#一fiber-架构的核心目标为什么要有-fiber)
      - [Fiber 的本质定义](#fiber-的本质定义)
      - [Fiber 带来的能力（不是 VDOM 能解决的）](#fiber-带来的能力不是-vdom-能解决的)
    - [二、Fiber 节点的完整结构（重点）](#二fiber-节点的完整结构重点)
      - [精简但真实的 Fiber 结构](#精简但真实的-fiber-结构)
      - [Fiber 是「链表 + 树」混合结构](#fiber-是链表--树混合结构)
    - [三、一个 Todo 应用的 Fiber 树长什么样？](#三一个-todo-应用的-fiber-树长什么样)
      - [示例 Todo 应用](#示例-todo-应用)
      - [对应的 Fiber 树（简化）](#对应的-fiber-树简化)
      - [关键点](#关键点)
    - [四、状态更新后发生了什么（完整调度链路）](#四状态更新后发生了什么完整调度链路)
      - [1️⃣ update 被创建（不是立刻更新）](#1️⃣-update-被创建不是立刻更新)
      - [2️⃣ scheduleUpdateOnFiber](#2️⃣-scheduleupdateonfiber)
      - [(1) 向上找到 Root](#1-向上找到-root)
      - [(2) 标记 lane](#2-标记-lane)
      - [(3) 调度任务](#3-调度任务)
      - [3️⃣ Scheduler 决定何时执行](#3️⃣-scheduler-决定何时执行)
    - [五、Render 阶段（Fiber 的核心）](#五render-阶段fiber-的核心)
      - [Render = 构建 workInProgress Fiber 树](#render--构建-workinprogress-fiber-树)
      - [深度优先遍历（可中断）](#深度优先遍历可中断)
      - [关键点：TodoAppFiber 被重新执行](#关键点todoappfiber-被重新执行)
      - [hooks 处理流程：](#hooks-处理流程)
  - [TodoList 是否会重新执行？](#todolist-是否会重新执行)
    - [六、Diff（Reconcile）阶段](#六diffreconcile阶段)
      - [列表 diff 的核心规则](#列表-diff-的核心规则)
    - [七、Commit 阶段（真正改 DOM）](#七commit-阶段真正改-dom)
      - [1️⃣ before mutation](#1️⃣-before-mutation)
      - [2️⃣ mutation](#2️⃣-mutation)
      - [3️⃣ layout](#3️⃣-layout)
    - [八、为什么 Fiber 看起来“全树”，但实际很快？](#八为什么-fiber-看起来全树但实际很快)
      - [因为三大短路机制：](#因为三大短路机制)
    - [九、一句话总结 Fiber 架构（技术面试级）](#九一句话总结-fiber-架构技术面试级)
  - [JSX](#jsx)
    - [JSX 的本质](#jsx-的本质)
    - [React.createElement 源码简析](#reactcreateelement-源码简析)
  - [核心 API（Hooks）实现原理](#核心-apihooks实现原理)
    - [hooks 链表结构原理](#hooks-链表结构原理)
    - [结构示意](#结构示意)
    - [挂载与遍历过程（伪代码）](#挂载与遍历过程伪代码)
    - [链表遍历与执行](#链表遍历与执行)
    - [useState 的实现原理](#usestate-的实现原理)
      - [伪代码实现](#伪代码实现)
      - [链表执行过程示例](#链表执行过程示例)
    - [useEffect 的实现原理](#useeffect-的实现原理)
      - [伪代码实现](#伪代码实现-1)
      - [执行流程](#执行流程)
    - [其他 hooks（useRef/useReducer/useMemo 等）](#其他-hooksuserefusereducerusememo-等)
      - [useRef](#useref)


# React 函数组件核心概念

## React 函数组件的本质

函数式组件本质上就是一个**接收 props，返回 React 元素（虚拟 DOM）**的普通 JavaScript 函数。

```jsx
function Hello(props) {
  return <div>Hello, {props.name}</div>;
}
```

React 内部会在渲染时调用该函数，拿到返回的虚拟 DOM 描述对象，然后参与后续的 diff 和渲染流程。

## state 更新驱动视图

### 数据驱动视图的底层机制

React 通过「响应式」的方式管理 UI 状态：

- 组件的 UI 由 state（状态）和 props（属性）决定。
- 当 state 发生变化时，React 会自动重新渲染组件，更新视图。
- 这种方式让开发者只需关注“数据到视图”的映射，而无需手动操作 DOM。

```js
// React 内部会在 setState 或 useState 的 setter 被调用时：
function setState(newState) {
  // 1. 更新 state
  // 2. 标记该组件为脏（需要重新渲染）
  // 3. 触发调度，等待本轮事件循环结束后批量更新
  scheduleUpdateOnFiber(fiber);
}
```

### 批量更新与调度

React 并不是每次 setState 都立即同步更新，而是采用「批量更新」和「异步调度」：

- 多个 setState 会被合并，减少渲染次数。
- 通过调度优先级机制（如 concurrent mode），保证高优先级任务优先执行。

### 流程图

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

## 虚拟 DOM（Virtual DOM, vdom）

### 虚拟 DOM 的结构

虚拟 DOM 其实就是一个普通的 JS 对象，描述了节点类型、属性、子节点等：

```js
const vnode = {
  type: 'div',
  props: { className: 'box' },
  children: [ ... ]
};
```

### diff 算法

每次 state 变化，React 会：

1. 重新执行组件函数，生成新的虚拟 DOM 树
2. 与上一次的虚拟 DOM 树进行对比（diff）
3. 只把变化的部分同步到真实 DOM（patch）

```js
function diff(oldVNode, newVNode) {
  if (oldVNode.type !== newVNode.type) {
    // 替换整个节点
  } else {
    // 递归对比 props 和 children
  }
}
```

## Fiber 架构

### 一、Fiber 架构的核心目标（为什么要有 Fiber）

React 16 之前（Stack Reconciler）的问题只有一个，但是致命的：

> **渲染是同步递归的，一旦开始就不能停**

后果：

* 大组件树更新 → JS 长任务
* 用户输入、动画被阻塞
* 无法区分“紧急更新 / 非紧急更新”

---

#### Fiber 的本质定义

> **Fiber = React 自己实现的一套「可中断的、可恢复的虚拟调用栈」**

它并不是为了替代 VDOM，而是：

* VDOM：**描述 UI 是什么**
* Fiber：**描述 UI 如何被计算**

---

#### Fiber 带来的能力（不是 VDOM 能解决的）

| 能力             | Fiber 解决 |
| -------------- | -------- |
| 可中断渲染          | ✔        |
| 优先级调度          | ✔        |
| 并发更新           | ✔        |
| Suspense       | ✔        |
| Error Boundary | ✔        |
| 时间分片           | ✔        |

---

### 二、Fiber 节点的完整结构（重点）

一个 Fiber 本质是一个 JS 对象，**结构非常稳定**。

#### 精简但真实的 Fiber 结构

```ts
type Fiber = {
  // ====== 基本信息 ======
  tag: WorkTag
  key: null | string
  elementType: any
  type: any
  stateNode: any

  // ====== Fiber 树结构 ======
  return: Fiber | null   // 父
  child: Fiber | null    // 第一个子
  sibling: Fiber | null  // 下一个兄弟

  // ====== Props / State ======
  pendingProps: any
  memoizedProps: any
  memoizedState: any
  updateQueue: UpdateQueue<any> | null

  // ====== 调度相关 ======
  lanes: Lanes
  childLanes: Lanes

  // ====== 副作用 ======
  flags: Flags
  subtreeFlags: Flags

  // ====== 双缓存 ======
  alternate: Fiber | null
}
```

---

#### Fiber 是「链表 + 树」混合结构

```
父子：child
兄弟：sibling
父指针：return
```

这样做的目的只有一个：

> **用 while 循环代替递归，支持中断和恢复**

---

### 三、一个 Todo 应用的 Fiber 树长什么样？

#### 示例 Todo 应用

```tsx
function App() {
  return <TodoApp />
}

function TodoApp() {
  const [todos, setTodos] = useState([])
  return (
    <>
      <AddTodo />
      <TodoList todos={todos} />
    </>
  )
}

function TodoList({ todos }) {
  return (
    <ul>
      {todos.map(t => <TodoItem key={t.id} todo={t} />)}
    </ul>
  )
}
```

---

#### 对应的 Fiber 树（简化）

```
HostRootFiber
└── AppFiber (FunctionComponent)
    └── TodoAppFiber (FunctionComponent)
        ├── AddTodoFiber (FunctionComponent)
        │   └── HostComponent(div)
        └── TodoListFiber (FunctionComponent)
            └── HostComponent(ul)
                ├── TodoItemFiber (key=1)
                │   └── HostComponent(li)
                ├── TodoItemFiber (key=2)
                │   └── HostComponent(li)
                └── ...
```

#### 关键点

* **函数组件 Fiber 没有 DOM**
* `stateNode`

  * FunctionComponent → `null`
  * HostComponent → DOM 节点
* 列表靠 `key` 保持 Fiber 复用

---

### 四、状态更新后发生了什么（完整调度链路）

假设点击「添加 Todo」：

```ts
setTodos([...todos, newTodo])
```

---

#### 1️⃣ update 被创建（不是立刻更新）

```ts
const update = {
  lane: SyncLane,
  action: newTodos
}
```

被放入：

```
TodoAppFiber.updateQueue
```

---

#### 2️⃣ scheduleUpdateOnFiber

```ts
scheduleUpdateOnFiber(TodoAppFiber, SyncLane)
```

它做了三件事：

#### (1) 向上找到 Root

```ts
TodoAppFiber
→ AppFiber
→ HostRootFiber
```

#### (2) 标记 lane

```ts
root.pendingLanes |= SyncLane
```

#### (3) 调度任务

```ts
ensureRootIsScheduled(root)
```

---

#### 3️⃣ Scheduler 决定何时执行

* 同步更新：立刻
* 低优先级：`requestIdleCallback`
* 并发模式：可中断

---

### 五、Render 阶段（Fiber 的核心）

#### Render = 构建 workInProgress Fiber 树

```
current Fiber Tree
        ↓
workInProgress Fiber Tree
```

---

#### 深度优先遍历（可中断）

```ts
while (workInProgress) {
  performUnitOfWork(workInProgress)
}
```

---

#### 关键点：TodoAppFiber 被重新执行

```ts
function TodoApp() {
  const [todos] = useState()
}
```

#### hooks 处理流程：

* 遍历 hooks 链表
* 执行 updateQueue
* 计算新 `todos`
* 写入 `memoizedState`

---

## TodoList 是否会重新执行？

取决于：

```ts
oldProps.todos === newProps.todos
```

* 新数组 → 引用变 → **重新 render**
* 相同引用 → bailout

---

### 六、Diff（Reconcile）阶段

#### 列表 diff 的核心规则

```ts
key 相同 → 复用 Fiber
key 不同 → 新建 / 删除
```

结果：

* 新 Todo → 新 Fiber（Placement）
* 旧 Todo → Fiber 复用
* 顺序变化 → Placement / Move

---

### 七、Commit 阶段（真正改 DOM）

commit 分三步：

#### 1️⃣ before mutation

* `useLayoutEffect` 清理

#### 2️⃣ mutation

* 插入 DOM
* 删除 DOM
* 更新属性

```ts
if (fiber.flags & Placement) {
  insertDOM()
}
```

#### 3️⃣ layout

* 执行 `useLayoutEffect`

---

### 八、为什么 Fiber 看起来“全树”，但实际很快？

#### 因为三大短路机制：

1. **Lane 剪枝**
2. **Props 引用 bailout**
3. **SubtreeFlags 汇总**

```ts
if (!includesSomeLane(fiber.lanes, renderLanes)) {
  bailout
}
```

---

### 九、一句话总结 Fiber 架构（技术面试级）

> **Fiber 是 React 为了解决“同步递归不可中断”问题而引入的调度层**
> **它用链表化的树结构模拟调用栈**
> **通过 lanes、flags、双缓存，使 React 可以在保证一致性的前提下实现并发渲染和最小 DOM 更新**

---


## JSX

### JSX 的本质

JSX 只是语法糖，最终会被 Babel 等工具编译为 React.createElement 调用。

```jsx
const element = <h1>Hello, world!</h1>;
// 编译后：
const element = React.createElement("h1", null, "Hello, world!");
```

### React.createElement 源码简析

核心作用：生成一个 JS 对象（虚拟 DOM）

```js
function createElement(type, config, ...children) {
  return {
    type,
    props: { ...config, children },
  };
}
```

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

### 其他 hooks（useRef/useReducer/useMemo 等）

#### useRef

```js
function useRef(initialValue) {
  const hook = mountWorkInProgressHook();
  if (hook.memoizedState === null) {
    hook.memoizedState = { current: initialValue };
  }
  return hook.memoizedState;
}
```

