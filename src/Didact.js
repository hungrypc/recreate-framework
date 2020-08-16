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

const Didact = {
    createElement,
    render
}

export default Didact