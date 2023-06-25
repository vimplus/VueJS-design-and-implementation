### 第3章 Vue.js 3 的设计思路

#### 3.1 声明式地描述 UI

编写前端涉及到的内容包括：**DOM元素、属性、事件、层级结构**等。

Vue.js 3 是一个声明式的 UI 框架，意味着用户在使用 Vue.js 3 开发页面时是声明式地描述 UI 的。比如：

1. 使用与 HTML 标签一致的方式来描述 DOM 元素，例如描述一个 div 都是使用 <div></div>；
2. 使用与 HTML 标签一致的方式来描述属性，例如 <div id="root"></div>；
3. 使用 : 或 v-bind 来描述动态绑定的属性，例如 <div :class="cls"></div>；
4. 使用 @ 或 v-on 来描述事件，例如 <div @click="handler"></div>；
5. 使用与 HTML 标签一致的方式来描述层级结构，例如<div><span></span></div>。

除了上面这种使用模板来描述 UI 之外，我们还可以用 JavaScript 对象的形式来描述：

```javascript
const title = {
  // 标签名称
  tag: 'h1',
  // 标签属性
  props: {
    onClick: () => handler
  },
  // 子节点
  children: [
    { tag: 'span' }
  ]
}
```

它对应的 Vue.js 模板就是：

```html
<h1 @click="handler"><span></span></h1>
```

**使用 JavaScript 对象的形式来描述 UI 会更加灵活**，比如我们需要描述一个标题，根据标题级别的不同会采用 h1-h6 这几个标签，如果使用 JavaScript 对象形式来描述，我们只需要使用一个变量来表示 h 标签即可：

```javascript
let level = 3
const title = {
  tag: `h${level}`
}
```

而使用模板来描述，我们就不得不穷举：

```html
<h1 v-if="level === 1"></h1>
<h2 v-else-if="level === 2"></h2>
<h3 v-else-if="level === 3"></h3>
<h4 v-else-if="level === 4"></h4>
<h5 v-else-if="level === 5"></h5>
<h6 v-else-if="level === 6"></h6>
```

这远远没有使用 JavaScript 对象的形式灵活。

而使用 JavaScript 对象的形式来描述 UI 的方式，就是所谓的虚拟 DOM。

正是因为虚拟 DOM 的灵活性，Vue.js 3 除了支持使用模板描述 UI 外，还支持使用虚拟 DOM 的形式。其实我们在组件中手写渲染函数就是使用虚拟 DOM 来描述 UI 的：

```javascript
import { h } from 'vue'

export default {
	render () {
    return h('h1', { onClick: handler })
  }
}
```

`h()` 函数的返回值就是一个对象，其作用是让我们编写虚拟 DOM 更加轻松。如果把上面的 `h()` 函数调用的代码改成 JavaScript 对象，就需要写更多的内容：

```javascript
import { h } from 'vue'

export default {
	render () {
    return {
    	tag: 'h1',
        props: {
            onClick: handler
        }
    }
  }
}
```

##### 小结

* 编写前端页面涉及到的内容包括：**DOM元素、属性、事件、层级结构**等。
* 使用 JavaScript 对象的形式来描述 UI 会更加灵活，这种方式就是所谓的**虚拟 DOM**；
* **h 函数就是一个辅助创建虚拟 DOM 的工具函数**，`h()` 函数的返回值就是一个对象，其作用是让我们编写虚拟 DOM 更加轻松。

#### 3.2 初识渲染器

**渲染器的作用就是把虚拟 DOM 渲染为真实 DOM。**

假设我们有如下的虚拟 DOM：

```javascript
const vnode = {
  tag: 'div',
  props: {
    onClick: () => console.log('Hello world.')
  },
  children: 'Click me'
}
```

我们需要编写一个渲染器，把上面的代码渲染成真实 DOM：

```javascript
function renderer(vnode, container) {
  const el = document.createElement(vnode.tag)

  // 处理属性
  for (let key in vnode.props) {
    // 如果是以 on 开头，说明是一个事件
    if (/^on/.test(key)) {
      el.addEventListener(
        key.substr(2).toLowerCase(),
        vnode.props[key]
      )
    }
  }

  // 处理 children
  if (typeof vnode.children === 'string') {
    el.appendChild(document.createTextNode(vnode.children))
  } else if (Array.isArray(vnode.children)) {
    // 递归调用 renderer 来渲染子节点
    vnode.children.forEach(child => renderer(child, el))
  }

  container.appendChild(el)
}
```

