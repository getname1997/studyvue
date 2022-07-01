'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const Text = Symbol("Text");
const Fragment = Symbol("Fragment");
const createVNode = function (type, props, children) {
    const vnode = {
        el: null,
        component: null,
        key: props === null || props === void 0 ? void 0 : props.key,
        type,
        props: props || {},
        children,
        shapeFlag: getShapeFlag(type),
    };
    if (Array.isArray(children)) {
        vnode.shapeFlag |= 16;
    }
    else if (typeof children === "string") {
        vnode.shapeFlag |= 8;
    }
    return vnode;
};
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1
        : 4;
}
function normalizeVNode(child) {
    if (typeof child === "string" || typeof child === "number") {
        return createVNode(Text, null, String(child));
    }
    else {
        return child;
    }
}

const h = (type, props, children) => {
    return createVNode(type, props, children);
};

function createAppAPI(render) {
    return function createApp(rootComponent) {
        const app = {
            _component: rootComponent,
            mount(rootContainer) {
                console.log("基于根组件创建 vnode", rootContainer, '选择的元素');
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            },
        };
        return app;
    };
}

var ShapeFlags;
(function (ShapeFlags) {
    ShapeFlags[ShapeFlags["ELEMENT"] = 1] = "ELEMENT";
    ShapeFlags[ShapeFlags["STATEFUL_COMPONENT"] = 4] = "STATEFUL_COMPONENT";
    ShapeFlags[ShapeFlags["TEXT_CHILDREN"] = 8] = "TEXT_CHILDREN";
    ShapeFlags[ShapeFlags["ARRAY_CHILDREN"] = 16] = "ARRAY_CHILDREN";
    ShapeFlags[ShapeFlags["SLOTS_CHILDREN"] = 32] = "SLOTS_CHILDREN";
})(ShapeFlags || (ShapeFlags = {}));

const isOn = (key) => /^on[A-Z]/.test(key);
function hasOwn(val, key) {
    return Object.prototype.hasOwnProperty.call(val, key);
}
const extend = Object.assign;

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $emit: (i) => i.emit,
    $slots: (i) => i.slots,
    $props: (i) => i.props,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        console.log(`触发 proxy hook , key -> : ${key}`);
        if (key[0] !== "$") {
            if (hasOwn(setupState, key)) {
                return setupState[key];
            }
            else if (hasOwn(props, key)) {
                return props[key];
            }
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
    set({ _: instance }, key, value) {
        const { setupState } = instance;
        if (setupState !== {} && hasOwn(setupState, key)) {
            setupState[key] = value;
        }
        return true;
    },
};

function createComponentInstance(vnode, parent) {
    const instance = {
        type: vnode.type,
        vnode,
        next: null,
        props: {},
        parent,
        provides: parent ? parent.provides : {},
        proxy: null,
        isMounted: false,
        attrs: {},
        slots: {},
        ctx: {},
        setupState: {},
        emit: () => { },
    };
    instance.ctx = {
        _: instance,
    };
    return instance;
}
const setupComponent = (instance) => {
    setupStatefulComponent(instance);
};
function setupStatefulComponent(instance) {
    instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
    const Component = instance.type;
    const { setup } = Component;
    if (setup) {
        handleSetupResult(instance, null);
    }
    else {
        finishComponentSetup(instance);
    }
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (!instance.render) {
        console.log('执行了');
        instance.render = Component.render;
    }
}
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === "function") {
        instance.render = setupResult;
    }
    finishComponentSetup(instance);
}

function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn);
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.fn = fn;
        this.scheduler = scheduler;
        console.log("创建 ReactiveEffect 对象");
    }
    run() {
        this.fn();
    }
}

const queue = [];
const p = Promise.resolve();
let isFlushPending = false;
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}
function queueJob(job) {
    if (!queue.includes(job)) {
        queue.push(job);
        queueFlush();
    }
}
function queueFlush() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(flushJobs);
}
function flushJobs() {
    isFlushPending = false;
    let job;
    while ((job = queue.shift())) {
        if (job) {
            job();
        }
    }
}

