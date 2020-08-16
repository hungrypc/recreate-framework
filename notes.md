# Notes

## Review

First, let's take the following react-specific code:
```jsx
const element = <h1 title='foo'>Hello</h1>
const container = document.getElementById('root')
ReactDOM.render(element, container)
```
How can we turn this into js?

`element` is jsx, so we can turn this into js like this:
```js
const element = React.createElement(
    'h1',
    { title: 'foo' },
    'Hello'
)
```
`React.createElement` creates an object from its arguments. we can replace the function call with its output:
```js
const element = {
    type: 'h1',
    props: {
        title: 'foo',
        children: 'Hello'
    },
}
```
This is what an element is - an object with the properties `type` and `props`.

- `type` specifies the type of the DOM node we want to create
- `props` is another object with keys and attributes from jsx attributes
- `children` is a string for now but it's usually an array with more elements

The next part we need to replace is `ReactDOM.render`.

`render` is where react changes the DOM, we can change this into js as follows:
```js
const node = document.createElement(element.type)
node['title'] = element.props.title

const text = document.createTextNode('')
text['nodeValue'] = element.props.children

node.appendChild(text)
container.appendChild(node)
```
Using `textNode` instead of setting `innerText` will allow us to treat all elements in the same way later. We also set the `nodValue` like we did with the `h1` title, almost as if the string had props: `{ nodeValue: 'hello' }`.

So now, the three lines of react code at the beginning of this section should now look like this:
```js
const element = {
    type: 'h1',
    props: {
        title: 'foo',
        children: 'Hello'
    },
}

const node = document.createElement(element.type)
node['title'] = element.props.title

const text = document.createTextNode('')
text['nodeValue'] = element.props.children

node.appendChild(text)
container.appendChild(node)
```

## Step 1: The `createElement` Function

Let's start from scratch with another example.
```jsx
const element = (
    <div id='foo'>
        <a>bar</a>
        <b />
    </div>
)
const container = document.getElementById('root')
ReactDOM.render(element, container)
```
We'll write our own `createElement` by first transforming the jsx to js so we can see the `createElement` calls.
```js
const element = React.createElement(
    'div',
    { id: 'foo' },
    React.createElement('a', null, 'bar'),
    React.createElement('b')
)
```
Looking at this, we can see that an element is an object with `type` and `props`. Let's write the function:
```js
function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children
        }
    }
}

// eg createElement('div', null, a, b) returns
// {
//     type: 'div',
//     props: { children: [a, b] }
// }
```
The children array could also contain primitive values so we'll wrap anything that isn't an object inside its own element and create a special type for them: `TEXT_ELEMENT`.
```js
function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.map(child =>
                typeof child === 'object'
                    ? child
                    : createTextElement(child)
            )
        }
    }
}

function createTextElement(text) {
    return {
        type: 'TEXT_ELEMENT',
        props: {
            nodeValue: text,
            children: []
        }
    }
}
```
Since we're still using react's `createElement` let's replace it by giving a name to our library. The article uses Didact, so I'll go with the same.
```js
const Didact = {
    createElement
}

const element = Didact.createElement(
    // ...
)
```
We still want to use jsx so how do we tell babel to use Didact's `createElement` instead of react's?
```js
/** @jsx Didact.createElement */
const element = (
    <div id='foo'>
        <a>bar</a>
        <b />
    </div>
)
```
With this comment, babel transpiles the jsx with the function we define.

## Step 2: The `render` Function

Next, we'll write our own `ReactDOM.render` function. For now, we only care about adding stuff to the DOM, will handle updating and deleting later.


```js
function render(element, container) {
    // we start by creating the DOM node using the element type
    // if the element type is TEXT_ELEMENT we create a text node instead of a regular node
    const dom = 
        element.type == 'TEXT_ELEMENT'
        ? document.createTextNode('')
        : document.createElement(element.type)

    // here, we assign the element props to the node
    const isProperty = key => key !== 'children'
    Object.keys(element.props)
        .filter(isProperty)
        .forEach(name => {
            dom[name] = element.props[name]
        })

    // recursively do the same for each child
    element.props.children.forEach(child =>
        render(child, dom)
    )

    // then append the new node to the container
    container.appendChild(dom)
}
```

And there we have it, a library that can render jsx to the DOM.

## Step 3: Concurrent Mode

Before we add more code, we need a refactor.

There's a problem with the recursive call.

Once we start rendering, we won't stop until we've rendered the complete element tree. If the element tree is big, it may bock the main thread for too long. If the browser needs to do high priority stuff like handling user input, it has to wait until the render finishes. 

So, we're going to break the work into small units, and after we finish each unit we'll let the browser interrupt the rendering if there's anything else that needs to be done. 

```js
let nextUnitOfWork = null

function workLoop(deadline) {
    let shouldYield = false 
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
        shouldYield = deadline.timeRemaining() < 1
    }
    requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function performUnitOfWork(nextUnitOfWork) {
    // todo
}
```
> [`requestIdleCallback()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback) method queues a function to be called during a browser's idle periods. This enables developers to perform background and low priority work on the main event loop, without impacting latency-critical events such as animation and input response.

We use `requestIdleCallback` to make a loop. We can think of `requestIdleCallback` as a `setTimeout`, but instead of us telling it when to run, the browser will run the callback when the main thread is idle. 

(note: React doesnt use `requestIdleCallback` anymore, it uses the [scheduler](https://github.com/facebook/react/tree/master/packages/scheduler) package. But for this use case, it's conceptually the same)

`requestIdleCallback` also gives us a dealine parameter. We can use it to check how much time we hav until the browser needs to take control again.

To start using the loop we'll need to set the first unit of work, and then write a `performUnitOfWork` function that not only performs the work but also returns the next unit of work.

## Step 4: Fibers

More info:
- [React Fiber](https://programmingwithmosh.com/javascript/react-fiber/)
- [Exploring React Fiber Tree](https://medium.com/@bendtherules/exploring-react-fiber-tree-20cbf62fe808)
- [React Fiber Architecture](https://github.com/acdlite/react-fiber-architecture)

To organize the units of work, we'll need a data structure: a fiber tree.

We'll have one fiber for each element and each fiber will be a unit of work. For example, suppose we want to render an element tree like as follows:
```jsx
Didact.render(
    <div>
        <h1>
            <p />
            <a />
        </h1>
        <h2 />
    </div>,
    container
)
```

In the `render` we'll create the root fiber and set it as the `nextUnitOfWork`. The rest of the work will happen on the `performUnitOfWork` function, there we will do 3 things for each fiber:
1. Add the element to the DOM
2. Create the fibers for the element's children
3. Select the next unit of work

One of the goals of this data structure is to make it easy to find the next unit of work. That's why each fiber has a link to its first child, its next sibling, and its parent.

![fiber tree](/notes-assets/fiber1.png)

When we finish performing work on a fiber, if it has a `child` then that fiber will be the next unit of work. If the fiber *doesn't* have a `child`, we use the `sibling` as the next unit of work.

From the example, when we finish working on the `div` fiber, the next unit of work will be the `h1` fiber. The `p` fiber doesn't have a `child` so we move on to the `a` fiber after finishing it.

And if the fiber doesn't have a `child` nor a `sibling`, we go to the 'uncle': the `sibling` of the `parent`

