const effectStack = [];

function subscribe(effect, subs) {
  // 将 effect 添加到 subs 中，并将 subs 添加到 effect 的 deps 中
  // 这样可以在 effect 执行时自动收集依赖项
  // 当状态更新时，通知所有订阅的 effect 执行
  // 这里的 subs 是一个 Set，用于存储所有订阅的 effect
  // 这样可以避免重复订阅同一个 effect
  // 当 effect 执行时，会遍历 subs 中的所有 effect，并执行它们
  // 这样可以实现响应式编程的效果
  // 订阅关系是双向的，effect 可以订阅 subs，subs 也可以订阅 effect
  subs.add(effect);
  effect.deps.add(subs);
}

function clean(effect) {
  // 清理 effect 的依赖项
  // 遍历 effect 的 deps 中的所有 subs，将 effect 从 subs 中删除
  for (const subs of effect.deps) {
    subs.delete(effect);
  }
  // 清空 effect 的 deps
  effect.deps.clear();
}

function useState(value) {
  const subs = new Set();
  const getter = () => {
    const effect = effectStack[effectStack.length - 1];
    if (effect) {
      subscribe(effect, subs);
    }
    return value;
  };
  const setter = (newValue) => {
    value = newValue;
    for (const effect of [...subs]) {
      effect.execute();
    }
  };
  return [getter, setter];
}

function useEffect(callback) {
  const effect = {
    execute,
    deps: new Set(),
  };
  const execute = () => {
    // 执行 effect 时，先清理依赖项
    // 这样可以避免重复订阅同一个 effect
    clean(effect);
    // 将 effect 添加到 effectStack 中
    // effectStack 是一个栈，用于存储当前正在执行的 effect
    effectStack.push(effect);
    try {
      // 执行回调函数
      // 在回调函数中可以访问当前状态值，并自动收集依赖项
      callback();
    } finally {
      effectStack.pop();
    }
  };
  // 首次执行时自动收集依赖项
  execute();
}

function useMemo(callback) {
  const [s, set] = useState();
  useEffect(() => {
    set(callback());
  });
  return s;
}

const [state, setState] = useState(0);
const [state2, setState2] = useState(0);

useEffect(() => {
  // 自动收集依赖项
  console.log(state());
});

useEffect(() => {
  // 自动收集依赖项
  console.log(state2());
});

const whoIsHere = useMemo(() => {
  if (!showAll()) {
    return state();
  }
  return `${state()}和${state1()}`;
});

setState(1);
setState2(2);
