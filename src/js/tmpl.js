/**
 * Created by Anton on 15.05.2017.
 */
const tmpl = {};

const slice = [].slice;
tmpl.createElement = function (tagName, props) {
    let el = null;
    if (typeof tagName === 'string') {
        el = document.createElement(tagName);
    } else {
        el = tagName;
    }
    let func, value;
    for (let prop in props) {
        value = props[prop];
        func = buildHooks[prop];
        if (func) {
            func(el, value);
        } else {
            el[prop] = value;
        }
    }
    slice.call(arguments, 2).forEach(function (childEl) {
        if (typeof childEl !== 'object') {
            childEl = document.createTextNode(childEl);
        }
        el.appendChild(childEl);
    });
    return el;
};
const buildHooks = {
    class: function (el, classList) {
        if (!Array.isArray(classList)) {
            classList = classList.split(/\s+/);
        }
        classList.forEach(function (className) {
            el.classList.add(className);
        });
    },
    style: function (el, styleObj) {
        let prop, value;
        for (prop in styleObj) {
            value = styleObj[prop];
            if (prop === 'float') {
                prop = 'cssFloat';
            }
            el.style[prop] = value;
        }
    },
    data: function (el, dataObj) {
        let key, value;
        for (key in dataObj) {
            value = dataObj[key];
            el.dataset[key] = value;
        }
    },
    append: function (el, childs) {
        if (!Array.isArray(childs)) {
            childs = [childs];
        }
        childs.forEach(function (childEl) {
            if (typeof childEl !== 'object') {
                childEl = document.createTextNode(childEl);
            }
            el.appendChild(childEl);
        });
    },
    on: function (el, eventList) {
        if (typeof eventList[0] !== 'object') {
            eventList = [eventList];
        }
        eventList.forEach(function (args) {
            el.addEventListener.apply(el, args);
        });
    },
    attr: function (el, attrObj) {
        let prop, value;
        for (prop in attrObj) {
            value = attrObj[prop];
            el.setAttribute(prop, value);
        }
    }
};

module.exports = tmpl;