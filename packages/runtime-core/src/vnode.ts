/*
*  转化成虚拟dom
* */
import { ShapeFlags } from "@mini-vue/shared"
export { createVNode as createElementVNode }
export const Text = Symbol("Text");
export const Fragment = Symbol("Fragment");
export const createVNode = function (
    type: any,
    props?: any,
    children?: string | Array<any>
) {
   const vnode = {
       el: null,
       component: null,
       key: props?.key,
       type,
       props: props || {},
       children,
       shapeFlag: getShapeFlag(type),
   }
    // 基于 children 再次设置 shapeFlag
    if (Array.isArray(children)) {
        vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    } else if (typeof children === "string") {
        vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    }
    return vnode;
};
// 基于 type 来判断是什么类型的组件
function getShapeFlag(type: any) {
    return typeof type === "string"
        ? ShapeFlags.ELEMENT
        : ShapeFlags.STATEFUL_COMPONENT;
}
export function normalizeVNode(child) {
    // 暂时只支持处理 child 为 string 和 number 的情况
    if (typeof child === "string" || typeof child === "number") {
        return createVNode(Text, null, String(child));
    } else {
        return child;
    }
}
