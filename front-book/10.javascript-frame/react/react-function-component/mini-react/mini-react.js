let wipFiber = null; // 当前正在 render 的 function fiber
let hookIndex = 0; // 当前是第几个 hook
let currentRoot = null;
let pendingEffects = []; // 本次 render 产生的 effect
const PLACEMENT = "PLACEMENT"; // 新增
const UPDATE = "UPDATE";       // 属性变化
const DELETION = "DELETION";   // 删除
let deletions = [];


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
    effectTag: null,   // 👈 新增
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

function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(currentRoot.child);
  deletions = [];
}

function commitWork(fiber) {
  if (!fiber) return;

  let parentDomFiber = fiber.parent;
  while (!parentDomFiber.dom) {
    parentDomFiber = parentDomFiber.parent;
  }
  const parentDom = parentDomFiber.dom;

  if (fiber.effectTag === PLACEMENT && fiber.dom != null) {
    parentDom.appendChild(fiber.dom);
  }

  if (fiber.effectTag === UPDATE && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }

  if (fiber.effectTag === DELETION) {
    commitDeletion(fiber, parentDom);
    return;
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber, parentDom) {
  if (fiber.dom) {
    parentDom.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, parentDom);
  }
}

function updateDom(dom, prevProps, nextProps) {
  // 删除旧事件
  Object.keys(prevProps)
    .filter(name => name.startsWith("on"))
    .forEach(name => {
      const event = name.toLowerCase().substring(2);
      dom.removeEventListener(event, prevProps[name]);
    });

  // 删除旧属性
  Object.keys(prevProps)
    .filter(name => name !== "children" && !nextProps[name])
    .forEach(name => {
      dom[name] = "";
    });

  // 设置新属性
  Object.keys(nextProps)
    .filter(name => name !== "children" && !name.startsWith("on"))
    .forEach(name => {
      dom[name] = nextProps[name];
    });

  // 添加新事件
  Object.keys(nextProps)
    .filter(name => name.startsWith("on"))
    .forEach(name => {
      const event = name.toLowerCase().substring(2);
      dom.addEventListener(event, nextProps[name]);
    });
}

function reconcileChildren(wipFiber, elements = []) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  while (index < elements.length || oldFiber) {
    const element = elements[index];
    let newFiber = null;

    const sameType =
      oldFiber &&
      element &&
      element.type === oldFiber.type;

    // ✅ UPDATE
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: UPDATE,
      };
    }

    // ✅ PLACEMENT
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: PLACEMENT,
      };
    }

    // ✅ DELETION
    if (oldFiber && !sameType) {
      oldFiber.effectTag = DELETION;
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (prevSibling && newFiber) {
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
  // 第一次是root fiber
  if (typeof fiber.type === "function") {
    // 🔑 标记当前正在 render 的 fiber
    wipFiber = fiber;
    hookIndex = 0;
    wipFiber.hooks = [];
    // 开始执行函数组件，并获取到vdom,useState/useRef 都会在这个过程中被调用
    // const children = [fiber.type(fiber.props)];
    const result = fiber.type(fiber.props);
    const children = Array.isArray(result) ? result : [result];

    // 执行过程中会调用 useState/useRef，产生 hooks ,当前的wipFiber里面会保存这些hooks
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
    props: { children: [element] },
    alternate: currentRoot,
  };

  deletions = [];
  currentRoot = rootFiber;

  let nextUnitOfWork = rootFiber;
  while (nextUnitOfWork) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }

  commitRoot(); // 🔥
}

const MiniReact = {
  createElement,
  render,
};

function useState(initialState) {
  const currentIndex = hookIndex; // ⭐ 固定住这个 hook 的位置

  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[currentIndex];

  const hook = {
    state: oldHook ? oldHook.state : initialState,
    queue: [],
  };

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = typeof action === "function" ? action(hook.state) : action;
  });

  const setState = (action) => {
    // ⭐ 永远操作「这个 hook 对应的 queue」
    const queue =
      wipFiber.alternate?.hooks?.[currentIndex]?.queue ??
      hook.queue;

    queue.push(action);
    rerender();
  };

  wipFiber.hooks.push(hook);
  hookIndex++;

  return [hook.state, setState];
}

function useEffect(effect, deps) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  let hasChanged = true;

  if (oldHook && deps) {
    hasChanged = deps.some(
      (dep, i) => !Object.is(dep, oldHook.deps[i])
    );
  }

  const hook = {
    effect,
    deps,
    cleanup: oldHook ? oldHook.cleanup : null,
  };

  if (hasChanged) {
    pendingEffects.push(hook);
  }

  wipFiber.hooks.push(hook);
  hookIndex++;
}

function useRef(initialValue) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  const hook = {
    current: oldHook ? oldHook.current : initialValue,
  };

  wipFiber.hooks.push(hook);
  hookIndex++;

  return hook;
}

function commitEffects() {
  pendingEffects.forEach((hook) => {
    // 1️⃣ 先清理上一次 effect
    if (hook.cleanup) {
      hook.cleanup();
    }

    // 2️⃣ 执行本次 effect
    const cleanup = hook.effect();

    // 3️⃣ 保存 cleanup（给下次用）
    hook.cleanup = typeof cleanup === "function" ? cleanup : null;
  });

  // 4️⃣ 清空
  pendingEffects = [];
}

function createContext(defaultValue) {
  const context = {
    _currentValue: defaultValue,
    Provider: null,
  };

  context.Provider = function Provider(props) {
    context._currentValue = props.value;
    return props.children;
  };

  return context;
}

function useContext(context) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  const hook = {
    value: context._currentValue,
  };

  wipFiber.hooks.push(hook);
  hookIndex++;

  return hook.value;
}


const CountContext = createContext(0);

function App() {
  const [count, setCount] = useState(0);


  return MiniReact.createElement(
    CountContext.Provider,
    { value: count },
    MiniReact.createElement(Child, null),
    MiniReact.createElement(
      "button",
      { onclick: () => setCount((c) => c + 1) },
      "Add"
    )
  );
}

function Child() {
  const count = useContext(CountContext);
  return MiniReact.createElement("div", null, "From context: ", count);
}

// TodoApp 实际是一个的函数组件，type 是函数
const element = createElement(App, null);

function rerender() {
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
