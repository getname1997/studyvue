export { effect } from "packages/reactivity/src/effect";


export const reactiveMap = new WeakMap();
export const readonlyMap = new WeakMap();
export const shallowReadonlyMap = new WeakMap();

const shallowUnwrapHandlers = {
    get(target, key, receiver) {
        // 如果里面是一个 ref 类型的话，那么就返回 .value
        // 如果不是的话，那么直接返回value 就可以了
        return unRef(Reflect.get(target, key, receiver));
    },
    set(target, key, value, receiver) {
        const oldValue = target[key];
        if (isRef(oldValue) && !isRef(value)) {
            return (target[key].value = value);
        } else {
            return Reflect.set(target, key, value, receiver);
        }
    },
};
export function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, shallowUnwrapHandlers);
}
// 把 ref 里面的值拿到
export function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}

export function isRef(value) {
    return !!value.__v_isRef;
}
// export function shallowReadonly(target) {
//     return createReactiveObject(
//         target,
//         shallowReadonlyMap,
//         shallowReadonlyHandlers
//     );
// }
function createReactiveObject(target, proxyMap, baseHandlers) {
    // 核心就是 proxy
    // 目的是可以侦听到用户 get 或者 set 的动作

    // 如果命中的话就直接返回就好了
    // 使用缓存做的优化点
    const existingProxy = proxyMap.get(target);
    if (existingProxy) {
        return existingProxy;
    }

    const proxy = new Proxy(target, baseHandlers);

    // 把创建好的 proxy 给存起来，
    proxyMap.set(target, proxy);
    return proxy;
}