在浏览器中运行这段代码，会渲染出 Click me 文本，点击该文本后会在控制台打印 Hello world.

渲染器的实现思路，总体分成三步：

* 创建元素；
* 添加属性和事件；
* 处理子节点。

我们刚才做的仅仅是创建节点，而**渲染器的精髓在于更新节点的阶段**。假设我们对 vnode 做一些小修改：

```javascript
const vnode = {
  tag: 'div',
  props: {
    onClick: () => console.log('Hello world.')
  },
  children: 'Click again' // 从 Click me 变成 Click again
}
```

对于渲染器来说，它需要精确地找到 vnode 对象的变更点并且只更新变更的内容。就上例来说，渲染器应该只更新元素的文本内容，而不需要再走一遍完整的流程。

#### 3.3 组件的本质

虚拟 DOM 除了能够描述真实 DOM 之外，还能够描述组件。

**组件的本质就是一组 DOM 元素的封装**，这组 DOM 元素就是组件要渲染的内容。
因此我们可以定义一个函数来代表组件：

```javascript
const myComponent = function () {
  return {
    tag: 'div',
    props: {
      onClick: () => console.log('Hello world.')
    },
    children: 'Click me'
  }
}
```

可以看到，组件的返回值也是一个虚拟 DOM，它代表组件要渲染的内容。搞清楚了组件的本质，我们就可以用虚拟 DOM 来描述组件了。我们可以让虚拟 DOM 中的 tag 属性来存储函数组件：

```javascript
const vnode = {
  tag: myComponent
}
```

就像 `{ tag: 'div' }` 来描述 div 标签一样，使用 `{ tag: myComponent }` 来描述组件，只不过 tag 的值不再是一个标签名称，而是一个组件函数。为了能够渲染这样的虚拟 DOM，我们需要对 `renderer()` 进行一些修改：

```javascript
function renderer (vnode, container) {
  if (typeof vnode.tag === 'string') {
    mountElement(vnode, container)
  } else if (typeof vnode.tag === 'function') {
    mountComponent(vnode, container)
  }
}
```

而 `mountElement()` 函数就和之前的 `renderer()` 函数一样：

```javascript
function mountElement (vnode, container) {
  const el = document.createElement(vnode.tag)

  // 处理属性
  for (let key in vnode.props) {
    // 如果是以 on 开头，说明是一个事件
    if (/^on/.test(key)) {
      el.addEventListener(
        key.substr(2).toLowerCase(),
        vnode.props[key]
      )
    }
  }

  // 处理 children
  if (typeof vnode.children === 'string') {
    el.appendChild(document.createTextNode(vnode.children))
  } else if (Array.isArray(vnode.children)) {
    // 递归调用 renderer 来渲染子节点
    vnode.children.forEach(child => renderer(child, el))
  }

  container.appendChild(el)
}
```

而 `mountComponent()` 的实现也很简单：

```javascript
function mountComponent (vnode, container) {
  // 通过调用组件函数，获取组件需要渲染的内容（虚拟 DOM）
  const subtree = vnode.tag()
  renderer(subtree, container)
}
```

这样子，我们的 `renderer()` 函数也支持了只组件的渲染了。

组件一定得是函数吗？当然不是，我们完全可以使用一个 JavaScript 对象来描述一个组件：

```javascript
const myComponent = {
  render () {
    return {
      tag: 'div',
      props: {
        onClick: () => console.log('Hello world.')
      },
      children: 'Click me'
    }
  }
}
```

该对象拥有一个 `render()` 函数，它的返回值是一个虚拟 DOM。

为了完成对这种组件的渲染，我们需要修改一下 `renderer()` 函数和 `mountComponent()` 函数：

```javascript
function renderer (vnode, container) {
  if (typeof vnode.tag === 'string') {
    mountElement(vnode, container)
  } else if (typeof vnode.tag === 'object') { // 如果是对象，说明 vnode 描述的是组件
    mountComponent(vnode, container)
  }
}

function mountComponent (vnode, container) {
  // 通过调用组件的渲染函数，获取组件需要渲染的内容（虚拟 DOM）
  const subtree = vnode.tag.render()
  renderer(subtree, container)
}
```

#### 3.4 模板的工作原理

