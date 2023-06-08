const obj = { text: 'hello world' }
function effect() {
    // effect 函数的执行会读取 obj.text
    document.body.innerText = obj.text
}

obj.text = 'hello vue3' // 修改 obj.text 的值，同时希望副作用函数会重新执行

// 很明显，以上修改页面不会有任何反应