// 全局类型补充。
//
// 说明：本文档树右键菜单事件 "open-menu-doctree" 的 detail 类型已由
// siyuan 1.2.8 SDK 内置（IEventBusMap），src/index.ts 直接使用官方类型，
// 无需在此重复声明。以下模块声明保留，便于日后为项目补充样式导入等声明。
declare module "*.scss" {
    const content: Record<string, string>;
    export default content;
}
