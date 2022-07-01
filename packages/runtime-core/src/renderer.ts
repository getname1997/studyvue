import { createAppAPI } from "./createApp";
import { ShapeFlags } from "@mini-vue/shared";
import { createComponentInstance,setupComponent } from "./component";
import { effect } from "@mini-vue/reactivity";
import { queueJob } from "./scheduler";
import { Fragment, Text ,normalizeVNode} from "./vnode";
export function createRenderer(options){
    const {
        createElement: hostCreateElement,
        setElementText: hostSetElementText,
        patchProp: hostPatchProp,
        insert: hostInsert,
        remove: hostRemove,
        setText: hostSetText,
        createText: hostCreateText,
    } = options;

    const render = (vnode, container) => {
        console.log("调用 path")
        patch(null, vnode, container);
    }
    function processText(n1, n2, container) {
        if (n1 === null) {
            console.log("初始化 Text 类型的节点");
        } else {
            const el = (n2.el = n1.el!);
            if (n2.children !== n1.children) {
                console.log("更新 Text 类型的节点");
            }
        }
    }

    function mountComponent(initialVNode, container, parentComponent) {
        // 1. 先创建一个 component instance
        const instance = (initialVNode.component = createComponentInstance(
            initialVNode,
            parentComponent
        ));
        console.log(`创建组件实例:${instance.type.name}`);
        // 2. 给 instance 加工加工 (处理)
        setupComponent(instance);
        setupRenderEffect(instance, initialVNode, container);
    }
    function processComponent(n1, n2, container, parentComponent) {
        // 如果 n1 没有值的话，那么就是 mount
        if (!n1) {
            console.log('初始化')
            // 初始化 component
            mountComponent(n2, container, parentComponent);
        } else {
            // 更新
            // updateComponent(n1, n2, container);
        }
    }
    function setupRenderEffect(instance, initialVNode, container) {
        function componentUpdateFn() {
            if (!instance.isMounted) {
                const proxyToUse = instance.proxy;
                const subTree = (instance.subTree = normalizeVNode(
                    instance.render.call(proxyToUse, proxyToUse)
                ))
                patch(null, subTree, container, null, instance);
                initialVNode.el = subTree.el;
                instance.isMounted = true
            }
        }
        instance.update = effect(componentUpdateFn, {
            scheduler: () => {
                // 把 effect 推到微任务的时候在执行
                // queueJob(effect);
                queueJob(instance.update);
            },
        });

    }
    function mountChildren(children, container) {
        children.forEach((VNodeChild) => {
            // todo
            // 这里应该需要处理一下 vnodeChild
            // 因为有可能不是 vnode 类型
            console.log("mountChildren:", VNodeChild);
            patch(null, VNodeChild, container);
        });
    }
    function mountElement(vnode, container, anchor) {
        const { shapeFlag, props } = vnode;
        // 1. 先创建 element
        // 基于可扩展的渲染 api
        const el = (vnode.el = hostCreateElement(vnode.type));
        console.log(shapeFlag,ShapeFlags.TEXT_CHILDREN,ShapeFlags.ARRAY_CHILDREN)
        // 支持单子组件和多子组件的创建
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            console.log(`处理文本:${vnode.children}`);
            hostSetElementText(el, vnode.children);
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            // 举个栗子
            // render(){
            // Hello 是个 component
            //     return h("div",{},[h("p"),h(Hello)])
            // }
            // 这里 children 就是个数组了，就需要依次调用 patch 递归来处理
            console.log(45454545454,vnode.children)
            mountChildren(vnode.children, el);
        }

        // 处理 props
        if (props) {
            for (const key in props) {
                // todo
                // 需要过滤掉vue自身用的key
                // 比如生命周期相关的 key: beforeMount、mounted
                const nextVal = props[key];
                hostPatchProp(el, key, null, nextVal);
            }
        }

        // todo
        // 触发 beforeMount() 钩子
        console.log("vnodeHook  -> onVnodeBeforeMount");
        console.log("DirectiveHook  -> beforeMount");
        console.log("transition  -> beforeEnter");

        // 插入
        hostInsert(el, container, anchor);

        // todo
        // 触发 mounted() 钩子
        console.log("vnodeHook  -> onVnodeMounted");
        console.log("DirectiveHook  -> mounted");
        console.log("transition  -> enter");
    }

    function processElement(n1, n2, container, anchor, parentComponent) {
        if (!n1) {
            mountElement(n2, container, anchor);
        } else {
            // todo
            // updateElement(n1, n2, container, anchor, parentComponent);
        }
    }

    function patch(
        n1,
        n2,
        container = null,
        anchor = null,
        parentComponent = null
    ) {
        // 基于 n2 的类型来判断
        // 因为 n2 是新的 vnode
        const { type, shapeFlag } = n2;
        console.log(type)
        switch (type) {
            case Text:
                processText(n1, n2, container);
                break;
            case Fragment:
                break;
            default:
                // 需要深层处理的数据
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    console.log("处理 element");
                    processElement(n1, n2, container, anchor, parentComponent);
                } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    console.log("处理 component");
                    processComponent(n1, n2, container, parentComponent);
                }
                break
        }
    }
    return {
        createApp: createAppAPI(render),
    };
}