function createRenderer(options) {
    const { createElement: hostCreateElement, setElementText: hostSetElementText, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setText: hostSetText, createText: hostCreateText, } = options;
    const render = (vnode, container) => {
        console.log("调用 path");
        patch(null, vnode, container);
    };
    function processText(n1, n2, container) {
        if (n1 === null) {
            console.log("初始化 Text 类型的节点");
        }
        else {
            (n2.el = n1.el);
            if (n2.children !== n1.children) {
                console.log("更新 Text 类型的节点");
            }
        }
    }
    function mountComponent(initialVNode, container, parentComponent) {
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
        console.log(`创建组件实例:${instance.type.name}`);
        setupComponent(instance);
        setupRenderEffect(instance, initialVNode, container);
    }
    function processComponent(n1, n2, container, parentComponent) {
        if (!n1) {
            console.log('初始化');
            mountComponent(n2, container, parentComponent);
        }
    }
    function setupRenderEffect(instance, initialVNode, container) {
        function componentUpdateFn() {
            if (!instance.isMounted) {
                const proxyToUse = instance.proxy;
                const subTree = (instance.subTree = normalizeVNode(instance.render.call(proxyToUse, proxyToUse)));
                patch(null, subTree, container, null, instance);
                initialVNode.el = subTree.el;
                instance.isMounted = true;
            }
        }
        instance.update = effect(componentUpdateFn, {
            scheduler: () => {
                queueJob(instance.update);
            },
        });
    }
    function mountChildren(children, container) {
        children.forEach((VNodeChild) => {
            console.log("mountChildren:", VNodeChild);
            patch(null, VNodeChild, container);
        });
    }
    function mountElement(vnode, container, anchor) {
        const { shapeFlag, props } = vnode;
        const el = (vnode.el = hostCreateElement(vnode.type));
        console.log(shapeFlag, 8, 16);
        if (shapeFlag & 8) {
            console.log(`处理文本:${vnode.children}`);
            hostSetElementText(el, vnode.children);
        }
        else if (shapeFlag & 16) {
            console.log(45454545454, vnode.children);
            mountChildren(vnode.children, el);
        }
        if (props) {
            for (const key in props) {
                const nextVal = props[key];
                hostPatchProp(el, key, null, nextVal);
            }
        }
        console.log("vnodeHook  -> onVnodeBeforeMount");
        console.log("DirectiveHook  -> beforeMount");
        console.log("transition  -> beforeEnter");
        hostInsert(el, container, anchor);
        console.log("vnodeHook  -> onVnodeMounted");
        console.log("DirectiveHook  -> mounted");
        console.log("transition  -> enter");
    }
    function processElement(n1, n2, container, anchor, parentComponent) {
        if (!n1) {
            mountElement(n2, container, anchor);
        }
    }
    function patch(n1, n2, container = null, anchor = null, parentComponent = null) {
        const { type, shapeFlag } = n2;
        console.log(type);
        switch (type) {
            case Text:
                processText(n1, n2);
                break;
            case Fragment:
                break;
            default:
                if (shapeFlag & 1) {
                    console.log("处理 element");
                    processElement(n1, n2, container, anchor);
                }
                else if (shapeFlag & 4) {
                    console.log("处理 component");
                    processComponent(n1, n2, container, parentComponent);
                }
                break;
        }
    }
    return {
        createApp: createAppAPI(render),
    };
}

let renderer;
function createElement(type) {
    console.log("CreateElement", type);
    const element = document.createElement(type);
    return element;
}
function insert(child, parent, anchor = null) {
    console.log("Insert");
    parent.insertBefore(child, anchor);
}
function setElementText(el, text) {
    console.log("SetElementText", el, text);
    el.textContent = text;
}
function patchProp(el, key, preValue, nextValue) {
    console.log(`PatchProp 设置属性:${key} 值:${nextValue}`);
    console.log(`key: ${key} 之前的值是:${preValue}`);
    if (isOn(key)) {
        const invokers = el._vei || (el._vei = {});
        const existingInvoker = invokers[key];
        if (nextValue && existingInvoker) {
            existingInvoker.value = nextValue;
        }
        else {
            const eventName = key.slice(2).toLowerCase();
            if (nextValue) {
                const invoker = (invokers[key] = nextValue);
                el.addEventListener(eventName, invoker);
            }
            else {
                el.removeEventListener(eventName, existingInvoker);
                invokers[key] = undefined;
            }
        }
    }
    else {
        if (nextValue === null || nextValue === "") {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextValue);
        }
    }
}
function ensureRenderer() {
    return (renderer ||
        (renderer = createRenderer({
            createElement,
            patchProp,
            setElementText,
            insert
        })));
}
const createApp = (...args) => {
    return ensureRenderer().createApp(...args);
};

exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.h = h;
//# sourceMappingURL=mini-vue.cjs.js.map
