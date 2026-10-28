import {
    fetchSyncPost,
    Plugin,
    showMessage,
} from "siyuan";
import type {IEventBusMap} from "siyuan";

/**
 * 文档树右键菜单事件的 detail。
 * siyuan 1.2.8 SDK 已内置 "open-menu-doctree" 的类型定义（IEventBusMap），
 * items 单选时长度为 1，元素为 {id, path, notebookId}。
 */
type TOpenMenuDoctreeDetail = IEventBusMap["open-menu-doctree"];

export default class CopyPathPlugin extends Plugin {
    // 箭头函数成员保持 this 与函数引用一致，onload/onunload 的 on/off 必须指向同一个监听器。
    private readonly onOpenMenuDoctree = (event: CustomEvent<TOpenMenuDoctreeDetail>) => {
        const {type, items, menu} = event.detail;
        // 仅处理右键单个文档的场景，笔记本与多选不响应。
        if (type !== "doc" || items.length !== 1) {
            return;
        }
        const doc = items[0];
        // detail.menu 指向「插件」子菜单，向其添加的项会被思源统一收纳进「插件 ▸」二级项；
        // 同步回调中 window.siyuan.menus.menu 才是当前完整菜单，仅在其不可用时回退到 detail.menu。
        const menuItem = {
            icon: "iconCopy",
            label: String(this.i18n.copyPath ?? "拷贝路径"),
            click: () => this.copyDocPath(doc.id, doc.notebookId),
        };
        const currentMenu = window.siyuan.menus?.menu;
        if (currentMenu) {
            currentMenu.addItem(menuItem);
        } else {
            menu.addItem(menuItem);
        }
    };

    onload() {
        this.eventBus.on("open-menu-doctree", this.onOpenMenuDoctree);
    }

    onunload() {
        this.eventBus.off("open-menu-doctree", this.onOpenMenuDoctree);
    }

    /**
     * 把文档完整路径（/笔记本名/父文档/文档名）写入剪贴板并弹窗提示。
     */
    private async copyDocPath(docId: string, notebookId: string) {
        try {
            const response = await fetchSyncPost("/api/filetree/getHPathByID", {id: docId});
            if (response.code !== 0) {
                throw new Error(response.msg || String(response.code));
            }
            // hPath 形如 /父文档/文档名，不含笔记本名，故手动补 "/" + 笔记本名。
            const hPath = response.data ?? "";
            const notebooks = window.siyuan.notebooks ?? [];
            const notebookName = notebooks.find((nb) => nb.id === notebookId)?.name ?? notebookId;
            const fullPath = `/${notebookName}${hPath}`;
            await navigator.clipboard.writeText(fullPath);
            showMessage(fullPath, 2000);
        } catch (error) {
            console.error("[copy-path] copy doc path failed:", error);
            showMessage(`拷贝路径失败：${error instanceof Error ? error.message : String(error)}`, 7000, "error");
        }
    }
}
