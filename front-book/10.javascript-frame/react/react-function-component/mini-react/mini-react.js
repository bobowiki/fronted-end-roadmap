let wipFiber = null; // 当前正在 render 的 function fiber
let hookIndex = 0; // 当前是第几个 hook
let currentRoot = null;

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

function createTextElement(text) {
  return {
    type: "TEXT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

function createFiber(element, parent) {
  return {
    type: element.type,
    props: element.props || { children: [] },
    parent,
    child: null,
    sibling: null,
    dom: null,
    alternate: null,
  };
}

function createDom(fiber) {
  if (fiber.type === "TEXT") {
    return document.createTextNode("");
  }

  const dom = document.createElement(fiber.type);

  Object.keys(fiber.props)
    .filter((key) => key !== "children")
    .forEach((name) => {
      dom[name] = fiber.props[name];
    });

  return dom;
}

function reconcileChildren(fiber, elements = []) {
  let index = 0;
  let prevSibling = null;

  let oldFiber = fiber.alternate && fiber.alternate.child;

  while (index < elements.length) {
    const element = elements[index];
    if (!element) {
      index++;
      continue;
    }

    const newFiber = createFiber(element, fiber);

    // 🔥 关键：建立 alternate
    if (oldFiber) {
      newFiber.alternate = oldFiber;
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
}

function getParentDom(fiber) {
  let parent = fiber.parent;
  while (parent && !parent.dom) {
    parent = parent.parent;
  }
  return parent ? parent.dom : null;
}

function performUnitOfWork(fiber) {
  if (typeof fiber.type === "function") {
    // 🔑 标记当前正在 render 的 fiber
    wipFiber = fiber;
    hookIndex = 0;
    wipFiber.hooks = [];
    // 开始执行函数组件，并获取到vdom
    const children = [fiber.type(fiber.props)];
    console.log("🚀 row: 103 - col: 1 hookIndex -> ", hookIndex);
    console.log("🚀 row: 104 - col: 6 wipFiber.hooks -> ", wipFiber.hooks);
    reconcileChildren(fiber, children);
  } else {
    // 第一步传入的fiber是root fiber且dom = container
    if (!fiber.dom) {
      if (fiber.type === "TEXT") {
        fiber.dom = document.createTextNode(fiber.props.nodeValue);
      } else {
        fiber.dom = createDom(fiber);
      }
    }
    // 第一次执行时root fiber 没有parent
    const parentDom = getParentDom(fiber);
    if (parentDom) {
      parentDom.appendChild(fiber.dom);
    }

    // 所以直接执行的是reconcileChildren，构建子fiber链表
    reconcileChildren(fiber, fiber.props.children || []);
  }

  // rootFiber = {
  //   type: undefined,
  //   dom: container,
  //   props: {
  //     children: [ /* React Element */ ]
  //   },
  //   parent: null,
  //   child: {
  //     type: TodoApp,          // ⚠️ function
  //     props: {
  //       children: []
  //     },
  //     parent: rootFiber,
  //     child: null,
  //     sibling: null,
  //     dom: null
  //   },
  //   sibling: null
  // }

  if (fiber.child) return fiber.child;

  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling;
    nextFiber = nextFiber.parent;
  }
}

function render(element, container) {
  const rootFiber = {
    dom: container,
    props: {
      children: [element],
    },
    parent: null,
    child: null,
    sibling: null,
    alternate: currentRoot,
  };

  currentRoot = rootFiber;

  let nextUnitOfWork = rootFiber;
  while (nextUnitOfWork) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
}

const MiniReact = {
  createElement,
  render,
};

function useState(initialState) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  const hook = {
    state: oldHook ? oldHook.state : initialState,
    queue: [],
  };

  // 执行上一次 render 遗留的更新
  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = typeof action === "function" ? action(hook.state) : action;
  });

  const setState = (action) => {
    hook.queue.push(action);
    // 🔥 触发重新 render（最粗暴版本）
    rerender();
  };

  wipFiber.hooks.push(hook);
  hookIndex++;

  return [hook.state, setState];
}

function TodoApp() {
  const [count, setCount] = useState(0);
  return MiniReact.createElement(
    "div",
    null,
    MiniReact.createElement("h3", null, "Count: ", count),
    MiniReact.createElement(
      "button",
      { onclick: () => setCount((c) => c + 1) },
      "Add"
    )
  );
}

// TodoApp 实际是一个的函数组件，type 是函数
const element = createElement(TodoApp, null);

function rerender() {
  document.getElementById("root").innerHTML = "";
  render(currentRoot.props.children[0], currentRoot.dom);
}
render(element, document.getElementById("root"));

/*
setState 更新流程：
1. 用户点击
   ↓
2. setState(action)
   ↓
3. action 被 push 到当前 hook.queue
   ↓
4. 调度一次更新（schedule）
   ↓
5. 从 Root Fiber 开始 render
   ↓
6. 进入 TodoApp Fiber
   ↓
7. 执行 TodoApp()
   ↓
8. useState:
   - 从 alternate.hooks 读取旧 state
   - 执行 queue 得到新 state
   - 生成新的 hook
   ↓
9. TodoApp return React Element
   ↓
10. reconcile children，构建新 Fiber
   ↓
11. render 完成
   ↓
12. commit 阶段：
   - 对比新旧 Fiber
   - 更新 DOM

props更新流程

function App() {
  const [count, setCount] = useState(0);
  return <TodoApp count={count} />;
}

function TodoApp({ count }) {
  return <div>{count}</div>;
}

1. 用户点击
   ↓
2. App.setState(action)
   ↓
3. action push 到 App hook.queue
   ↓
4. schedule 更新（root）
   ↓
5. 从 Root Fiber 开始 render
   ↓
6. 进入 App Fiber
   ↓
7. 执行 App()
   ↓
8. App.useState:
   - 从 alternate.hooks 读旧 state
   - 执行 queue 得到新 state
   ↓
9. App return React Element
   <TodoApp count={newCount} />
   ↓
10. reconcile App.children
   ↓
11. 进入 TodoApp Fiber
   ↓
12. 执行 TodoApp(props)
   props.count = newCount
   ↓
13. TodoApp return React Element
   ↓
14. reconcile children
   ↓
15. render 完成
   ↓
16. commit：
   - 对比 props
   - 更新 DOM


*/
