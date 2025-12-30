# 超时检测

通常我们限制一个任务的超时时间会采用promise.race来做

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>

<body>
    <script>
        function timeout(ms) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({ timeout: true });
                }, ms);
            });
        }
        function fetchData() {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({ name: 'zhangsan' });
                }, 1000);
            });
        }
        Promise.race([timeout(2000), fetchData()]).then((res) => {
            console.log(res)
            if (res.timeout) {
                console.log('超时，终止后续操作');
            } else {
                console.log('done', res);
            }
        });
    </script>
</body>

</html>
```

# 中断fetch或者一些异步操作

## AbortController 用法梳理与案例
 1. 创建 controller
 2. 获取 signal 传给 fetch
 3. 需要中断时调用 controller.abort()
 4. fetch 会抛出 AbortError，可用 try/catch 捕获

如果是promise需要手动检测single状态。

除了 fetch，以下 Web API 也原生支持 AbortSignal（signal）：

- XMLHttpRequest（open/send 方法，部分实现支持）
- ReadableStream、WritableStream、TransformStream（流操作相关 API）
- WebSocket（部分新标准实现）
- navigator.sendBeacon（部分实现）
- Web Locks API（navigator.locks.request）
- WebTransport、WebCodecs、WebUSB、WebBluetooth 等新兴 API
- 部分第三方库（如 axios、node-fetch）也支持传入 signal

主流用法还是 fetch、流、部分新 API。只要文档说明支持 signal: AbortSignal 的 API，都能用 controller.abort() 实现中断。标准会逐步推广到更多异步 API。

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>

<body>
    <button id="start">开始</button>
    <button id="cancel">取消</button>
</body>
<script>
    const startBtn = document.getElementById('start');
    const cancelBtn = document.getElementById('cancel');

    let controller;

    startBtn.onclick = () => {
        controller = new AbortController();
        const signal = controller.signal;

        // 自定义一个可中断的延迟 Promise
        function delay(ms, signal) {
            return new Promise((resolve, reject) => {
                const timer = setTimeout(() => {
                    resolve('延迟完成');
                }, ms);
                if (signal) {
                    signal.addEventListener('abort', () => {
                        clearTimeout(timer);
                        reject(new DOMException('Aborted', 'AbortError'));
                    });
                }
            });
        }

        delay(5000, signal)
            .then(data => {
                console.log('操作成功:', data);
            })
            .catch(err => {
                if (err.name === 'AbortError') {
                    console.log('操作被取消');
                } else {
                    console.error('操作失败:', err);
                }
            });
    };

    cancelBtn.onclick = () => {
        if (controller) {
            controller.abort();
        }
    };
</script>

</html>
```


# 结论：别再试图 “杀掉 Promise”JavaScript 中的取消机制
与其他语言的预期完全不同。Promise 是对未来结果的不可变占位符，而不是对 “执行任务” 的控制句柄。语言本身没有提供强制终止工作的机制，试图那样做往往会让代码变得脆弱且难以预测。
相反，JavaScript 通过 AbortController 与 AbortSignal 提供了协作式取消。
它们允许我们：
- 传达 “任务不再需要” 的信号；
- 清理诸如网络连接、数据流、文件句柄等资源；
- 让任务在检测到信号时主动退出。

核心理念是：
> 取消是一种 “意图”，不是 “强制”。工作只有在执行它的代码检测到信号并响应时才会停止。CPU 密集型循环、同步代码或未配合的逻辑仍会继续运行，直到自然完成。

通过接受这种模型：
- API 更加可预测、可组合；
- 资源泄漏与副作用最小化；异步代码能优雅地处理用户触发的中断。

最终，JavaScript 的取消机制并不是在 “杀掉 Promise”，而是在让任务具备响应性和协作性。理解这一点，能帮助开发者编写出健壮、可维护的异步代码，而无需与语言的执行模型作斗争。
