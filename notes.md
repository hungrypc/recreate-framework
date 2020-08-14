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

Next, we'll write our own `ReactDOM.render` function
