
import { createElement } from './Didact/createElement'
import { render } from './Didact/render'

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

const Didact = {
    createElement,
    render
}

export default Didact