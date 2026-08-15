import { init as initBrowser, captureException } from "@argusdev/sdk-browser";
function componentName(instance) {
    if (!instance)
        return undefined;
    const internals = instance;
    return (internals.$options?.name ??
        internals.$?.type?.__name ??
        internals.$?.type?.name);
}
/*
 * The Vue hook. Vue swallows component errors (render, setup, lifecycle hooks,
 * watchers, event handlers) and routes them to `app.config.errorHandler` —
 * they never reach window.onerror, so this is the only reliable hook, the same
 * reason sdk-react needs a boundary.
 *
 * Exported on its own for apps that call init() themselves and only want the
 * Vue-specific handler.
 */
export function attachVueErrorHandler(app) {
    /* chain whatever the app already installed — we observe, never replace */
    const previous = app.config.errorHandler;
    app.config.errorHandler = (err, instance, info) => {
        const tags = {};
        const name = componentName(instance);
        if (name)
            tags.component = name;
        /* info is Vue's own label for where it blew up: "render function",
           "setup function", "native event handler", "watcher callback"… */
        if (info)
            tags.lifecycleHook = info;
        void captureException(err, Object.keys(tags).length > 0 ? { tags } : {});
        if (previous) {
            previous(err, instance, info);
        }
        else {
            /* setting a handler suppresses Vue's own logging — put it back, devs
               still want the error in their console */
            console.error(err);
        }
    };
}
/*
 * Usage:
 *   import { argusVue } from "@argusdev/sdk-vue";
 *   createApp(App).use(argusVue, { dsn: "https://KEY@host/PROJECT_ID" }).mount("#app");
 *
 * Not annotated as Vue's `Plugin<T>` on purpose: that generic's shape moved
 * across 3.x minors, and the object literal already satisfies `app.use()`
 * for every version in the peer range.
 */
export const argusVue = {
    install(app, options) {
        /* browser globals first: window.onerror, unhandledrejection, web vitals */
        initBrowser(options);
        attachVueErrorHandler(app);
    },
};
//# sourceMappingURL=plugin.js.map