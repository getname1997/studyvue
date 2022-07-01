import { extend } from "@mini-vue/shared";
export function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn);

    // 把用户传过来的值合并到 _effect 对象上去
    // 缺点就是不是显式的，看代码的时候并不知道有什么值
    extend(_effect, options);
    _effect.run();
    // 把 _effect.run 这个方法返回
    // 让用户可以自行选择调用的时机（调用 fn）
    const runner: any = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}
export class ReactiveEffect {
    constructor(public fn, public scheduler?) {
        console.log("创建 ReactiveEffect 对象");
    }
    run() {
        this.fn()
    }
}
