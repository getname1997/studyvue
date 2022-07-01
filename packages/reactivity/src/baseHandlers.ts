//
// const shallowReadonlyGet = createGetter(true, true);
// export const shallowReadonlyHandlers = {
//     get: shallowReadonlyGet,
//     set(target, key) {
//         // readonly 的响应式对象不可以修改值
//         console.warn(
//             `Set operation on key "${String(key)}" failed: target is readonly.`,
//             target
//         );
//         return true;
//     },
// };
