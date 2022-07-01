export * from "../src/shapeFlags";

// 必须是 on+一个大写字母的格式开头
export const isOn = (key) => /^on[A-Z]/.test(key);

export function hasOwn(val, key) {
    return Object.prototype.hasOwnProperty.call(val, key);
}
export const extend = Object.assign;
