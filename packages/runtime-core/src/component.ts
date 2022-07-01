// import { emit } from "./componentEmits";
/*proxy 封装*/
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { proxyRefs } from "@mini-vue/reactivity";
export function createComponentInstance(vnode, parent) {
    const instance = {
        type: vnode.type,
        vnode,
        next: null, // 需要更新的 vnode，用于更新 component 类型的组件
        props: {},
        parent,
        provides: parent ? parent.provides : {}, //  获取 parent 的 provides 作为当前组件的初始化值 这样就可以继承 parent.provides 的属性了
        proxy: null,
        isMounted: false,
        attrs: {}, // 存放 attrs 的数据
        slots: {}, // 存放插槽的数据
        ctx: {}, // context 对象
        setupState: {}, // 存储 setup 的返回值
        emit: () => {},
    };

    // 在 prod 坏境下的 ctx 只是下面简单的结构
    // 在 dev 环境下会更复杂
    instance.ctx = {
        _: instance,
    };

    // 赋值 emit
    // 这里使用 bind 把 instance 进行绑定
    // 后面用户使用的时候只需要给 event 和参数即可
    // instance.emit = emit.bind(null, instance) as any;

    return instance;
}
export const setupComponent =(instance)=>{
    setupStatefulComponent(instance)


}


function setupStatefulComponent(instance){
    instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers)
    const Component = instance.type;
    const { setup } = Component;
    /*暂时不处理setup*/
    if (setup) {
        // 设置当前 currentInstance 的值
        // 必须要在调用 setup 之前
        setCurrentInstance(instance);

        // const setupContext = createSetupContext(instance);
        // 真实的处理场景里面应该是只在 dev 环境才会把 props 设置为只读的
        // const setupResult =
        //     setup && setup(shallowReadonly(instance.props), setupContext);

        setCurrentInstance(null);

        // 3. 处理 setupResult
        handleSetupResult(instance,null);
    } else {
        /*把render*/
        finishComponentSetup(instance);
    }

}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (!instance.render) {
        // 如果 compile 有值 并且当组件没有 render 函数，那么就需要把 template 编译成 render 函数
        if (compile && !Component.render) {
            if (Component.template) {
                // 这里就是 runtime 模块和 compile 模块结合点
                const template = Component.template;
                Component.render = compile(template);
            }
        }
        console.log('执行了')
        instance.render = Component.render;
    }

    // applyOptions()
}
function handleSetupResult(instance, setupResult) {
    // setup 返回值不一样的话，会有不同的处理
    // 1. 看看 setupResult 是个什么
    if (typeof setupResult === "function") {
        // 如果返回的是 function 的话，那么绑定到 render 上
        // 认为是 render 逻辑
        // setup(){ return ()=>(h("div")) }
        instance.render = setupResult;
    } else if (typeof setupResult === "object") {
        // 返回的是一个对象的话
        // 先存到 setupState 上
        // 先使用 @vue/reactivity 里面的 proxyRefs
        // 后面我们自己构建
        // proxyRefs 的作用就是把 setupResult 对象做一层代理
        // 方便用户直接访问 ref 类型的值
        // 比如 setupResult 里面有个 count 是个 ref 类型的对象，用户使用的时候就可以直接使用 count 了，而不需要在 count.value
        // 这里也就是官网里面说到的自动结构 Ref 类型
        // instance.setupState = proxyRefs(setupResult);
    }

    finishComponentSetup(instance);
}
let currentInstance = {};
export function setCurrentInstance(instance) {
    currentInstance = instance;
}
let compile;
export function registerRuntimeCompiler(_compile) {
    compile = _compile;
}