将 **模板转换成虚拟 DOM** 的工作是由 Vue.js 中的另一个重要组件部分：**编译器** 来实现的。

例如以下模板：

```javascript
<div @click="handler">
  Click me
</div>
```

对于编译器来说，**模板就是一个普通的字符串**，它会分析该字符串并生成一个功能与之相同的渲染函数：

```javascript
render () {
  return h('div', { onClick: handler }, 'Click me')
}
```

以我们熟悉的 Vue 组件为例：

```javascript
<template>
  <div @click="handler">
    Click me
  </div>
</template>

<script>
export default {
  data () {/* ... */},
  methods: {
    handler () {/* ... */}
  }
}
</script>
```

其中 `<tempalte></template>` 中的内容就是模板内容，编译器会把该内容编译成渲染函数并添加到 `<script>` 标签块的组件对象中：

```javascript
export default {
  data () {/* ... */},
  methods: {
    handler () {/* ... */}
  },
  render () {
    return h('div', { onClick: handler }, 'Click me')
  }
}
```

所以，对于一个组件来说:

> 无论是使用模板还是手写渲染函数，它要渲染的内容最终都是通过渲染函数产生的，然后渲染器再把渲染函数返回的虚拟 DOM 渲染成真实 DOM，这就是模板的工作原理，也是 Vue.js 渲染页面的流程。

#### 3.5 Vue.js 是各个模块组成的有机整体

如前面所述，**组件的实现依赖于渲染器，模板的编译依赖于编译器**，并且编译后生成的代码是根据渲染器和虚拟 DOM 的设计而决定的，因此 **Vue.js 的各个模块之间是相互关联、相互制约的，共同构成一个有机体**。

> 模板 --[编译器]--> 渲染函数 --[渲染器]--> 真实DOM

假设我们有如下的模板：

```html
<div id="foo" :class="cls"></div>
```

通过编译器，这段代码会变成：

```javascript
export default {
  render () {
    // 为了更直观显示，我们使用虚拟 DOM 对象来描述
    // 等价于：h('div', { id: 'foo', class: cls })
    return {
      tag: 'div',
      props: {
        id: 'foo',
        class: cls
      }
    }
  }
}
```

这段代码中的 cls 是一个变量，它随时可能发生变化。我们知道渲染器的作用之一是寻找并只更新变化的内容，所以当变量 cls 变化时，渲染器会自行寻找变更点。

从渲染器的角度上看，寻找出这样一个变化点需要花费一些力气。而从编译器的角度看，可以很容易的看出模板中会出现变化的点。

我们都知道 Vue.js 的模板是有特点的，拿上面的模板来说，我们一眼就能看出 id 是一个固定的值，不会发生改变；而通过 `:` 或者 `v-bind` 来绑定的 class 它是可能会发生变化的。所以编译器是可以识别出哪些是静态属性，哪些是动态属性，因此我们在生成代码时完全可以附带上这一点：

```javascript
export default {
  render () {
    return {
      tag: 'div',
      props: {
        id: 'foo',
        class: cls
      },
      patchFlag: 1 // 假设数字 1 是表示 class 是动态的
    }
  }
}
```

如上面的代码所示，虚拟 DOM 中多了一个属性 `patchFlag` 用于描述某个属性它是动态的，可能会发生变化的。那么渲染器就可以省去了寻找变量点的工作量，性能自然就提升了。

#### 3.6 总结

* Vue.js 是一个声明式的框架。
* 声明式的好处：**直接描述结果，用户不需要关注过程**;
* Vue.js 既模板又支持使用虚拟 DOM 的形式来描述 UI；
* 虚拟 DOM —— 更加灵活；模板 —— 更加直观；
* 渲染器的作用 —— 把虚拟 DOM 对象渲染为真实 DOM 元素。
* 渲染器的工作原理 —— **递归地遍历虚拟 DOM 对象，并调用原生DOM API 来完成真实 DOM 的创建**。
* **组件其实就是一组虚拟 DOM 元素的封装**，它可以是**一个返回虚拟 DOM 的函数，也可以是一个对象**，但这个对象下必须要有一个函数用来产出组件要渲染的虚拟 DOM。
* Vue.js 的模板会被一个叫作**编译器**的程序**编译为渲染函数**；
* 编译器、渲染器都是 Vue.js 的核心组成部分，它们共同构成一个有机的整体，不同模块之间互相配合，进一步提升框架性能。