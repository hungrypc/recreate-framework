import Didact from './Didact'

/** @jsx Didact.createElement */
const element = (
    <div style="background: salmon">
        <h1>Hello world</h1>
    </div>
)

const container = document.getElementById('root')
Didact.render(element, container)