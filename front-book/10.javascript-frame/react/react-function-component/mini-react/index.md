
> **把“一次 Todo 更新”中，Fiber 结构是如何一步一步变化的，说清楚、画清楚、对齐代码清楚。**

我会 **严格按时间顺序** 来，不跳步、不抽象，不用 React 官方黑话。

---

# 一、示例代码（作为“唯一世界观”）

我们只讨论这个最小 Todo（一个 state）：

```js
function TodoApp() {
  const [todos, setTodos] = useState(["Learn Fiber"]);
  return createElement(
    "div",
    null,
    createElement("h3", null, "Todo"),
    createElement(
      "ul",
      null,
      ...todos.map(t => createElement("li", null, t))
    ),
    createElement(
      "button",
      { onclick: () => setTodos(prev => [...prev, "New Todo"]) },
      "Add"
    )
  );
}
```

---

# 二、首次 render：Fiber 是怎么「长出来」的

## Step 0：调用 render

```js
render(<TodoApp />, container)
```

创建 **Root Fiber**：

```js
rootFiber = {
  type: undefined,
  dom: container,
  props: {
    children: [ <TodoApp /> ]
  },
  parent: null,
  child: null,
  sibling: null,
  alternate: null
}
```

⚠️ 此时 **还没有 TodoApp Fiber**

---

## Step 1：performUnitOfWork(rootFiber)

### rootFiber 是 HostRoot（不是函数）

进入 else 分支：

* `fiber.dom` 已存在（container）
* 不 append
* 调用：

```js
reconcileChildren(rootFiber, [ <TodoApp /> ])
```

---

## Step 2：reconcileChildren(rootFiber)

创建 **TodoApp Fiber**：

```js
todoAppFiber = {
  type: TodoApp,          // 👈 函数组件
  props: {},
  parent: rootFiber,
  child: null,
  sibling: null,
  dom: null,
  hooks: undefined,
  alternate: null
}
```

此时 Fiber 树是：

```
rootFiber
└── todoAppFiber
```

---

## Step 3：performUnitOfWork(todoAppFiber)

### 这是关键转折点

```js
if (typeof fiber.type === "function") {
  wipFiber = fiber;     // 👈 指向 todoAppFiber
  hookIndex = 0;
  wipFiber.hooks = [];  // 👈 hooks 在这里被初始化
```

---

## Step 4：执行组件函数

```js
const children = [ TodoApp() ];
```

⚠️ **从这一刻开始，useState 才会运行**

---

# 三、useState 执行时，Fiber 的变化（重点）

## Step 5：第一次 useState

```js
const [todos, setTodos] = useState(["Learn Fiber"]);
```

### 当前环境

```js
wipFiber === todoAppFiber
hookIndex === 0
wipFiber.hooks === []
```

---

### 读取旧 hook

```js
oldHook = wipFiber.alternate?.hooks?.[0]  // null
```

---

### 创建新 hook

```js
hook = {
  state: ["Learn Fiber"],
  queue: []
}
```

---

### 存到哪里？

```js
wipFiber.hooks.push(hook)
hookIndex++
```

此时 **todoAppFiber 变成**：

```js
todoAppFiber = {
  type: TodoApp,
  ...
  hooks: [
    {
      state: ["Learn Fiber"],
      queue: []
    }
  ]
}
```

⚠️ **hooks 永远属于 Fiber，不属于 render，不属于全局**

---

## Step 6：TodoApp return VDOM

返回的是一个 React Element：

```js
{
  type: "div",
  props: {
    children: [
      <h3 />,
      <ul />,
      <button />
    ]
  }
}
```

---

## Step 7：reconcileChildren(todoAppFiber)

创建 DOM Fiber：

```
todoAppFiber
└── divFiber
    ├── h3Fiber
    ├── ulFiber
    │   └── liFiber
    └── buttonFiber
```

---

## Step 8：DFS 继续，创建 DOM & append

在后续 `performUnitOfWork` 中：

* 为 `"div"`, `"h3"`, `"ul"`, `"li"`, `"button"` 创建 DOM
* append 到 parent DOM

---

## ✅ 首次 render 结束后，Fiber 全景快照

```
rootFiber
└── todoAppFiber
    ├── hooks[0]: { state: ["Learn Fiber"], queue: [] }
    └── div
        ├── h3
        ├── ul
        │   └── li("Learn Fiber")
        └── button
```

---

# 四、点击 Add：Fiber 是如何变化的（重点）

## Step 9：点击按钮

```js
setTodos(prev => [...prev, "New Todo"])
```

---

## Step 10：setState 做了什么？

```js
// 这里的hook本质是一个闭包，保存了之前fiber.hooks里面的hook引用地址，所以这里本质是在朝着对应的hook链表里面去push action
hook.queue.push(action)
rerender()
```

⚠️ 注意：

* **queue 被 push 到旧 hook**
* 这个 hook 属于 **当前 Fiber（旧树）**

---

## Step 11：rerender → render 再次执行

```js
render(<TodoApp />, container)
```

创建 **新的 Root Fiber**：

```js
newRootFiber = {
  ...
  alternate: oldRootFiber
}
```

---

## Step 12：新 TodoApp Fiber 被创建

```js
newTodoAppFiber = {
  type: TodoApp,
  ...
  hooks: [],
  alternate: oldTodoAppFiber
}
```

---

## Step 13：再次执行 TodoApp()

```js
wipFiber = newTodoAppFiber
hookIndex = 0
```

---

## Step 14：useState 再次执行（核心）

```js
oldHook = wipFiber.alternate.hooks[0]
```

即：

```js
oldHook = {
  state: ["Learn Fiber"],
  queue: [ action ]
}
```

---

### 执行 queue

```js
hook.state = oldHook.state
actions.forEach(action => {
  // 这里的hook.state就是老的state
  hook.state = action(hook.state)
})
```

结果：

```js
hook.state = ["Learn Fiber", "New Todo"]
```

---

### 新 Fiber 上的 hooks 变成：

```js
newTodoAppFiber.hooks = [
  {
    state: ["Learn Fiber", "New Todo"],
    queue: []
  }
]
```

⚠️ **旧 Fiber 的 hooks 不再使用**

---

## Step 15：返回新 VDOM → 新 Fiber 树 → DOM 更新

最终：

```
oldTodoAppFiber  ❌（被 alternate 链接）
newTodoAppFiber  ✅（成为 current）
```

---

# 五、一句话终极总结（非常重要）

> **Fiber 是“组件的一次 render 实例”**
> **Hooks 是挂在 Fiber 上的状态快照**
> **setState 不是改 Fiber，而是触发“创建一个新 Fiber”**
