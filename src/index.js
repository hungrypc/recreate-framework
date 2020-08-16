import Didact from './Didact'
console.log('testing')

/** @jsx Didact.createElement */
const element = (
    <div>
        <h1>Hello world</h1>
    </div>
)
const container = document.getElementById('root')
Didact.render(element, container)