/// <reference path="../../../../typings/common.d.ts" />
/// <reference path="../../../../typings/ExtAPI.d.ts" />
class BrowserPermissionsError extends Error {
}
const BrowserPermissions = {
    _required: { permissions: ['tabs', 'webNavigation'], origins: ['<all_urls>'] },
    request(callback) {
        chrome.permissions.request(this._required, callback);
    },
    check(callback) {
        /**
         * This would be the proper way to check for permissions if the Chrome devs
         * wouldn't have fucked app the API
         */
        // chrome.permissions.contains(this._required, callback)
        chrome.permissions.getAll((permissions) => {
            try {
                Object.keys(this._required).forEach(key => {
                    this._required[key].forEach(val => {
                        if (!permissions[key].includes(val)) {
                            throw new BrowserPermissionsError();
                        }
                    });
                });
            }
            catch (err) {
                return callback(false);
            }
            callback(true);
        });
    },
};
var Views;
(function (Views) {
    var Settings;
    (function (Settings_1) {
        var $ = Core.Utils.DOM;
        class PageSettings extends Core.CustomElement {
            constructor(node, data) {
                super(node, data);
            }
            init() {
                this.settings = new Settings(this.parent);
                ExtAPI.invoke('get-settings').then(settings => {
                    for (let key in settings) {
                        this.settings[key] = settings[key];
                    }
                }).catch(this.parent._log);
                let [page, tab] = window.location.hash.split('/', 2);
                tab = tab ? '.' + tab : '';
                this.parent.navigateToTab($.q('.tab-nav a' + tab));
            }
        }
        Settings_1.PageSettings = PageSettings;
        class Settings {
            constructor(view) {
                this.view = view;
                this._settings = {};
                this._hasPermission = false;
            }
            _get(key) {
                return this._settings[key];
            }
            _set(key, val, force = false) {
                if (!force && val === this._settings[key]) {
                    return;
                }
                if (key in this._settings) {
                    let saved = {};
                    saved[key] = val;
                    setTimeout(() => ExtAPI.invoke('save-settings', saved), 10);
                }
                this._settings[key] = val;
            }
            get alwaysCenterTheWindow() { return this._get('alwaysCenterTheWindow'); }
            set alwaysCenterTheWindow(val) { this._set('alwaysCenterTheWindow', val); }
            get leftAlignWindow() { return this._get('leftAlignWindow'); }
            set leftAlignWindow(val) { this._set('leftAlignWindow', val); }
            get hideTooltipDelay() { return this._get('hideTooltipDelay'); }
            set hideTooltipDelay(val) { this._set('hideTooltipDelay', parseInt(val, 10)); }
            get popupIconStyle() { return this._get('popupIconStyle'); }
            set popupIconStyle(val) { this._set('popupIconStyle', val); }
            get presetsIconsStyle() { return this._get('presetsIconsStyle'); }
            set presetsIconsStyle(val) { this._set('presetsIconsStyle', val); }
            get alternatePresetsBg() { return this._get('alternatePresetsBg'); }
            set alternatePresetsBg(val) { this._set('alternatePresetsBg', val); }
            get autoClosePopup() { return this._get('autoClosePopup'); }
            set autoClosePopup(val) { this._set('autoClosePopup', val); }
            get presetsPrimaryLine() { return this._get('presetsPrimaryLine'); }
            set presetsPrimaryLine(val) { this._set('presetsPrimaryLine', val); }
            get hidePresetsDescription() { return this._get('hidePresetsDescription'); }
            set hidePresetsDescription(val) { this._set('hidePresetsDescription', val); }
            get hidePopupTooltips() { return this._get('hidePopupTooltips'); }
            set hidePopupTooltips(val) { this._set('hidePopupTooltips', val); }
            get hideQuickResize() { return this._get('hideQuickResize'); }
            set hideQuickResize(val) { this._set('hideQuickResize', val); }
            get alwaysShowTheTooltip() { return this._get('alwaysShowTheTooltip'); }
            set alwaysShowTheTooltip(val) {
                if (!val) {
                    this._set('alwaysShowTheTooltip', false);
                    return;
                }
                // temporary set the value to true, so the binding system doesn't revert the checkbox to un-checked
                this._settings.alwaysShowTheTooltip = true;
                if (this._hasPermission) {
                    this._set('alwaysShowTheTooltip', val, true);
                    return; // permissions have already been checked
                }
                BrowserPermissions.check(granted => {
                    if (granted) {
                        this._hasPermission = true;
                        return this._set('alwaysShowTheTooltip', val, true);
                    }
                    let view = this.view;
                    let actions = [];
                    let title = 'Insufficient permissions';
                    let message = `In order for the extension to be able to automatically show the tooltip on all opened pages,
				it needs to be able to inject custom code in the context of all pages, without user interaction.
				<br /><br />
				<em>If you're not comfortable granting those permissions, you can always manually enable the tooltip for any
				given page from the extension's popup menu</em>`;
                    actions.push({ title: 'Cancel', onDismiss: true, handler: () => {
                            view.dismissMessage();
                            this.alwaysShowTheTooltip = false;
                        } });
                    actions.push({ title: 'Grant permissions', main: true, handler: () => {
                            view.dismissMessage();
                            BrowserPermissions.request(granted => {
                                this.alwaysShowTheTooltip = granted;
                            });
                        } });
                    view.showMessage(title, message, actions);
                });
            }
        }
        Core.Components.create('wr-page-settings', {
            static: [],
            initialize: (el, data) => new PageSettings(el, data)
        });
    })(Settings = Views.Settings || (Views.Settings = {}));
})(Views || (Views = {}));
/// <reference path="../../../../typings/common.d.ts" />
/// <reference path="../../../../typings/ExtAPI.d.ts" />
var Views;
(function (Views) {
    var Settings;
    (function (Settings) {
        var Preset = Core.Preset;
        var $ = Core.Utils.DOM;
        class PagePresets extends Core.CustomElement {
            constructor(node, data) {
                super(node, data);
                this.presets = [];
                this.presetEdit = this.presetEdit.bind(this);
                this.presetDelete = this.presetDelete.bind(this);
            }
            init() {
                //this.template = $.q('.preset-item');
                ExtAPI.invoke('get-presets').then(presets => {
                    for (let p of presets) {
                        this.presets.push(new Preset(p));
                    }
                    Sortable.create($.q('#presetsSortList'), {
                        animation: 150,
                        forceFallback: true,
                        fallbackOnBody: true,
                        handle: 'wr-preset',
                        fallbackClass: 'sortable-mirror',
                        onEnd: evt => {
                            if (evt.newIndex === evt.oldIndex) {
                                return;
                            }
                            let presets = this.presets.slice();
                            let preset = presets.splice(evt.oldIndex, 1);
                            let views = this.parent.currentView.bindings[0].iterated;
                            let view = views.splice(evt.oldIndex, 1);
                            presets.splice(evt.newIndex, 0, preset[0]);
                            views.splice(evt.newIndex, 0, view[0]);
                            _reindex(views);
                            this.presets = presets;
                            ExtAPI.invoke('save-settings', { presets: presets });
                        }
                    });
                });
            }
            presetsDelete(evt, ctx) {
                let view = ctx.parent;
                let actions = [];
                let title = 'Warning';
                let message = `Are you sure you want to delete all the existing presets?`;
                actions.push({ title: 'Yes, I\'m sure', main: true, handler: () => {
                        ctx.presets = [];
                        ExtAPI.invoke('save-settings', { presets: ctx.presets });
                        view.dismissMessage();
                    } });
                actions.push({ title: 'No, don\'t do it', handler: () => view.dismissMessage() });
                view.showMessage(title, message, actions, { class: 'danger' });
            }
            presetsReset(evt, ctx) {
                const reset = () => {
                    ExtAPI.invoke('default-settings').then(defaults => {
                        ctx.presets = [];
                        ctx.presets = defaults.presets;
                        return ExtAPI.invoke('save-settings', { presets: defaults.presets });
                    }).catch(err => console.log(err));
                };
                if (!ctx.presets || !ctx.presets.length) {
                    return reset();
                }
                let view = ctx.parent;
                let actions = [];
                let title = 'Warning';
                let message = `Are you sure you want to replace all your existing presets with the default ones?`;
                actions.push({ title: 'Yes, I\'m sure', main: true, handler: () => {
                        reset();
                        view.dismissMessage();
                    } });
                actions.push({ title: 'No, don\'t do it', handler: () => view.dismissMessage() });
                view.showMessage(title, message, actions, { class: 'danger' });
            }
            presetAdd(evt, ctx) {
                ctx.parent.showSubPage('wr-page-edit-preset', 'add');
            }
            presetEdit(evt, ctx) {
                ctx.parent.showSubPage('wr-page-edit-preset', `edit=${ctx.item.id}`);
            }
            presetDelete(evt, ctx) {
                let index = ctx.index;
                let views = this.parent.currentView.bindings[0].iterated;
                let node = views[index].els[0];
                $.animate(node, 'puff-out', 'transform').then(n => {
                    $.animate(node, 'collapse', 'margin-top').then(n => {
                        views[index].unbind();
                        node.parentNode.removeChild(node);
                        views.splice(index, 1);
                        this.presets.splice(index, 1);
                        _reindex(views);
                        ExtAPI.invoke('save-settings', { presets: this.presets });
                    });
                });
            }
            _performUnbound(callback) {
                let binding = this.parent.currentView; //.bindings[0];
                binding.unbind();
                let result = callback();
                binding.bind();
                binding.sync();
                // for (let view of binding.iterated) {
                // 	view.sync();
                // }
                return result;
            }
        }
        Settings.PagePresets = PagePresets;
        function _reindex(views) {
            views.forEach((view, index) => {
                view.models.index = index;
            });
        }
        Core.Components.create('wr-page-presets', {
            static: [],
            initialize: (el, data) => new PagePresets(el, data)
        });
    })(Settings = Views.Settings || (Views.Settings = {}));
})(Views || (Views = {}));
/// <reference path="../../../typings/rivets.d.ts" />
/// <reference path="../../../typings/ExtAPI.d.ts" />
/// <reference path="../../../typings/tab-nav.d.ts" />
/// <reference path="../../../typings/common.d.ts" />
/// <reference path="./pages/settings.ts" />
/// <reference path="./pages/presets.ts" />
var Views;
(function (Views) {
    var Settings;
    (function (Settings) {
        var ModalMessage = Views.Common.ModalMessage;
        var $ = Core.Utils.DOM;
        class SettingsView {
            constructor(id, title, element) {
                this.id = id;
                this.title = title;
                this.element = element;
                this.selected = false;
            }
        }
        Settings.SettingsView = SettingsView;
        class MainView {
            constructor() {
                this.menu = [
                    new SettingsView('#settings', 'settings', 'wr-page-settings'),
                    new SettingsView('#presets', 'presets', 'wr-page-presets'),
                    new SettingsView('#hotkeys', 'hotkeys', 'wr-page-hotkeys'),
                    new SettingsView('#sync', 'sync', 'wr-page-sync'),
                    new SettingsView('#help', 'about', 'wr-page-help')
                ];
                this.routes = [
                    new SettingsView('#help/release-notes', 'release-notes', 'wr-page-release-notes'),
                    new SettingsView('#pro', 'pro', 'wr-page-pro')
                ];
                this.license = null;
                this.presetsIconsStyle = '';
                this.navigateTo = this.navigateTo.bind(this);
                this.handleNavigateToTab = this.handleNavigateToTab.bind(this);
                this.showMessage = this.showMessage.bind(this);
                this.dismissMessage = this.dismissMessage.bind(this);
                ExtAPI.invoke('get-settings').then(settings => {
                    this.license = settings.license;
                    this.presetsIconsStyle = settings.presetsIconsStyle;
                    return ExtAPI.invoke('settings:requested-page');
                }).then(url => {
                    this._showView(url) || this.showView(this.menu[0]);
                    // this.showView(this._view('#pro'));
                });
                chrome.runtime.onMessage.addListener((msg, sender, respond) => {
                    if (msg && msg.showPage) {
                        let view = this._showView(msg.showPage);
                    }
                    if (msg && msg.UpdatedSettings) {
                        if ('license' in msg.UpdatedSettings) {
                            this.license = msg.UpdatedSettings.license;
                        }
                        if ('presetsIconsStyle' in msg.UpdatedSettings) {
                            this.presetsIconsStyle = msg.UpdatedSettings.presetsIconsStyle;
                        }
                    }
                });
            }
            _showView(url) {
                let [page, ...args] = (url || '').split('/');
                let view = this._view(url) || this._view(page);
                let params = '';
                if (args && args.length) {
                    params = args.join('/');
                }
                view && this.showView(view, params);
                return view;
            }
            showView(view, params = '') {
                this.selectedView = view;
                params = params || '';
                for (let item of this.menu) {
                    item.selected = view.id.indexOf(item.id) === 0;
                }
                $.hide('#content').then(_ => {
                    this.currentView && this.currentView.unbind();
                    this.currentView = rivets.init(view.element, null, { parent: this });
                    let model = this.currentView.models;
                    window.location.hash = `${view.id}/${params}`;
                    $.empty('#content');
                    $.q('#content').appendChild(this.currentView.els[0]);
                    model.init && model.init();
                    $.show('#content');
                });
            }
            showSubPage(element, id) {
                this.showView(new SettingsView(`${this.selectedView.id}/${id}`, id, element));
            }
            navigateTo(evt, ctx) {
                let item = ctx.item;
                if (!item) {
                    let target = evt.target;
                    while (target && !target.matches('a, button')) {
                        target = target.parentNode;
                    }
                    if (target) {
                        item = this._view(target.hash || target.getAttribute('data-hash'));
                    }
                }
                console.log(item);
                this.showView(item);
            }
            handleNavigateToTab(evt, ctx) {
                evt.preventDefault();
                this.navigateToTab(evt.target);
            }
            navigateToTab(target) {
                if (target.classList.contains('selected')) {
                    return;
                }
                let current = $.q('.selected', target.parentNode);
                let showNext = () => {
                    $.addClass(target, 'selected');
                    $.addClass(target.hash, 'visible');
                    setTimeout(() => { $.addClass(target.hash, 'selected'); }, 1);
                };
                if (!current) {
                    return showNext();
                }
                $.removeClass(current, 'selected');
                $.hide(current.hash, 'selected').then(_ => {
                    $.removeClass(current.hash, 'visible');
                    showNext();
                });
            }
            showMessage(title, message, actions, options = {}) {
                if (!actions || actions.length === 0) {
                    actions = [{ title: 'OK', onDismiss: true, handler: this.dismissMessage }];
                }
                this.currentMessage = new ModalMessage(title, message, false, actions, options);
            }
            dismissMessage() {
                this.currentMessage.hide().then(x => {
                    this.currentMessage = null;
                });
            }
            _view(id) {
                let routes = this.menu.concat(this.routes);
                for (let view of routes) {
                    if (view.id === id) {
                        return view;
                    }
                }
                return null;
            }
            _log(err) {
                console.log(err);
            }
        }
        Settings.MainView = MainView;
        Settings.mainView = new MainView();
        Settings.model = rivets.bind(document.body, Settings.mainView);
    })(Settings = Views.Settings || (Views.Settings = {}));
})(Views || (Views = {}));
/// <reference path="../../../../typings/common.d.ts" />
var Views;
(function (Views) {
    var Settings;
    (function (Settings) {
        class TabContent extends Core.CustomElement {
            constructor(node, data) {
                super(node, data);
            }
        }
        Settings.TabContent = TabContent;
        Core.Components.create('wr-tab-content', {
            static: [],
            initialize: (el, data) => new TabContent(el, data)
        });
    })(Settings = Views.Settings || (Views.Settings = {}));
})(Views || (Views = {}));
/// <reference path="../../../../typings/common.d.ts" />
var Views;
(function (Views) {
    var Settings;
    (function (Settings) {
        class TabGroup extends Core.CustomElement {
            constructor(node, data) {
                super(node, data);
            }
        }
        Settings.TabGroup = TabGroup;
        Core.Components.create('wr-tab-group', {
            static: [],
            initialize: (el, data) => new TabGroup(el, data)
        });
    })(Settings = Views.Settings || (Views.Settings = {}));
})(Views || (Views = {}));
/// <reference path="../../../../typings/common.d.ts" />
/// <reference path="../../../../typings/ExtAPI.d.ts" />
var Views;
(function (Views) {
    var Settings;
    (function (Settings) {
        var $ = Core.Utils.DOM;
        var Preset = Core.Preset;
        var PresetPosition = Core.PresetPosition;
        class PageEditPreset extends Core.CustomElement {
            constructor(node, data) {
                super(node, data);
                this.title = 'add preset';
                this.preset = new Preset({});
                this.formErrors = [];
            }
            init() {
                let params = window.location.hash.match(/edit=([^\/]+)/);
                this.id = params ? params[1] : '';
                if (this.id) {
                    this.title = 'edit preset';
                    ExtAPI.invoke('get-presets').then(presets => {
                        let data = presets.find(item => item.id === this.id);
                        this.preset = new Preset(data);
                        this.customPosition = this.preset.position;
                        this.customIcon = this.preset.type;
                    });
                }
            }
            useCurrentSize(evt, ctx) {
                chrome.windows.getCurrent({ populate: true }, win => {
                    let tab = win.tabs.filter(tab => tab.active).pop();
                    if (ctx.preset.target == 1) {
                        ctx.preset.width = tab.width;
                        ctx.preset.height = tab.height;
                    }
                    else {
                        ctx.preset.width = win.width;
                        ctx.preset.height = win.height;
                    }
                });
            }
            useCurrentPosition(evt, ctx) {
                chrome.windows.getCurrent(win => {
                    ctx.customPosition = PresetPosition.CUSTOM;
                    ctx.preset.left = win.left;
                    ctx.preset.top = win.top;
                });
            }
            get allowCustomPosition() {
                return this.preset.position === PresetPosition.CUSTOM;
            }
            set allowCustomPosition(newValue) {
                // placeholder setter
            }
            get customPosition() {
                return this.preset.position;
            }
            set customPosition(newValue) {
                newValue = parseInt(newValue, 10);
                this.preset.position = newValue;
                if (newValue !== PresetPosition.CUSTOM) {
                    this.preset.left = null;
                    this.preset.top = null;
                }
                this.allowCustomPosition = newValue;
            }
            get customIcon() {
                return this.preset.type;
            }
            set customIcon(newValue) {
                newValue = parseInt(newValue, 10);
                this.preset.type = newValue;
            }
            cancel(evt, ctx) {
                ctx.parent.showView(ctx.parent.menu[1]);
            }
            savePreset(evt, ctx) {
                evt.preventDefault();
                let preset = ctx.preset;
                ctx.formErrors = [];
                if (preset.width === null && preset.height === null) {
                    ctx.formErrors.push('You must provide at least one of the width and height values!');
                    $.q('#content').scrollTop = 0;
                }
                if (ctx.formErrors.length) {
                    return;
                }
                ExtAPI.invoke('save-preset', preset).then(data => {
                    ctx.parent.showView(ctx.parent.menu[1]);
                });
            }
        }
        Settings.PageEditPreset = PageEditPreset;
        Core.Components.create('wr-page-edit-preset', {
            static: [],
            initialize: (el, data) => new PageEditPreset(el, data)
        });
    })(Settings = Views.Settings || (Views.Settings = {}));
})(Views || (Views = {}));
/// <reference path="../../../../typings/common.d.ts" />
/// <reference path="../../../../typings/ExtAPI.d.ts" />
var Views;
(function (Views) {
    var Settings;
    (function (Settings) {
        class PageHelp extends Core.CustomElement {
            constructor(node, data) {
                super(node, data);
            }
            init() {
                let config = chrome.runtime.getManifest();
                this.friendlyVersion = config.version_name || config.version;
                this.completeVersion = config.version_name ? `(${config.version})` : '';
                let log = JSON.parse(window.localStorage['debugLog'] || '[]');
                let rows = [];
                for (let r = 0, l = log.length; r < l; r++) {
                    rows.push(JSON.stringify(log[r]));
                }
                this.debugLog = rows.length ? `[\n    ${rows.join(",\n    ")}\n]` : null;
            }
            showReleaseNotes(evt, ctx) {
                ctx.parent.showSubPage('wr-page-release-notes', 'release-notes');
            }
            showDebugLog(evt, ctx) {
                ctx.parent.showMessage('Errors log', `<pre>${ctx.debugLog}</pre>`, null, { class: 'danger' });
            }
        }
        Settings.PageHelp = PageHelp;
        Core.Components.create('wr-page-help', {
            static: [],
            initialize: (el, data) => new PageHelp(el, data)
        });
    })(Settings = Views.Settings || (Views.Settings = {}));
})(Views || (Views = {}));
/// <reference path="../../../../typings/common.d.ts" />
var Views;
(function (Views) {
    var Settings;
    (function (Settings) {
        var $ = Core.Utils.DOM;
        class PageHotkeys extends Core.CustomElement {
            constructor(node, data) {
                super(node, data);
                this.key_ShowPopup = '<not set>';
                this.key_ToggleTooltip = '<not set>';
                this.key_CyclePresets = '<not set>';
                this.key_CyclePresetsRev = '<not set>';
            }
            init() {
                this.parent.navigateToTab($.q('.tab-nav a'));
                chrome.commands.getAll(commands => this.globalShortcuts = commands);
            }
            configureShortcuts() {
                chrome.tabs.create({
                    url: 'chrome://extensions/shortcuts',
                    active: true
                });
            }
        }
        Settings.PageHotkeys = PageHotkeys;
        Core.Components.create('wr-page-hotkeys', {
            static: [],
            initialize: (el, data) => new PageHotkeys(el, data)
        });
    })(Settings = Views.Settings || (Views.Settings = {}));
})(Views || (Views = {}));
/// <reference path="../../../../typings/common.d.ts" />
/// <reference path="../../../../typings/ExtAPI.d.ts" />
var Views;
(function (Views) {
    var Settings;
    (function (Settings) {
        class PagePro extends Core.CustomElement {
            constructor(node, data) {
                super(node, data);
                this.defaultPrice = 4;
                this.payAmount = 4;
                this.minAmount = 3;
                this.licenseKey = '';
                this.error = '';
                this.busy = false;
                this.activate = () => {
                    if (!this.licenseKey.match(/^\s*[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}\s*$/i)) {
                        this.error = 'Invalid license key!';
                        return;
                    }
                    this.error = '';
                    this.busy = true;
                    ExtAPI.invoke('pro:activate-license', { key: this.licenseKey })
                        .then(this._handleErrors)
                        .then(data => {
                        this.licenseKey = '';
                        // this.parent.license = data;
                    });
                };
                this.purchase = () => {
                    if (this.payAmount < this.minAmount) {
                        this.error = `The minimum amount is \$${this.minAmount.toFixed(2)}`;
                        return;
                    }
                    this.error = '';
                    this.busy = true;
                    ExtAPI.invoke('pro:checkout-url', { price: this.payAmount })
                        .then(this._handleErrors)
                        .then(data => {
                        window.open(data.url);
                    });
                };
                this._handleErrors = (response) => {
                    this.busy = false;
                    this.error = '';
                    if (response.error) {
                        this.error = response.error;
                        return Promise.reject(response.error);
                    }
                    return Promise.resolve(response.data);
                };
            }
            init() {
            }
        }
        Settings.PagePro = PagePro;
        Core.Components.create('wr-page-pro', {
            static: [],
            initialize: (el, data) => new PagePro(el, data)
        });
    })(Settings = Views.Settings || (Views.Settings = {}));
})(Views || (Views = {}));
/// <reference path="../../../../typings/common.d.ts" />
/// <reference path="../../../../typings/ExtAPI.d.ts" />
var Views;
(function (Views) {
    var Settings;
    (function (Settings) {
        class PageReleaseNotes extends Core.CustomElement {
            constructor(node, data) {
                super(node, data);
            }
            cancel(evt, ctx) {
                ctx.parent.showView(ctx.parent.menu[4]);
            }
            goTo(evt, ctx) {
                var hash = evt.target.hash || evt.target.getAttribute('data-hash');
                ctx.parent.showView(ctx.parent._view(hash));
            }
        }
        Settings.PageReleaseNotes = PageReleaseNotes;
        Core.Components.create('wr-page-release-notes', {
            static: [],
            initialize: (el, data) => new PageReleaseNotes(el, data)
        });
    })(Settings = Views.Settings || (Views.Settings = {}));
})(Views || (Views = {}));
/// <reference path="../../../../typings/common.d.ts" />
/// <reference path="../../../../typings/ExtAPI.d.ts" />
var Views;
(function (Views) {
    var Settings;
    (function (Settings_2) {
        var $ = Core.Utils.DOM;
        class PageSync extends Core.CustomElement {
            constructor(node, data) {
                super(node, data);
                this.exportSettings = this.exportSettings.bind(this);
                this.importSettings = this.importSettings.bind(this);
            }
            init() {
                this.settings = new Settings();
                ExtAPI.invoke('get-sync-status').then(status => {
                    this.settings.syncSettings = !status;
                }).catch(this.parent._log);
            }
            exportSettings() {
                ExtAPI.invoke('get-settings').then(settings => {
                    let node = $.q('#importExportField');
                    node.value = JSON.stringify(settings);
                    node.focus();
                    node.select();
                });
            }
            importSettings() {
                let node = $.q('#importExportField');
                let data;
                let settings = {};
                try {
                    data = JSON.parse(node.value);
                }
                catch (ex) {
                    this.parent.showMessage('Error', 'The provided input is not a valid JSON object.');
                    return null;
                }
                ExtAPI.invoke('import-settings', data);
                this.parent.showMessage('Success', 'The new settings have been imported.');
                node.value = '';
            }
        }
        Settings_2.PageSync = PageSync;
        class Settings {
            constructor() {
                this._settings = {};
            }
            get syncSettings() { return this._settings.syncSettings; }
            set syncSettings(val) {
                if (val === this._settings.syncSettings) {
                    return;
                }
                this._settings.syncSettings = val;
                setTimeout(() => {
                    ExtAPI.invoke('toggle-sync', !val)
                        .then(() => ExtAPI.invoke('get-settings'))
                        .then(settings => ExtAPI.invoke('save-settings', settings));
                });
            }
        }
        Core.Components.create('wr-page-sync', {
            static: [],
            initialize: (el, data) => new PageSync(el, data)
        });
    })(Settings = Views.Settings || (Views.Settings = {}));
})(Views || (Views = {}));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy92aWV3cy9zZXR0aW5ncy9wYWdlcy9zZXR0aW5ncy50cyIsInNyYy92aWV3cy9zZXR0aW5ncy9wYWdlcy9wcmVzZXRzLnRzIiwic3JjL3ZpZXdzL3NldHRpbmdzL3NldHRpbmdzLnRzIiwic3JjL3ZpZXdzL3NldHRpbmdzL2NvbXBvbmVudHMvdGFiLWNvbnRlbnQudHMiLCJzcmMvdmlld3Mvc2V0dGluZ3MvY29tcG9uZW50cy90YWItZ3JvdXAudHMiLCJzcmMvdmlld3Mvc2V0dGluZ3MvcGFnZXMvZWRpdC1wcmVzZXQudHMiLCJzcmMvdmlld3Mvc2V0dGluZ3MvcGFnZXMvaGVscC50cyIsInNyYy92aWV3cy9zZXR0aW5ncy9wYWdlcy9ob3RrZXlzLnRzIiwic3JjL3ZpZXdzL3NldHRpbmdzL3BhZ2VzL3Byby50cyIsInNyYy92aWV3cy9zZXR0aW5ncy9wYWdlcy9yZWxlYXNlLW5vdGVzLnRzIiwic3JjL3ZpZXdzL3NldHRpbmdzL3BhZ2VzL3N5bmMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsd0RBQXdEO0FBQ3hELHdEQUF3RDtBQUd4RCxNQUFNLHVCQUF3QixTQUFRLEtBQUs7Q0FBRztBQUU5QyxNQUFNLGtCQUFrQixHQUFHO0lBQzFCLFNBQVMsRUFBRSxFQUFDLFdBQVcsRUFBRSxDQUFDLE1BQU0sRUFBRSxlQUFlLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxZQUFZLENBQUMsRUFBQztJQUU1RSxPQUFPLENBQUMsUUFBb0M7UUFDM0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQTtJQUNyRCxDQUFDO0lBRUQsS0FBSyxDQUFDLFFBQW9DO1FBQ3pDOzs7V0FHRztRQUNILHdEQUF3RDtRQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFdBQTJDLEVBQUUsRUFBRTtZQUN6RSxJQUFJO2dCQUNILE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxD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QUNmLE1BQU0sQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUMsR0FBRyxDQUFDO3lCQUNoQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQzt5QkFDekMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDOUQsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDO1NBQ0Q7UUFFRCxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUU7WUFDdEMsTUFBTSxFQUFFLEVBQUU7WUFDVixVQUFVLEVBQUUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDO1NBQ2hELENBQUMsQ0FBQTtJQUNILENBQUMsRUEzRVksUUFBUSxHQUFSLGNBQVEsS0FBUixjQUFRLFFBMkVwQjtBQUFELENBQUMsRUEzRU0sS0FBSyxLQUFMLEtBQUssUUEyRVgiLCJmaWxlIjoidmlld3Mvc2V0dGluZ3MuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vLi4vLi4vdHlwaW5ncy9jb21tb24uZC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi8uLi8uLi90eXBpbmdzL0V4dEFQSS5kLnRzXCIgLz5cclxuXHJcbnR5cGUgQnJvd3NlclBlcm1pc3Npb25zQ2FsbGJhY2sgPSAoZ3JhbnRlZDogYm9vbGVhbikgPT4gdm9pZFxyXG5jbGFzcyBCcm93c2VyUGVybWlzc2lvbnNFcnJvciBleHRlbmRzIEVycm9yIHt9XHJcblxyXG5jb25zdCBCcm93c2VyUGVybWlzc2lvbnMgPSB7XHJcblx0X3JlcXVpcmVkOiB7cGVybWlzc2lvbnM6IFsndGFicycsICd3ZWJOYXZpZ2F0aW9uJ10sIG9yaWdpbnM6IFsnPGFsbF91cmxzPiddfSxcclxuXHJcblx0cmVxdWVzdChjYWxsYmFjazogQnJvd3NlclBlcm1pc3Npb25zQ2FsbGJhY2spIHtcclxuXHRcdGNocm9tZS5wZXJtaXNzaW9ucy5yZXF1ZXN0KHRoaXMuX3JlcXVpcmVkLCBjYWxsYmFjaylcclxuXHR9LFxyXG5cclxuXHRjaGVjayhjYWxsYmFjazogQnJvd3NlclBlcm1pc3Npb25zQ2FsbGJhY2spIHtcclxuXHRcdC8qKlxyXG5cdFx0ICogVGhpcyB3b3VsZCBiZSB0aGUgcHJvcGVyIHdheSB0byBjaGVjayBmb3IgcGVybWlzc2lvbnMgaWYgdGhlIENocm9tZSBkZXZzXHJcblx0XHQgKiB3b3VsZG4ndCBoYXZlIGZ1Y2tlZCBhcHAgdGhlIEFQSVxyXG5cdFx0ICovXHJcblx0XHQvLyBjaHJvbWUucGVybWlzc2lvbnMuY29udGFpbnModGhpcy5fcmVxdWlyZWQsIGNhbGxiYWNrKVxyXG5cdFx0Y2hyb21lLnBlcm1pc3Npb25zLmdldEFsbCgocGVybWlzc2lvbnM6IGNocm9tZS5wZXJtaXNzaW9ucy5QZXJtaXNzaW9ucykgPT4ge1xyXG5cdFx0XHR0cnkge1xyXG5cdFx0XHRcdE9iamVjdC5rZXlzKHRoaXMuX3JlcXVpcmVkKS5mb3JFYWNoKGtleSA9PiB7XHJcblx0XHRcdFx0XHR0aGlzLl9yZXF1aXJlZFtrZXldLmZvckVhY2godmFsID0+IHtcclxuXHRcdFx0XHRcdFx0aWYgKCFwZXJtaXNzaW9uc1trZXldLmluY2x1ZGVzKHZhbCkpIHtcclxuXHRcdFx0XHRcdFx0XHR0aHJvdyBuZXcgQnJvd3NlclBlcm1pc3Npb25zRXJyb3IoKVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdH0gY2F0Y2goZXJyKSB7XHJcblx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKGZhbHNlKVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjYWxsYmFjayh0cnVlKVxyXG5cdFx0fSlcclxuXHR9LFxyXG59XHJcblxyXG5tb2R1bGUgVmlld3MuU2V0dGluZ3Mge1xyXG5cdGltcG9ydCAkID0gQ29yZS5VdGlscy5ET007XHJcblxyXG5cdGV4cG9ydCBjbGFzcyBQYWdlU2V0dGluZ3MgZXh0ZW5kcyBDb3JlLkN1c3RvbUVsZW1lbnQge1xyXG5cdFx0cHVibGljIHBhcmVudDogYW55OyAvLyBWaWV3cy5TZXR0aW5ncy5NYWluVmlldztcclxuXHRcdHB1YmxpYyBzZXR0aW5nczogU2V0dGluZ3M7XHJcblxyXG5cdFx0Y29uc3RydWN0b3Iobm9kZSwgZGF0YSkge1xyXG5cdFx0XHRzdXBlcihub2RlLCBkYXRhKTtcclxuXHRcdH1cclxuXHJcblx0XHRpbml0KCkge1xyXG5cdFx0XHR0aGlzLnNldHRpbmdzID0gbmV3IFNldHRpbmdzKHRoaXMucGFyZW50KTtcclxuXHJcblx0XHRcdEV4dEFQSS5pbnZva2UoJ2dldC1zZXR0aW5ncycpLnRoZW4oc2V0dGluZ3MgPT4ge1xyXG5cdFx0XHRcdGZvciAobGV0IGtleSBpbiBzZXR0aW5ncykge1xyXG5cdFx0XHRcdFx0dGhpcy5zZXR0aW5nc1trZXldID0gc2V0dGluZ3Nba2V5XTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pLmNhdGNoKHRoaXMucGFyZW50Ll9sb2cpO1xyXG5cclxuXHRcdFx0bGV0IFtwYWdlLCB0YWJdID0gd2luZG93LmxvY2F0aW9uLmhhc2guc3BsaXQoJy8nLCAyKTtcclxuXHRcdFx0dGFiID0gdGFiID8gJy4nICsgdGFiIDogJyc7XHJcblxyXG5cdFx0XHR0aGlzLnBhcmVudC5uYXZpZ2F0ZVRvVGFiKCQucSgnLnRhYi1uYXYgYScgKyB0YWIpKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGNsYXNzIFNldHRpbmdzIHtcclxuXHRcdHByaXZhdGUgX3NldHRpbmdzOiBhbnkgPSB7fTtcclxuXHRcdHByaXZhdGUgX2hhc1Blcm1pc3Npb246IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcblx0XHRjb25zdHJ1Y3Rvcihwcml2YXRlIHZpZXc6IGFueSkge31cclxuXHJcblx0XHRwcml2YXRlIF9nZXQoa2V5KSB7XHJcblx0XHRcdHJldHVybiB0aGlzLl9zZXR0aW5nc1trZXldO1xyXG5cdFx0fVxyXG5cclxuXHRcdHByaXZhdGUgX3NldChrZXk6IHN0cmluZywgdmFsOiBhbnksIGZvcmNlOiBib29sZWFuID0gZmFsc2UpIHtcclxuXHRcdFx0aWYgKCFmb3JjZSAmJiB2YWwgPT09IHRoaXMuX3NldHRpbmdzW2tleV0pIHtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChrZXkgaW4gdGhpcy5fc2V0dGluZ3MpIHtcclxuXHRcdFx0XHRsZXQgc2F2ZWQgPSB7fTtcclxuXHRcdFx0XHRzYXZlZFtrZXldID0gdmFsO1xyXG5cclxuXHRcdFx0XHRzZXRUaW1lb3V0KCgpID0+IEV4dEFQSS5pbnZva2UoJ3NhdmUtc2V0dGluZ3MnLCBzYXZlZCksIDEwKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy5fc2V0dGluZ3Nba2V5XSA9IHZhbDtcclxuXHRcdH1cclxuXHJcblx0XHRnZXQgYWx3YXlzQ2VudGVyVGhlV2luZG93KCkgICAgIHsgcmV0dXJuIHRoaXMuX2dldCgnYWx3YXlzQ2VudGVyVGhlV2luZG93Jyk7IH1cclxuXHRcdHNldCBhbHdheXNDZW50ZXJUaGVXaW5kb3codmFsKSAgeyB0aGlzLl9zZXQoJ2Fsd2F5c0NlbnRlclRoZVdpbmRvdycsIHZhbCk7IH1cclxuXHJcblx0XHRnZXQgbGVmdEFsaWduV2luZG93KCkgICAgICAgICAgIHsgcmV0dXJuIHRoaXMuX2dldCgnbGVmdEFsaWduV2luZG93Jyk7IH1cclxuXHRcdHNldCBsZWZ0QWxpZ25XaW5kb3codmFsKSAgICAgICAgeyB0aGlzLl9zZXQoJ2xlZnRBbGlnbldpbmRvdycsIHZhbCk7IH1cclxuXHJcblx0XHRnZXQgaGlkZVRvb2x0aXBEZWxheSgpICAgICAgICAgIHsgcmV0dXJuIHRoaXMuX2dldCgnaGlkZVRvb2x0aXBEZWxheScpOyB9XHJcblx0XHRzZXQgaGlkZVRvb2x0aXBEZWxheSh2YWwpICAgICAgIHsgdGhpcy5fc2V0KCdoaWRlVG9vbHRpcERlbGF5JywgcGFyc2VJbnQodmFsLCAxMCkpOyB9XHJcblxyXG5cdFx0Z2V0IHBvcHVwSWNvblN0eWxlKCkgICAgICAgICAgICB7IHJldHVybiB0aGlzLl9nZXQoJ3BvcHVwSWNvblN0eWxlJyk7IH1cclxuXHRcdHNldCBwb3B1cEljb25TdHlsZSh2YWwpICAgICAgICAgeyB0aGlzLl9zZXQoJ3BvcHVwSWNvblN0eWxlJywgdmFsKTsgfVxyXG5cclxuXHRcdGdldCBwcmVzZXRzSWNvbnNTdHlsZSgpICAgICAgICAgeyByZXR1cm4gdGhpcy5fZ2V0KCdwcmVzZXRzSWNvbnNTdHlsZScpOyB9XHJcblx0XHRzZXQgcHJlc2V0c0ljb25zU3R5bGUodmFsKSAgICAgIHsgdGhpcy5fc2V0KCdwcmVzZXRzSWNvbnNTdHlsZScsIHZhbCk7IH1cclxuXHJcblx0XHRnZXQgYWx0ZXJuYXRlUHJlc2V0c0JnKCkgICAgICAgIHsgcmV0dXJuIHRoaXMuX2dldCgnYWx0ZXJuYXRlUHJlc2V0c0JnJyk7IH1cclxuXHRcdHNldCBhbHRlcm5hdGVQcmVzZXRzQmcodmFsKSAgICAgeyB0aGlzLl9zZXQoJ2FsdGVybmF0ZVByZXNldHNCZycsIHZhbCk7IH1cclxuXHJcblx0XHRnZXQgYXV0b0Nsb3NlUG9wdXAoKSAgICAgICAgICAgIHsgcmV0dXJuIHRoaXMuX2dldCgnYXV0b0Nsb3NlUG9wdXAnKTsgfVxyXG5cdFx0c2V0IGF1dG9DbG9zZVBvcHVwKHZhbCkgICAgICAgICB7IHRoaXMuX3NldCgnYXV0b0Nsb3NlUG9wdXAnLCB2YWwpOyB9XHJcblxyXG5cdFx0Z2V0IHByZXNldHNQcmltYXJ5TGluZSgpICAgICAgICB7IHJldHVybiB0aGlzLl9nZXQoJ3ByZXNldHNQcmltYXJ5TGluZScpOyB9XHJcblx0XHRzZXQgcHJlc2V0c1ByaW1hcnlMaW5lKHZhbCkgICAgIHsgdGhpcy5fc2V0KCdwcmVzZXRzUHJpbWFyeUxpbmUnLCB2YWwpOyB9XHJcblxyXG5cdFx0Z2V0IGhpZGVQcmVzZXRzRGVzY3JpcHRpb24oKSAgICB7IHJldHVybiB0aGlzLl9nZXQoJ2hpZGVQcmVzZXRzRGVzY3JpcHRpb24nKTsgfVxyXG5cdFx0c2V0IGhpZGVQcmVzZXRzRGVzY3JpcHRpb24odmFsKSB7IHRoaXMuX3NldCgnaGlkZVByZXNldHNEZXNjcmlwdGlvbicsIHZhbCk7IH1cclxuXHJcblx0XHRnZXQgaGlkZVBvcHVwVG9vbHRpcHMoKSAgICAgICAgIHsgcmV0dXJuIHRoaXMuX2dldCgnaGlkZVBvcHVwVG9vbHRpcHMnKTsgfVxyXG5cdFx0c2V0IGhpZGVQb3B1cFRvb2x0aXBzKHZhbCkgICAgICB7IHRoaXMuX3NldCgnaGlkZVBvcHVwVG9vbHRpcHMnLCB2YWwpOyB9XHJcblxyXG5cdFx0Z2V0IGhpZGVRdWlja1Jlc2l6ZSgpICAgICAgICAgICB7IHJldHVybiB0aGlzLl9nZXQoJ2hpZGVRdWlja1Jlc2l6ZScpOyB9XHJcblx0XHRzZXQgaGlkZVF1aWNrUmVzaXplKHZhbCkgICAgICAgIHsgdGhpcy5fc2V0KCdoaWRlUXVpY2tSZXNpemUnLCB2YWwpOyB9XHJcblxyXG5cdFx0Z2V0IGFsd2F5c1Nob3dUaGVUb29sdGlwKCkgICAgICB7IHJldHVybiB0aGlzLl9nZXQoJ2Fsd2F5c1Nob3dUaGVUb29sdGlwJyk7IH1cclxuXHRcdHNldCBhbHdheXNTaG93VGhlVG9vbHRpcCh2YWwpICAge1xyXG5cdFx0XHRpZiAoIXZhbCkge1xyXG5cdFx0XHRcdHRoaXMuX3NldCgnYWx3YXlzU2hvd1RoZVRvb2x0aXAnLCBmYWxzZSk7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyB0ZW1wb3Jhcnkgc2V0IHRoZSB2YWx1ZSB0byB0cnVlLCBzbyB0aGUgYmluZGluZyBzeXN0ZW0gZG9lc24ndCByZXZlcnQgdGhlIGNoZWNrYm94IHRvIHVuLWNoZWNrZWRcclxuXHRcdFx0dGhpcy5fc2V0dGluZ3MuYWx3YXlzU2hvd1RoZVRvb2x0aXAgPSB0cnVlO1xyXG5cclxuXHRcdFx0aWYgKHRoaXMuX2hhc1Blcm1pc3Npb24pIHtcclxuXHRcdFx0XHR0aGlzLl9zZXQoJ2Fsd2F5c1Nob3dUaGVUb29sdGlwJywgdmFsLCB0cnVlKTtcclxuXHRcdFx0XHRyZXR1cm47IC8vIHBlcm1pc3Npb25zIGhhdmUgYWxyZWFkeSBiZWVuIGNoZWNrZWRcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0QnJvd3NlclBlcm1pc3Npb25zLmNoZWNrKGdyYW50ZWQgPT4ge1xyXG5cdFx0XHRcdGlmIChncmFudGVkKSB7XHJcblx0XHRcdFx0XHR0aGlzLl9oYXNQZXJtaXNzaW9uID0gdHJ1ZTtcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLl9zZXQoJ2Fsd2F5c1Nob3dUaGVUb29sdGlwJywgdmFsLCB0cnVlKTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGxldCB2aWV3ICAgID0gdGhpcy52aWV3O1xyXG5cdFx0XHRcdGxldCBhY3Rpb25zID0gW107XHJcblx0XHRcdFx0bGV0IHRpdGxlICAgPSAnSW5zdWZmaWNpZW50IHBlcm1pc3Npb25zJztcclxuXHRcdFx0XHRsZXQgbWVzc2FnZSA9IGBJbiBvcmRlciBmb3IgdGhlIGV4dGVuc2lvbiB0byBiZSBhYmxlIHRvIGF1dG9tYXRpY2FsbHkgc2hvdyB0aGUgdG9vbHRpcCBvbiBhbGwgb3BlbmVkIHBhZ2VzLFxyXG5cdFx0XHRcdGl0IG5lZWRzIHRvIGJlIGFibGUgdG8gaW5qZWN0IGN1c3RvbSBjb2RlIGluIHRoZSBjb250ZXh0IG9mIGFsbCBwYWdlcywgd2l0aG91dCB1c2VyIGludGVyYWN0aW9uLlxyXG5cdFx0XHRcdDxiciAvPjxiciAvPlxyXG5cdFx0XHRcdDxlbT5JZiB5b3UncmUgbm90IGNvbWZvcnRhYmxlIGdyYW50aW5nIHRob3NlIHBlcm1pc3Npb25zLCB5b3UgY2FuIGFsd2F5cyBtYW51YWxseSBlbmFibGUgdGhlIHRvb2x0aXAgZm9yIGFueVxyXG5cdFx0XHRcdGdpdmVuIHBhZ2UgZnJvbSB0aGUgZXh0ZW5zaW9uJ3MgcG9wdXAgbWVudTwvZW0+YDtcclxuXHJcblx0XHRcdFx0YWN0aW9ucy5wdXNoKHt0aXRsZTogJ0NhbmNlbCcsIG9uRGlzbWlzczogdHJ1ZSwgaGFuZGxlcjogKCkgPT4ge1xyXG5cdFx0XHRcdFx0dmlldy5kaXNtaXNzTWVzc2FnZSgpO1xyXG5cdFx0XHRcdFx0dGhpcy5hbHdheXNTaG93VGhlVG9vbHRpcCA9IGZhbHNlO1xyXG5cdFx0XHRcdH19KVxyXG5cclxuXHRcdFx0XHRhY3Rpb25zLnB1c2goe3RpdGxlOiAnR3JhbnQgcGVybWlzc2lvbnMnLCBtYWluOiB0cnVlLCBoYW5kbGVyOiAoKSA9PiB7XHJcblx0XHRcdFx0XHR2aWV3LmRpc21pc3NNZXNzYWdlKCk7XHJcblx0XHRcdFx0XHRCcm93c2VyUGVybWlzc2lvbnMucmVxdWVzdChncmFudGVkID0+IHtcclxuXHRcdFx0XHRcdFx0dGhpcy5hbHdheXNTaG93VGhlVG9vbHRpcCA9IGdyYW50ZWQ7XHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdH19KVxyXG5cclxuXHRcdFx0XHR2aWV3LnNob3dNZXNzYWdlKHRpdGxlLCBtZXNzYWdlLCBhY3Rpb25zKTtcclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRDb3JlLkNvbXBvbmVudHMuY3JlYXRlKCd3ci1wYWdlLXNldHRpbmdzJywge1xyXG5cdFx0c3RhdGljOiBbXSxcclxuXHRcdGluaXRpYWxpemU6IChlbCwgZGF0YSkgPT4gbmV3IFBhZ2VTZXR0aW5ncyhlbCwgZGF0YSlcclxuXHR9KVxyXG59XHJcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi8uLi8uLi90eXBpbmdzL2NvbW1vbi5kLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uLy4uLy4uL3R5cGluZ3MvRXh0QVBJLmQudHNcIiAvPlxyXG5cclxubW9kdWxlIFZpZXdzLlNldHRpbmdzIHtcclxuXHRpbXBvcnQgUHJlc2V0ID0gQ29yZS5QcmVzZXQ7XHJcblx0aW1wb3J0ICQgPSBDb3JlLlV0aWxzLkRPTTtcclxuXHJcblx0ZGVjbGFyZSB2YXIgU29ydGFibGU6IGFueTtcclxuXHRkZWNsYXJlIHZhciBkcmFndWxhOiBhbnk7XHJcblxyXG5cdGV4cG9ydCBjbGFzcyBQYWdlUHJlc2V0cyBleHRlbmRzIENvcmUuQ3VzdG9tRWxlbWVudCB7XHJcblx0XHRwdWJsaWMgcGFyZW50OiBhbnk7IC8vIFZpZXdzLlNldHRpbmdzLk1haW5WaWV3O1xyXG5cclxuXHRcdHB1YmxpYyBwcmVzZXRzOiBQcmVzZXRbXSA9ICBbXTtcclxuXHRcdHB1YmxpYyB0ZW1wbGF0ZTogSFRNTEVsZW1lbnQ7XHJcblxyXG5cdFx0Y29uc3RydWN0b3Iobm9kZSwgZGF0YSkge1xyXG5cdFx0XHRzdXBlcihub2RlLCBkYXRhKTtcclxuXHJcblx0XHRcdHRoaXMucHJlc2V0RWRpdCA9IHRoaXMucHJlc2V0RWRpdC5iaW5kKHRoaXMpO1xyXG5cdFx0XHR0aGlzLnByZXNldERlbGV0ZSA9IHRoaXMucHJlc2V0RGVsZXRlLmJpbmQodGhpcyk7XHJcblx0XHR9XHJcblxyXG5cdFx0aW5pdCgpIHtcclxuXHRcdFx0Ly90aGlzLnRlbXBsYXRlID0gJC5xKCcucHJlc2V0LWl0ZW0nKTtcclxuXHJcblx0XHRcdEV4dEFQSS5pbnZva2UoJ2dldC1wcmVzZXRzJykudGhlbihwcmVzZXRzID0+IHtcclxuXHRcdFx0XHRmb3IgKGxldCBwIG9mIHByZXNldHMpIHtcclxuXHRcdFx0XHRcdHRoaXMucHJlc2V0cy5wdXNoKG5ldyBQcmVzZXQocCkpO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0U29ydGFibGUuY3JlYXRlKCQucSgnI3ByZXNldHNTb3J0TGlzdCcpLCB7XHJcblx0XHRcdFx0XHRhbmltYXRpb246IDE1MCxcclxuXHRcdFx0XHRcdGZvcmNlRmFsbGJhY2s6IHRydWUsXHJcblx0XHRcdFx0XHRmYWxsYmFja09uQm9keTogdHJ1ZSxcclxuXHRcdFx0XHRcdGhhbmRsZTogJ3dyLXByZXNldCcsXHJcblx0XHRcdFx0XHRmYWxsYmFja0NsYXNzOiAnc29ydGFibGUtbWlycm9yJyxcclxuXHRcdFx0XHRcdG9uRW5kOiBldnQgPT4ge1xyXG5cdFx0XHRcdFx0XHRpZiAoZXZ0Lm5ld0luZGV4ID09PSBldnQub2xkSW5kZXgpIHtcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdGxldCBwcmVzZXRzID0gdGhpcy5wcmVzZXRzLnNsaWNlKCk7XHJcblx0XHRcdFx0XHRcdGxldCBwcmVzZXQgID0gcHJlc2V0cy5zcGxpY2UoZXZ0Lm9sZEluZGV4LCAxKTtcclxuXHJcblx0XHRcdFx0XHRcdGxldCB2aWV3cyA9IHRoaXMucGFyZW50LmN1cnJlbnRWaWV3LmJpbmRpbmdzWzBdLml0ZXJhdGVkO1xyXG5cdFx0XHRcdFx0XHRsZXQgdmlldyAgPSB2aWV3cy5zcGxpY2UoZXZ0Lm9sZEluZGV4LCAxKTtcclxuXHJcblx0XHRcdFx0XHRcdHByZXNldHMuc3BsaWNlKGV2dC5uZXdJbmRleCwgMCwgcHJlc2V0WzBdKTtcclxuXHRcdFx0XHRcdFx0dmlld3Muc3BsaWNlKGV2dC5uZXdJbmRleCwgMCwgdmlld1swXSk7XHJcblxyXG5cdFx0XHRcdFx0XHRfcmVpbmRleCh2aWV3cyk7XHJcblxyXG5cdFx0XHRcdFx0XHR0aGlzLnByZXNldHMgPSBwcmVzZXRzO1xyXG5cclxuXHRcdFx0XHRcdFx0RXh0QVBJLmludm9rZSgnc2F2ZS1zZXR0aW5ncycsIHtwcmVzZXRzOiBwcmVzZXRzfSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH0pXHJcblx0XHR9XHJcblxyXG5cdFx0cHJlc2V0c0RlbGV0ZShldnQsIGN0eCkge1xyXG5cdFx0XHRsZXQgdmlldyAgICA9IGN0eC5wYXJlbnQ7XHJcblx0XHRcdGxldCBhY3Rpb25zID0gW107XHJcblx0XHRcdGxldCB0aXRsZSAgID0gJ1dhcm5pbmcnO1xyXG5cdFx0XHRsZXQgbWVzc2FnZSA9IGBBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIGFsbCB0aGUgZXhpc3RpbmcgcHJlc2V0cz9gO1xyXG5cclxuXHRcdFx0YWN0aW9ucy5wdXNoKHt0aXRsZTogJ1llcywgSVxcJ20gc3VyZScsIG1haW46IHRydWUsIGhhbmRsZXI6ICgpID0+IHtcclxuXHRcdFx0XHRjdHgucHJlc2V0cyA9IFtdO1xyXG5cdFx0XHRcdEV4dEFQSS5pbnZva2UoJ3NhdmUtc2V0dGluZ3MnLCB7cHJlc2V0czogY3R4LnByZXNldHN9KTtcclxuXHRcdFx0XHR2aWV3LmRpc21pc3NNZXNzYWdlKCk7XHJcblx0XHRcdH19KVxyXG5cdFx0XHRhY3Rpb25zLnB1c2goe3RpdGxlOiAnTm8sIGRvblxcJ3QgZG8gaXQnLCBoYW5kbGVyOiAoKSA9PiB2aWV3LmRpc21pc3NNZXNzYWdlKCl9KVxyXG5cclxuXHRcdFx0dmlldy5zaG93TWVzc2FnZSh0aXRsZSwgbWVzc2FnZSwgYWN0aW9ucywge2NsYXNzOiAnZGFuZ2VyJ30pO1xyXG5cdFx0fVxyXG5cclxuXHRcdHByZXNldHNSZXNldChldnQsIGN0eCkge1xyXG5cdFx0XHRjb25zdCByZXNldCA9ICgpID0+IHtcclxuXHRcdFx0XHRFeHRBUEkuaW52b2tlKCdkZWZhdWx0LXNldHRpbmdzJykudGhlbihkZWZhdWx0cyA9PiB7XHJcblx0XHRcdFx0XHRjdHgucHJlc2V0cyA9IFtdO1xyXG5cdFx0XHRcdFx0Y3R4LnByZXNldHMgPSBkZWZhdWx0cy5wcmVzZXRzO1xyXG5cdFx0XHRcdFx0cmV0dXJuIEV4dEFQSS5pbnZva2UoJ3NhdmUtc2V0dGluZ3MnLCB7cHJlc2V0czogZGVmYXVsdHMucHJlc2V0c30pXHJcblx0XHRcdFx0fSkuY2F0Y2goZXJyID0+IGNvbnNvbGUubG9nKGVycikpXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmICghY3R4LnByZXNldHMgfHwgIWN0eC5wcmVzZXRzLmxlbmd0aCkge1xyXG5cdFx0XHRcdHJldHVybiByZXNldCgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRsZXQgdmlldyAgICA9IGN0eC5wYXJlbnQ7XHJcblx0XHRcdGxldCBhY3Rpb25zID0gW107XHJcblx0XHRcdGxldCB0aXRsZSAgID0gJ1dhcm5pbmcnO1xyXG5cdFx0XHRsZXQgbWVzc2FnZSA9IGBBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gcmVwbGFjZSBhbGwgeW91ciBleGlzdGluZyBwcmVzZXRzIHdpdGggdGhlIGRlZmF1bHQgb25lcz9gO1xyXG5cclxuXHRcdFx0YWN0aW9ucy5wdXNoKHt0aXRsZTogJ1llcywgSVxcJ20gc3VyZScsIG1haW46IHRydWUsIGhhbmRsZXI6ICgpID0+IHtcclxuXHRcdFx0XHRyZXNldCgpO1xyXG5cdFx0XHRcdHZpZXcuZGlzbWlzc01lc3NhZ2UoKTtcclxuXHRcdFx0fX0pXHJcblx0XHRcdGFjdGlvbnMucHVzaCh7dGl0bGU6ICdObywgZG9uXFwndCBkbyBpdCcsIGhhbmRsZXI6ICgpID0+IHZpZXcuZGlzbWlzc01lc3NhZ2UoKX0pXHJcblxyXG5cdFx0XHR2aWV3LnNob3dNZXNzYWdlKHRpdGxlLCBtZXNzYWdlLCBhY3Rpb25zLCB7Y2xhc3M6ICdkYW5nZXInfSk7XHJcblx0XHR9XHJcblxyXG5cdFx0cHJlc2V0QWRkKGV2dCwgY3R4KSB7XHJcblx0XHRcdGN0eC5wYXJlbnQuc2hvd1N1YlBhZ2UoJ3dyLXBhZ2UtZWRpdC1wcmVzZXQnLCAnYWRkJyk7XHJcblx0XHR9XHJcblxyXG5cdFx0cHJlc2V0RWRpdChldnQsIGN0eCkge1xyXG5cdFx0XHRjdHgucGFyZW50LnNob3dTdWJQYWdlKCd3ci1wYWdlLWVkaXQtcHJlc2V0JywgYGVkaXQ9JHtjdHguaXRlbS5pZH1gKTtcclxuXHRcdH1cclxuXHJcblx0XHRwcmVzZXREZWxldGUoZXZ0LCBjdHgpIHtcclxuXHRcdFx0bGV0IGluZGV4ID0gY3R4LmluZGV4O1xyXG5cdFx0XHRsZXQgdmlld3MgPSB0aGlzLnBhcmVudC5jdXJyZW50Vmlldy5iaW5kaW5nc1swXS5pdGVyYXRlZDtcclxuXHRcdFx0bGV0IG5vZGU6IEhUTUxFbGVtZW50ID0gdmlld3NbaW5kZXhdLmVsc1swXTtcclxuXHJcblx0XHRcdCQuYW5pbWF0ZShub2RlLCAncHVmZi1vdXQnLCAndHJhbnNmb3JtJykudGhlbihuID0+IHtcclxuXHRcdFx0XHQkLmFuaW1hdGUobm9kZSwgJ2NvbGxhcHNlJywgJ21hcmdpbi10b3AnKS50aGVuKG4gPT4ge1xyXG5cdFx0XHRcdFx0dmlld3NbaW5kZXhdLnVuYmluZCgpO1xyXG5cclxuXHRcdFx0XHRcdG5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcclxuXHJcblx0XHRcdFx0XHR2aWV3cy5zcGxpY2UoaW5kZXgsIDEpO1xyXG5cdFx0XHRcdFx0dGhpcy5wcmVzZXRzLnNwbGljZShpbmRleCwgMSk7XHJcblxyXG5cdFx0XHRcdFx0X3JlaW5kZXgodmlld3MpO1xyXG5cclxuXHRcdFx0XHRcdEV4dEFQSS5pbnZva2UoJ3NhdmUtc2V0dGluZ3MnLCB7cHJlc2V0czogdGhpcy5wcmVzZXRzfSk7XHJcblx0XHRcdFx0fSlcclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHJcblx0XHRwcml2YXRlIF9wZXJmb3JtVW5ib3VuZChjYWxsYmFjayk6IGFueSB7XHJcblx0XHRcdGxldCBiaW5kaW5nID0gdGhpcy5wYXJlbnQuY3VycmVudFZpZXc7Ly8uYmluZGluZ3NbMF07XHJcblx0XHRcdGJpbmRpbmcudW5iaW5kKCk7XHJcblx0XHRcdGxldCByZXN1bHQgPSBjYWxsYmFjaygpO1xyXG5cdFx0XHRiaW5kaW5nLmJpbmQoKTtcclxuXHRcdFx0YmluZGluZy5zeW5jKCk7XHJcblxyXG5cdFx0XHQvLyBmb3IgKGxldCB2aWV3IG9mIGJpbmRpbmcuaXRlcmF0ZWQpIHtcclxuXHRcdFx0Ly8gXHR2aWV3LnN5bmMoKTtcclxuXHRcdFx0Ly8gfVxyXG5cclxuXHRcdFx0cmV0dXJuIHJlc3VsdDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9yZWluZGV4KHZpZXdzOiBhbnlbXSk6IHZvaWQge1xyXG5cdFx0dmlld3MuZm9yRWFjaCgodmlldywgaW5kZXgpID0+IHtcclxuXHRcdFx0dmlldy5tb2RlbHMuaW5kZXggPSBpbmRleDtcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHRDb3JlLkNvbXBvbmVudHMuY3JlYXRlKCd3ci1wYWdlLXByZXNldHMnLCB7XHJcblx0XHRzdGF0aWM6IFtdLFxyXG5cdFx0aW5pdGlhbGl6ZTogKGVsLCBkYXRhKSA9PiBuZXcgUGFnZVByZXNldHMoZWwsIGRhdGEpXHJcblx0fSlcclxufVxyXG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vLi4vdHlwaW5ncy9yaXZldHMuZC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi8uLi90eXBpbmdzL0V4dEFQSS5kLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uLy4uL3R5cGluZ3MvdGFiLW5hdi5kLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uLy4uL3R5cGluZ3MvY29tbW9uLmQudHNcIiAvPlxyXG5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vcGFnZXMvc2V0dGluZ3MudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9wYWdlcy9wcmVzZXRzLnRzXCIgLz5cclxuXHJcbm1vZHVsZSBWaWV3cy5TZXR0aW5ncyB7XHJcblx0aW1wb3J0IE1vZGFsTWVzc2FnZSA9IFZpZXdzLkNvbW1vbi5Nb2RhbE1lc3NhZ2U7XHJcblx0aW1wb3J0IE1vZGFsTWVzc2FnZUFjdGlvbiA9IFZpZXdzLkNvbW1vbi5Nb2RhbE1lc3NhZ2VBY3Rpb247XHJcblxyXG5cdGltcG9ydCAkID0gQ29yZS5VdGlscy5ET007XHJcblxyXG5cdGV4cG9ydCBjbGFzcyBTZXR0aW5nc1ZpZXcge1xyXG5cdFx0cHVibGljIHNlbGVjdGVkOiBib29sZWFuID0gZmFsc2U7XHJcblxyXG5cdFx0Y29uc3RydWN0b3IoXHJcblx0XHRcdHB1YmxpYyBpZDogc3RyaW5nLFxyXG5cdFx0XHRwdWJsaWMgdGl0bGU6IHN0cmluZyxcclxuXHRcdFx0cHVibGljIGVsZW1lbnQ6IHN0cmluZ1xyXG5cdFx0KSB7fVxyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGNsYXNzIE1haW5WaWV3IHtcclxuXHRcdG1lbnU6IFNldHRpbmdzVmlld1tdID0gW1xyXG5cdFx0XHRuZXcgU2V0dGluZ3NWaWV3KCcjc2V0dGluZ3MnLCAnc2V0dGluZ3MnLCAnd3ItcGFnZS1zZXR0aW5ncycpLFxyXG5cdFx0XHRuZXcgU2V0dGluZ3NWaWV3KCcjcHJlc2V0cycsICdwcmVzZXRzJywgJ3dyLXBhZ2UtcHJlc2V0cycpLFxyXG5cdFx0XHRuZXcgU2V0dGluZ3NWaWV3KCcjaG90a2V5cycsICdob3RrZXlzJywgJ3dyLXBhZ2UtaG90a2V5cycpLFxyXG5cdFx0XHRuZXcgU2V0dGluZ3NWaWV3KCcjc3luYycsICdzeW5jJywgJ3dyLXBhZ2Utc3luYycpLFxyXG5cdFx0XHRuZXcgU2V0dGluZ3NWaWV3KCcjaGVscCcsICdhYm91dCcsICd3ci1wYWdlLWhlbHAnKVxyXG5cdFx0XTtcclxuXHJcblx0XHRyb3V0ZXM6IFNldHRpbmdzVmlld1tdID0gW1xyXG5cdFx0XHRuZXcgU2V0dGluZ3NWaWV3KCcjaGVscC9yZWxlYXNlLW5vdGVzJywgJ3JlbGVhc2Utbm90ZXMnLCAnd3ItcGFnZS1yZWxlYXNlLW5vdGVzJyksXHJcblx0XHRcdG5ldyBTZXR0aW5nc1ZpZXcoJyNwcm8nLCAncHJvJywgJ3dyLXBhZ2UtcHJvJylcclxuXHRcdF1cclxuXHJcblx0XHRjdXJyZW50VmlldzogYW55OyAvLyByaXZldHMuXy5WaWV3XHJcblx0XHRzZWxlY3RlZFZpZXc6IFNldHRpbmdzVmlldztcclxuXHRcdGN1cnJlbnRNZXNzYWdlOiBNb2RhbE1lc3NhZ2U7XHJcblxyXG5cdFx0bGljZW5zZTogYW55ID0gbnVsbDtcclxuXHRcdHByZXNldHNJY29uc1N0eWxlOiBzdHJpbmcgPSAnJztcclxuXHJcblx0XHRjb25zdHJ1Y3RvcigpIHtcclxuXHRcdFx0dGhpcy5uYXZpZ2F0ZVRvID0gdGhpcy5uYXZpZ2F0ZVRvLmJpbmQodGhpcyk7XHJcblx0XHRcdHRoaXMuaGFuZGxlTmF2aWdhdGVUb1RhYiA9IHRoaXMuaGFuZGxlTmF2aWdhdGVUb1RhYi5iaW5kKHRoaXMpO1xyXG5cclxuXHRcdFx0dGhpcy5zaG93TWVzc2FnZSA9IHRoaXMuc2hvd01lc3NhZ2UuYmluZCh0aGlzKTtcclxuXHRcdFx0dGhpcy5kaXNtaXNzTWVzc2FnZSA9IHRoaXMuZGlzbWlzc01lc3NhZ2UuYmluZCh0aGlzKTtcclxuXHJcblx0XHRcdEV4dEFQSS5pbnZva2UoJ2dldC1zZXR0aW5ncycpLnRoZW4oc2V0dGluZ3MgPT4ge1xyXG5cdFx0XHRcdHRoaXMubGljZW5zZSA9IHNldHRpbmdzLmxpY2Vuc2U7XHJcblx0XHRcdFx0dGhpcy5wcmVzZXRzSWNvbnNTdHlsZSA9IHNldHRpbmdzLnByZXNldHNJY29uc1N0eWxlO1xyXG5cclxuXHRcdFx0XHRyZXR1cm4gRXh0QVBJLmludm9rZSgnc2V0dGluZ3M6cmVxdWVzdGVkLXBhZ2UnKTtcclxuXHRcdFx0fSkudGhlbih1cmwgPT4ge1xyXG5cdFx0XHRcdHRoaXMuX3Nob3dWaWV3KHVybCkgfHwgdGhpcy5zaG93Vmlldyh0aGlzLm1lbnVbMF0pO1xyXG5cdFx0XHRcdC8vIHRoaXMuc2hvd1ZpZXcodGhpcy5fdmlldygnI3BybycpKTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0XHRjaHJvbWUucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKG1zZywgc2VuZGVyLCByZXNwb25kKSA9PiB7XHJcblx0XHRcdFx0aWYgKG1zZyAmJiBtc2cuc2hvd1BhZ2UpIHtcclxuXHRcdFx0XHRcdGxldCB2aWV3ID0gdGhpcy5fc2hvd1ZpZXcobXNnLnNob3dQYWdlKTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGlmIChtc2cgJiYgbXNnLlVwZGF0ZWRTZXR0aW5ncykge1xyXG5cdFx0XHRcdFx0aWYgKCdsaWNlbnNlJyBpbiBtc2cuVXBkYXRlZFNldHRpbmdzKSB7XHJcblx0XHRcdFx0XHRcdHRoaXMubGljZW5zZSA9IG1zZy5VcGRhdGVkU2V0dGluZ3MubGljZW5zZTtcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRpZiAoJ3ByZXNldHNJY29uc1N0eWxlJyBpbiBtc2cuVXBkYXRlZFNldHRpbmdzKSB7XHJcblx0XHRcdFx0XHRcdHRoaXMucHJlc2V0c0ljb25zU3R5bGUgPSBtc2cuVXBkYXRlZFNldHRpbmdzLnByZXNldHNJY29uc1N0eWxlO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHJcblx0XHRfc2hvd1ZpZXcodXJsOiBzdHJpbmcpIHtcclxuXHRcdFx0bGV0IFtwYWdlLCAuLi5hcmdzXSA9ICh1cmwgfHwgJycpLnNwbGl0KCcvJyk7XHJcblx0XHRcdGxldCB2aWV3ID0gdGhpcy5fdmlldyh1cmwpIHx8IHRoaXMuX3ZpZXcocGFnZSk7XHJcblx0XHRcdGxldCBwYXJhbXMgPSAnJztcclxuXHJcblx0XHRcdGlmIChhcmdzICYmIGFyZ3MubGVuZ3RoKSB7XHJcblx0XHRcdFx0cGFyYW1zID0gYXJncy5qb2luKCcvJyk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHZpZXcgJiYgdGhpcy5zaG93Vmlldyh2aWV3LCBwYXJhbXMpO1xyXG5cclxuXHRcdFx0cmV0dXJuIHZpZXc7XHJcblx0XHR9XHJcblxyXG5cdFx0c2hvd1ZpZXcodmlldzogU2V0dGluZ3NWaWV3LCBwYXJhbXM6IHN0cmluZyA9ICcnKSB7XHJcblx0XHRcdHRoaXMuc2VsZWN0ZWRWaWV3ID0gdmlldztcclxuXHRcdFx0cGFyYW1zID0gcGFyYW1zIHx8ICcnO1xyXG5cclxuXHRcdFx0Zm9yIChsZXQgaXRlbSBvZiB0aGlzLm1lbnUpIHtcclxuXHRcdFx0XHRpdGVtLnNlbGVjdGVkID0gdmlldy5pZC5pbmRleE9mKGl0ZW0uaWQpID09PSAwO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQkLmhpZGUoJyNjb250ZW50JykudGhlbihfID0+IHtcclxuXHRcdFx0XHR0aGlzLmN1cnJlbnRWaWV3ICYmIHRoaXMuY3VycmVudFZpZXcudW5iaW5kKCk7XHJcblx0XHRcdFx0dGhpcy5jdXJyZW50VmlldyA9IHJpdmV0cy5pbml0KHZpZXcuZWxlbWVudCwgbnVsbCwge3BhcmVudDogdGhpc30pO1xyXG5cclxuXHRcdFx0XHRsZXQgbW9kZWwgPSB0aGlzLmN1cnJlbnRWaWV3Lm1vZGVscztcclxuXHJcblx0XHRcdFx0d2luZG93LmxvY2F0aW9uLmhhc2ggPSBgJHt2aWV3LmlkfS8ke3BhcmFtc31gO1xyXG5cclxuXHRcdFx0XHQkLmVtcHR5KCcjY29udGVudCcpO1xyXG5cdFx0XHRcdCQucSgnI2NvbnRlbnQnKS5hcHBlbmRDaGlsZCh0aGlzLmN1cnJlbnRWaWV3LmVsc1swXSk7XHJcblx0XHRcdFx0bW9kZWwuaW5pdCAmJiBtb2RlbC5pbml0KCk7XHJcblx0XHRcdFx0JC5zaG93KCcjY29udGVudCcpO1xyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cclxuXHRcdHNob3dTdWJQYWdlKGVsZW1lbnQ6IHN0cmluZywgaWQ6IHN0cmluZykge1xyXG5cdFx0XHR0aGlzLnNob3dWaWV3KG5ldyBTZXR0aW5nc1ZpZXcoYCR7dGhpcy5zZWxlY3RlZFZpZXcuaWR9LyR7aWR9YCwgaWQsIGVsZW1lbnQpKTtcclxuXHRcdH1cclxuXHJcblx0XHRuYXZpZ2F0ZVRvKGV2dCwgY3R4KSB7XHJcblx0XHRcdGxldCBpdGVtID0gY3R4Lml0ZW07XHJcblx0XHRcdFxyXG5cdFx0XHRpZiAoIWl0ZW0pIHtcclxuXHRcdFx0XHRsZXQgdGFyZ2V0ID0gZXZ0LnRhcmdldDtcclxuXHRcdFx0XHR3aGlsZSAodGFyZ2V0ICYmICF0YXJnZXQubWF0Y2hlcygnYSwgYnV0dG9uJykpIHtcclxuXHRcdFx0XHRcdHRhcmdldCA9IHRhcmdldC5wYXJlbnROb2RlO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0aWYgKHRhcmdldCkge1xyXG5cdFx0XHRcdFx0aXRlbSA9IHRoaXMuX3ZpZXcodGFyZ2V0Lmhhc2ggfHwgdGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1oYXNoJykpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Y29uc29sZS5sb2coaXRlbSlcclxuXHJcblx0XHRcdHRoaXMuc2hvd1ZpZXcoaXRlbSk7XHJcblx0XHR9XHJcblxyXG5cdFx0aGFuZGxlTmF2aWdhdGVUb1RhYihldnQsIGN0eCkge1xyXG5cdFx0XHRldnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0dGhpcy5uYXZpZ2F0ZVRvVGFiKGV2dC50YXJnZXQpO1xyXG5cdFx0fVxyXG5cclxuXHRcdG5hdmlnYXRlVG9UYWIodGFyZ2V0KSB7XHJcblx0XHRcdGlmICh0YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdzZWxlY3RlZCcpKSB7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRsZXQgY3VycmVudCA9IDxIVE1MQW5jaG9yRWxlbWVudD4gJC5xKCcuc2VsZWN0ZWQnLCB0YXJnZXQucGFyZW50Tm9kZSk7XHJcblx0XHRcdGxldCBzaG93TmV4dCA9ICgpID0+IHtcclxuXHRcdFx0XHQkLmFkZENsYXNzKHRhcmdldCwgJ3NlbGVjdGVkJyk7XHJcblx0XHRcdFx0JC5hZGRDbGFzcyh0YXJnZXQuaGFzaCwgJ3Zpc2libGUnKTtcclxuXHRcdFx0XHRzZXRUaW1lb3V0KCgpID0+IHskLmFkZENsYXNzKHRhcmdldC5oYXNoLCAnc2VsZWN0ZWQnKX0sIDEpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoIWN1cnJlbnQpIHtcclxuXHRcdFx0XHRyZXR1cm4gc2hvd05leHQoKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0JC5yZW1vdmVDbGFzcyhjdXJyZW50LCAnc2VsZWN0ZWQnKTtcclxuXHRcdFx0JC5oaWRlKGN1cnJlbnQuaGFzaCwgJ3NlbGVjdGVkJykudGhlbihfID0+IHtcclxuXHRcdFx0XHQkLnJlbW92ZUNsYXNzKGN1cnJlbnQuaGFzaCwgJ3Zpc2libGUnKTtcclxuXHRcdFx0XHRzaG93TmV4dCgpO1xyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblx0XHRzaG93TWVzc2FnZSh0aXRsZTogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcsIGFjdGlvbnM/OiBNb2RhbE1lc3NhZ2VBY3Rpb25bXSwgb3B0aW9uczogYW55ID0ge30pIHtcclxuXHRcdFx0aWYgKCFhY3Rpb25zIHx8IGFjdGlvbnMubGVuZ3RoID09PSAwKSB7XHJcblx0XHRcdFx0YWN0aW9ucyA9IFt7dGl0bGU6ICdPSycsIG9uRGlzbWlzczogdHJ1ZSwgaGFuZGxlcjogdGhpcy5kaXNtaXNzTWVzc2FnZX1dO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLmN1cnJlbnRNZXNzYWdlID0gbmV3IE1vZGFsTWVzc2FnZSh0aXRsZSwgbWVzc2FnZSwgZmFsc2UsIGFjdGlvbnMsIG9wdGlvbnMpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGRpc21pc3NNZXNzYWdlKCkge1xyXG5cdFx0XHR0aGlzLmN1cnJlbnRNZXNzYWdlLmhpZGUoKS50aGVuKHggPT4ge1xyXG5cdFx0XHRcdHRoaXMuY3VycmVudE1lc3NhZ2UgPSBudWxsXHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cclxuXHRcdF92aWV3KGlkOiBzdHJpbmcpOiBTZXR0aW5nc1ZpZXcge1xyXG5cdFx0XHRsZXQgcm91dGVzID0gdGhpcy5tZW51LmNvbmNhdCh0aGlzLnJvdXRlcyk7XHJcblxyXG5cdFx0XHRmb3IgKGxldCB2aWV3IG9mIHJvdXRlcykge1xyXG5cdFx0XHRcdGlmICh2aWV3LmlkID09PSBpZCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHZpZXc7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdH1cclxuXHJcblx0XHRfbG9nKGVycjogYW55KSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKGVycik7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRleHBvcnQgdmFyIG1haW5WaWV3ID0gbmV3IE1haW5WaWV3KCk7XHJcblx0ZXhwb3J0IHZhciBtb2RlbCA9IHJpdmV0cy5iaW5kKGRvY3VtZW50LmJvZHksIG1haW5WaWV3KTtcclxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi8uLi8uLi90eXBpbmdzL2NvbW1vbi5kLnRzXCIgLz5cclxuXHJcbm1vZHVsZSBWaWV3cy5TZXR0aW5ncyB7XHJcblx0ZXhwb3J0IGNsYXNzIFRhYkNvbnRlbnQgZXh0ZW5kcyBDb3JlLkN1c3RvbUVsZW1lbnQge1xyXG5cdFx0Y29uc3RydWN0b3Iobm9kZSwgZGF0YSkge1xyXG5cdFx0XHRzdXBlcihub2RlLCBkYXRhKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdENvcmUuQ29tcG9uZW50cy5jcmVhdGUoJ3dyLXRhYi1jb250ZW50Jywge1xyXG5cdFx0c3RhdGljOiBbXSxcclxuXHRcdGluaXRpYWxpemU6IChlbCwgZGF0YSkgPT4gbmV3IFRhYkNvbnRlbnQoZWwsIGRhdGEpXHJcblx0fSlcclxufVxyXG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vLi4vLi4vdHlwaW5ncy9jb21tb24uZC50c1wiIC8+XHJcblxyXG5tb2R1bGUgVmlld3MuU2V0dGluZ3Mge1xyXG5cdGV4cG9ydCBjbGFzcyBUYWJHcm91cCBleHRlbmRzIENvcmUuQ3VzdG9tRWxlbWVudCB7XHJcblx0XHRjb25zdHJ1Y3Rvcihub2RlLCBkYXRhKSB7XHJcblx0XHRcdHN1cGVyKG5vZGUsIGRhdGEpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Q29yZS5Db21wb25lbnRzLmNyZWF0ZSgnd3ItdGFiLWdyb3VwJywge1xyXG5cdFx0c3RhdGljOiBbXSxcclxuXHRcdGluaXRpYWxpemU6IChlbCwgZGF0YSkgPT4gbmV3IFRhYkdyb3VwKGVsLCBkYXRhKVxyXG5cdH0pXHJcbn1cclxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uLy4uLy4uL3R5cGluZ3MvY29tbW9uLmQudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vLi4vLi4vdHlwaW5ncy9FeHRBUEkuZC50c1wiIC8+XHJcblxyXG5tb2R1bGUgVmlld3MuU2V0dGluZ3Mge1xyXG5cdGltcG9ydCAkID0gQ29yZS5VdGlscy5ET007XHJcblx0aW1wb3J0IFByZXNldCA9IENvcmUuUHJlc2V0O1xyXG5cdGltcG9ydCBQcmVzZXRUeXBlID0gQ29yZS5QcmVzZXRUeXBlO1xyXG5cdGltcG9ydCBQcmVzZXRUYXJnZXQgPSBDb3JlLlByZXNldFRhcmdldDtcclxuXHRpbXBvcnQgUHJlc2V0UG9zaXRpb24gPSBDb3JlLlByZXNldFBvc2l0aW9uO1xyXG5cclxuXHRpbXBvcnQgRm9ybWF0SW50ZWdlciA9IENvcmUuRm9ybWF0dGVycy5Ub0ludDtcclxuXHJcblx0ZXhwb3J0IGNsYXNzIFBhZ2VFZGl0UHJlc2V0IGV4dGVuZHMgQ29yZS5DdXN0b21FbGVtZW50IHtcclxuXHRcdHB1YmxpYyBwYXJlbnQ6IGFueTsgLy8gVmlld3MuU2V0dGluZ3MuTWFpblZpZXc7XHJcblxyXG5cdFx0cHVibGljIHRpdGxlOiBzdHJpbmcgPSAnYWRkIHByZXNldCc7XHJcblx0XHRwdWJsaWMgaWQ6IHN0cmluZztcclxuXHJcblx0XHRwdWJsaWMgcHJlc2V0OiBQcmVzZXQgPSBuZXcgUHJlc2V0KHt9KTtcclxuXHJcblx0XHRwdWJsaWMgZm9ybUVycm9yczogc3RyaW5nW10gPSBbXTtcclxuXHJcblx0XHRjb25zdHJ1Y3Rvcihub2RlLCBkYXRhKSB7XHJcblx0XHRcdHN1cGVyKG5vZGUsIGRhdGEpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGluaXQoKSB7XHJcblx0XHRcdGxldCBwYXJhbXMgPSB3aW5kb3cubG9jYXRpb24uaGFzaC5tYXRjaCgvZWRpdD0oW15cXC9dKykvKTtcclxuXHRcdFx0dGhpcy5pZCA9IHBhcmFtcyA/IHBhcmFtc1sxXSA6ICcnO1xyXG5cclxuXHRcdFx0aWYgKHRoaXMuaWQpIHtcclxuXHRcdFx0XHR0aGlzLnRpdGxlID0gJ2VkaXQgcHJlc2V0JztcclxuXHJcblx0XHRcdFx0RXh0QVBJLmludm9rZSgnZ2V0LXByZXNldHMnKS50aGVuKHByZXNldHMgPT4ge1xyXG5cdFx0XHRcdFx0bGV0IGRhdGEgPSBwcmVzZXRzLmZpbmQoaXRlbSA9PiBpdGVtLmlkID09PSB0aGlzLmlkKTtcclxuXHRcdFx0XHRcdHRoaXMucHJlc2V0ID0gbmV3IFByZXNldChkYXRhKTtcclxuXHRcdFx0XHRcdHRoaXMuY3VzdG9tUG9zaXRpb24gPSB0aGlzLnByZXNldC5wb3NpdGlvbjtcclxuXHRcdFx0XHRcdHRoaXMuY3VzdG9tSWNvbiA9IHRoaXMucHJlc2V0LnR5cGU7XHJcblx0XHRcdFx0fSlcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHVzZUN1cnJlbnRTaXplKGV2dCwgY3R4KSB7XHJcblx0XHRcdGNocm9tZS53aW5kb3dzLmdldEN1cnJlbnQoe3BvcHVsYXRlOiB0cnVlfSwgd2luID0+IHtcclxuXHRcdFx0XHRsZXQgdGFiOiBhbnkgPSB3aW4udGFicy5maWx0ZXIodGFiID0+IHRhYi5hY3RpdmUpLnBvcCgpO1xyXG5cclxuXHRcdFx0XHRpZiAoY3R4LnByZXNldC50YXJnZXQgPT0gMSkge1xyXG5cdFx0XHRcdFx0Y3R4LnByZXNldC53aWR0aCAgPSB0YWIud2lkdGg7XHJcblx0XHRcdFx0XHRjdHgucHJlc2V0LmhlaWdodCA9IHRhYi5oZWlnaHQ7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdGN0eC5wcmVzZXQud2lkdGggID0gd2luLndpZHRoO1xyXG5cdFx0XHRcdFx0Y3R4LnByZXNldC5oZWlnaHQgPSB3aW4uaGVpZ2h0O1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHJcblx0XHR1c2VDdXJyZW50UG9zaXRpb24oZXZ0LCBjdHgpIHtcclxuXHRcdFx0Y2hyb21lLndpbmRvd3MuZ2V0Q3VycmVudCh3aW4gPT4ge1xyXG5cdFx0XHRcdGN0eC5jdXN0b21Qb3NpdGlvbiA9IFByZXNldFBvc2l0aW9uLkNVU1RPTTtcclxuXHJcblx0XHRcdFx0Y3R4LnByZXNldC5sZWZ0ID0gd2luLmxlZnQ7XHJcblx0XHRcdFx0Y3R4LnByZXNldC50b3AgID0gd2luLnRvcDtcclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHJcblx0XHRnZXQgYWxsb3dDdXN0b21Qb3NpdGlvbigpOiBib29sZWFuIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMucHJlc2V0LnBvc2l0aW9uID09PSBQcmVzZXRQb3NpdGlvbi5DVVNUT007XHJcblx0XHR9XHJcblxyXG5cdFx0c2V0IGFsbG93Q3VzdG9tUG9zaXRpb24obmV3VmFsdWUpIHtcclxuXHRcdFx0Ly8gcGxhY2Vob2xkZXIgc2V0dGVyXHJcblx0XHR9XHJcblxyXG5cdFx0Z2V0IGN1c3RvbVBvc2l0aW9uKCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5wcmVzZXQucG9zaXRpb247XHJcblx0XHR9XHJcblxyXG5cdFx0c2V0IGN1c3RvbVBvc2l0aW9uKG5ld1ZhbHVlOiBhbnkpIHtcclxuXHRcdFx0bmV3VmFsdWUgPSBwYXJzZUludChuZXdWYWx1ZSwgMTApO1xyXG5cdFx0XHR0aGlzLnByZXNldC5wb3NpdGlvbiA9IG5ld1ZhbHVlO1xyXG5cclxuXHRcdFx0aWYgKG5ld1ZhbHVlICE9PSBQcmVzZXRQb3NpdGlvbi5DVVNUT00pIHtcclxuXHRcdFx0XHR0aGlzLnByZXNldC5sZWZ0ID0gbnVsbDtcclxuXHRcdFx0XHR0aGlzLnByZXNldC50b3AgID0gbnVsbDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy5hbGxvd0N1c3RvbVBvc2l0aW9uID0gbmV3VmFsdWU7XHJcblx0XHR9XHJcblxyXG5cdFx0Z2V0IGN1c3RvbUljb24oKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLnByZXNldC50eXBlO1xyXG5cdFx0fVxyXG5cclxuXHRcdHNldCBjdXN0b21JY29uKG5ld1ZhbHVlOiBhbnkpIHtcclxuXHRcdFx0bmV3VmFsdWUgPSBwYXJzZUludChuZXdWYWx1ZSwgMTApO1xyXG5cdFx0XHR0aGlzLnByZXNldC50eXBlID0gbmV3VmFsdWU7XHJcblx0XHR9XHJcblxyXG5cdFx0Y2FuY2VsKGV2dCwgY3R4KSB7XHJcblx0XHRcdGN0eC5wYXJlbnQuc2hvd1ZpZXcoY3R4LnBhcmVudC5tZW51WzFdKTtcclxuXHRcdH1cclxuXHJcblx0XHRzYXZlUHJlc2V0KGV2dCwgY3R4KSB7XHJcblx0XHRcdGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuXHRcdFx0bGV0IHByZXNldCA9IGN0eC5wcmVzZXQ7XHJcblxyXG5cdFx0XHRjdHguZm9ybUVycm9ycyA9IFtdO1xyXG5cclxuXHRcdFx0aWYgKHByZXNldC53aWR0aCA9PT0gbnVsbCAmJiBwcmVzZXQuaGVpZ2h0ID09PSBudWxsKSB7XHJcblx0XHRcdFx0Y3R4LmZvcm1FcnJvcnMucHVzaCgnWW91IG11c3QgcHJvdmlkZSBhdCBsZWFzdCBvbmUgb2YgdGhlIHdpZHRoIGFuZCBoZWlnaHQgdmFsdWVzIScpO1xyXG5cdFx0XHRcdCQucSgnI2NvbnRlbnQnKS5zY3JvbGxUb3AgPSAwO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoY3R4LmZvcm1FcnJvcnMubGVuZ3RoKSB7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRFeHRBUEkuaW52b2tlKCdzYXZlLXByZXNldCcsIHByZXNldCkudGhlbihkYXRhID0+IHtcclxuXHRcdFx0XHRjdHgucGFyZW50LnNob3dWaWV3KGN0eC5wYXJlbnQubWVudVsxXSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Q29yZS5Db21wb25lbnRzLmNyZWF0ZSgnd3ItcGFnZS1lZGl0LXByZXNldCcsIHtcclxuXHRcdHN0YXRpYzogW10sXHJcblx0XHRpbml0aWFsaXplOiAoZWwsIGRhdGEpID0+IG5ldyBQYWdlRWRpdFByZXNldChlbCwgZGF0YSlcclxuXHR9KVxyXG59XHJcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi8uLi8uLi90eXBpbmdzL2NvbW1vbi5kLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uLy4uLy4uL3R5cGluZ3MvRXh0QVBJLmQudHNcIiAvPlxyXG5cclxubW9kdWxlIFZpZXdzLlNldHRpbmdzIHtcclxuXHRleHBvcnQgY2xhc3MgUGFnZUhlbHAgZXh0ZW5kcyBDb3JlLkN1c3RvbUVsZW1lbnQge1xyXG5cdFx0cHVibGljIGZyaWVuZGx5VmVyc2lvbjogc3RyaW5nO1xyXG5cdFx0cHVibGljIGNvbXBsZXRlVmVyc2lvbjogc3RyaW5nO1xyXG5cdFx0cHVibGljIGRlYnVnTG9nOiBzdHJpbmc7XHJcblxyXG5cdFx0Y29uc3RydWN0b3Iobm9kZSwgZGF0YSkge1xyXG5cdFx0XHRzdXBlcihub2RlLCBkYXRhKTtcclxuXHRcdH1cclxuXHJcblx0XHRpbml0KCkge1xyXG5cdFx0XHRsZXQgY29uZmlnOiBhbnkgPSBjaHJvbWUucnVudGltZS5nZXRNYW5pZmVzdCgpO1xyXG5cclxuXHRcdFx0dGhpcy5mcmllbmRseVZlcnNpb24gPSBjb25maWcudmVyc2lvbl9uYW1lIHx8IGNvbmZpZy52ZXJzaW9uO1xyXG5cdFx0XHR0aGlzLmNvbXBsZXRlVmVyc2lvbiA9IGNvbmZpZy52ZXJzaW9uX25hbWUgPyBgKCR7Y29uZmlnLnZlcnNpb259KWAgOiAnJztcclxuXHRcdFx0XHJcblx0XHRcdGxldCBsb2cgPSBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2VbJ2RlYnVnTG9nJ10gfHwgJ1tdJyk7XHJcblx0XHRcdGxldCByb3dzID0gW107XHJcblxyXG5cdFx0XHRmb3IgKGxldCByID0gMCwgbCA9IGxvZy5sZW5ndGg7IHIgPCBsOyByKyspIHtcclxuXHRcdFx0XHRyb3dzLnB1c2goSlNPTi5zdHJpbmdpZnkobG9nW3JdKSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRoaXMuZGVidWdMb2cgPSByb3dzLmxlbmd0aCA/IGBbXFxuICAgICR7cm93cy5qb2luKFwiLFxcbiAgICBcIil9XFxuXWAgOiBudWxsO1xyXG5cdFx0fVxyXG5cclxuXHRcdHNob3dSZWxlYXNlTm90ZXMoZXZ0LCBjdHgpIHtcclxuXHRcdFx0Y3R4LnBhcmVudC5zaG93U3ViUGFnZSgnd3ItcGFnZS1yZWxlYXNlLW5vdGVzJywgJ3JlbGVhc2Utbm90ZXMnKTtcclxuXHRcdH1cclxuXHJcblx0XHRzaG93RGVidWdMb2coZXZ0LCBjdHgpIHtcclxuXHRcdFx0Y3R4LnBhcmVudC5zaG93TWVzc2FnZSgnRXJyb3JzIGxvZycsIGA8cHJlPiR7Y3R4LmRlYnVnTG9nfTwvcHJlPmAsIG51bGwsIHtjbGFzczogJ2Rhbmdlcid9KTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdENvcmUuQ29tcG9uZW50cy5jcmVhdGUoJ3dyLXBhZ2UtaGVscCcsIHtcclxuXHRcdHN0YXRpYzogW10sXHJcblx0XHRpbml0aWFsaXplOiAoZWwsIGRhdGEpID0+IG5ldyBQYWdlSGVscChlbCwgZGF0YSlcclxuXHR9KVxyXG59XHJcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi8uLi8uLi90eXBpbmdzL2NvbW1vbi5kLnRzXCIgLz5cclxuXHJcbm1vZHVsZSBWaWV3cy5TZXR0aW5ncyB7XHJcblx0aW1wb3J0ICQgPSBDb3JlLlV0aWxzLkRPTTtcclxuXHJcblx0ZXhwb3J0IGNsYXNzIFBhZ2VIb3RrZXlzIGV4dGVuZHMgQ29yZS5DdXN0b21FbGVtZW50IHtcclxuXHRcdHB1YmxpYyBwYXJlbnQ6IGFueTsgLy8gVmlld3MuU2V0dGluZ3MuTWFpblZpZXc7XHJcblxyXG5cdFx0cHVibGljIGtleV9TaG93UG9wdXA6IHN0cmluZyA9ICc8bm90IHNldD4nO1xyXG5cdFx0cHVibGljIGtleV9Ub2dnbGVUb29sdGlwOiBzdHJpbmcgPSAnPG5vdCBzZXQ+JztcclxuXHRcdHB1YmxpYyBrZXlfQ3ljbGVQcmVzZXRzOiBzdHJpbmcgPSAnPG5vdCBzZXQ+JztcclxuXHRcdHB1YmxpYyBrZXlfQ3ljbGVQcmVzZXRzUmV2OiBzdHJpbmcgPSAnPG5vdCBzZXQ+JztcclxuXHJcblx0XHRwdWJsaWMgZ2xvYmFsU2hvcnRjdXRzOiBjaHJvbWUuY29tbWFuZHMuQ29tbWFuZFtdO1xyXG5cclxuXHRcdGNvbnN0cnVjdG9yKG5vZGUsIGRhdGEpIHtcclxuXHRcdFx0c3VwZXIobm9kZSwgZGF0YSk7XHJcblx0XHR9XHJcblxyXG5cdFx0aW5pdCgpIHtcclxuXHRcdFx0dGhpcy5wYXJlbnQubmF2aWdhdGVUb1RhYigkLnEoJy50YWItbmF2IGEnKSk7XHJcblxyXG5cdFx0XHRjaHJvbWUuY29tbWFuZHMuZ2V0QWxsKGNvbW1hbmRzID0+IHRoaXMuZ2xvYmFsU2hvcnRjdXRzID0gY29tbWFuZHMpXHJcblxyXG5cdFx0fVxyXG5cclxuXHRcdGNvbmZpZ3VyZVNob3J0Y3V0cygpIHtcclxuXHRcdFx0Y2hyb21lLnRhYnMuY3JlYXRlKHtcclxuXHRcdFx0XHR1cmwgOiAnY2hyb21lOi8vZXh0ZW5zaW9ucy9zaG9ydGN1dHMnLFxyXG5cdFx0XHRcdGFjdGl2ZSA6IHRydWVcclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdENvcmUuQ29tcG9uZW50cy5jcmVhdGUoJ3dyLXBhZ2UtaG90a2V5cycsIHtcclxuXHRcdHN0YXRpYzogW10sXHJcblx0XHRpbml0aWFsaXplOiAoZWwsIGRhdGEpID0+IG5ldyBQYWdlSG90a2V5cyhlbCwgZGF0YSlcclxuXHR9KVxyXG59XHJcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi8uLi8uLi90eXBpbmdzL2NvbW1vbi5kLnRzXCIgLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi8uLi8uLi90eXBpbmdzL0V4dEFQSS5kLnRzXCIgLz5cblxubW9kdWxlIFZpZXdzLlNldHRpbmdzIHtcblx0ZXhwb3J0IGNsYXNzIFBhZ2VQcm8gZXh0ZW5kcyBDb3JlLkN1c3RvbUVsZW1lbnQge1xuXHRcdHB1YmxpYyBwYXJlbnQ6IGFueTsgLy8gVmlld3MuU2V0dGluZ3MuTWFpblZpZXc7XG5cblx0XHRwdWJsaWMgZGVmYXVsdFByaWNlOiBudW1iZXIgPSA0O1xuXHRcdHB1YmxpYyBwYXlBbW91bnQ6IG51bWJlciA9IDQ7XG5cdFx0cHVibGljIG1pbkFtb3VudDogbnVtYmVyID0gMztcblx0XHRwdWJsaWMgbGljZW5zZUtleTogc3RyaW5nID0gJyc7XG5cdFx0cHVibGljIGVycm9yOiBzdHJpbmcgPSAnJztcblx0XHRwdWJsaWMgYnVzeTogYm9vbGVhbiA9IGZhbHNlO1xuXG5cdFx0Y29uc3RydWN0b3Iobm9kZSwgZGF0YSkge1xuXHRcdFx0c3VwZXIobm9kZSwgZGF0YSk7XG5cdFx0fVxuXG5cdFx0aW5pdCgpIHtcblx0XHRcdFxuXHRcdH1cblxuXHRcdGFjdGl2YXRlID0gKCkgPT4ge1xuXHRcdFx0aWYgKCF0aGlzLmxpY2Vuc2VLZXkubWF0Y2goL15cXHMqW2EtZlxcZF17OH0tW2EtZlxcZF17NH0tW2EtZlxcZF17NH0tW2EtZlxcZF17NH0tW2EtZlxcZF17MTJ9XFxzKiQvaSkpIHtcblx0XHRcdFx0dGhpcy5lcnJvciA9ICdJbnZhbGlkIGxpY2Vuc2Uga2V5ISc7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5lcnJvciA9ICcnO1xuXHRcdFx0dGhpcy5idXN5ID0gdHJ1ZTtcblx0XHRcdFxuXHRcdFx0RXh0QVBJLmludm9rZSgncHJvOmFjdGl2YXRlLWxpY2Vuc2UnLCB7a2V5OiB0aGlzLmxpY2Vuc2VLZXl9KVxuXHRcdFx0XHQudGhlbih0aGlzLl9oYW5kbGVFcnJvcnMpXG5cdFx0XHRcdC50aGVuKGRhdGEgPT4ge1xuXHRcdFx0XHRcdHRoaXMubGljZW5zZUtleSA9ICcnO1xuXHRcdFx0XHRcdC8vIHRoaXMucGFyZW50LmxpY2Vuc2UgPSBkYXRhO1xuXHRcdFx0XHR9KTtcblx0XHR9XG5cblx0XHRwdXJjaGFzZSA9ICgpID0+IHtcblx0XHRcdGlmICh0aGlzLnBheUFtb3VudCA8IHRoaXMubWluQW1vdW50KSB7XG5cdFx0XHRcdHRoaXMuZXJyb3IgPSBgVGhlIG1pbmltdW0gYW1vdW50IGlzIFxcJCR7dGhpcy5taW5BbW91bnQudG9GaXhlZCgyKX1gO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuZXJyb3IgPSAnJztcblx0XHRcdHRoaXMuYnVzeSA9IHRydWU7XG5cdFx0XHRcblx0XHRcdEV4dEFQSS5pbnZva2UoJ3BybzpjaGVja291dC11cmwnLCB7cHJpY2U6IHRoaXMucGF5QW1vdW50fSlcblx0XHRcdFx0LnRoZW4odGhpcy5faGFuZGxlRXJyb3JzKVxuXHRcdFx0XHQudGhlbihkYXRhID0+IHtcblx0XHRcdFx0XHR3aW5kb3cub3BlbihkYXRhLnVybCk7XG5cdFx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdF9oYW5kbGVFcnJvcnMgPSAocmVzcG9uc2U6IGFueSk6IFByb21pc2U8YW55PiA9PiB7XG5cdFx0XHR0aGlzLmJ1c3kgPSBmYWxzZTtcblx0XHRcdHRoaXMuZXJyb3IgPSAnJztcblxuXHRcdFx0aWYgKHJlc3BvbnNlLmVycm9yKSB7XG5cdFx0XHRcdHRoaXMuZXJyb3IgPSByZXNwb25zZS5lcnJvcjtcblx0XHRcdFx0cmV0dXJuIFByb21pc2UucmVqZWN0KHJlc3BvbnNlLmVycm9yKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcblx0XHR9XG5cdH1cblxuXHRDb3JlLkNvbXBvbmVudHMuY3JlYXRlKCd3ci1wYWdlLXBybycsIHtcblx0XHRzdGF0aWM6IFtdLFxuXHRcdGluaXRpYWxpemU6IChlbCwgZGF0YSkgPT4gbmV3IFBhZ2VQcm8oZWwsIGRhdGEpXG5cdH0pXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vLi4vLi4vdHlwaW5ncy9jb21tb24uZC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi8uLi8uLi90eXBpbmdzL0V4dEFQSS5kLnRzXCIgLz5cclxuXHJcbm1vZHVsZSBWaWV3cy5TZXR0aW5ncyB7XHJcblx0ZXhwb3J0IGNsYXNzIFBhZ2VSZWxlYXNlTm90ZXMgZXh0ZW5kcyBDb3JlLkN1c3RvbUVsZW1lbnQge1xyXG5cdFx0cHVibGljIHBhcmVudDogYW55OyAvLyBWaWV3cy5TZXR0aW5ncy5NYWluVmlldztcclxuXHJcblx0XHRjb25zdHJ1Y3Rvcihub2RlLCBkYXRhKSB7XHJcblx0XHRcdHN1cGVyKG5vZGUsIGRhdGEpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGNhbmNlbChldnQsIGN0eCkge1xyXG5cdFx0XHRjdHgucGFyZW50LnNob3dWaWV3KGN0eC5wYXJlbnQubWVudVs0XSk7XHJcblx0XHR9XHJcblx0XHRcclxuXHRcdGdvVG8oZXZ0LCBjdHgpIHtcclxuXHRcdFx0dmFyIGhhc2ggPSBldnQudGFyZ2V0Lmhhc2ggfHwgZXZ0LnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtaGFzaCcpO1xyXG5cdFx0XHRjdHgucGFyZW50LnNob3dWaWV3KGN0eC5wYXJlbnQuX3ZpZXcoaGFzaCkpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Q29yZS5Db21wb25lbnRzLmNyZWF0ZSgnd3ItcGFnZS1yZWxlYXNlLW5vdGVzJywge1xyXG5cdFx0c3RhdGljOiBbXSxcclxuXHRcdGluaXRpYWxpemU6IChlbCwgZGF0YSkgPT4gbmV3IFBhZ2VSZWxlYXNlTm90ZXMoZWwsIGRhdGEpXHJcblx0fSlcclxufVxyXG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vLi4vLi4vdHlwaW5ncy9jb21tb24uZC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi8uLi8uLi90eXBpbmdzL0V4dEFQSS5kLnRzXCIgLz5cclxuXHJcbm1vZHVsZSBWaWV3cy5TZXR0aW5ncyB7XHJcblx0aW1wb3J0ICQgPSBDb3JlLlV0aWxzLkRPTTtcclxuXHJcblx0ZXhwb3J0IGNsYXNzIFBhZ2VTeW5jIGV4dGVuZHMgQ29yZS5DdXN0b21FbGVtZW50IHtcclxuXHRcdHB1YmxpYyBwYXJlbnQ6IGFueTsgLy8gVmlld3MuU2V0dGluZ3MuTWFpblZpZXc7XHJcblxyXG5cdFx0cHVibGljIHNldHRpbmdzOiBTZXR0aW5ncztcclxuXHJcblx0XHRjb25zdHJ1Y3Rvcihub2RlLCBkYXRhKSB7XHJcblx0XHRcdHN1cGVyKG5vZGUsIGRhdGEpO1xyXG5cclxuXHRcdFx0dGhpcy5leHBvcnRTZXR0aW5ncyA9IHRoaXMuZXhwb3J0U2V0dGluZ3MuYmluZCh0aGlzKTtcclxuXHRcdFx0dGhpcy5pbXBvcnRTZXR0aW5ncyA9IHRoaXMuaW1wb3J0U2V0dGluZ3MuYmluZCh0aGlzKTtcclxuXHRcdH1cclxuXHJcblx0XHRpbml0KCkge1xyXG5cdFx0XHR0aGlzLnNldHRpbmdzID0gbmV3IFNldHRpbmdzKCk7XHJcblx0XHRcdEV4dEFQSS5pbnZva2UoJ2dldC1zeW5jLXN0YXR1cycpLnRoZW4oc3RhdHVzID0+IHtcclxuXHRcdFx0XHR0aGlzLnNldHRpbmdzLnN5bmNTZXR0aW5ncyA9ICFzdGF0dXM7XHJcblx0XHRcdH0pLmNhdGNoKHRoaXMucGFyZW50Ll9sb2cpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydFNldHRpbmdzKCkge1xyXG5cdFx0XHRFeHRBUEkuaW52b2tlKCdnZXQtc2V0dGluZ3MnKS50aGVuKHNldHRpbmdzID0+IHtcclxuXHRcdFx0XHRsZXQgbm9kZSA9IDxIVE1MVGV4dEFyZWFFbGVtZW50PiAkLnEoJyNpbXBvcnRFeHBvcnRGaWVsZCcpO1xyXG5cclxuXHRcdFx0XHRub2RlLnZhbHVlID0gSlNPTi5zdHJpbmdpZnkoc2V0dGluZ3MpO1xyXG5cdFx0XHRcdG5vZGUuZm9jdXMoKTtcclxuXHRcdFx0XHRub2RlLnNlbGVjdCgpO1xyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cclxuXHRcdGltcG9ydFNldHRpbmdzKCkge1xyXG5cdFx0XHRsZXQgbm9kZSA9IDxIVE1MVGV4dEFyZWFFbGVtZW50PiAkLnEoJyNpbXBvcnRFeHBvcnRGaWVsZCcpO1xyXG5cdFx0XHRsZXQgZGF0YTtcclxuXHRcdFx0bGV0IHNldHRpbmdzOiBhbnkgPSB7fTtcclxuXHJcblx0XHRcdHRyeSB7XHJcblx0XHRcdFx0ZGF0YSA9IEpTT04ucGFyc2Uobm9kZS52YWx1ZSk7XHJcblx0XHRcdH0gY2F0Y2goZXgpIHtcclxuXHRcdFx0XHR0aGlzLnBhcmVudC5zaG93TWVzc2FnZSgnRXJyb3InLCAnVGhlIHByb3ZpZGVkIGlucHV0IGlzIG5vdCBhIHZhbGlkIEpTT04gb2JqZWN0LicpO1xyXG5cdFx0XHRcdHJldHVybiBudWxsO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRFeHRBUEkuaW52b2tlKCdpbXBvcnQtc2V0dGluZ3MnLCBkYXRhKTtcclxuXHJcblx0XHRcdHRoaXMucGFyZW50LnNob3dNZXNzYWdlKCdTdWNjZXNzJywgJ1RoZSBuZXcgc2V0dGluZ3MgaGF2ZSBiZWVuIGltcG9ydGVkLicpO1xyXG5cdFx0XHRub2RlLnZhbHVlID0gJyc7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRjbGFzcyBTZXR0aW5ncyB7XHJcblx0XHRwcml2YXRlIF9zZXR0aW5nczogYW55ID0ge307XHJcblxyXG5cdFx0Y29uc3RydWN0b3IoKSB7fVxyXG5cclxuXHRcdGdldCBzeW5jU2V0dGluZ3MoKSAgICAgeyByZXR1cm4gdGhpcy5fc2V0dGluZ3Muc3luY1NldHRpbmdzOyB9XHJcblx0XHRzZXQgc3luY1NldHRpbmdzKHZhbCkgIHtcclxuXHRcdFx0aWYgKHZhbCA9PT0gdGhpcy5fc2V0dGluZ3Muc3luY1NldHRpbmdzKSB7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLl9zZXR0aW5ncy5zeW5jU2V0dGluZ3MgPSB2YWw7XHJcblx0XHRcdHNldFRpbWVvdXQoKCkgPT4ge1xyXG5cdFx0XHRcdEV4dEFQSS5pbnZva2UoJ3RvZ2dsZS1zeW5jJywgIXZhbClcclxuXHRcdFx0XHRcdC50aGVuKCgpID0+IEV4dEFQSS5pbnZva2UoJ2dldC1zZXR0aW5ncycpKVxyXG5cdFx0XHRcdFx0LnRoZW4oc2V0dGluZ3MgPT4gRXh0QVBJLmludm9rZSgnc2F2ZS1zZXR0aW5ncycsIHNldHRpbmdzKSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Q29yZS5Db21wb25lbnRzLmNyZWF0ZSgnd3ItcGFnZS1zeW5jJywge1xyXG5cdFx0c3RhdGljOiBbXSxcclxuXHRcdGluaXRpYWxpemU6IChlbCwgZGF0YSkgPT4gbmV3IFBhZ2VTeW5jKGVsLCBkYXRhKVxyXG5cdH0pXHJcbn1cclxuIl19
