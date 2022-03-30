var Core;
(function (Core) {
    let PresetType;
    (function (PresetType) {
        PresetType[PresetType["PHONE"] = 0] = "PHONE";
        PresetType[PresetType["TABLET"] = 1] = "TABLET";
        PresetType[PresetType["LAPTOP"] = 2] = "LAPTOP";
        PresetType[PresetType["DESKTOP"] = 3] = "DESKTOP";
    })(PresetType = Core.PresetType || (Core.PresetType = {}));
    let PresetTarget;
    (function (PresetTarget) {
        PresetTarget[PresetTarget["WINDOW"] = 0] = "WINDOW";
        PresetTarget[PresetTarget["VIEWPORT"] = 1] = "VIEWPORT";
    })(PresetTarget = Core.PresetTarget || (Core.PresetTarget = {}));
    let PresetPosition;
    (function (PresetPosition) {
        PresetPosition[PresetPosition["DEFAULT"] = 0] = "DEFAULT";
        PresetPosition[PresetPosition["CUSTOM"] = 1] = "CUSTOM";
        PresetPosition[PresetPosition["CENTER"] = 2] = "CENTER";
    })(PresetPosition = Core.PresetPosition || (Core.PresetPosition = {}));
    let PopupIconStyle;
    (function (PopupIconStyle) {
        PopupIconStyle[PopupIconStyle["MONOCHROME"] = 0] = "MONOCHROME";
        PopupIconStyle[PopupIconStyle["COLORED"] = 1] = "COLORED";
        PopupIconStyle[PopupIconStyle["CONTRAST"] = 2] = "CONTRAST";
    })(PopupIconStyle = Core.PopupIconStyle || (Core.PopupIconStyle = {}));
})(Core || (Core = {}));
/// <reference path="../../../typings/html5.d.ts" />
var Core;
(function (Core) {
    var Utils;
    (function (Utils) {
        function UUID() {
            let uuid;
            let bytes = crypto.getRandomValues(new Uint8Array(21));
            let hexed = val => (val % 16).toString(16);
            bytes[12] = 4;
            bytes[16] = bytes[16] & 0x3 | 0x8;
            uuid = Array.from(bytes, hexed).join('');
            uuid = uuid + Date.now().toString(16);
            uuid = uuid.replace(/^(.{8})(.{4})(.{4})(.{4})/, '$1-$2-$3-$4-');
            return uuid.toUpperCase();
        }
        Utils.UUID = UUID;
    })(Utils = Core.Utils || (Core.Utils = {}));
})(Core || (Core = {}));
var Core;
(function (Core) {
    var Utils;
    (function (Utils) {
        var Request;
        (function (Request) {
            function Get(url) {
                return new Promise((resolve, reject) => {
                    var xhr = new XMLHttpRequest();
                    xhr.addEventListener('load', resolve);
                    xhr.addEventListener('error', reject);
                    xhr.addEventListener('abort', reject);
                    xhr.open('GET', url);
                    xhr.send();
                });
            }
            Request.Get = Get;
            function GetJSON(url) {
                return Get(url).then(data => Promise.resolve(JSON.parse(data.target.responseText)));
            }
            Request.GetJSON = GetJSON;
            function Post(url, data) {
                return _post(url, data).then(response => response.text());
            }
            Request.Post = Post;
            function PostJSON(url, data) {
                return _post(url, data).then(response => response.json());
            }
            Request.PostJSON = PostJSON;
            function _post(url, data) {
                let parts = [];
                for (let k in data) {
                    let name = encodeURIComponent(k);
                    let value = encodeURIComponent(data[k]);
                    parts.push(`${name}=${value}`);
                }
                const init = {
                    method: 'POST',
                    body: parts.join('&'),
                    headers: { "Content-Type": "application/x-www-form-urlencoded" }
                };
                return fetch(url, init);
            }
        })(Request = Utils.Request || (Utils.Request = {}));
    })(Utils = Core.Utils || (Core.Utils = {}));
})(Core || (Core = {}));
var ResizerAPI;
(function (ResizerAPI) {
    var Tooltip;
    (function (Tooltip) {
        function _message(tabId, message) {
            return new Promise((resolve, reject) => {
                chrome.tabs.sendMessage(tabId, message, answer => resolve(chrome.runtime.lastError ? null : answer));
            });
        }
        Tooltip.HIDDEN = 'HIDDEN';
        Tooltip.VISIBLE = 'VISIBLE';
        function Enable(tabId) {
            return new Promise((resolve, reject) => {
                chrome.tabs.executeScript(tabId, { file: 'scripts/enable-tooltip.js' }, result => resolve(!chrome.runtime.lastError));
            });
        }
        Tooltip.Enable = Enable;
        function Disable(tabId) {
            return _message(tabId, 'DISABLE');
        }
        Tooltip.Disable = Disable;
        function GetStatus(tabId) {
            return _message(tabId, 'STATUS');
        }
        Tooltip.GetStatus = GetStatus;
        function Show(tabId) {
            return _message(tabId, 'SHOW');
        }
        Tooltip.Show = Show;
        function Hide(tabId) {
            return _message(tabId, 'HIDE');
        }
        Tooltip.Hide = Hide;
        function Toggle(tabId) {
            return _message(tabId, 'STATUS').then(status => {
                if (status === null) {
                    return Tooltip.Enable(tabId).then(result => {
                        setTimeout(() => Tooltip.Show(tabId), 100);
                        return result;
                    });
                }
                return _message(tabId, 'TOGGLE');
            });
        }
        Tooltip.Toggle = Toggle;
        function SetTimeout(tabId, timeout) {
            return _message(tabId, { command: 'SET_HIDE_DELAY', delay: timeout });
        }
        Tooltip.SetTimeout = SetTimeout;
        function EnableOnAllPages() {
            if (chrome.webNavigation && !chrome.webNavigation.onDOMContentLoaded.hasListener(enableOnNewTabs)) {
                chrome.webNavigation.onDOMContentLoaded.addListener(enableOnNewTabs);
            }
            chrome.tabs.query({}, tabs => {
                for (let tab of tabs) {
                    Enable(tab.id);
                }
            });
        }
        Tooltip.EnableOnAllPages = EnableOnAllPages;
        function DisableOnAllPages() {
            if (chrome.webNavigation) {
                while (chrome.webNavigation.onDOMContentLoaded.hasListener(enableOnNewTabs)) {
                    chrome.webNavigation.onDOMContentLoaded.removeListener(enableOnNewTabs);
                }
            }
            chrome.tabs.query({}, tabs => {
                for (let tab of tabs) {
                    Disable(tab.id);
                }
            });
        }
        Tooltip.DisableOnAllPages = DisableOnAllPages;
        function enableOnNewTabs(details) {
            if (details.tabId && !details.frameId) {
                Enable(details.tabId);
            }
        }
    })(Tooltip = ResizerAPI.Tooltip || (ResizerAPI.Tooltip = {}));
})(ResizerAPI || (ResizerAPI = {}));
var ResizerAPI;
(function (ResizerAPI) {
    var Settings;
    (function (Settings) {
        var PresetType = Core.PresetType;
        var PresetTarget = Core.PresetTarget;
        var PresetPosition = Core.PresetPosition;
        Settings.DefaultSettings = {
            alwaysCenterTheWindow: false,
            leftAlignWindow: false,
            alwaysShowTheTooltip: false,
            hideTooltipDelay: 3000,
            tooltipPosition: ['bottom', 'right'],
            popupIconStyle: 'dark+color',
            presetsIconsStyle: 'clear',
            alternatePresetsBg: false,
            autoClosePopup: false,
            presetsPrimaryLine: '',
            hidePresetsDescription: false,
            hidePopupTooltips: false,
            hideQuickResize: false,
            originalInstallDate: null,
            license: null,
            presets: []
        };
        function _getStore(local = false, force = false) {
            let store = local ? chrome.storage.local : chrome.storage.sync;
            if (force) {
                return Promise.resolve(store);
            }
            return new Promise((resolve, reject) => {
                chrome.storage.local.get({ disableSync: false }, settings => {
                    if (chrome.runtime.lastError) {
                        return reject(chrome.runtime.lastError);
                    }
                    let store = local || settings.disableSync ? chrome.storage.local : chrome.storage.sync;
                    resolve(store);
                });
            });
        }
        function _getLicense() {
            return new Promise((resolve, reject) => {
                return _getStore(false, true).then(store => {
                    store.get({ license: null }, data => {
                        if (chrome.runtime.lastError) {
                            return reject(chrome.runtime.lastError);
                        }
                        resolve(data.license);
                    });
                });
            });
        }
        function Set(key, value, local = false) {
            let data = _normalize(key, value);
            if ('license' in data) {
                _getStore(false, true).then(store => {
                    store.set({ license: data.license });
                });
            }
            return _getStore(local).then(store => {
                return new Promise((resolve, reject) => {
                    store.set(data, () => {
                        if (chrome.runtime.lastError) {
                            return reject(chrome.runtime.lastError);
                        }
                        resolve(data);
                    });
                });
            });
        }
        Settings.Set = Set;
        function Get(key, defaultValue, local = false) {
            let keys = _normalize(key, defaultValue);
            return _getLicense().then(license => _getStore(local).then(store => {
                return new Promise((resolve, reject) => {
                    store.get(keys, settings => {
                        if (chrome.runtime.lastError) {
                            return reject(chrome.runtime.lastError);
                        }
                        settings.license = license;
                        if (typeof (key) === 'string') {
                            return resolve(settings[key]);
                        }
                        for (let k in Settings.DefaultSettings) {
                            if (!(k in settings)) {
                                settings[k] = Settings.DefaultSettings[k];
                            }
                        }
                        return resolve(settings);
                    });
                });
            }));
        }
        Settings.Get = Get;
        function Del(key, local = false) {
            let keys = (key instanceof Array) ? key : [key];
            return _getStore(local).then(store => {
                return new Promise((resolve, reject) => {
                    store.remove(keys, () => {
                        if (chrome.runtime.lastError) {
                            return reject(chrome.runtime.lastError);
                        }
                        return resolve();
                    });
                });
            });
        }
        Settings.Del = Del;
        function _normalize(key, defaultValue) {
            let keys = {};
            if (typeof (key) === 'string') {
                if (defaultValue === undefined) {
                    defaultValue = Settings.DefaultSettings[key];
                }
                keys[key] = defaultValue;
            }
            else {
                keys = key;
            }
            return keys;
        }
        function _handler(resolve, reject) {
            return function (data) {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                resolve(data);
            };
        }
        function ParseV1(data) {
            if (!data) {
                return;
            }
            let settings = {};
            let presets = JSON.parse(data['WindowResizer.Rows']);
            settings.alwaysShowTheTooltip = data['WindowResizer.Tooltip'] != 1;
            settings.hideTooltipDelay = parseInt(data['WindowResizer.TooltipDelay'], 10) || Settings.DefaultSettings.hideTooltipDelay;
            settings.hidePresetsDescription = data['WindowResizer.PopupDescription'] == 1;
            settings.presets = [];
            for (let preset of presets) {
                settings.presets.push({
                    id: Core.Utils.UUID(),
                    width: _parseNumber(preset.width),
                    height: _parseNumber(preset.height),
                    top: _parseNumber(preset.Y),
                    left: _parseNumber(preset.X),
                    description: preset.title || null,
                    position: _parsePosition(preset.pos),
                    type: _parseType(preset.type),
                    target: _parseTarget(preset.target)
                });
            }
            return settings;
            function _parseNumber(value) {
                return parseInt(value, 10) || null;
            }
            function _parseTarget(value) {
                return value == 'window' ? PresetTarget.WINDOW : PresetTarget.VIEWPORT;
            }
            function _parsePosition(value) {
                let pos = parseInt(value, 10) || 0;
                switch (pos) {
                    case 1: return PresetPosition.CUSTOM;
                    case 3: return PresetPosition.CENTER;
                }
                return PresetPosition.DEFAULT;
            }
            function _parseType(value) {
                switch (value) {
                    case 'desktop': return PresetType.DESKTOP;
                    case 'laptop': return PresetType.LAPTOP;
                    case 'tablet': return PresetType.TABLET;
                    case 'smartphone': return PresetType.PHONE;
                    case 'featurephone': return PresetType.PHONE;
                }
                return PresetType.DESKTOP;
            }
        }
        Settings.ParseV1 = ParseV1;
        Settings.DefaultSettings.presets.push({
            id: 'D482CEBD-12DC-457D-8FCF-B15226DFEDD8',
            width: 320,
            height: 568,
            target: Core.PresetTarget.VIEWPORT,
            description: 'iPhone 5',
            type: Core.PresetType.PHONE
        });
        Settings.DefaultSettings.presets.push({
            id: 'A1D7D065-33B0-44BD-8F20-A15226DFF237',
            width: 375,
            height: 667,
            target: Core.PresetTarget.VIEWPORT,
            description: 'iPhone 6',
            type: Core.PresetType.PHONE
        });
        Settings.DefaultSettings.presets.push({
            id: 'FF3DE6CD-F560-4576-811F-E15226DFF45F',
            width: 1024,
            height: 768,
            target: Core.PresetTarget.VIEWPORT,
            description: 'iPad',
            type: Core.PresetType.TABLET
        });
        Settings.DefaultSettings.presets.push({
            id: '27ACDD9C-9A94-44F8-B333-C15226DFF5FF',
            width: 1440,
            height: 900,
            target: Core.PresetTarget.WINDOW,
            description: 'Laptop',
            type: Core.PresetType.LAPTOP
        });
        Settings.DefaultSettings.presets.push({
            id: '2256E7AD-B7BA-40B7-9969-415226DFF817',
            width: 1680,
            height: 1050,
            target: Core.PresetTarget.WINDOW,
            description: 'Desktop',
            type: Core.PresetType.DESKTOP
        });
        Settings.DefaultSettings.presets.push({
            id: '2256E7AD-B7BA-40B7-9969-415226DFF818',
            width: 1920,
            height: 1080,
            target: Core.PresetTarget.WINDOW,
            description: 'Desktop',
            type: Core.PresetType.DESKTOP
        });
        Settings.DefaultSettings.presets.push({
            id: 'C76F48DB-B2D2-4DEA-B35D-6152606F883D',
            width: 2560,
            height: 1440,
            target: Core.PresetTarget.WINDOW,
            description: 'Desktop',
            type: Core.PresetType.DESKTOP
        });
    })(Settings = ResizerAPI.Settings || (ResizerAPI.Settings = {}));
})(ResizerAPI || (ResizerAPI = {}));
var ResizerAPI;
(function (ResizerAPI) {
    var SettingsPage;
    (function (SettingsPage) {
        let currentPage = null;
        function Open(page = null) {
            page = page || '#settings';
            currentPage = page;
            return new Promise((resolve, reject) => {
                chrome.runtime.openOptionsPage(() => {
                    chrome.runtime.sendMessage({ showPage: page }, (response) => {
                        if (chrome.runtime.lastError) {
                            // it's ok, don't need to do anything
                        }
                        resolve(response);
                    });
                    return true;
                });
            });
        }
        SettingsPage.Open = Open;
        function Current() {
            return Promise.resolve(currentPage);
        }
        SettingsPage.Current = Current;
    })(SettingsPage = ResizerAPI.SettingsPage || (ResizerAPI.SettingsPage = {}));
})(ResizerAPI || (ResizerAPI = {}));
var ResizerAPI;
(function (ResizerAPI) {
    var Chrome;
    (function (Chrome) {
        var Windows;
        (function (Windows) {
            Windows.NONE = chrome.windows.WINDOW_ID_NONE;
            function Get(winId, config) {
                config = config || { populate: true };
                return new Promise((resolve, reject) => {
                    chrome.windows.get(winId, config, win => {
                        if (chrome.runtime.lastError) {
                            return reject(chrome.runtime.lastError);
                        }
                        resolve(win);
                    });
                });
            }
            Windows.Get = Get;
            function All(config) {
                return new Promise((resolve, reject) => {
                    chrome.windows.getAll(config, win => {
                        if (chrome.runtime.lastError) {
                            return reject(chrome.runtime.lastError);
                        }
                        resolve(win);
                    });
                });
            }
            Windows.All = All;
            function Create(config) {
                return new Promise((resolve, reject) => {
                    chrome.windows.create(config, win => {
                        if (chrome.runtime.lastError) {
                            return reject(chrome.runtime.lastError);
                        }
                        resolve(win);
                    });
                });
            }
            Windows.Create = Create;
            function CreatePopup(url, config = {}) {
                config.url = url;
                config.type = 'popup';
                return Create(config);
            }
            Windows.CreatePopup = CreatePopup;
            function Update(winId, config) {
                return new Promise((resolve, reject) => {
                    chrome.windows.update(winId, config, win => {
                        if (chrome.runtime.lastError) {
                            return reject(chrome.runtime.lastError);
                        }
                        resolve(win);
                    });
                });
            }
            Windows.Update = Update;
            function On(name, callback) {
                let event = chrome.windows['on' + name];
                event && !event.hasListener(callback) && event.addListener(callback);
            }
            Windows.On = On;
            function Off(name, callback) {
                let event = chrome.windows['on' + name];
                event && event.removeListener(callback);
            }
            Windows.Off = Off;
        })(Windows = Chrome.Windows || (Chrome.Windows = {}));
    })(Chrome = ResizerAPI.Chrome || (ResizerAPI.Chrome = {}));
})(ResizerAPI || (ResizerAPI = {}));
var ResizerAPI;
(function (ResizerAPI) {
    var Chrome;
    (function (Chrome) {
        var Tabs;
        (function (Tabs) {
            function Query(filter = {}) {
                return new Promise((resolve, reject) => {
                    function _done(tabs) {
                        if (chrome.runtime.lastError) {
                            return reject(chrome.runtime.lastError);
                        }
                        if (!(tabs instanceof Array)) {
                            tabs = [tabs];
                        }
                        resolve(tabs);
                    }
                    if (typeof filter === 'number') {
                        chrome.tabs.get(filter, _done);
                    }
                    else {
                        chrome.tabs.query(filter, _done);
                    }
                });
            }
            Tabs.Query = Query;
            function GetActive(winId) {
                let filter = {
                    active: true,
                    windowId: winId
                };
                return new Promise((resolve, reject) => {
                    chrome.tabs.query(filter, tabs => {
                        if (chrome.runtime.lastError) {
                            return reject(chrome.runtime.lastError);
                        }
                        resolve(tabs[0]);
                    });
                });
            }
            Tabs.GetActive = GetActive;
            function Create(config) {
                return new Promise((resolve, reject) => {
                    chrome.windows.create(config, win => {
                        if (chrome.runtime.lastError) {
                            return reject(chrome.runtime.lastError);
                        }
                        resolve(win);
                    });
                });
            }
            Tabs.Create = Create;
            function CreatePopup(url, config) {
                config.url = url;
                config.type = 'popup';
                return Create(config);
            }
            Tabs.CreatePopup = CreatePopup;
            function Update(winId, config) {
                return new Promise((resolve, reject) => {
                    chrome.windows.update(winId, config, win => {
                        if (chrome.runtime.lastError) {
                            return reject(chrome.runtime.lastError);
                        }
                        resolve(win);
                    });
                });
            }
            Tabs.Update = Update;
            function Duplicate(tabId) {
                return new Promise((resolve, reject) => {
                    chrome.tabs.duplicate(tabId, tab => {
                        if (chrome.runtime.lastError) {
                            return reject(chrome.runtime.lastError);
                        }
                        resolve(tab);
                    });
                });
            }
            Tabs.Duplicate = Duplicate;
            function GetZoom(tabId) {
                return new Promise((resolve, reject) => {
                    chrome.tabs.getZoom(tabId, zoom => {
                        if (chrome.runtime.lastError) {
                            return reject(chrome.runtime.lastError);
                        }
                        resolve(zoom);
                    });
                });
            }
            Tabs.GetZoom = GetZoom;
        })(Tabs = Chrome.Tabs || (Chrome.Tabs = {}));
    })(Chrome = ResizerAPI.Chrome || (ResizerAPI.Chrome = {}));
})(ResizerAPI || (ResizerAPI = {}));
var ResizerAPI;
(function (ResizerAPI) {
    var Chrome;
    (function (Chrome) {
        var Runtime;
        (function (Runtime) {
            function Error() {
                return chrome.runtime.lastError;
            }
            Runtime.Error = Error;
            function Broadcast(message) {
                return new Promise((resolve, reject) => {
                    chrome.runtime.sendMessage(message, response => {
                        if (chrome.runtime.lastError) {
                            return reject(chrome.runtime.lastError);
                        }
                        resolve(response);
                    });
                });
            }
            Runtime.Broadcast = Broadcast;
            function On(name, callback) {
                let event = chrome.runtime['on' + name];
                event && !event.hasListener(callback) && event.addListener(callback);
            }
            Runtime.On = On;
            function Off(name, callback) {
                let event = chrome.runtime['on' + name];
                event && event.removeListener(callback);
            }
            Runtime.Off = Off;
        })(Runtime = Chrome.Runtime || (Chrome.Runtime = {}));
    })(Chrome = ResizerAPI.Chrome || (ResizerAPI.Chrome = {}));
})(ResizerAPI || (ResizerAPI = {}));
var ResizerAPI;
(function (ResizerAPI) {
    var Chrome;
    (function (Chrome) {
        var ContextMenus;
        (function (ContextMenus) {
            function Create(config) {
                return new Promise((resolve, reject) => {
                    chrome.contextMenus.create(config, () => {
                        if (chrome.runtime.lastError) {
                            return reject(chrome.runtime.lastError);
                        }
                        resolve();
                    });
                });
            }
            ContextMenus.Create = Create;
            function Update(itemId, config) {
                return new Promise((resolve, reject) => {
                    chrome.contextMenus.update(itemId, config, () => {
                        if (chrome.runtime.lastError) {
                            return reject(chrome.runtime.lastError);
                        }
                        resolve();
                    });
                });
            }
            ContextMenus.Update = Update;
            function Remove(itemId) {
                return new Promise((resolve, reject) => {
                    chrome.contextMenus.remove(itemId, () => {
                        if (chrome.runtime.lastError) {
                            return reject(chrome.runtime.lastError);
                        }
                        resolve();
                    });
                });
            }
            ContextMenus.Remove = Remove;
            function On(name, callback) {
                let event = chrome.contextMenus['on' + name];
                event && !event.hasListener(callback) && event.addListener(callback);
            }
            ContextMenus.On = On;
            function Off(name, callback) {
                let event = chrome.contextMenus['on' + name];
                event && event.removeListener(callback);
            }
            ContextMenus.Off = Off;
        })(ContextMenus = Chrome.ContextMenus || (Chrome.ContextMenus = {}));
    })(Chrome = ResizerAPI.Chrome || (ResizerAPI.Chrome = {}));
})(ResizerAPI || (ResizerAPI = {}));
/// <reference path="../../ResizerAPI/Chrome/Windows.ts" />
/// <reference path="../../ResizerAPI/Chrome/Tabs.ts" />
var ToolsPopup;
(function (ToolsPopup) {
    var Windows = ResizerAPI.Chrome.Windows;
    let _ID = null;
    function ID() {
        return _ID;
    }
    ToolsPopup.ID = ID;
    function Open() {
        let config = {
            url: 'views/popup.html#popup-view',
            type: 'popup',
            width: 360,
            height: 420
        };
        return Windows.Create(config).then(win => {
            _ID = win.id;
            Windows.On('Removed', _OnClose);
            return win;
        });
    }
    ToolsPopup.Open = Open;
    function Focus() {
        return Windows.Update(_ID, { focused: true });
    }
    ToolsPopup.Focus = Focus;
    function Blur() {
        return Windows.Update(_ID, { focused: false });
    }
    ToolsPopup.Blur = Blur;
    function AttachTo(mainWindow) {
        let focusPopup = _ID ? Focus() : Open();
        let newPosition = {
            top: mainWindow.top,
            left: mainWindow.left + mainWindow.width
        };
        return focusPopup.then(win => Windows.Update(win.id, newPosition));
    }
    ToolsPopup.AttachTo = AttachTo;
    function _OnClose(winId) {
        if (winId === _ID) {
            _ID = null;
            Windows.Off('Removed', _OnClose);
        }
    }
})(ToolsPopup || (ToolsPopup = {}));
var Core;
(function (Core) {
    var Utils;
    (function (Utils) {
        class UniqueStack {
            constructor() {
                this._values = [];
            }
            append(value) {
                this.remove(value);
                this._values.push(value);
            }
            remove(value) {
                let existing = this._values.indexOf(value);
                (existing > -1) && this._values.splice(existing, 1);
            }
            current() {
                let last = this._values.length - 1;
                return this._values[last];
            }
        }
        Utils.UniqueStack = UniqueStack;
    })(Utils = Core.Utils || (Core.Utils = {}));
})(Core || (Core = {}));
/// <reference path="../../Core/Utils/UniqueStack.ts" />
/// <reference path="../../ResizerAPI/Chrome/Windows.ts" />
/// <reference path="./ToolsPopup.ts" />
var WindowsStack;
(function (WindowsStack) {
    var Windows = ResizerAPI.Chrome.Windows;
    let winStack = new Core.Utils.UniqueStack();
    function Current() {
        return winStack.current();
    }
    WindowsStack.Current = Current;
    function Append(winId) {
        return winStack.append(winId);
    }
    WindowsStack.Append = Append;
    function Remove(winId) {
        return winStack.remove(winId);
    }
    WindowsStack.Remove = Remove;
    function Init() {
        Windows.On('FocusChanged', winId => {
            if (winId === Windows.NONE || winId === ToolsPopup.ID()) {
                return;
            }
            winStack.append(winId);
        });
        Windows.On('Removed', winId => {
            winStack.remove(winId);
        });
        Windows.All().then(windows => {
            let focused = 0;
            for (let win of windows) {
                win.focused && (focused = win.id);
                winStack.append(win.id);
            }
            focused && winStack.append(focused);
        });
    }
    WindowsStack.Init = Init;
})(WindowsStack || (WindowsStack = {}));
var Core;
(function (Core) {
    var Utils;
    (function (Utils) {
        function IsBeta() {
            const manifest = chrome.runtime.getManifest();
            const isBeta = Boolean(manifest.version_name.match(/beta/i));
            return isBeta;
        }
        Utils.IsBeta = IsBeta;
    })(Utils = Core.Utils || (Core.Utils = {}));
})(Core || (Core = {}));
/// <reference path="../../Core/Utils/Request.ts" />
/// <reference path="../../Core/Utils/Utils.ts" />
/// <reference path="../../ResizerAPI/Settings.ts" />
var Banner;
(function (Banner) {
    var Settings = ResizerAPI.Settings;
    var Request = Core.Utils.Request;
    var Utils = Core.Utils;
    function Get(id) {
        let license;
        return Settings.Get('license', false).then(details => {
            license = details;
            return Settings.Get('bannerHidden', null, true);
        }).then(hidden => {
            let timestamp = hidden ? (new Date(hidden)).getTime() : 0;
            let stayHidden = 2 * 24 * 3600 * 1000; // every 2 days
            // only show the banner once a week for non-Pro and non-Beta users
            if (license || Utils.IsBeta() || timestamp + stayHidden > Date.now()) {
                return Promise.resolve(null);
            }
            return Request.GetJSON('assets/affiliates/banners.json').then((banners) => {
                banners = banners.filter(banner => banner.enabled);
                if (id === undefined) {
                    id = Math.floor(Math.random() * banners.length);
                }
                return Promise.resolve(banners[id]);
            });
        });
    }
    Banner.Get = Get;
    function Status() {
        return Settings.Get('bannerHidden', null, true);
    }
    Banner.Status = Status;
    function Hide() {
        return Settings.Get('bannerHidden', null, true).then(hidden => {
            Settings.Set('bannerHidden', _today(), true);
            return Promise.resolve(!hidden);
        });
    }
    Banner.Hide = Hide;
    function _today() {
        let date = new Date();
        return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    }
})(Banner || (Banner = {}));
/// <reference path="../../ResizerAPI/Settings.ts" />
var CyclePresets;
(function (CyclePresets) {
    var Settings = ResizerAPI.Settings;
    let previous = -1;
    function GetNext() {
        return _getPreset(1);
    }
    CyclePresets.GetNext = GetNext;
    function GetPrev() {
        return _getPreset(-1);
    }
    CyclePresets.GetPrev = GetPrev;
    function _getPreset(direction) {
        return Settings.Get('presets').then(presets => {
            previous = (previous + direction + presets.length) % presets.length;
            return Promise.resolve(presets[previous]);
        });
    }
})(CyclePresets || (CyclePresets = {}));
var Updater;
(function (Updater) {
    var Runtime = ResizerAPI.Chrome.Runtime;
    var Settings = ResizerAPI.Settings;
    function Init() {
        chrome.runtime.setUninstallURL('http://coolx10.com/window-resizer/good-bye.php');
        Runtime.On('Installed', details => {
            Settings.Get('originalInstallDate').then(originalInstallDate => {
                if (!originalInstallDate) {
                    Settings.Set('originalInstallDate', Date.now());
                }
            });
            switch (details.reason) {
                case 'install':
                    Settings.Get('presets').then(presets => {
                        !presets && Background.SaveSettings(Settings.DefaultSettings);
                    });
                    chrome.tabs.create({
                        url: 'http://coolx10.com/window-resizer/welcome.php',
                        active: true
                    });
                    break;
                case 'update':
                    let previousVersion = parseInt(details.previousVersion);
                    if (details.previousVersion.match(/^2\.6/)) {
                        break;
                    }
                    if (previousVersion == 1) {
                        // import settings from 1.x.x versions
                        let oldSettings = Settings.ParseV1(window.localStorage);
                        Background.SaveSettings(oldSettings);
                        window.localStorage.clear();
                    }
                    Settings.Get({ 'useMonochromeIcon': null }).then(old => {
                        if (old.useMonochromeIcon !== null) {
                            Settings.Del('useMonochromeIcon');
                            Settings.Set('popupIconStyle', 0);
                        }
                    });
                    window.localStorage['wasUpdated'] = previousVersion;
                    ShowBadge();
                    break;
            }
        });
        if (window.localStorage['wasUpdated']) {
            ShowBadge();
        }
    }
    Updater.Init = Init;
    function ShowBadge() {
        chrome.browserAction.setBadgeText({ text: 'new' });
        chrome.browserAction.setBadgeBackgroundColor({ color: '#77c35a' });
    }
    Updater.ShowBadge = ShowBadge;
    function HideBadge() {
        chrome.browserAction.setBadgeText({ text: '' });
    }
    Updater.HideBadge = HideBadge;
})(Updater || (Updater = {}));
/// <reference path="../../typings/ExtAPI.d.ts" />
/// <reference path="../Core/Utils/Enums.ts" />
/// <reference path="../Core/Utils/UUID.ts" />
/// <reference path="../Core/Utils/Request.ts" />
/// <reference path="../ResizerAPI/Tooltip.ts" />
/// <reference path="../ResizerAPI/Settings.ts" />
/// <reference path="../ResizerAPI/SettingsPage.ts" />
/// <reference path="../ResizerAPI/Chrome/Windows.ts" />
/// <reference path="../ResizerAPI/Chrome/Tabs.ts" />
/// <reference path="../ResizerAPI/Chrome/Runtime.ts" />
/// <reference path="../ResizerAPI/Chrome/ContextMenus.ts" />
/// <reference path="./background/ToolsPopup.ts" />
/// <reference path="./background/WindowsStack.ts" />
/// <reference path="./background/Banner.ts" />
/// <reference path="./background/CyclePresets.ts" />
/// <reference path="./background/Updater.ts" />
var Background;
(function (Background) {
    var EndpointVisibility = ExtAPI.Router.EndpointVisibility;
    var PresetTarget = Core.PresetTarget;
    var PresetPosition = Core.PresetPosition;
    var Tooltip = ResizerAPI.Tooltip;
    var Windows = ResizerAPI.Chrome.Windows;
    var Tabs = ResizerAPI.Chrome.Tabs;
    var Runtime = ResizerAPI.Chrome.Runtime;
    var ContextMenus = ResizerAPI.Chrome.ContextMenus;
    var Settings = ResizerAPI.Settings;
    var SettingsPage = ResizerAPI.SettingsPage;
    var Request = Core.Utils.Request;
    ExtAPI.init();
    ExtAPI.register({
        action: 'resize',
        visibility: EndpointVisibility.Public,
        handler: Resize
    });
    ExtAPI.register({
        action: 'open-url',
        visibility: EndpointVisibility.Private,
        handler: OpenUrl
    });
    ExtAPI.register({
        action: 'open-as-popup',
        visibility: EndpointVisibility.Private,
        handler: OpenAsPopup
    });
    ExtAPI.register({
        action: 'get-banner',
        visibility: EndpointVisibility.Private,
        handler: Banner.Get
    });
    ExtAPI.register({
        action: 'hide-banner',
        visibility: EndpointVisibility.Private,
        handler: Banner.Hide
    });
    ExtAPI.register({
        action: 'get-banner-status',
        visibility: EndpointVisibility.Private,
        handler: Banner.Status
    });
    ExtAPI.register({
        action: 'rotate-viewport',
        visibility: EndpointVisibility.Private,
        handler: RotateViewport
    });
    ExtAPI.register({
        action: 'open-settings',
        visibility: EndpointVisibility.Private,
        handler: OpenSettings
    });
    ExtAPI.register({
        action: 'open-presets-settings',
        visibility: EndpointVisibility.Private,
        handler: OpenPresetsSettings
    });
    ExtAPI.register({
        action: 'open-release-notes',
        visibility: EndpointVisibility.Private,
        handler: OpenReleaseNotes
    });
    ExtAPI.register({
        action: 'open-pro-page',
        visibility: EndpointVisibility.Private,
        handler: OpenProPage
    });
    ExtAPI.register({
        action: 'toggle-tooltip',
        visibility: EndpointVisibility.Private,
        handler: ToggleTooltip
    });
    ExtAPI.register({
        action: 'tooltip-hide-delay',
        visibility: EndpointVisibility.Private,
        handler: GetTooltipHideDelay
    });
    ExtAPI.register({
        action: 'tooltip-position',
        visibility: EndpointVisibility.Private,
        handler: GetTooltipPosition
    });
    ExtAPI.register({
        action: 'get-zoom',
        visibility: EndpointVisibility.Private,
        handler: GetZoom
    });
    ExtAPI.register({
        action: 'limit-popup',
        visibility: EndpointVisibility.Private,
        handler: LimitPopup
    });
    ExtAPI.register({
        action: 'get-presets',
        visibility: EndpointVisibility.Private,
        handler: GetPresets
    });
    ExtAPI.register({
        action: 'save-preset',
        visibility: EndpointVisibility.Private,
        handler: SavePreset
    });
    ExtAPI.register({
        action: 'get-sync-status',
        visibility: EndpointVisibility.Private,
        handler: GetSyncStatus
    });
    ExtAPI.register({
        action: 'toggle-sync',
        visibility: EndpointVisibility.Private,
        handler: ToggleSync
    });
    ExtAPI.register({
        action: 'default-settings',
        visibility: EndpointVisibility.Private,
        handler: GetDefaultSettings
    });
    ExtAPI.register({
        action: 'get-settings',
        visibility: EndpointVisibility.Private,
        handler: GetSettings
    });
    ExtAPI.register({
        action: 'save-settings',
        visibility: EndpointVisibility.Private,
        handler: SaveSettings
    });
    ExtAPI.register({
        action: 'import-settings',
        visibility: EndpointVisibility.Private,
        handler: ImportSettings
    });
    ExtAPI.register({
        action: 'settings:requested-page',
        visibility: EndpointVisibility.Private,
        handler: SettingsGetRequestedPage
    });
    ExtAPI.register({
        action: 'pro:checkout-url',
        visibility: EndpointVisibility.Private,
        handler: ProCheckoutUrl
    });
    ExtAPI.register({
        action: 'pro:activate-license',
        visibility: EndpointVisibility.Private,
        handler: ProActivateLicense
    });
    ExtAPI.register({
        action: '_debug',
        visibility: EndpointVisibility.Private,
        handler: _DEBUG
    });
    WindowsStack.Init();
    Updater.Init();
    function ProCheckoutUrl(params, sender) {
        return Request.PostJSON('https://coolx10.com/window-resizer/pro/checkout-url', { price: params.price });
    }
    function ProActivateLicense(params, sender) {
        return Request.PostJSON('https://coolx10.com/window-resizer/pro/activate-license', { key: params.key }).then(response => {
            if (!response.error) {
                return SaveSettings({ license: response.data });
            }
            return Promise.resolve(response);
        });
    }
    function _DEBUG(data) {
        console.log(data);
        return Promise.resolve(true);
    }
    function OpenUrl(params) {
        return Tabs.Create({ url: params.url });
    }
    chrome.commands.onCommand.addListener((command) => {
        switch (command) {
            case 'a-manual-tooltip-toggle':
                ToggleTooltip().catch(err => {
                    if (err.INVALID_PROTOCOL) {
                        alert('This feature only works on pages loaded using one of the "http://", "https://" or "file://" protocols!');
                    }
                    if (err.WEBSTORE_PERMISSION) {
                        alert('This feature doesn\'t work on this tab because extensions are not allowed to alter the Webstore pages!');
                    }
                });
                break;
            case 'b-rotate-viewport':
                RotateViewport();
                break;
            case 'c-cycle-presets':
                CyclePresets.GetNext().then(Resize);
                break;
            case 'd-cycle-presets-reverse':
                CyclePresets.GetPrev().then(Resize);
                break;
            default:
                let match = String(command).match(/presets\-(\d+)/);
                let index = match ? parseInt(match[1], 10) - 1 : -1;
                (index > -1) && Settings.Get('presets').then(presets => {
                    presets[index] && Resize(presets[index]);
                });
                break;
        }
    });
    Windows.On('FocusChanged', winId => {
        if (winId !== Windows.NONE) {
            Windows.Get(winId).then(win => {
                if (win.type == 'popup' && winId !== ToolsPopup.ID()) {
                    ContextMenus.Create({ id: 'context-menu-item', contexts: ['all'], title: 'Show the resizer window' }).catch(_silence);
                }
                else {
                    ContextMenus.Remove('context-menu-item').catch(_silence);
                }
            });
        }
    });
    ContextMenus.On('Clicked', (info, tab) => {
        Windows.Get(tab.windowId).then(_attachToolsPopup);
    });
    function OpenAsPopup(params) {
        params = params || {
            width: 800,
            height: 480,
            target: PresetTarget.VIEWPORT,
            position: PresetPosition.CENTER
        };
        return new Promise((resolve, reject) => {
            let details;
            _getDetails()
                .then(props => Promise.resolve(details = props))
                .then(props => Tabs.Duplicate(details.tabId))
                .then(tab => Windows.Create({ tabId: details.tabId, type: 'popup' }))
                .then(win => Resize(params))
                .then(win => _attachToolsPopup(win))
                .then(resolve)
                .catch(err => {
                reject();
            });
        });
    }
    function _attachToolsPopup(mainWindow) {
        return ToolsPopup.AttachTo(mainWindow).then(win => {
            WindowsStack.Remove(ToolsPopup.ID());
            return Promise.resolve(win);
        });
    }
    function GetPresets() {
        return Settings.Get('presets').then(presets => Promise.resolve(presets || []));
    }
    function SavePreset(preset) {
        return GetPresets().then(presets => {
            let existing = presets.findIndex(p => p.id === preset.id);
            if (existing > -1) {
                presets[existing] = preset;
            }
            else {
                presets.unshift(preset);
            }
            return SaveSettings({ presets: presets });
        });
    }
    function GetDefaultSettings() {
        return Promise.resolve(Settings.DefaultSettings);
    }
    function GetSettings(key) {
        return Settings.Get(key);
    }
    function GetSyncStatus() {
        return Settings.Get('disableSync', false, true);
    }
    function ToggleSync(status) {
        return Settings.Set('disableSync', status, true);
    }
    function SaveSettings(data) {
        Runtime.Broadcast({ UpdatedSettings: data }).catch(_silence);
        if ('popupIconStyle' in data) {
            setIconType(data.popupIconStyle);
        }
        if ('hideTooltipDelay' in data) {
            Tabs.Query().then(tabs => {
                tabs.forEach(tab => Tooltip.SetTimeout(tab.id, data.hideTooltipDelay));
            });
        }
        if ('alwaysShowTheTooltip' in data) {
            if (data.alwaysShowTheTooltip) {
                Tooltip.EnableOnAllPages();
            }
            else {
                Tooltip.DisableOnAllPages();
            }
        }
        return Settings.Set(data);
    }
    Background.SaveSettings = SaveSettings;
    function ImportSettings(data) {
        let settings = {};
        if ('settings' in data) {
            data['WindowResizer.Rows'] = JSON.stringify(data.presets);
            if (data.settings) {
                data['WindowResizer.Tooltip'] = data.settings.tooltip;
                data['WindowResizer.TooltipDelay'] = data.settings.tooltipDelay;
                data['WindowResizer.PopupDescription'] = data.settings.popupDescription;
            }
            settings = Settings.ParseV1(data);
        }
        else {
            for (let key in Settings.DefaultSettings) {
                if (key in data) {
                    settings[key] = data[key];
                }
            }
        }
        return Settings.Set(settings);
    }
    function RotateViewport() {
        return _getDetails().then(details => Resize({
            target: PresetTarget.VIEWPORT,
            width: details.innerHeight / details.zoom,
            height: details.innerWidth / details.zoom
        }));
    }
    function SettingsGetRequestedPage() {
        return SettingsPage.Current();
    }
    function OpenSettings(view = null) {
        return SettingsPage.Open(view);
    }
    function OpenPresetsSettings() {
        return SettingsPage.Open('#presets');
    }
    function OpenReleaseNotes() {
        return SettingsPage.Open('#help/release-notes');
    }
    function OpenProPage() {
        return SettingsPage.Open('#pro');
    }
    function ToggleTooltip() {
        let tab;
        return _getTab()
            .then(t => _validateUrl(tab = t))
            .then(p => Tooltip.Toggle(tab.id));
    }
    function GetTooltipHideDelay() {
        return Settings.Get('hideTooltipDelay');
    }
    function GetTooltipPosition() {
        return Settings.Get('tooltipPosition');
    }
    function GetZoom(params, sender) {
        let tabId = sender.tab.id;
        let tabs = chrome.tabs;
        return new Promise((resolve, reject) => {
            tabs.getZoom(tabId, zoom => resolve(zoom));
        });
    }
    function _getTab(winId) {
        return Tabs.GetActive(winId || WindowsStack.Current());
    }
    function _getDetails() {
        return Windows.Update(WindowsStack.Current(), { state: 'normal' })
            .then(win => _getTab(win.id)
            .then(tab => Tabs.GetZoom(tab.id)
            .then(zoom => {
            return Promise.resolve({
                id: win.id,
                tabId: tab.id,
                width: win.width,
                height: win.height,
                top: win.top,
                left: win.left,
                innerWidth: tab.width,
                innerHeight: tab.height,
                url: tab.url,
                zoom: zoom,
            });
        })));
    }
    function __computeOptions(params, win) {
        let options = {};
        for (let prop of ['width', 'height', 'top', 'left']) {
            isSet(params[prop]) && (options[prop] = params[prop]);
        }
        if (params.target === PresetTarget.VIEWPORT) {
            if (params.width) {
                options.width = win.width - win.innerWidth + Math.round(params.width * win.zoom);
            }
            if (params.height) {
                options.height = win.height - win.innerHeight + Math.round(params.height * win.zoom);
            }
        }
        return Settings.Get({ alwaysCenterTheWindow: false, leftAlignWindow: false }).then(settings => {
            let centered = settings.alwaysCenterTheWindow;
            let leftAligned = settings.leftAlignWindow;
            let screen = window.screen;
            if (centered || params.position === PresetPosition.CENTER) {
                // center the window if the global option is set or required by the preset
                options.left = Math.floor((screen.availWidth - options.width) / 2) + screen.availLeft;
                options.top = Math.floor((screen.availHeight - options.height) / 2) + screen.availTop;
            }
            else if (!leftAligned && isSet(options.width) && !isSet(options.left) && !isSet(options.top)) {
                // if the user hasn't selected the old behavior (window stays left aligned)
                // keep the right side of the window (where the extensions' icons are) in the same place
                options.left = win.left + win.width - options.width;
            }
            return Promise.resolve(options);
        });
    }
    function Resize(params) {
        let initial;
        let debug = {
            _: (new Date()).toISOString(),
            desired: {
                width: params.width,
                height: params.height,
                top: params.top,
                left: params.left,
                target: params.target,
            }
        };
        return _getDetails()
            .then(current => {
            debug.initial = {
                width: current.width,
                height: current.height,
                innerWidth: current.innerWidth,
                innerHeight: current.innerHeight,
                top: current.top,
                left: current.left,
                zoom: current.zoom,
            };
            return __computeOptions(params, initial = current);
        })
            .then(options => {
            debug.computed = options;
            return _resize(initial.id, options);
        })
            .catch(errors => {
            let actual = errors && errors.OUT_OF_BOUNDS && errors.OUT_OF_BOUNDS.actual ? errors.OUT_OF_BOUNDS.actual : {};
            debug.actual = {
                width: actual.width,
                height: actual.height,
                top: actual.top,
                left: actual.left,
                type: actual.type,
            };
            return Settings.Get({ alwaysCenterTheWindow: false, leftAlignWindow: false }).then(settings => {
                let top = initial.top;
                let left = initial.left - (actual.width - initial.width);
                let centered = settings.alwaysCenterTheWindow;
                let leftAligned = settings.leftAlignWindow;
                let screen = window.screen;
                if (leftAligned) {
                    left = initial.left;
                }
                if (debug.desired.top !== null) {
                    top = debug.desired.top;
                }
                if (debug.desired.left !== null) {
                    left = debug.desired.left;
                }
                if (centered || params.position === PresetPosition.CENTER) {
                    // center the window if the global option is set or required by the preset
                    left = Math.floor((screen.availWidth - actual.width) / 2) + screen.availLeft;
                    top = Math.floor((screen.availHeight - actual.height) / 2) + screen.availTop;
                }
                // reset window in case of failure
                Windows.Update(initial.id, { top, left });
                let log = [];
                try {
                    log = JSON.parse(window.localStorage['debugLog'] || '[]');
                }
                catch (ex) { }
                log.splice(9);
                log.unshift(debug);
                window.localStorage['debugLog'] = JSON.stringify(log);
                return Promise.reject({ errors, debug });
            });
        });
    }
    function LimitPopup(params) {
        return Windows.Update(ToolsPopup.ID(), params);
    }
    function _executeScript(code, tabId, inject) {
        return new Promise((resolve, reject) => {
            let getTabId = Promise.resolve(tabId);
            if (!tabId) {
                getTabId = _getTab().then(tab => Promise.resolve(tab.id));
            }
            getTabId.then(tabId => {
                let config = {};
                if (inject) {
                    config.code = code;
                }
                else {
                    config.file = code;
                }
                chrome.tabs.executeScript(tabId || null, config, result => {
                    if (Runtime.Error()) {
                        reject({ 'INVALID_TAB': Runtime.Error() });
                    }
                    else {
                        resolve(result[0]);
                    }
                });
            });
        });
    }
    function _resize(winId, options) {
        return Windows.Update(winId, options).then(updated => {
            let errors = [];
            if (options.width && options.width < updated.width) {
                errors.push('MIN_WIDTH');
            }
            if (options.height && options.height < updated.height) {
                errors.push('MIN_HEIGHT');
            }
            if (options.width && options.width > updated.width) {
                errors.push('MAX_WIDTH');
            }
            if (options.height && options.height > updated.height) {
                errors.push('MAX_HEIGHT');
            }
            if (errors.length) {
                return Promise.reject({ 'OUT_OF_BOUNDS': { keys: errors, target: options, actual: updated } });
            }
            // All good!
            return Promise.resolve(updated);
        });
    }
    function isSet(val) {
        return val !== null && val !== undefined;
    }
    function _validateUrl(tab) {
        let protocol = String(tab.url).split(':').shift();
        let allowed = ['http', 'https', 'file'];
        if (allowed.indexOf(protocol) < 0) {
            return Promise.reject({ 'INVALID_PROTOCOL': { protocol: protocol, tab: tab } });
        }
        return new Promise((resolve, reject) => {
            _executeScript(`(function() {return '${protocol}'})()`, tab.id, true)
                .then(resolve)
                .catch(err => {
                if (protocol === 'file') {
                    reject({ 'FILE_PROTOCOL_PERMISSION': { tab: tab, err: err } });
                }
                else {
                    reject({ 'WEBSTORE_PERMISSION': { tab: tab, err: err } });
                }
            });
        });
    }
    function _silence() { }
    function setIconType(style) {
        __setIcon(style);
    }
    GetSettings().then((settings) => {
        setIconType(settings.popupIconStyle);
        if (settings.alwaysShowTheTooltip) {
            Tooltip.EnableOnAllPages();
        }
    });
    function __setIcon(style) {
        style = String(style);
        if (style.match(/^\d+$/)) {
            const styles = ['grey', 'dark+color', 'light+color'];
            style = ['grey', 'dark+color', 'light+color'][style] || 'dark+color';
        }
        fetch(chrome.runtime.getURL('assets/icons/browser-icon-16.svg'))
            .then(response => response.text())
            .then(svg => _processColors(svg))
            .then(svg => {
            let file = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
            let data = URL.createObjectURL(file);
            let light = style.match(/light/);
            return Promise.all([
                svg2ImgData(data, 16, light, 1),
                svg2ImgData(data, 32, light, 2)
            ]);
        }).then(([icon16, icon32]) => {
            chrome.browserAction.setIcon({ imageData: {
                    "16": icon16,
                    "32": icon32,
                } });
        });
        function _processColors(svg) {
            switch (style) {
                case 'light':
                    svg = svg.replace(/347f2b/, 'eee');
                case 'light+color':
                    svg = svg.replace(/333/, 'eee');
                    break;
                case 'dark':
                    svg = svg.replace(/347f2b/, '333');
                    break;
                case 'neutral':
                    svg = svg.replace(/347f2b/, '666');
                    svg = svg.replace(/333/, '666');
                    break;
            }
            return Promise.resolve(svg);
        }
    }
    function svg2ImgData(source, size, light, scale = 1) {
        return new Promise((resolve, reject) => {
            const cnv = document.createElement('canvas');
            const ctx = cnv.getContext('2d');
            const img = document.createElement('img');
            cnv.width = size;
            cnv.height = size;
            img.width = size;
            img.height = size;
            img.onload = _render;
            img.src = source;
            function _render() {
                let shadow = light ?
                    `rgba(255, 255, 255, ${0.075 * scale})` :
                    `rgba(0, 0, 0, ${0.05 * scale})`;
                ctx.shadowColor = shadow;
                ctx.shadowBlur = 1;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 1;
                ctx.drawImage(img, 0, 0);
                resolve(ctx.getImageData(0, 0, size, size));
            }
        });
    }
})(Background || (Background = {}));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9Db3JlL1V0aWxzL0VudW1zLnRzIiwic3JjL0NvcmUvVXRpbHMvVVVJRC50cyIsInNyYy9Db3JlL1V0aWxzL1JlcXVlc3QudHMiLCJzcmMvUmVzaXplckFQSS9Ub29sdGlwLnRzIiwic3JjL1Jlc2l6ZXJBUEkvU2V0dGluZ3MudHMiLCJzcmMvUmVzaXplckFQSS9TZXR0aW5nc1BhZ2UudHMiLCJzcmMvUmVzaXplckFQSS9DaHJvbWUvV2luZG93cy50cyIsInNyYy9SZXNpemVyQVBJL0Nocm9tZS9UYWJzLnRzIiwic3JjL1Jlc2l6ZXJBUEkvQ2hyb21lL1J1bnRpbWUudHMiLCJzcmMvUmVzaXplckFQSS9DaHJvbWUvQ29udGV4dE1lbnVzLnRzIiwic3JjL1NjcmlwdHMvYmFja2dyb3VuZC9Ub29sc1BvcHVwLnRzIiwic3JjL0NvcmUvVXRpbHMvVW5pcXVlU3RhY2sudHMiLCJzcmMvU2NyaXB0cy9iYWNrZ3JvdW5kL1dpbmRvd3NTdGFjay50cyIsInNyYy9Db3JlL1V0aWxzL1V0aWxzLnRzIiwic3JjL1NjcmlwdHMvYmFja2dyb3VuZC9CYW5uZXIudHMiLCJzcmMvU2NyaXB0cy9iYWNrZ3JvdW5kL0N5Y2xlUHJlc2V0cy50cyIsInNyYy9TY3JpcHRzL2JhY2tncm91bmQvVXBkYXRlci50cyIsInNyYy9TY3JpcHRzL2JhY2tncm91bmQtcHJvY2Vzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxJQUFPLElBQUksQ0F3QlY7QUF4QkQsV0FBTyxJQUFJO0lBQ1YsSUFBWSxVQUtYO0lBTEQsV0FBWSxVQUFVO1FBQ3JCLDZDQUFTLENBQUE7UUFDVCwrQ0FBTSxDQUFBO1FBQ04sK0NBQU0sQ0FBQTtRQUNOLGlEQUFPLENBQUE7SUFDUixDQUFDLEVBTFcsVUFBVSxHQUFWLGVBQVUsS0FBVixlQUFVLFFBS3JCO0lBRUQsSUFBWSxZQUdYO0lBSEQsV0FBWSxZQUFZO1FBQ3ZCLG1EQUFVLENBQUE7UUFDVix1REFBUSxDQUFBO0lBQ1QsQ0FBQyxFQUhX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R0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNqQyxNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRTFDLEdBQUcsQ0FBQyxLQUFLLEdBQUksSUFBSSxDQUFDO1lBQ2xCLEdBQUcsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1lBRWxCLEdBQUcsQ0FBQyxLQUFLLEdBQUksSUFBSSxDQUFDO1lBQ2xCLEdBQUcsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1lBRWxCLEdBQUcsQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDO1lBQ3JCLEdBQUcsQ0FBQyxHQUFHLEdBQU0sTUFBTSxDQUFDO1lBRXBCLFNBQVMsT0FBTztnQkFDZixJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsQ0FBQztvQkFDbkIsdUJBQXVCLEtBQUssR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO29CQUN6QyxpQkFBaUIsSUFBSSxHQUFHLEtBQUssR0FBRyxDQUFDO2dCQUVsQyxHQUFHLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQztnQkFDekIsR0FBRyxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7Z0JBQ25CLEdBQUcsQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDO2dCQUN0QixHQUFHLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQztnQkFDdEIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUV6QixPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzdDLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUM7QUFDRixDQUFDLEVBNXhCTSxVQUFVLEtBQVYsVUFBVSxRQTR4QmhCIiwiZmlsZSI6InNjcmlwdHMvYmFja2dyb3VuZC1wcm9jZXNzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXHJcbm1vZHVsZSBDb3JlIHtcclxuXHRleHBvcnQgZW51bSBQcmVzZXRUeXBlIHtcclxuXHRcdFBIT05FID0gMCxcclxuXHRcdFRBQkxFVCxcclxuXHRcdExBUFRPUCxcclxuXHRcdERFU0tUT1BcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBlbnVtIFByZXNldFRhcmdldCB7XHJcblx0XHRXSU5ET1cgPSAwLFxyXG5cdFx0VklFV1BPUlRcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBlbnVtIFByZXNldFBvc2l0aW9uIHtcclxuXHRcdERFRkFVTFQgPSAwLFxyXG5cdFx0Q1VTVE9NLFxyXG5cdFx0Q0VOVEVSXHJcblx0fVxyXG5cclxuXHRleHBvcnQgZW51bSBQb3B1cEljb25TdHlsZSB7XHJcblx0XHRNT05PQ0hST01FID0gMCxcclxuXHRcdENPTE9SRUQsXHJcblx0XHRDT05UUkFTVFxyXG5cdH1cclxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi8uLi90eXBpbmdzL2h0bWw1LmQudHNcIiAvPlxyXG5cclxubW9kdWxlIENvcmUuVXRpbHMge1xyXG5cdGV4cG9ydCBmdW5jdGlvbiBVVUlEKCk6IHN0cmluZyB7XHJcblx0XHRsZXQgdXVpZDogc3RyaW5nO1xyXG5cdFx0bGV0IGJ5dGVzID0gY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhuZXcgVWludDhBcnJheSgyMSkpO1xyXG5cdFx0bGV0IGhleGVkID0gdmFsID0+ICh2YWwgJSAxNikudG9TdHJpbmcoMTYpO1xyXG5cclxuXHRcdGJ5dGVzWzEyXSA9IDQ7XHJcblx0XHRieXRlc1sxNl0gPSBieXRlc1sxNl0gJiAweDMgfCAweDg7XHJcblxyXG5cdFx0dXVpZCA9IEFycmF5LmZyb20oYnl0ZXMsIGhleGVkKS5qb2luKCcnKTtcclxuXHRcdHV1aWQgPSB1dWlkICsgRGF0ZS5ub3coKS50b1N0cmluZygxNik7XHJcblx0XHR1dWlkID0gdXVpZC5yZXBsYWNlKC9eKC57OH0pKC57NH0pKC57NH0pKC57NH0pLywgJyQxLSQyLSQzLSQ0LScpO1xyXG5cclxuXHRcdHJldHVybiB1dWlkLnRvVXBwZXJDYXNlKCk7XHJcblx0fVxyXG59IiwiXHJcbm1vZHVsZSBDb3JlLlV0aWxzLlJlcXVlc3Qge1xyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gR2V0KHVybDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcclxuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcblx0XHRcdHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuXHJcblx0XHRcdHhoci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgcmVzb2x2ZSk7XHJcblx0XHRcdHhoci5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIHJlamVjdCk7XHJcblx0XHRcdHhoci5hZGRFdmVudExpc3RlbmVyKCdhYm9ydCcsIHJlamVjdCk7XHJcblx0XHRcdHhoci5vcGVuKCdHRVQnLCB1cmwpO1xyXG5cdFx0XHR4aHIuc2VuZCgpO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gR2V0SlNPTih1cmw6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XHJcblx0XHRyZXR1cm4gR2V0KHVybCkudGhlbihkYXRhID0+IFByb21pc2UucmVzb2x2ZShKU09OLnBhcnNlKGRhdGEudGFyZ2V0LnJlc3BvbnNlVGV4dCkpKTtcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBmdW5jdGlvbiBQb3N0KHVybDogc3RyaW5nLCBkYXRhOiBhbnkpOiBQcm9taXNlPGFueT4ge1xyXG5cdFx0cmV0dXJuIF9wb3N0KHVybCwgZGF0YSkudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS50ZXh0KCkpO1xyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIFBvc3RKU09OKHVybDogc3RyaW5nLCBkYXRhOiBhbnkpOiBQcm9taXNlPGFueT4ge1xyXG5cdFx0cmV0dXJuIF9wb3N0KHVybCwgZGF0YSkudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5qc29uKCkpO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gX3Bvc3QodXJsOiBzdHJpbmcsIGRhdGE6IGFueSk6IFByb21pc2U8YW55PiB7XHJcblx0XHRsZXQgcGFydHMgPSBbXTtcclxuXHRcdGZvciAobGV0IGsgaW4gZGF0YSkge1xyXG5cdFx0XHRsZXQgbmFtZSA9IGVuY29kZVVSSUNvbXBvbmVudChrKTtcclxuXHRcdFx0bGV0IHZhbHVlID0gZW5jb2RlVVJJQ29tcG9uZW50KGRhdGFba10pO1xyXG5cdFx0XHRwYXJ0cy5wdXNoKGAke25hbWV9PSR7dmFsdWV9YCk7XHJcblx0XHR9XHJcblx0XHRjb25zdCBpbml0ID0ge1xyXG5cdFx0XHRtZXRob2Q6ICdQT1NUJyxcclxuXHRcdFx0Ym9keTogcGFydHMuam9pbignJicpLFxyXG5cdFx0XHRoZWFkZXJzOiB7XCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWRcIn1cclxuXHRcdH07XHJcblxyXG5cdFx0cmV0dXJuIGZldGNoKHVybCwgaW5pdCk7XHJcblx0fVxyXG59IiwibW9kdWxlIFJlc2l6ZXJBUEkuVG9vbHRpcCB7XHJcblx0ZnVuY3Rpb24gX21lc3NhZ2UodGFiSWQ6IG51bWJlciwgbWVzc2FnZTogYW55KTogUHJvbWlzZTxzdHJpbmc+IHtcclxuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcblx0XHRcdGNocm9tZS50YWJzLnNlbmRNZXNzYWdlKHRhYklkLCBtZXNzYWdlLCBhbnN3ZXIgPT4gcmVzb2x2ZShjaHJvbWUucnVudGltZS5sYXN0RXJyb3IgPyBudWxsIDogYW5zd2VyKSk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBjb25zdCBISURERU4gID0gJ0hJRERFTic7XHJcblx0ZXhwb3J0IGNvbnN0IFZJU0lCTEUgPSAnVklTSUJMRSc7XHJcblxyXG5cdGV4cG9ydCBmdW5jdGlvbiBFbmFibGUodGFiSWQ6IG51bWJlcik6IFByb21pc2U8YW55PiB7XHJcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG5cdFx0XHRjaHJvbWUudGFicy5leGVjdXRlU2NyaXB0KHRhYklkLCB7ZmlsZTogJ3NjcmlwdHMvZW5hYmxlLXRvb2x0aXAuanMnfSwgcmVzdWx0ID0+IHJlc29sdmUoIWNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikpO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gRGlzYWJsZSh0YWJJZDogbnVtYmVyKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuXHRcdHJldHVybiBfbWVzc2FnZSh0YWJJZCwgJ0RJU0FCTEUnKTtcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBmdW5jdGlvbiBHZXRTdGF0dXModGFiSWQ6IG51bWJlcik6IFByb21pc2U8c3RyaW5nPiB7XHJcblx0XHRyZXR1cm4gX21lc3NhZ2UodGFiSWQsICdTVEFUVVMnKTtcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBmdW5jdGlvbiBTaG93KHRhYklkOiBudW1iZXIpOiBQcm9taXNlPHN0cmluZz4ge1xyXG5cdFx0cmV0dXJuIF9tZXNzYWdlKHRhYklkLCAnU0hPVycpO1xyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIEhpZGUodGFiSWQ6IG51bWJlcik6IFByb21pc2U8c3RyaW5nPiB7XHJcblx0XHRyZXR1cm4gX21lc3NhZ2UodGFiSWQsICdISURFJyk7XHJcblx0fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gVG9nZ2xlKHRhYklkOiBudW1iZXIpOiBQcm9taXNlPGFueT4ge1xyXG5cdFx0cmV0dXJuIF9tZXNzYWdlKHRhYklkLCAnU1RBVFVTJykudGhlbihzdGF0dXMgPT4ge1xyXG5cdFx0XHRpZiAoc3RhdHVzID09PSBudWxsKSB7XHJcblx0XHRcdFx0cmV0dXJuIFRvb2x0aXAuRW5hYmxlKHRhYklkKS50aGVuKHJlc3VsdCA9PiB7XHJcblx0XHRcdFx0XHRzZXRUaW1lb3V0KCgpPT5Ub29sdGlwLlNob3codGFiSWQpLCAxMDApO1xyXG5cdFx0XHRcdFx0cmV0dXJuIHJlc3VsdDtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIF9tZXNzYWdlKHRhYklkLCAnVE9HR0xFJyk7XHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIFNldFRpbWVvdXQodGFiSWQ6IG51bWJlciwgdGltZW91dDogbnVtYmVyKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuXHRcdHJldHVybiBfbWVzc2FnZSh0YWJJZCwge2NvbW1hbmQ6ICdTRVRfSElERV9ERUxBWScsIGRlbGF5OiB0aW1lb3V0fSk7XHJcblx0fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gRW5hYmxlT25BbGxQYWdlcygpIHtcclxuXHRcdGlmIChjaHJvbWUud2ViTmF2aWdhdGlvbiAmJiAhY2hyb21lLndlYk5hdmlnYXRpb24ub25ET01Db250ZW50TG9hZGVkLmhhc0xpc3RlbmVyKGVuYWJsZU9uTmV3VGFicykpIHtcclxuXHRcdFx0Y2hyb21lLndlYk5hdmlnYXRpb24ub25ET01Db250ZW50TG9hZGVkLmFkZExpc3RlbmVyKGVuYWJsZU9uTmV3VGFicyk7XHJcblx0XHR9XHJcblxyXG5cdFx0Y2hyb21lLnRhYnMucXVlcnkoe30sIHRhYnMgPT4ge1xyXG5cdFx0XHRmb3IgKGxldCB0YWIgb2YgdGFicykge1xyXG5cdFx0XHRcdEVuYWJsZSh0YWIuaWQpO1xyXG5cdFx0XHR9XHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIERpc2FibGVPbkFsbFBhZ2VzKCkge1xyXG5cdFx0aWYgKGNocm9tZS53ZWJOYXZpZ2F0aW9uKSB7XHJcblx0XHRcdHdoaWxlIChjaHJvbWUud2ViTmF2aWdhdGlvbi5vbkRPTUNvbnRlbnRMb2FkZWQuaGFzTGlzdGVuZXIoZW5hYmxlT25OZXdUYWJzKSkge1xyXG5cdFx0XHRcdGNocm9tZS53ZWJOYXZpZ2F0aW9uLm9uRE9NQ29udGVudExvYWRlZC5yZW1vdmVMaXN0ZW5lcihlbmFibGVPbk5ld1RhYnMpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0Y2hyb21lLnRhYnMucXVlcnkoe30sIHRhYnMgPT4ge1xyXG5cdFx0XHRmb3IgKGxldCB0YWIgb2YgdGFicykge1xyXG5cdFx0XHRcdERpc2FibGUodGFiLmlkKTtcclxuXHRcdFx0fVxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGVuYWJsZU9uTmV3VGFicyhkZXRhaWxzOiBjaHJvbWUud2ViTmF2aWdhdGlvbi5XZWJOYXZpZ2F0aW9uRnJhbWVkQ2FsbGJhY2tEZXRhaWxzKSB7XHJcblx0XHRpZiAoZGV0YWlscy50YWJJZCAmJiAhZGV0YWlscy5mcmFtZUlkKSB7XHJcblx0XHRcdEVuYWJsZShkZXRhaWxzLnRhYklkKTtcclxuXHRcdH1cclxuXHR9XHJcbn0iLCJtb2R1bGUgUmVzaXplckFQSS5TZXR0aW5ncyB7XHJcblx0aW1wb3J0IEVuZHBvaW50VmlzaWJpbGl0eSA9IEV4dEFQSS5Sb3V0ZXIuRW5kcG9pbnRWaXNpYmlsaXR5O1xyXG5cdGltcG9ydCBQcmVzZXRUeXBlICAgICAgICAgPSBDb3JlLlByZXNldFR5cGU7XHJcblx0aW1wb3J0IFByZXNldFRhcmdldCAgICAgICA9IENvcmUuUHJlc2V0VGFyZ2V0O1xyXG5cdGltcG9ydCBQcmVzZXRQb3NpdGlvbiAgICAgPSBDb3JlLlByZXNldFBvc2l0aW9uO1xyXG5cclxuXHJcblx0ZXhwb3J0IGludGVyZmFjZSBJS2V5cyB7XHJcblx0XHRhbHdheXNDZW50ZXJUaGVXaW5kb3c/OiBib29sZWFuO1xyXG5cdFx0bGVmdEFsaWduV2luZG93PzogYm9vbGVhbjtcclxuXHRcdGFsd2F5c1Nob3dUaGVUb29sdGlwPzogYm9vbGVhbjtcclxuXHRcdGhpZGVUb29sdGlwRGVsYXk/OiBudW1iZXI7XHJcblx0XHR0b29sdGlwUG9zaXRpb24/OiBzdHJpbmdbXTtcclxuXHRcdHBvcHVwSWNvblN0eWxlPzogc3RyaW5nO1xyXG5cdFx0cHJlc2V0c0ljb25zU3R5bGU/OiBzdHJpbmc7XHJcblx0XHRhbHRlcm5hdGVQcmVzZXRzQmc/OiBib29sZWFuO1xyXG5cdFx0YXV0b0Nsb3NlUG9wdXA/OiBib29sZWFuO1xyXG5cdFx0cHJlc2V0c1ByaW1hcnlMaW5lPzogc3RyaW5nO1xyXG5cdFx0aGlkZVByZXNldHNEZXNjcmlwdGlvbj86IGJvb2xlYW47XHJcblx0XHRoaWRlUG9wdXBUb29sdGlwcz86IGJvb2xlYW47XHJcblx0XHRoaWRlUXVpY2tSZXNpemU/OiBib29sZWFuO1xyXG5cdFx0b3JpZ2luYWxJbnN0YWxsRGF0ZT86IG51bWJlcjtcclxuXHRcdGxpY2Vuc2U/OiBhbnk7XHJcblxyXG5cdFx0cHJlc2V0cz86IGFueVtdO1xyXG5cdH1cclxuXHJcblx0ZXhwb3J0IHZhciBEZWZhdWx0U2V0dGluZ3M6IElLZXlzID0ge1xyXG5cdFx0YWx3YXlzQ2VudGVyVGhlV2luZG93ICA6IGZhbHNlLFxyXG5cdFx0bGVmdEFsaWduV2luZG93ICAgICAgICA6IGZhbHNlLFxyXG5cdFx0YWx3YXlzU2hvd1RoZVRvb2x0aXAgICA6IGZhbHNlLFxyXG5cdFx0aGlkZVRvb2x0aXBEZWxheSAgICAgICA6IDMwMDAsXHJcblx0XHR0b29sdGlwUG9zaXRpb24gICAgICAgIDogWydib3R0b20nLCAncmlnaHQnXSxcclxuXHRcdHBvcHVwSWNvblN0eWxlICAgICAgICAgOiAnZGFyaytjb2xvcicsXHJcblx0XHRwcmVzZXRzSWNvbnNTdHlsZSAgICAgIDogJ2NsZWFyJyxcclxuXHRcdGFsdGVybmF0ZVByZXNldHNCZyAgICAgOiBmYWxzZSxcclxuXHRcdGF1dG9DbG9zZVBvcHVwICAgICAgICAgOiBmYWxzZSxcclxuXHRcdHByZXNldHNQcmltYXJ5TGluZSAgICAgOiAnJyxcclxuXHRcdGhpZGVQcmVzZXRzRGVzY3JpcHRpb24gOiBmYWxzZSxcclxuXHRcdGhpZGVQb3B1cFRvb2x0aXBzICAgICAgOiBmYWxzZSxcclxuXHRcdGhpZGVRdWlja1Jlc2l6ZSAgICAgICAgOiBmYWxzZSxcclxuXHRcdG9yaWdpbmFsSW5zdGFsbERhdGUgICAgOiBudWxsLFxyXG5cdFx0bGljZW5zZSAgICAgICAgICAgICAgICA6IG51bGwsXHJcblx0XHRwcmVzZXRzICAgICAgICAgICAgICAgIDogW11cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9nZXRTdG9yZShsb2NhbDogYm9vbGVhbiA9IGZhbHNlLCBmb3JjZTogYm9vbGVhbiA9IGZhbHNlKTogUHJvbWlzZTxjaHJvbWUuc3RvcmFnZS5TdG9yYWdlQXJlYT4ge1xyXG5cdFx0bGV0IHN0b3JlID0gbG9jYWwgPyBjaHJvbWUuc3RvcmFnZS5sb2NhbCA6IGNocm9tZS5zdG9yYWdlLnN5bmM7XHJcblxyXG5cdFx0aWYgKGZvcmNlKSB7XHJcblx0XHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUoc3RvcmUpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcblx0XHRcdGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldCh7ZGlzYWJsZVN5bmM6IGZhbHNlfSwgc2V0dGluZ3MgPT4ge1xyXG5cdFx0XHRcdGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHtcclxuXHRcdFx0XHRcdHJldHVybiByZWplY3QoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGxldCBzdG9yZSA9IGxvY2FsIHx8IHNldHRpbmdzLmRpc2FibGVTeW5jID8gY2hyb21lLnN0b3JhZ2UubG9jYWwgOiBjaHJvbWUuc3RvcmFnZS5zeW5jO1xyXG5cclxuXHRcdFx0XHRyZXNvbHZlKHN0b3JlKTtcclxuXHRcdFx0fSk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9nZXRMaWNlbnNlKCkge1xyXG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuXHRcdFx0cmV0dXJuIF9nZXRTdG9yZShmYWxzZSwgdHJ1ZSkudGhlbihzdG9yZSA9PiB7XHJcblx0XHRcdFx0c3RvcmUuZ2V0KHtsaWNlbnNlOiBudWxsfSwgZGF0YSA9PiB7XHJcblx0XHRcdFx0XHRpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XHJcblx0XHRcdFx0XHRcdHJldHVybiByZWplY3QoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKTtcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRyZXNvbHZlKGRhdGEubGljZW5zZSk7XHJcblx0XHRcdFx0fSlcclxuXHRcdFx0fSlcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gU2V0KGtleTogc3RyaW5nfGFueSwgdmFsdWU/OiBhbnksIGxvY2FsOiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPGFueT4ge1xyXG5cdFx0bGV0IGRhdGEgPSBfbm9ybWFsaXplKGtleSwgdmFsdWUpO1xyXG5cclxuXHRcdGlmICgnbGljZW5zZScgaW4gZGF0YSApIHtcclxuXHRcdFx0X2dldFN0b3JlKGZhbHNlLCB0cnVlKS50aGVuKHN0b3JlID0+IHtcclxuXHRcdFx0XHRzdG9yZS5zZXQoe2xpY2Vuc2U6IGRhdGEubGljZW5zZX0pO1xyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBfZ2V0U3RvcmUobG9jYWwpLnRoZW4oc3RvcmUgPT4ge1xyXG5cdFx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG5cdFx0XHRcdHN0b3JlLnNldChkYXRhLCAoKSA9PiB7XHJcblx0XHRcdFx0XHRpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XHJcblx0XHRcdFx0XHRcdHJldHVybiByZWplY3QoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcclxuXHRcdFx0XHRcdHJlc29sdmUoZGF0YSk7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBmdW5jdGlvbiBHZXQoa2V5OiBzdHJpbmd8YW55LCBkZWZhdWx0VmFsdWU/OiBhbnksIGxvY2FsOiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPGFueT4ge1xyXG5cdFx0bGV0IGtleXMgID0gX25vcm1hbGl6ZShrZXksIGRlZmF1bHRWYWx1ZSk7XHJcblxyXG5cdFx0cmV0dXJuIF9nZXRMaWNlbnNlKCkudGhlbihsaWNlbnNlID0+IF9nZXRTdG9yZShsb2NhbCkudGhlbihzdG9yZSA9PiB7XHJcblx0XHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcblx0XHRcdFx0c3RvcmUuZ2V0KGtleXMsIHNldHRpbmdzID0+IHtcclxuXHRcdFx0XHRcdGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHtcclxuXHRcdFx0XHRcdFx0cmV0dXJuIHJlamVjdChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpO1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdHNldHRpbmdzLmxpY2Vuc2UgPSBsaWNlbnNlO1xyXG5cclxuXHRcdFx0XHRcdGlmICh0eXBlb2Yoa2V5KSA9PT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRcdFx0cmV0dXJuIHJlc29sdmUoc2V0dGluZ3Nba2V5XSk7XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0Zm9yIChsZXQgayBpbiBEZWZhdWx0U2V0dGluZ3MpIHtcclxuXHRcdFx0XHRcdFx0aWYgKCEoayBpbiBzZXR0aW5ncykpIHtcclxuXHRcdFx0XHRcdFx0XHRzZXR0aW5nc1trXSA9IERlZmF1bHRTZXR0aW5nc1trXTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdHJldHVybiByZXNvbHZlKHNldHRpbmdzKTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fSk7XHJcblx0XHR9KSk7XHJcblx0fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gRGVsKGtleTogc3RyaW5nfHN0cmluZ1tdLCBsb2NhbDogYm9vbGVhbiA9IGZhbHNlKTogUHJvbWlzZTxhbnk+IHtcclxuXHRcdGxldCBrZXlzICA9IChrZXkgaW5zdGFuY2VvZiBBcnJheSkgPyBrZXkgOiBba2V5XTtcclxuXHJcblx0XHRyZXR1cm4gX2dldFN0b3JlKGxvY2FsKS50aGVuKHN0b3JlID0+IHtcclxuXHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuXHRcdFx0XHRzdG9yZS5yZW1vdmUoPHN0cmluZ1tdPiBrZXlzLCAoKSA9PiB7XHJcblx0XHRcdFx0XHRpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XHJcblx0XHRcdFx0XHRcdHJldHVybiByZWplY3QoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKTtcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRyZXR1cm4gcmVzb2x2ZSgpO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9KTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gX25vcm1hbGl6ZShrZXk6IHN0cmluZ3xhbnksIGRlZmF1bHRWYWx1ZT86IGFueSk6IGFueSB7XHJcblx0XHRsZXQga2V5czogYW55ID0ge307XHJcblxyXG5cdFx0aWYgKHR5cGVvZihrZXkpID09PSAnc3RyaW5nJykge1xyXG5cdFx0XHRpZiAoZGVmYXVsdFZhbHVlID09PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRkZWZhdWx0VmFsdWUgPSBEZWZhdWx0U2V0dGluZ3Nba2V5XTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0a2V5c1trZXldID0gZGVmYXVsdFZhbHVlO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0a2V5cyA9IGtleTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4ga2V5cztcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9oYW5kbGVyKHJlc29sdmU6IEZ1bmN0aW9uLCByZWplY3Q6IEZ1bmN0aW9uKTogYW55IHtcclxuXHRcdHJldHVybiBmdW5jdGlvbihkYXRhKSB7XHJcblx0XHRcdGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHtcclxuXHRcdFx0XHRyZXR1cm4gcmVqZWN0KGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcik7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJlc29sdmUoZGF0YSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gUGFyc2VWMShkYXRhOiBhbnkpOiBJS2V5cyB7XHJcblx0XHRpZiAoIWRhdGEpIHtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdGxldCBzZXR0aW5nczogYW55ICA9IHt9O1xyXG5cdFx0bGV0IHByZXNldHM6IGFueVtdID0gSlNPTi5wYXJzZShkYXRhWydXaW5kb3dSZXNpemVyLlJvd3MnXSk7XHJcblxyXG5cdFx0c2V0dGluZ3MuYWx3YXlzU2hvd1RoZVRvb2x0aXAgICA9IGRhdGFbJ1dpbmRvd1Jlc2l6ZXIuVG9vbHRpcCddICE9IDE7XHJcblx0XHRzZXR0aW5ncy5oaWRlVG9vbHRpcERlbGF5ICAgICAgID0gcGFyc2VJbnQoZGF0YVsnV2luZG93UmVzaXplci5Ub29sdGlwRGVsYXknXSwgMTApIHx8IERlZmF1bHRTZXR0aW5ncy5oaWRlVG9vbHRpcERlbGF5O1xyXG5cdFx0c2V0dGluZ3MuaGlkZVByZXNldHNEZXNjcmlwdGlvbiA9IGRhdGFbJ1dpbmRvd1Jlc2l6ZXIuUG9wdXBEZXNjcmlwdGlvbiddID09IDE7XHJcblxyXG5cdFx0c2V0dGluZ3MucHJlc2V0cyA9IFtdO1xyXG5cclxuXHRcdGZvciAobGV0IHByZXNldCBvZiBwcmVzZXRzKSB7XHJcblx0XHRcdHNldHRpbmdzLnByZXNldHMucHVzaCh7XHJcblx0XHRcdFx0aWQgICAgICAgICAgOiBDb3JlLlV0aWxzLlVVSUQoKSxcclxuXHRcdFx0XHR3aWR0aCAgICAgICA6IF9wYXJzZU51bWJlcihwcmVzZXQud2lkdGgpLFxyXG5cdFx0XHRcdGhlaWdodCAgICAgIDogX3BhcnNlTnVtYmVyKHByZXNldC5oZWlnaHQpLFxyXG5cdFx0XHRcdHRvcCAgICAgICAgIDogX3BhcnNlTnVtYmVyKHByZXNldC5ZKSxcclxuXHRcdFx0XHRsZWZ0ICAgICAgICA6IF9wYXJzZU51bWJlcihwcmVzZXQuWCksXHJcblx0XHRcdFx0ZGVzY3JpcHRpb24gOiBwcmVzZXQudGl0bGUgfHwgbnVsbCxcclxuXHRcdFx0XHRwb3NpdGlvbiAgICA6IF9wYXJzZVBvc2l0aW9uKHByZXNldC5wb3MpLFxyXG5cdFx0XHRcdHR5cGUgICAgICAgIDogX3BhcnNlVHlwZShwcmVzZXQudHlwZSksXHJcblx0XHRcdFx0dGFyZ2V0ICAgICAgOiBfcGFyc2VUYXJnZXQocHJlc2V0LnRhcmdldClcclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gc2V0dGluZ3M7XHJcblxyXG5cdFx0ZnVuY3Rpb24gX3BhcnNlTnVtYmVyKHZhbHVlKSB7XHJcblx0XHRcdHJldHVybiBwYXJzZUludCh2YWx1ZSwgMTApIHx8IG51bGw7XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gX3BhcnNlVGFyZ2V0KHZhbHVlKSB7XHJcblx0XHRcdHJldHVybiB2YWx1ZSA9PSAnd2luZG93JyA/IFByZXNldFRhcmdldC5XSU5ET1cgOiBQcmVzZXRUYXJnZXQuVklFV1BPUlQ7XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gX3BhcnNlUG9zaXRpb24odmFsdWUpIHtcclxuXHRcdFx0bGV0IHBvcyA9IHBhcnNlSW50KHZhbHVlLCAxMCkgfHwgMDtcclxuXHJcblx0XHRcdHN3aXRjaCAocG9zKSB7XHJcblx0XHRcdFx0Y2FzZSAxOiByZXR1cm4gUHJlc2V0UG9zaXRpb24uQ1VTVE9NO1xyXG5cdFx0XHRcdGNhc2UgMzogcmV0dXJuIFByZXNldFBvc2l0aW9uLkNFTlRFUjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIFByZXNldFBvc2l0aW9uLkRFRkFVTFQ7XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gX3BhcnNlVHlwZSh2YWx1ZSkge1xyXG5cdFx0XHRzd2l0Y2ggKHZhbHVlKSB7XHJcblx0XHRcdFx0Y2FzZSAnZGVza3RvcCcgICAgICA6IHJldHVybiBQcmVzZXRUeXBlLkRFU0tUT1A7XHJcblx0XHRcdFx0Y2FzZSAnbGFwdG9wJyAgICAgICA6IHJldHVybiBQcmVzZXRUeXBlLkxBUFRPUDtcclxuXHRcdFx0XHRjYXNlICd0YWJsZXQnICAgICAgIDogcmV0dXJuIFByZXNldFR5cGUuVEFCTEVUO1xyXG5cdFx0XHRcdGNhc2UgJ3NtYXJ0cGhvbmUnICAgOiByZXR1cm4gUHJlc2V0VHlwZS5QSE9ORTtcclxuXHRcdFx0XHRjYXNlICdmZWF0dXJlcGhvbmUnIDogcmV0dXJuIFByZXNldFR5cGUuUEhPTkU7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiBQcmVzZXRUeXBlLkRFU0tUT1A7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHREZWZhdWx0U2V0dGluZ3MucHJlc2V0cy5wdXNoKHtcclxuXHRcdGlkOiAnRDQ4MkNFQkQtMTJEQy00NTdELThGQ0YtQjE1MjI2REZFREQ4JyxcclxuXHRcdHdpZHRoOiAzMjAsXHJcblx0XHRoZWlnaHQ6IDU2OCxcclxuXHRcdHRhcmdldDogQ29yZS5QcmVzZXRUYXJnZXQuVklFV1BPUlQsXHJcblx0XHRkZXNjcmlwdGlvbjogJ2lQaG9uZSA1JyxcclxuXHRcdHR5cGU6IENvcmUuUHJlc2V0VHlwZS5QSE9ORVxyXG5cdH0pXHJcblxyXG5cdERlZmF1bHRTZXR0aW5ncy5wcmVzZXRzLnB1c2goe1xyXG5cdFx0aWQ6ICdBMUQ3RDA2NS0zM0IwLTQ0QkQtOEYyMC1BMTUyMjZERkYyMzcnLFxyXG5cdFx0d2lkdGg6IDM3NSxcclxuXHRcdGhlaWdodDogNjY3LFxyXG5cdFx0dGFyZ2V0OiBDb3JlLlByZXNldFRhcmdldC5WSUVXUE9SVCxcclxuXHRcdGRlc2NyaXB0aW9uOiAnaVBob25lIDYnLFxyXG5cdFx0dHlwZTogQ29yZS5QcmVzZXRUeXBlLlBIT05FXHJcblx0fSlcclxuXHJcblx0RGVmYXVsdFNldHRpbmdzLnByZXNldHMucHVzaCh7XHJcblx0XHRpZDogJ0ZGM0RFNkNELUY1NjAtNDU3Ni04MTFGLUUxNTIyNkRGRjQ1RicsXHJcblx0XHR3aWR0aDogMTAyNCxcclxuXHRcdGhlaWdodDogNzY4LFxyXG5cdFx0dGFyZ2V0OiBDb3JlLlByZXNldFRhcmdldC5WSUVXUE9SVCxcclxuXHRcdGRlc2NyaXB0aW9uOiAnaVBhZCcsXHJcblx0XHR0eXBlOiBDb3JlLlByZXNldFR5cGUuVEFCTEVUXHJcblx0fSlcclxuXHJcblx0RGVmYXVsdFNldHRpbmdzLnByZXNldHMucHVzaCh7XHJcblx0XHRpZDogJzI3QUNERDlDLTlBOTQtNDRGOC1CMzMzLUMxNTIyNkRGRjVGRicsXHJcblx0XHR3aWR0aDogMTQ0MCxcclxuXHRcdGhlaWdodDogOTAwLFxyXG5cdFx0dGFyZ2V0OiBDb3JlLlByZXNldFRhcmdldC5XSU5ET1csXHJcblx0XHRkZXNjcmlwdGlvbjogJ0xhcHRvcCcsXHJcblx0XHR0eXBlOiBDb3JlLlByZXNldFR5cGUuTEFQVE9QXHJcblx0fSlcclxuXHJcblx0RGVmYXVsdFNldHRpbmdzLnByZXNldHMucHVzaCh7XHJcblx0XHRpZDogJzIyNTZFN0FELUI3QkEtNDBCNy05OTY5LTQxNTIyNkRGRjgxNycsXHJcblx0XHR3aWR0aDogMTY4MCxcclxuXHRcdGhlaWdodDogMTA1MCxcclxuXHRcdHRhcmdldDogQ29yZS5QcmVzZXRUYXJnZXQuV0lORE9XLFxyXG5cdFx0ZGVzY3JpcHRpb246ICdEZXNrdG9wJyxcclxuXHRcdHR5cGU6IENvcmUuUHJlc2V0VHlwZS5ERVNLVE9QXHJcblx0fSlcclxuXHJcblx0RGVmYXVsdFNldHRpbmdzLnByZXNldHMucHVzaCh7XHJcblx0XHRpZDogJzIyNTZFN0FELUI3QkEtNDBCNy05OTY5LTQxNTIyNkRGRjgxOCcsXHJcblx0XHR3aWR0aDogMTkyMCxcclxuXHRcdGhlaWdodDogMTA4MCxcclxuXHRcdHRhcmdldDogQ29yZS5QcmVzZXRUYXJnZXQuV0lORE9XLFxyXG5cdFx0ZGVzY3JpcHRpb246ICdEZXNrdG9wJyxcclxuXHRcdHR5cGU6IENvcmUuUHJlc2V0VHlwZS5ERVNLVE9QXHJcblx0fSlcclxuXHJcblx0RGVmYXVsdFNldHRpbmdzLnByZXNldHMucHVzaCh7XHJcblx0XHRpZDogJ0M3NkY0OERCLUIyRDItNERFQS1CMzVELTYxNTI2MDZGODgzRCcsXHJcblx0XHR3aWR0aDogMjU2MCxcclxuXHRcdGhlaWdodDogMTQ0MCxcclxuXHRcdHRhcmdldDogQ29yZS5QcmVzZXRUYXJnZXQuV0lORE9XLFxyXG5cdFx0ZGVzY3JpcHRpb246ICdEZXNrdG9wJyxcclxuXHRcdHR5cGU6IENvcmUuUHJlc2V0VHlwZS5ERVNLVE9QXHJcblx0fSlcclxufSIsIm1vZHVsZSBSZXNpemVyQVBJLlNldHRpbmdzUGFnZSB7XHJcblx0bGV0IGN1cnJlbnRQYWdlID0gbnVsbDtcclxuXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIE9wZW4ocGFnZTogc3RyaW5nID0gbnVsbCk6IFByb21pc2U8YW55PiB7XHJcblx0XHRwYWdlID0gcGFnZSB8fCAnI3NldHRpbmdzJztcclxuXHRcdGN1cnJlbnRQYWdlID0gcGFnZTtcclxuXHJcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG5cdFx0XHRjaHJvbWUucnVudGltZS5vcGVuT3B0aW9uc1BhZ2UoKCkgPT4ge1xyXG5cdFx0XHRcdGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHtzaG93UGFnZTogcGFnZX0sIChyZXNwb25zZSkgPT4ge1xyXG5cdFx0XHRcdFx0aWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xyXG5cdFx0XHRcdFx0XHQvLyBpdCdzIG9rLCBkb24ndCBuZWVkIHRvIGRvIGFueXRoaW5nXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRyZXNvbHZlKHJlc3BvbnNlKVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHR9KTtcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gQ3VycmVudCgpOiBQcm9taXNlPHN0cmluZz4ge1xyXG5cdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZShjdXJyZW50UGFnZSk7XHJcblx0fVxyXG59IiwibW9kdWxlIFJlc2l6ZXJBUEkuQ2hyb21lLldpbmRvd3Mge1xyXG5cdGV4cG9ydCBjb25zdCBOT05FID0gY2hyb21lLndpbmRvd3MuV0lORE9XX0lEX05PTkU7XHJcblxyXG5cdGV4cG9ydCBpbnRlcmZhY2UgSVdpbmRvdyBleHRlbmRzIGNocm9tZS53aW5kb3dzLldpbmRvdyB7fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gR2V0KHdpbklkOiBudW1iZXIsIGNvbmZpZz86IGNocm9tZS53aW5kb3dzLkdldEluZm8pOiBQcm9taXNlPElXaW5kb3c+IHtcclxuXHRcdGNvbmZpZyA9IGNvbmZpZyB8fCB7cG9wdWxhdGU6IHRydWV9O1xyXG5cclxuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcblx0XHRcdGNocm9tZS53aW5kb3dzLmdldCh3aW5JZCwgY29uZmlnLCB3aW4gPT4ge1xyXG5cdFx0XHRcdGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHtcclxuXHRcdFx0XHRcdHJldHVybiByZWplY3QoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdHJlc29sdmUod2luKTtcclxuXHRcdFx0fSlcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIEFsbChjb25maWc/OiBjaHJvbWUud2luZG93cy5HZXRJbmZvKTogUHJvbWlzZTxJV2luZG93W10+IHtcclxuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcblx0XHRcdGNocm9tZS53aW5kb3dzLmdldEFsbChjb25maWcsIHdpbiA9PiB7XHJcblx0XHRcdFx0aWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHJlamVjdChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0cmVzb2x2ZSh3aW4pO1xyXG5cdFx0XHR9KVxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBmdW5jdGlvbiBDcmVhdGUoY29uZmlnOiBjaHJvbWUud2luZG93cy5DcmVhdGVEYXRhKTogUHJvbWlzZTxJV2luZG93PiB7XHJcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG5cdFx0XHRjaHJvbWUud2luZG93cy5jcmVhdGUoY29uZmlnLCB3aW4gPT4ge1xyXG5cdFx0XHRcdGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHtcclxuXHRcdFx0XHRcdHJldHVybiByZWplY3QoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdHJlc29sdmUod2luKTtcclxuXHRcdFx0fSlcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gQ3JlYXRlUG9wdXAodXJsOiBzdHJpbmcsIGNvbmZpZzogY2hyb21lLndpbmRvd3MuQ3JlYXRlRGF0YSA9IHt9KTogUHJvbWlzZTxJV2luZG93PiB7XHJcblx0XHRjb25maWcudXJsICA9IHVybDtcclxuXHRcdGNvbmZpZy50eXBlID0gJ3BvcHVwJztcclxuXHJcblx0XHRyZXR1cm4gQ3JlYXRlKGNvbmZpZyk7XHJcblx0fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gVXBkYXRlKHdpbklkOiBudW1iZXIsIGNvbmZpZzogY2hyb21lLndpbmRvd3MuVXBkYXRlSW5mbyk6IFByb21pc2U8SVdpbmRvdz4ge1xyXG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuXHRcdFx0Y2hyb21lLndpbmRvd3MudXBkYXRlKHdpbklkLCBjb25maWcsIHdpbiA9PiB7XHJcblx0XHRcdFx0aWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHJlamVjdChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0cmVzb2x2ZSh3aW4pO1xyXG5cdFx0XHR9KVxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBmdW5jdGlvbiBPbihuYW1lOiBzdHJpbmcsIGNhbGxiYWNrOiBGdW5jdGlvbikge1xyXG5cdFx0bGV0IGV2ZW50ID0gY2hyb21lLndpbmRvd3NbJ29uJyArIG5hbWVdO1xyXG5cclxuXHRcdGV2ZW50ICYmICFldmVudC5oYXNMaXN0ZW5lcihjYWxsYmFjaykgJiYgZXZlbnQuYWRkTGlzdGVuZXIoY2FsbGJhY2spO1xyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIE9mZihuYW1lOiBzdHJpbmcsIGNhbGxiYWNrOiBGdW5jdGlvbikge1xyXG5cdFx0bGV0IGV2ZW50ID0gY2hyb21lLndpbmRvd3NbJ29uJyArIG5hbWVdO1xyXG5cclxuXHRcdGV2ZW50ICYmIGV2ZW50LnJlbW92ZUxpc3RlbmVyKGNhbGxiYWNrKTtcclxuXHR9XHJcbn0iLCJtb2R1bGUgUmVzaXplckFQSS5DaHJvbWUuVGFicyB7XHJcblx0ZXhwb3J0IGludGVyZmFjZSBJVGFiIGV4dGVuZHMgY2hyb21lLnRhYnMuVGFiIHt9XHJcblxyXG5cdGV4cG9ydCBmdW5jdGlvbiBRdWVyeShmaWx0ZXI6IG51bWJlciB8IGNocm9tZS50YWJzLlF1ZXJ5SW5mbyA9IHt9KTogUHJvbWlzZTxJVGFiW10+IHtcclxuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcblx0XHRcdGZ1bmN0aW9uIF9kb25lKHRhYnMpIHtcclxuXHRcdFx0XHRpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gcmVqZWN0KGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcik7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRpZiAoISh0YWJzIGluc3RhbmNlb2YgQXJyYXkpKSB7XHJcblx0XHRcdFx0XHR0YWJzID0gW3RhYnNdO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0cmVzb2x2ZSh0YWJzKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKHR5cGVvZiBmaWx0ZXIgPT09ICdudW1iZXInKSB7XHJcblx0XHRcdFx0Y2hyb21lLnRhYnMuZ2V0KDxudW1iZXI+ZmlsdGVyLCBfZG9uZSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0Y2hyb21lLnRhYnMucXVlcnkoPGNocm9tZS50YWJzLlF1ZXJ5SW5mbz5maWx0ZXIsIF9kb25lKTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gR2V0QWN0aXZlKHdpbklkOiBudW1iZXIpOiBQcm9taXNlPElUYWI+IHtcclxuXHRcdGxldCBmaWx0ZXIgPSB7XHJcblx0XHRcdGFjdGl2ZTogdHJ1ZSxcclxuXHRcdFx0d2luZG93SWQgOiB3aW5JZFxyXG5cdFx0fTtcclxuXHJcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG5cdFx0XHRjaHJvbWUudGFicy5xdWVyeShmaWx0ZXIsIHRhYnMgPT4ge1xyXG5cdFx0XHRcdGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHtcclxuXHRcdFx0XHRcdHJldHVybiByZWplY3QoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdHJlc29sdmUodGFic1swXSk7XHJcblx0XHRcdH0pXHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIENyZWF0ZShjb25maWc6IGNocm9tZS53aW5kb3dzLkNyZWF0ZURhdGEpOiBQcm9taXNlPGNocm9tZS53aW5kb3dzLldpbmRvdz4ge1xyXG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuXHRcdFx0Y2hyb21lLndpbmRvd3MuY3JlYXRlKGNvbmZpZywgd2luID0+IHtcclxuXHRcdFx0XHRpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gcmVqZWN0KGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcik7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRyZXNvbHZlKHdpbik7XHJcblx0XHRcdH0pXHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIENyZWF0ZVBvcHVwKHVybDogc3RyaW5nLCBjb25maWc/OiBjaHJvbWUud2luZG93cy5DcmVhdGVEYXRhKTogUHJvbWlzZTxjaHJvbWUud2luZG93cy5XaW5kb3c+IHtcclxuXHRcdGNvbmZpZy51cmwgID0gdXJsO1xyXG5cdFx0Y29uZmlnLnR5cGUgPSAncG9wdXAnO1xyXG5cclxuXHRcdHJldHVybiBDcmVhdGUoY29uZmlnKTtcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBmdW5jdGlvbiBVcGRhdGUod2luSWQ6IG51bWJlciwgY29uZmlnOiBjaHJvbWUud2luZG93cy5DcmVhdGVEYXRhKTogUHJvbWlzZTxjaHJvbWUud2luZG93cy5XaW5kb3c+IHtcclxuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcblx0XHRcdGNocm9tZS53aW5kb3dzLnVwZGF0ZSh3aW5JZCwgY29uZmlnLCB3aW4gPT4ge1xyXG5cdFx0XHRcdGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHtcclxuXHRcdFx0XHRcdHJldHVybiByZWplY3QoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdHJlc29sdmUod2luKTtcclxuXHRcdFx0fSlcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gRHVwbGljYXRlKHRhYklkOiBudW1iZXIpOiBQcm9taXNlPElUYWI+IHtcclxuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcblx0XHRcdGNocm9tZS50YWJzLmR1cGxpY2F0ZSh0YWJJZCwgdGFiID0+IHtcclxuXHRcdFx0XHRpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gcmVqZWN0KGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcik7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRyZXNvbHZlKHRhYik7XHJcblx0XHRcdH0pXHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIEdldFpvb20odGFiSWQ6IG51bWJlcik6IFByb21pc2U8bnVtYmVyPiB7XHJcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG5cdFx0XHRjaHJvbWUudGFicy5nZXRab29tKHRhYklkLCB6b29tID0+IHtcclxuXHRcdFx0XHRpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gcmVqZWN0KGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcik7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRyZXNvbHZlKHpvb20pO1xyXG5cdFx0XHR9KVxyXG5cdFx0fSk7XHJcblx0fVxyXG59IiwibW9kdWxlIFJlc2l6ZXJBUEkuQ2hyb21lLlJ1bnRpbWUge1xyXG5cdGV4cG9ydCBmdW5jdGlvbiBFcnJvcigpOiBhbnkge1xyXG5cdFx0cmV0dXJuIGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcjtcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBmdW5jdGlvbiBCcm9hZGNhc3QobWVzc2FnZTogYW55KTogUHJvbWlzZTxhbnk+IHtcclxuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcblx0XHRcdGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKG1lc3NhZ2UsIHJlc3BvbnNlID0+IHtcclxuXHRcdFx0XHRpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gcmVqZWN0KGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcik7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRyZXNvbHZlKHJlc3BvbnNlKTtcclxuXHRcdFx0fSlcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIE9uKG5hbWU6IHN0cmluZywgY2FsbGJhY2s6IEZ1bmN0aW9uKSB7XHJcblx0XHRsZXQgZXZlbnQgPSBjaHJvbWUucnVudGltZVsnb24nICsgbmFtZV07XHJcblxyXG5cdFx0ZXZlbnQgJiYgIWV2ZW50Lmhhc0xpc3RlbmVyKGNhbGxiYWNrKSAmJiBldmVudC5hZGRMaXN0ZW5lcihjYWxsYmFjayk7XHJcblx0fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gT2ZmKG5hbWU6IHN0cmluZywgY2FsbGJhY2s6IEZ1bmN0aW9uKSB7XHJcblx0XHRsZXQgZXZlbnQgPSBjaHJvbWUucnVudGltZVsnb24nICsgbmFtZV07XHJcblxyXG5cdFx0ZXZlbnQgJiYgZXZlbnQucmVtb3ZlTGlzdGVuZXIoY2FsbGJhY2spO1xyXG5cdH1cclxufSIsIm1vZHVsZSBSZXNpemVyQVBJLkNocm9tZS5Db250ZXh0TWVudXMge1xyXG5cdGV4cG9ydCBmdW5jdGlvbiBDcmVhdGUoY29uZmlnOiBjaHJvbWUuY29udGV4dE1lbnVzLkNyZWF0ZVByb3BlcnRpZXMpOiBQcm9taXNlPGFueT4ge1xyXG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuXHRcdFx0Y2hyb21lLmNvbnRleHRNZW51cy5jcmVhdGUoY29uZmlnLCAoKSA9PiB7XHJcblx0XHRcdFx0aWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHJlamVjdChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0cmVzb2x2ZSgpO1xyXG5cdFx0XHR9KVxyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gVXBkYXRlKGl0ZW1JZDogc3RyaW5nLCBjb25maWc6IGNocm9tZS5jb250ZXh0TWVudXMuVXBkYXRlUHJvcGVydGllcyk6IFByb21pc2U8YW55PiB7XHJcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG5cdFx0XHRjaHJvbWUuY29udGV4dE1lbnVzLnVwZGF0ZShpdGVtSWQsIGNvbmZpZywgKCkgPT4ge1xyXG5cdFx0XHRcdGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHtcclxuXHRcdFx0XHRcdHJldHVybiByZWplY3QoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdHJlc29sdmUoKTtcclxuXHRcdFx0fSlcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIFJlbW92ZShpdGVtSWQ6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XHJcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG5cdFx0XHRjaHJvbWUuY29udGV4dE1lbnVzLnJlbW92ZShpdGVtSWQsICgpID0+IHtcclxuXHRcdFx0XHRpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gcmVqZWN0KGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcik7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRyZXNvbHZlKCk7XHJcblx0XHRcdH0pXHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBmdW5jdGlvbiBPbihuYW1lOiBzdHJpbmcsIGNhbGxiYWNrOiBGdW5jdGlvbikge1xyXG5cdFx0bGV0IGV2ZW50ID0gY2hyb21lLmNvbnRleHRNZW51c1snb24nICsgbmFtZV07XHJcblxyXG5cdFx0ZXZlbnQgJiYgIWV2ZW50Lmhhc0xpc3RlbmVyKGNhbGxiYWNrKSAmJiBldmVudC5hZGRMaXN0ZW5lcihjYWxsYmFjayk7XHJcblx0fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gT2ZmKG5hbWU6IHN0cmluZywgY2FsbGJhY2s6IEZ1bmN0aW9uKSB7XHJcblx0XHRsZXQgZXZlbnQgPSBjaHJvbWUuY29udGV4dE1lbnVzWydvbicgKyBuYW1lXTtcclxuXHJcblx0XHRldmVudCAmJiBldmVudC5yZW1vdmVMaXN0ZW5lcihjYWxsYmFjayk7XHJcblx0fVxyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL1Jlc2l6ZXJBUEkvQ2hyb21lL1dpbmRvd3MudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vUmVzaXplckFQSS9DaHJvbWUvVGFicy50c1wiIC8+XHJcblxyXG5tb2R1bGUgVG9vbHNQb3B1cCB7XHJcblx0aW1wb3J0IFdpbmRvd3MgPSBSZXNpemVyQVBJLkNocm9tZS5XaW5kb3dzO1xyXG5cdGltcG9ydCBUYWJzID0gUmVzaXplckFQSS5DaHJvbWUuVGFicztcclxuXHJcblx0bGV0IF9JRCA9IG51bGw7XHJcblxyXG5cdGV4cG9ydCBmdW5jdGlvbiBJRCgpIHtcclxuXHRcdHJldHVybiBfSUQ7XHJcblx0fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gT3BlbigpOiBQcm9taXNlPGNocm9tZS53aW5kb3dzLldpbmRvdz4ge1xyXG5cdFx0bGV0IGNvbmZpZyA9IHtcclxuXHRcdFx0dXJsICAgIDogJ3ZpZXdzL3BvcHVwLmh0bWwjcG9wdXAtdmlldycsXHJcblx0XHRcdHR5cGUgICA6ICdwb3B1cCcsXHJcblx0XHRcdHdpZHRoICA6IDM2MCxcclxuXHRcdFx0aGVpZ2h0IDogNDIwXHJcblx0XHR9O1xyXG5cclxuXHRcdHJldHVybiBXaW5kb3dzLkNyZWF0ZShjb25maWcpLnRoZW4od2luID0+IHtcclxuXHRcdFx0X0lEID0gd2luLmlkO1xyXG5cdFx0XHRXaW5kb3dzLk9uKCdSZW1vdmVkJywgX09uQ2xvc2UpO1xyXG5cclxuXHRcdFx0cmV0dXJuIHdpbjtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIEZvY3VzKCk6IFByb21pc2U8Y2hyb21lLndpbmRvd3MuV2luZG93PiB7XHJcblx0XHRyZXR1cm4gV2luZG93cy5VcGRhdGUoX0lELCB7Zm9jdXNlZDogdHJ1ZX0pO1xyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIEJsdXIoKTogUHJvbWlzZTxjaHJvbWUud2luZG93cy5XaW5kb3c+IHtcclxuXHRcdHJldHVybiBXaW5kb3dzLlVwZGF0ZShfSUQsIHtmb2N1c2VkOiBmYWxzZX0pO1xyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIEF0dGFjaFRvKG1haW5XaW5kb3c6IGNocm9tZS53aW5kb3dzLldpbmRvdyk6IFByb21pc2U8Y2hyb21lLndpbmRvd3MuV2luZG93PiB7XHJcblx0XHRsZXQgZm9jdXNQb3B1cCAgPSBfSUQgPyBGb2N1cygpIDogT3BlbigpO1xyXG5cdFx0bGV0IG5ld1Bvc2l0aW9uID0ge1xyXG5cdFx0XHR0b3A6IG1haW5XaW5kb3cudG9wLFxyXG5cdFx0XHRsZWZ0OiBtYWluV2luZG93LmxlZnQgKyBtYWluV2luZG93LndpZHRoXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGZvY3VzUG9wdXAudGhlbih3aW4gPT4gV2luZG93cy5VcGRhdGUod2luLmlkLCBuZXdQb3NpdGlvbikpO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gX09uQ2xvc2Uod2luSWQpIHtcclxuXHRcdGlmICh3aW5JZCA9PT0gX0lEKSB7XHJcblx0XHRcdF9JRCA9IG51bGw7XHJcblx0XHRcdFdpbmRvd3MuT2ZmKCdSZW1vdmVkJywgX09uQ2xvc2UpO1xyXG5cdFx0fVxyXG5cdH1cclxufSIsIm1vZHVsZSBDb3JlLlV0aWxzIHtcclxuXHRleHBvcnQgY2xhc3MgVW5pcXVlU3RhY2sge1xyXG5cdFx0cHJpdmF0ZSBfdmFsdWVzID0gW107XHJcblxyXG5cdFx0cHVibGljIGFwcGVuZCh2YWx1ZSkge1xyXG5cdFx0XHR0aGlzLnJlbW92ZSh2YWx1ZSk7XHJcblx0XHRcdHRoaXMuX3ZhbHVlcy5wdXNoKHZhbHVlKTtcclxuXHRcdH1cclxuXHJcblx0XHRwdWJsaWMgcmVtb3ZlKHZhbHVlKSB7XHJcblx0XHRcdGxldCBleGlzdGluZyA9IHRoaXMuX3ZhbHVlcy5pbmRleE9mKHZhbHVlKTtcclxuXHRcdFx0KGV4aXN0aW5nID4gLTEpICYmIHRoaXMuX3ZhbHVlcy5zcGxpY2UoZXhpc3RpbmcsIDEpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHB1YmxpYyBjdXJyZW50KCkge1xyXG5cdFx0XHRsZXQgbGFzdCA9IHRoaXMuX3ZhbHVlcy5sZW5ndGggLSAxO1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5fdmFsdWVzW2xhc3RdO1xyXG5cdFx0fVxyXG5cdH1cclxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi9Db3JlL1V0aWxzL1VuaXF1ZVN0YWNrLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL1Jlc2l6ZXJBUEkvQ2hyb21lL1dpbmRvd3MudHNcIiAvPlxyXG5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vVG9vbHNQb3B1cC50c1wiIC8+XHJcblxyXG5tb2R1bGUgV2luZG93c1N0YWNrIHtcclxuXHRpbXBvcnQgV2luZG93cyA9IFJlc2l6ZXJBUEkuQ2hyb21lLldpbmRvd3M7XHJcblxyXG5cdGxldCB3aW5TdGFjayA9IG5ldyBDb3JlLlV0aWxzLlVuaXF1ZVN0YWNrKCk7XHJcblxyXG5cdGV4cG9ydCBmdW5jdGlvbiBDdXJyZW50KCkge1xyXG5cdFx0cmV0dXJuIHdpblN0YWNrLmN1cnJlbnQoKTtcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBmdW5jdGlvbiBBcHBlbmQod2luSWQpIHtcclxuXHRcdHJldHVybiB3aW5TdGFjay5hcHBlbmQod2luSWQpO1xyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIFJlbW92ZSh3aW5JZCkge1xyXG5cdFx0cmV0dXJuIHdpblN0YWNrLnJlbW92ZSh3aW5JZCk7XHJcblx0fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gSW5pdCgpIHtcclxuXHRcdFdpbmRvd3MuT24oJ0ZvY3VzQ2hhbmdlZCcsIHdpbklkID0+IHtcclxuXHRcdFx0aWYgKHdpbklkID09PSBXaW5kb3dzLk5PTkUgfHwgd2luSWQgPT09IFRvb2xzUG9wdXAuSUQoKSkge1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0d2luU3RhY2suYXBwZW5kKHdpbklkKTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdFdpbmRvd3MuT24oJ1JlbW92ZWQnLCB3aW5JZCA9PiB7XHJcblx0XHRcdHdpblN0YWNrLnJlbW92ZSh3aW5JZCk7XHJcblx0XHR9KTtcclxuXHJcblx0XHRXaW5kb3dzLkFsbCgpLnRoZW4od2luZG93cyA9PiB7XHJcblx0XHRcdGxldCBmb2N1c2VkID0gMDtcclxuXHJcblx0XHRcdGZvciAobGV0IHdpbiBvZiB3aW5kb3dzKSB7XHJcblx0XHRcdFx0d2luLmZvY3VzZWQgJiYgKGZvY3VzZWQgPSB3aW4uaWQpO1xyXG5cdFx0XHRcdHdpblN0YWNrLmFwcGVuZCh3aW4uaWQpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmb2N1c2VkICYmIHdpblN0YWNrLmFwcGVuZChmb2N1c2VkKTtcclxuXHRcdH0pO1xyXG5cdH1cclxufSIsIm1vZHVsZSBDb3JlLlV0aWxzIHtcblx0ZXhwb3J0IGZ1bmN0aW9uIElzQmV0YSgpOiBib29sZWFuIHtcblx0XHRjb25zdCBtYW5pZmVzdDogYW55ID0gY2hyb21lLnJ1bnRpbWUuZ2V0TWFuaWZlc3QoKTtcblx0XHRjb25zdCBpc0JldGE6IGJvb2xlYW4gPSBCb29sZWFuKG1hbmlmZXN0LnZlcnNpb25fbmFtZS5tYXRjaCgvYmV0YS9pKSk7XG5cblx0XHRyZXR1cm4gaXNCZXRhO1xuXHR9XG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL0NvcmUvVXRpbHMvUmVxdWVzdC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi9Db3JlL1V0aWxzL1V0aWxzLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL1Jlc2l6ZXJBUEkvU2V0dGluZ3MudHNcIiAvPlxyXG5cclxubW9kdWxlIEJhbm5lciB7XHJcblx0aW1wb3J0IFNldHRpbmdzID0gUmVzaXplckFQSS5TZXR0aW5ncztcclxuXHRpbXBvcnQgUmVxdWVzdCA9IENvcmUuVXRpbHMuUmVxdWVzdDtcclxuXHRpbXBvcnQgVXRpbHMgPSBDb3JlLlV0aWxzO1xyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gR2V0KGlkPzogbnVtYmVyKTogUHJvbWlzZTxhbnk+IHtcclxuXHRcdGxldCBsaWNlbnNlO1xyXG5cdFx0cmV0dXJuIFNldHRpbmdzLkdldCgnbGljZW5zZScsIGZhbHNlKS50aGVuKGRldGFpbHMgPT4ge1xyXG5cdFx0XHRsaWNlbnNlID0gZGV0YWlscztcclxuXHRcdFx0cmV0dXJuIFNldHRpbmdzLkdldCgnYmFubmVySGlkZGVuJywgbnVsbCwgdHJ1ZSk7XHJcblx0XHR9KS50aGVuKGhpZGRlbiA9PiB7XHJcblx0XHRcdGxldCB0aW1lc3RhbXAgPSBoaWRkZW4gPyAobmV3IERhdGUoaGlkZGVuKSkuZ2V0VGltZSgpIDogMDtcclxuXHRcdFx0bGV0IHN0YXlIaWRkZW4gPSAyICogMjQgKiAzNjAwICogMTAwMDsgLy8gZXZlcnkgMiBkYXlzXHJcblxyXG5cdFx0XHQvLyBvbmx5IHNob3cgdGhlIGJhbm5lciBvbmNlIGEgd2VlayBmb3Igbm9uLVBybyBhbmQgbm9uLUJldGEgdXNlcnNcclxuXHRcdFx0aWYgKGxpY2Vuc2UgfHwgVXRpbHMuSXNCZXRhKCkgfHwgdGltZXN0YW1wICsgc3RheUhpZGRlbiA+IERhdGUubm93KCkpIHtcclxuXHRcdFx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gUmVxdWVzdC5HZXRKU09OKCdhc3NldHMvYWZmaWxpYXRlcy9iYW5uZXJzLmpzb24nKS50aGVuKChiYW5uZXJzOiBhbnlbXSkgPT4ge1xyXG5cdFx0XHRcdGJhbm5lcnMgPSBiYW5uZXJzLmZpbHRlcihiYW5uZXIgPT4gYmFubmVyLmVuYWJsZWQpO1xyXG5cclxuXHRcdFx0XHRpZiAoaWQgPT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdFx0aWQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBiYW5uZXJzLmxlbmd0aCk7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGJhbm5lcnNbaWRdKTtcclxuXHRcdFx0fSlcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIFN0YXR1cygpOiBQcm9taXNlPGFueT4ge1xyXG5cdFx0cmV0dXJuIFNldHRpbmdzLkdldCgnYmFubmVySGlkZGVuJywgbnVsbCwgdHJ1ZSk7XHJcblx0fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gSGlkZSgpOiBQcm9taXNlPGFueT4ge1xyXG5cdFx0cmV0dXJuIFNldHRpbmdzLkdldCgnYmFubmVySGlkZGVuJywgbnVsbCwgdHJ1ZSkudGhlbihoaWRkZW4gPT4ge1xyXG5cdFx0XHRTZXR0aW5ncy5TZXQoJ2Jhbm5lckhpZGRlbicsIF90b2RheSgpLCB0cnVlKTtcclxuXHRcdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZSghaGlkZGVuKTtcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfdG9kYXkoKTogc3RyaW5nIHtcclxuXHRcdGxldCBkYXRlID0gbmV3IERhdGUoKTtcclxuXHJcblx0XHRyZXR1cm4gZGF0ZS5nZXRGdWxsWWVhcigpICsgJy0nICsgKGRhdGUuZ2V0TW9udGgoKSArIDEpICsgJy0nICsgZGF0ZS5nZXREYXRlKCk7XHJcblx0fVxyXG59XHJcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi9SZXNpemVyQVBJL1NldHRpbmdzLnRzXCIgLz5cclxuXHJcbm1vZHVsZSBDeWNsZVByZXNldHMge1xyXG5cdGltcG9ydCBTZXR0aW5ncyA9IFJlc2l6ZXJBUEkuU2V0dGluZ3M7XHJcblxyXG5cdGxldCBwcmV2aW91cyA9IC0xO1xyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gR2V0TmV4dCgpOiBQcm9taXNlPGFueT4ge1xyXG5cdFx0cmV0dXJuIF9nZXRQcmVzZXQoMSk7XHJcblx0fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gR2V0UHJldigpOiBQcm9taXNlPGFueT4ge1xyXG5cdFx0cmV0dXJuIF9nZXRQcmVzZXQoLTEpO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gX2dldFByZXNldChkaXJlY3Rpb246IG51bWJlcik6IFByb21pc2U8YW55PiB7XHJcblx0XHRyZXR1cm4gU2V0dGluZ3MuR2V0KCdwcmVzZXRzJykudGhlbihwcmVzZXRzID0+IHtcclxuXHRcdFx0cHJldmlvdXMgPSAocHJldmlvdXMgKyBkaXJlY3Rpb24gKyBwcmVzZXRzLmxlbmd0aCkgJSBwcmVzZXRzLmxlbmd0aDtcclxuXHRcdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZShwcmVzZXRzW3ByZXZpb3VzXSk7XHJcblx0XHR9KVxyXG5cdH1cclxufSIsIlxyXG5tb2R1bGUgVXBkYXRlciB7XHJcblx0aW1wb3J0IFJ1bnRpbWUgID0gUmVzaXplckFQSS5DaHJvbWUuUnVudGltZTtcclxuXHRpbXBvcnQgU2V0dGluZ3MgPSBSZXNpemVyQVBJLlNldHRpbmdzO1xyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gSW5pdCgpIHtcclxuXHRcdGNocm9tZS5ydW50aW1lLnNldFVuaW5zdGFsbFVSTCgnaHR0cDovL2Nvb2x4MTAuY29tL3dpbmRvdy1yZXNpemVyL2dvb2QtYnllLnBocCcpO1xyXG5cclxuXHRcdFJ1bnRpbWUuT24oJ0luc3RhbGxlZCcsIGRldGFpbHMgPT4ge1xyXG5cdFx0XHRTZXR0aW5ncy5HZXQoJ29yaWdpbmFsSW5zdGFsbERhdGUnKS50aGVuKG9yaWdpbmFsSW5zdGFsbERhdGUgPT4ge1xyXG5cdFx0XHRcdGlmICghb3JpZ2luYWxJbnN0YWxsRGF0ZSkge1xyXG5cdFx0XHRcdFx0U2V0dGluZ3MuU2V0KCdvcmlnaW5hbEluc3RhbGxEYXRlJywgRGF0ZS5ub3coKSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVxyXG5cclxuXHRcdFx0c3dpdGNoIChkZXRhaWxzLnJlYXNvbikge1xyXG5cdFx0XHRcdGNhc2UgJ2luc3RhbGwnOlxyXG5cdFx0XHRcdFx0U2V0dGluZ3MuR2V0KCdwcmVzZXRzJykudGhlbihwcmVzZXRzID0+IHtcclxuXHRcdFx0XHRcdFx0IXByZXNldHMgJiYgQmFja2dyb3VuZC5TYXZlU2V0dGluZ3MoU2V0dGluZ3MuRGVmYXVsdFNldHRpbmdzKTtcclxuXHRcdFx0XHRcdH0pXHJcblxyXG5cdFx0XHRcdFx0Y2hyb21lLnRhYnMuY3JlYXRlKHtcclxuXHRcdFx0XHRcdFx0dXJsOiAnaHR0cDovL2Nvb2x4MTAuY29tL3dpbmRvdy1yZXNpemVyL3dlbGNvbWUucGhwJyxcclxuXHRcdFx0XHRcdFx0YWN0aXZlOiB0cnVlXHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHRicmVhaztcclxuXHJcblx0XHRcdFx0Y2FzZSAndXBkYXRlJzpcclxuXHRcdFx0XHRcdGxldCBwcmV2aW91c1ZlcnNpb24gPSBwYXJzZUludChkZXRhaWxzLnByZXZpb3VzVmVyc2lvbik7XHJcblxyXG5cdFx0XHRcdFx0aWYgKGRldGFpbHMucHJldmlvdXNWZXJzaW9uLm1hdGNoKC9eMlxcLjYvKSkge1xyXG5cdFx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRpZiAocHJldmlvdXNWZXJzaW9uID09IDEpIHtcclxuXHRcdFx0XHRcdFx0Ly8gaW1wb3J0IHNldHRpbmdzIGZyb20gMS54LnggdmVyc2lvbnNcclxuXHRcdFx0XHRcdFx0bGV0IG9sZFNldHRpbmdzID0gU2V0dGluZ3MuUGFyc2VWMSh3aW5kb3cubG9jYWxTdG9yYWdlKTtcclxuXHRcdFx0XHRcdFx0QmFja2dyb3VuZC5TYXZlU2V0dGluZ3Mob2xkU2V0dGluZ3MpO1xyXG5cdFx0XHRcdFx0XHR3aW5kb3cubG9jYWxTdG9yYWdlLmNsZWFyKCk7XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0U2V0dGluZ3MuR2V0KHsndXNlTW9ub2Nocm9tZUljb24nOiBudWxsfSkudGhlbihvbGQgPT4ge1xyXG5cdFx0XHRcdFx0XHRpZiAob2xkLnVzZU1vbm9jaHJvbWVJY29uICE9PSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdFx0U2V0dGluZ3MuRGVsKCd1c2VNb25vY2hyb21lSWNvbicpO1xyXG5cdFx0XHRcdFx0XHRcdFNldHRpbmdzLlNldCgncG9wdXBJY29uU3R5bGUnLCAwKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSlcclxuXHJcblx0XHRcdFx0XHR3aW5kb3cubG9jYWxTdG9yYWdlWyd3YXNVcGRhdGVkJ10gPSBwcmV2aW91c1ZlcnNpb247XHJcblx0XHRcdFx0XHRTaG93QmFkZ2UoKTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0fVxyXG5cdFx0fSlcclxuXHJcblx0XHRpZiAod2luZG93LmxvY2FsU3RvcmFnZVsnd2FzVXBkYXRlZCddKSB7XHJcblx0XHRcdFNob3dCYWRnZSgpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIFNob3dCYWRnZSgpIHtcclxuXHRcdGNocm9tZS5icm93c2VyQWN0aW9uLnNldEJhZGdlVGV4dCh7dGV4dCA6ICduZXcnfSk7XHJcblx0XHRjaHJvbWUuYnJvd3NlckFjdGlvbi5zZXRCYWRnZUJhY2tncm91bmRDb2xvcih7Y29sb3IgOiAnIzc3YzM1YSd9KTtcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBmdW5jdGlvbiBIaWRlQmFkZ2UoKSB7XHJcblx0XHRjaHJvbWUuYnJvd3NlckFjdGlvbi5zZXRCYWRnZVRleHQoe3RleHQgOiAnJ30pO1xyXG5cdH1cclxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi90eXBpbmdzL0V4dEFQSS5kLnRzXCIgLz5cclxuXHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9Db3JlL1V0aWxzL0VudW1zLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL0NvcmUvVXRpbHMvVVVJRC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9Db3JlL1V0aWxzL1JlcXVlc3QudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vUmVzaXplckFQSS9Ub29sdGlwLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL1Jlc2l6ZXJBUEkvU2V0dGluZ3MudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vUmVzaXplckFQSS9TZXR0aW5nc1BhZ2UudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vUmVzaXplckFQSS9DaHJvbWUvV2luZG93cy50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9SZXNpemVyQVBJL0Nocm9tZS9UYWJzLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL1Jlc2l6ZXJBUEkvQ2hyb21lL1J1bnRpbWUudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vUmVzaXplckFQSS9DaHJvbWUvQ29udGV4dE1lbnVzLnRzXCIgLz5cclxuXHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2JhY2tncm91bmQvVG9vbHNQb3B1cC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2JhY2tncm91bmQvV2luZG93c1N0YWNrLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vYmFja2dyb3VuZC9CYW5uZXIudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9iYWNrZ3JvdW5kL0N5Y2xlUHJlc2V0cy50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2JhY2tncm91bmQvVXBkYXRlci50c1wiIC8+XHJcblxyXG5tb2R1bGUgQmFja2dyb3VuZCB7XHJcblx0aW1wb3J0IEVuZHBvaW50VmlzaWJpbGl0eSA9IEV4dEFQSS5Sb3V0ZXIuRW5kcG9pbnRWaXNpYmlsaXR5O1xyXG5cdGltcG9ydCBQcmVzZXRUeXBlICAgICAgICAgPSBDb3JlLlByZXNldFR5cGU7XHJcblx0aW1wb3J0IFByZXNldFRhcmdldCAgICAgICA9IENvcmUuUHJlc2V0VGFyZ2V0O1xyXG5cdGltcG9ydCBQcmVzZXRQb3NpdGlvbiAgICAgPSBDb3JlLlByZXNldFBvc2l0aW9uO1xyXG5cclxuXHRpbXBvcnQgVG9vbHRpcCAgICAgID0gUmVzaXplckFQSS5Ub29sdGlwO1xyXG5cdGltcG9ydCBXaW5kb3dzICAgICAgPSBSZXNpemVyQVBJLkNocm9tZS5XaW5kb3dzO1xyXG5cdGltcG9ydCBUYWJzICAgICAgICAgPSBSZXNpemVyQVBJLkNocm9tZS5UYWJzO1xyXG5cdGltcG9ydCBSdW50aW1lICAgICAgPSBSZXNpemVyQVBJLkNocm9tZS5SdW50aW1lO1xyXG5cdGltcG9ydCBDb250ZXh0TWVudXMgPSBSZXNpemVyQVBJLkNocm9tZS5Db250ZXh0TWVudXM7XHJcblx0aW1wb3J0IFNldHRpbmdzICAgICA9IFJlc2l6ZXJBUEkuU2V0dGluZ3M7XHJcblx0aW1wb3J0IFNldHRpbmdzUGFnZSA9IFJlc2l6ZXJBUEkuU2V0dGluZ3NQYWdlO1xyXG5cclxuXHRpbXBvcnQgUmVxdWVzdCAgICAgID0gQ29yZS5VdGlscy5SZXF1ZXN0O1xyXG5cclxuXHRFeHRBUEkuaW5pdCgpO1xyXG5cclxuXHRFeHRBUEkucmVnaXN0ZXIoe1xyXG5cdFx0YWN0aW9uOiAncmVzaXplJyxcclxuXHRcdHZpc2liaWxpdHk6IEVuZHBvaW50VmlzaWJpbGl0eS5QdWJsaWMsXHJcblx0XHRoYW5kbGVyOiBSZXNpemVcclxuXHR9KVxyXG5cclxuXHRFeHRBUEkucmVnaXN0ZXIoe1xyXG5cdFx0YWN0aW9uOiAnb3Blbi11cmwnLFxyXG5cdFx0dmlzaWJpbGl0eTogRW5kcG9pbnRWaXNpYmlsaXR5LlByaXZhdGUsXHJcblx0XHRoYW5kbGVyOiBPcGVuVXJsXHJcblx0fSlcclxuXHJcblx0RXh0QVBJLnJlZ2lzdGVyKHtcclxuXHRcdGFjdGlvbjogJ29wZW4tYXMtcG9wdXAnLFxyXG5cdFx0dmlzaWJpbGl0eTogRW5kcG9pbnRWaXNpYmlsaXR5LlByaXZhdGUsXHJcblx0XHRoYW5kbGVyOiBPcGVuQXNQb3B1cFxyXG5cdH0pXHJcblxyXG5cdEV4dEFQSS5yZWdpc3Rlcih7XHJcblx0XHRhY3Rpb246ICdnZXQtYmFubmVyJyxcclxuXHRcdHZpc2liaWxpdHk6IEVuZHBvaW50VmlzaWJpbGl0eS5Qcml2YXRlLFxyXG5cdFx0aGFuZGxlcjogQmFubmVyLkdldFxyXG5cdH0pXHJcblxyXG5cdEV4dEFQSS5yZWdpc3Rlcih7XHJcblx0XHRhY3Rpb246ICdoaWRlLWJhbm5lcicsXHJcblx0XHR2aXNpYmlsaXR5OiBFbmRwb2ludFZpc2liaWxpdHkuUHJpdmF0ZSxcclxuXHRcdGhhbmRsZXI6IEJhbm5lci5IaWRlXHJcblx0fSlcclxuXHJcblx0RXh0QVBJLnJlZ2lzdGVyKHtcclxuXHRcdGFjdGlvbjogJ2dldC1iYW5uZXItc3RhdHVzJyxcclxuXHRcdHZpc2liaWxpdHk6IEVuZHBvaW50VmlzaWJpbGl0eS5Qcml2YXRlLFxyXG5cdFx0aGFuZGxlcjogQmFubmVyLlN0YXR1c1xyXG5cdH0pXHJcblxyXG5cdEV4dEFQSS5yZWdpc3Rlcih7XHJcblx0XHRhY3Rpb246ICdyb3RhdGUtdmlld3BvcnQnLFxyXG5cdFx0dmlzaWJpbGl0eTogRW5kcG9pbnRWaXNpYmlsaXR5LlByaXZhdGUsXHJcblx0XHRoYW5kbGVyOiBSb3RhdGVWaWV3cG9ydFxyXG5cdH0pXHJcblxyXG5cdEV4dEFQSS5yZWdpc3Rlcih7XHJcblx0XHRhY3Rpb246ICdvcGVuLXNldHRpbmdzJyxcclxuXHRcdHZpc2liaWxpdHk6IEVuZHBvaW50VmlzaWJpbGl0eS5Qcml2YXRlLFxyXG5cdFx0aGFuZGxlcjogT3BlblNldHRpbmdzXHJcblx0fSlcclxuXHJcblx0RXh0QVBJLnJlZ2lzdGVyKHtcclxuXHRcdGFjdGlvbjogJ29wZW4tcHJlc2V0cy1zZXR0aW5ncycsXHJcblx0XHR2aXNpYmlsaXR5OiBFbmRwb2ludFZpc2liaWxpdHkuUHJpdmF0ZSxcclxuXHRcdGhhbmRsZXI6IE9wZW5QcmVzZXRzU2V0dGluZ3NcclxuXHR9KVxyXG5cclxuXHRFeHRBUEkucmVnaXN0ZXIoe1xyXG5cdFx0YWN0aW9uOiAnb3Blbi1yZWxlYXNlLW5vdGVzJyxcclxuXHRcdHZpc2liaWxpdHk6IEVuZHBvaW50VmlzaWJpbGl0eS5Qcml2YXRlLFxyXG5cdFx0aGFuZGxlcjogT3BlblJlbGVhc2VOb3Rlc1xyXG5cdH0pXHJcblxyXG5cdEV4dEFQSS5yZWdpc3Rlcih7XHJcblx0XHRhY3Rpb246ICdvcGVuLXByby1wYWdlJyxcclxuXHRcdHZpc2liaWxpdHk6IEVuZHBvaW50VmlzaWJpbGl0eS5Qcml2YXRlLFxyXG5cdFx0aGFuZGxlcjogT3BlblByb1BhZ2VcclxuXHR9KVxyXG5cclxuXHRFeHRBUEkucmVnaXN0ZXIoe1xyXG5cdFx0YWN0aW9uOiAndG9nZ2xlLXRvb2x0aXAnLFxyXG5cdFx0dmlzaWJpbGl0eTogRW5kcG9pbnRWaXNpYmlsaXR5LlByaXZhdGUsXHJcblx0XHRoYW5kbGVyOiBUb2dnbGVUb29sdGlwXHJcblx0fSlcclxuXHJcblx0RXh0QVBJLnJlZ2lzdGVyKHtcclxuXHRcdGFjdGlvbjogJ3Rvb2x0aXAtaGlkZS1kZWxheScsXHJcblx0XHR2aXNpYmlsaXR5OiBFbmRwb2ludFZpc2liaWxpdHkuUHJpdmF0ZSxcclxuXHRcdGhhbmRsZXI6IEdldFRvb2x0aXBIaWRlRGVsYXlcclxuXHR9KVxyXG5cclxuXHRFeHRBUEkucmVnaXN0ZXIoe1xyXG5cdFx0YWN0aW9uOiAndG9vbHRpcC1wb3NpdGlvbicsXHJcblx0XHR2aXNpYmlsaXR5OiBFbmRwb2ludFZpc2liaWxpdHkuUHJpdmF0ZSxcclxuXHRcdGhhbmRsZXI6IEdldFRvb2x0aXBQb3NpdGlvblxyXG5cdH0pXHJcblxyXG5cdEV4dEFQSS5yZWdpc3Rlcih7XHJcblx0XHRhY3Rpb246ICdnZXQtem9vbScsXHJcblx0XHR2aXNpYmlsaXR5OiBFbmRwb2ludFZpc2liaWxpdHkuUHJpdmF0ZSxcclxuXHRcdGhhbmRsZXI6IEdldFpvb21cclxuXHR9KVxyXG5cclxuXHRFeHRBUEkucmVnaXN0ZXIoe1xyXG5cdFx0YWN0aW9uOiAnbGltaXQtcG9wdXAnLFxyXG5cdFx0dmlzaWJpbGl0eTogRW5kcG9pbnRWaXNpYmlsaXR5LlByaXZhdGUsXHJcblx0XHRoYW5kbGVyOiBMaW1pdFBvcHVwXHJcblx0fSlcclxuXHJcblx0RXh0QVBJLnJlZ2lzdGVyKHtcclxuXHRcdGFjdGlvbjogJ2dldC1wcmVzZXRzJyxcclxuXHRcdHZpc2liaWxpdHk6IEVuZHBvaW50VmlzaWJpbGl0eS5Qcml2YXRlLFxyXG5cdFx0aGFuZGxlcjogR2V0UHJlc2V0c1xyXG5cdH0pXHJcblxyXG5cdEV4dEFQSS5yZWdpc3Rlcih7XHJcblx0XHRhY3Rpb246ICdzYXZlLXByZXNldCcsXHJcblx0XHR2aXNpYmlsaXR5OiBFbmRwb2ludFZpc2liaWxpdHkuUHJpdmF0ZSxcclxuXHRcdGhhbmRsZXI6IFNhdmVQcmVzZXRcclxuXHR9KVxyXG5cclxuXHRFeHRBUEkucmVnaXN0ZXIoe1xyXG5cdFx0YWN0aW9uOiAnZ2V0LXN5bmMtc3RhdHVzJyxcclxuXHRcdHZpc2liaWxpdHk6IEVuZHBvaW50VmlzaWJpbGl0eS5Qcml2YXRlLFxyXG5cdFx0aGFuZGxlcjogR2V0U3luY1N0YXR1c1xyXG5cdH0pXHJcblxyXG5cdEV4dEFQSS5yZWdpc3Rlcih7XHJcblx0XHRhY3Rpb246ICd0b2dnbGUtc3luYycsXHJcblx0XHR2aXNpYmlsaXR5OiBFbmRwb2ludFZpc2liaWxpdHkuUHJpdmF0ZSxcclxuXHRcdGhhbmRsZXI6IFRvZ2dsZVN5bmNcclxuXHR9KVxyXG5cclxuXHRFeHRBUEkucmVnaXN0ZXIoe1xyXG5cdFx0YWN0aW9uOiAnZGVmYXVsdC1zZXR0aW5ncycsXHJcblx0XHR2aXNpYmlsaXR5OiBFbmRwb2ludFZpc2liaWxpdHkuUHJpdmF0ZSxcclxuXHRcdGhhbmRsZXI6IEdldERlZmF1bHRTZXR0aW5nc1xyXG5cdH0pXHJcblxyXG5cdEV4dEFQSS5yZWdpc3Rlcih7XHJcblx0XHRhY3Rpb246ICdnZXQtc2V0dGluZ3MnLFxyXG5cdFx0dmlzaWJpbGl0eTogRW5kcG9pbnRWaXNpYmlsaXR5LlByaXZhdGUsXHJcblx0XHRoYW5kbGVyOiBHZXRTZXR0aW5nc1xyXG5cdH0pXHJcblxyXG5cdEV4dEFQSS5yZWdpc3Rlcih7XHJcblx0XHRhY3Rpb246ICdzYXZlLXNldHRpbmdzJyxcclxuXHRcdHZpc2liaWxpdHk6IEVuZHBvaW50VmlzaWJpbGl0eS5Qcml2YXRlLFxyXG5cdFx0aGFuZGxlcjogU2F2ZVNldHRpbmdzXHJcblx0fSlcclxuXHJcblx0RXh0QVBJLnJlZ2lzdGVyKHtcclxuXHRcdGFjdGlvbjogJ2ltcG9ydC1zZXR0aW5ncycsXHJcblx0XHR2aXNpYmlsaXR5OiBFbmRwb2ludFZpc2liaWxpdHkuUHJpdmF0ZSxcclxuXHRcdGhhbmRsZXI6IEltcG9ydFNldHRpbmdzXHJcblx0fSlcclxuXHJcblx0RXh0QVBJLnJlZ2lzdGVyKHtcclxuXHRcdGFjdGlvbjogJ3NldHRpbmdzOnJlcXVlc3RlZC1wYWdlJyxcclxuXHRcdHZpc2liaWxpdHk6IEVuZHBvaW50VmlzaWJpbGl0eS5Qcml2YXRlLFxyXG5cdFx0aGFuZGxlcjogU2V0dGluZ3NHZXRSZXF1ZXN0ZWRQYWdlXHJcblx0fSlcclxuXHJcblx0RXh0QVBJLnJlZ2lzdGVyKHtcclxuXHRcdGFjdGlvbjogJ3BybzpjaGVja291dC11cmwnLFxyXG5cdFx0dmlzaWJpbGl0eTogRW5kcG9pbnRWaXNpYmlsaXR5LlByaXZhdGUsXHJcblx0XHRoYW5kbGVyOiBQcm9DaGVja291dFVybFxyXG5cdH0pXHJcblxyXG5cdEV4dEFQSS5yZWdpc3Rlcih7XHJcblx0XHRhY3Rpb246ICdwcm86YWN0aXZhdGUtbGljZW5zZScsXHJcblx0XHR2aXNpYmlsaXR5OiBFbmRwb2ludFZpc2liaWxpdHkuUHJpdmF0ZSxcclxuXHRcdGhhbmRsZXI6IFByb0FjdGl2YXRlTGljZW5zZVxyXG5cdH0pXHJcblxyXG5cdEV4dEFQSS5yZWdpc3Rlcih7XHJcblx0XHRhY3Rpb246ICdfZGVidWcnLFxyXG5cdFx0dmlzaWJpbGl0eTogRW5kcG9pbnRWaXNpYmlsaXR5LlByaXZhdGUsXHJcblx0XHRoYW5kbGVyOiBfREVCVUdcclxuXHR9KVxyXG5cclxuXHJcblx0V2luZG93c1N0YWNrLkluaXQoKTtcclxuXHRVcGRhdGVyLkluaXQoKTtcclxuXHJcblx0ZnVuY3Rpb24gUHJvQ2hlY2tvdXRVcmwocGFyYW1zOiBhbnksIHNlbmRlcjogYW55KTogUHJvbWlzZTxhbnk+IHtcclxuXHRcdHJldHVybiBSZXF1ZXN0LlBvc3RKU09OKCdodHRwczovL2Nvb2x4MTAuY29tL3dpbmRvdy1yZXNpemVyL3Byby9jaGVja291dC11cmwnLCB7cHJpY2U6IHBhcmFtcy5wcmljZX0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gUHJvQWN0aXZhdGVMaWNlbnNlKHBhcmFtczogYW55LCBzZW5kZXI6IGFueSk6IFByb21pc2U8YW55PiB7XHJcblx0XHRyZXR1cm4gUmVxdWVzdC5Qb3N0SlNPTignaHR0cHM6Ly9jb29seDEwLmNvbS93aW5kb3ctcmVzaXplci9wcm8vYWN0aXZhdGUtbGljZW5zZScsIHtrZXk6IHBhcmFtcy5rZXl9KS50aGVuKHJlc3BvbnNlID0+IHtcclxuXHRcdFx0aWYgKCFyZXNwb25zZS5lcnJvcikge1xyXG5cdFx0XHRcdHJldHVybiBTYXZlU2V0dGluZ3Moe2xpY2Vuc2U6IHJlc3BvbnNlLmRhdGF9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc3BvbnNlKTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gX0RFQlVHKGRhdGE6IGFueSk6IFByb21pc2U8YW55PiB7XHJcblx0XHRjb25zb2xlLmxvZyhkYXRhKTtcclxuXHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUodHJ1ZSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBPcGVuVXJsKHBhcmFtczogYW55KTogUHJvbWlzZTxhbnk+IHtcclxuXHRcdHJldHVybiBUYWJzLkNyZWF0ZSh7dXJsOiBwYXJhbXMudXJsfSk7XHJcblx0fVxyXG5cclxuXHRjaHJvbWUuY29tbWFuZHMub25Db21tYW5kLmFkZExpc3RlbmVyKChjb21tYW5kOiBzdHJpbmcpID0+IHtcclxuXHRcdHN3aXRjaCAoY29tbWFuZCkge1xyXG5cdFx0XHRjYXNlICdhLW1hbnVhbC10b29sdGlwLXRvZ2dsZSc6XHJcblx0XHRcdFx0VG9nZ2xlVG9vbHRpcCgpLmNhdGNoKGVyciA9PiB7XHJcblx0XHRcdFx0XHRpZiAoZXJyLklOVkFMSURfUFJPVE9DT0wpIHtcclxuXHRcdFx0XHRcdFx0YWxlcnQoJ1RoaXMgZmVhdHVyZSBvbmx5IHdvcmtzIG9uIHBhZ2VzIGxvYWRlZCB1c2luZyBvbmUgb2YgdGhlIFwiaHR0cDovL1wiLCBcImh0dHBzOi8vXCIgb3IgXCJmaWxlOi8vXCIgcHJvdG9jb2xzIScpO1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdGlmIChlcnIuV0VCU1RPUkVfUEVSTUlTU0lPTikge1xyXG5cdFx0XHRcdFx0XHRhbGVydCgnVGhpcyBmZWF0dXJlIGRvZXNuXFwndCB3b3JrIG9uIHRoaXMgdGFiIGJlY2F1c2UgZXh0ZW5zaW9ucyBhcmUgbm90IGFsbG93ZWQgdG8gYWx0ZXIgdGhlIFdlYnN0b3JlIHBhZ2VzIScpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRicmVhaztcclxuXHJcblx0XHRcdGNhc2UgJ2Itcm90YXRlLXZpZXdwb3J0JzpcclxuXHRcdFx0XHRSb3RhdGVWaWV3cG9ydCgpO1xyXG5cdFx0XHRicmVhaztcclxuXHJcblx0XHRcdGNhc2UgJ2MtY3ljbGUtcHJlc2V0cyc6XHJcblx0XHRcdFx0Q3ljbGVQcmVzZXRzLkdldE5leHQoKS50aGVuKFJlc2l6ZSk7XHJcblx0XHRcdGJyZWFrO1xyXG5cclxuXHRcdFx0Y2FzZSAnZC1jeWNsZS1wcmVzZXRzLXJldmVyc2UnOlxyXG5cdFx0XHRcdEN5Y2xlUHJlc2V0cy5HZXRQcmV2KCkudGhlbihSZXNpemUpO1xyXG5cdFx0XHRicmVhaztcclxuXHJcblx0XHRcdGRlZmF1bHQ6XHJcblx0XHRcdFx0bGV0IG1hdGNoID0gU3RyaW5nKGNvbW1hbmQpLm1hdGNoKC9wcmVzZXRzXFwtKFxcZCspLyk7XHJcblx0XHRcdFx0bGV0IGluZGV4ID0gbWF0Y2ggPyBwYXJzZUludChtYXRjaFsxXSwgMTApIC0gMSA6IC0xO1xyXG5cclxuXHRcdFx0XHQoaW5kZXggPiAtMSkgJiYgU2V0dGluZ3MuR2V0KCdwcmVzZXRzJykudGhlbihwcmVzZXRzID0+IHtcclxuXHRcdFx0XHRcdHByZXNldHNbaW5kZXhdICYmIFJlc2l6ZShwcmVzZXRzW2luZGV4XSk7XHJcblx0XHRcdFx0fSlcclxuXHRcdFx0YnJlYWs7XHJcblx0XHR9XHJcblx0fSlcclxuXHJcblx0V2luZG93cy5PbignRm9jdXNDaGFuZ2VkJywgd2luSWQgPT4ge1xyXG5cdFx0aWYgKHdpbklkICE9PSBXaW5kb3dzLk5PTkUpIHtcclxuXHRcdFx0V2luZG93cy5HZXQod2luSWQpLnRoZW4od2luID0+IHtcclxuXHRcdFx0XHRpZiAod2luLnR5cGUgPT0gJ3BvcHVwJyAmJiB3aW5JZCAhPT0gVG9vbHNQb3B1cC5JRCgpKSB7XHJcblx0XHRcdFx0XHRDb250ZXh0TWVudXMuQ3JlYXRlKHtpZDogJ2NvbnRleHQtbWVudS1pdGVtJywgY29udGV4dHM6IFsnYWxsJ10sIHRpdGxlOiAnU2hvdyB0aGUgcmVzaXplciB3aW5kb3cnfSkuY2F0Y2goX3NpbGVuY2UpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRDb250ZXh0TWVudXMuUmVtb3ZlKCdjb250ZXh0LW1lbnUtaXRlbScpLmNhdGNoKF9zaWxlbmNlKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdH0pO1xyXG5cclxuXHRDb250ZXh0TWVudXMuT24oJ0NsaWNrZWQnLCAoaW5mbywgdGFiKSA9PiB7XHJcblx0XHRXaW5kb3dzLkdldCh0YWIud2luZG93SWQpLnRoZW4oX2F0dGFjaFRvb2xzUG9wdXApO1xyXG5cdH0pO1xyXG5cclxuXHRmdW5jdGlvbiBPcGVuQXNQb3B1cChwYXJhbXM/OiBJUmVzaXplT3B0aW9ucyk6IFByb21pc2U8V2luZG93cy5JV2luZG93PiB7XHJcblx0XHRwYXJhbXMgPSBwYXJhbXMgfHwge1xyXG5cdFx0XHR3aWR0aDogODAwLFxyXG5cdFx0XHRoZWlnaHQ6IDQ4MCxcclxuXHRcdFx0dGFyZ2V0OiBQcmVzZXRUYXJnZXQuVklFV1BPUlQsXHJcblx0XHRcdHBvc2l0aW9uOiBQcmVzZXRQb3NpdGlvbi5DRU5URVJcclxuXHRcdH07XHJcblxyXG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuXHRcdFx0bGV0IGRldGFpbHM6IElXaW5kb3dEZXRhaWxzO1xyXG5cclxuXHRcdFx0X2dldERldGFpbHMoKVxyXG5cdFx0XHRcdC50aGVuKHByb3BzID0+IFByb21pc2UucmVzb2x2ZShkZXRhaWxzID0gcHJvcHMpKVxyXG5cdFx0XHRcdC50aGVuKHByb3BzID0+IFRhYnMuRHVwbGljYXRlKGRldGFpbHMudGFiSWQpKVxyXG5cdFx0XHRcdC50aGVuKHRhYiA9PiBXaW5kb3dzLkNyZWF0ZSh7dGFiSWQ6IGRldGFpbHMudGFiSWQsIHR5cGU6ICdwb3B1cCd9KSlcclxuXHRcdFx0XHQudGhlbih3aW4gPT4gUmVzaXplKHBhcmFtcykpXHJcblx0XHRcdFx0LnRoZW4od2luID0+IF9hdHRhY2hUb29sc1BvcHVwKHdpbikpXHJcblx0XHRcdFx0LnRoZW4ocmVzb2x2ZSlcclxuXHRcdFx0XHQuY2F0Y2goZXJyID0+IHtcclxuXHRcdFx0XHRcdHJlamVjdCgpO1xyXG5cdFx0XHRcdH0pXHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gX2F0dGFjaFRvb2xzUG9wdXAobWFpbldpbmRvdzogV2luZG93cy5JV2luZG93KTogUHJvbWlzZTxXaW5kb3dzLklXaW5kb3c+IHtcclxuXHRcdHJldHVybiBUb29sc1BvcHVwLkF0dGFjaFRvKG1haW5XaW5kb3cpLnRoZW4od2luID0+IHtcclxuXHRcdFx0V2luZG93c1N0YWNrLlJlbW92ZShUb29sc1BvcHVwLklEKCkpO1xyXG5cclxuXHRcdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZSh3aW4pO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBHZXRQcmVzZXRzKCk6IFByb21pc2U8YW55PiB7XHJcblx0XHRyZXR1cm4gU2V0dGluZ3MuR2V0KCdwcmVzZXRzJykudGhlbihwcmVzZXRzID0+IFByb21pc2UucmVzb2x2ZShwcmVzZXRzIHx8IFtdKSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBTYXZlUHJlc2V0KHByZXNldDogYW55KTogUHJvbWlzZTxhbnk+IHtcclxuXHRcdHJldHVybiBHZXRQcmVzZXRzKCkudGhlbihwcmVzZXRzID0+IHtcclxuXHRcdFx0bGV0IGV4aXN0aW5nID0gcHJlc2V0cy5maW5kSW5kZXgocCA9PiBwLmlkID09PSBwcmVzZXQuaWQpO1xyXG5cclxuXHRcdFx0aWYgKGV4aXN0aW5nID4gLTEpIHtcclxuXHRcdFx0XHRwcmVzZXRzW2V4aXN0aW5nXSA9IHByZXNldDtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRwcmVzZXRzLnVuc2hpZnQocHJlc2V0KTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIFNhdmVTZXR0aW5ncyh7cHJlc2V0czogcHJlc2V0c30pO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBHZXREZWZhdWx0U2V0dGluZ3MoKTogUHJvbWlzZTxhbnk+IHtcclxuXHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUoU2V0dGluZ3MuRGVmYXVsdFNldHRpbmdzKTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIEdldFNldHRpbmdzKGtleT86IHN0cmluZyk6IFByb21pc2U8YW55PiB7XHJcblx0XHRyZXR1cm4gU2V0dGluZ3MuR2V0KGtleSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBHZXRTeW5jU3RhdHVzKCkge1xyXG5cdFx0cmV0dXJuIFNldHRpbmdzLkdldCgnZGlzYWJsZVN5bmMnLCBmYWxzZSwgdHJ1ZSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBUb2dnbGVTeW5jKHN0YXR1cykge1xyXG5cdFx0cmV0dXJuIFNldHRpbmdzLlNldCgnZGlzYWJsZVN5bmMnLCBzdGF0dXMsIHRydWUpO1xyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIFNhdmVTZXR0aW5ncyhkYXRhOiBTZXR0aW5ncy5JS2V5cyk6IFByb21pc2U8YW55PiB7XHJcblx0XHRSdW50aW1lLkJyb2FkY2FzdCh7VXBkYXRlZFNldHRpbmdzOiBkYXRhfSkuY2F0Y2goX3NpbGVuY2UpO1xyXG5cclxuXHRcdGlmICgncG9wdXBJY29uU3R5bGUnIGluIGRhdGEpIHtcclxuXHRcdFx0c2V0SWNvblR5cGUoZGF0YS5wb3B1cEljb25TdHlsZSk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKCdoaWRlVG9vbHRpcERlbGF5JyBpbiBkYXRhKSB7XHJcblx0XHRcdFRhYnMuUXVlcnkoKS50aGVuKHRhYnMgPT4ge1xyXG5cdFx0XHRcdHRhYnMuZm9yRWFjaCh0YWIgPT4gVG9vbHRpcC5TZXRUaW1lb3V0KHRhYi5pZCwgZGF0YS5oaWRlVG9vbHRpcERlbGF5KSk7XHJcblx0XHRcdH0pXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKCdhbHdheXNTaG93VGhlVG9vbHRpcCcgaW4gZGF0YSkge1xyXG5cdFx0XHRpZiAoZGF0YS5hbHdheXNTaG93VGhlVG9vbHRpcCkge1xyXG5cdFx0XHRcdFRvb2x0aXAuRW5hYmxlT25BbGxQYWdlcygpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFRvb2x0aXAuRGlzYWJsZU9uQWxsUGFnZXMoKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBTZXR0aW5ncy5TZXQoZGF0YSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBJbXBvcnRTZXR0aW5ncyhkYXRhOiBhbnkpOiBQcm9taXNlPGFueT4ge1xyXG5cdFx0bGV0IHNldHRpbmdzOiBhbnkgPSB7fTtcclxuXHJcblx0XHRpZiAoJ3NldHRpbmdzJyBpbiBkYXRhKSB7XHJcblx0XHRcdGRhdGFbJ1dpbmRvd1Jlc2l6ZXIuUm93cyddID0gSlNPTi5zdHJpbmdpZnkoZGF0YS5wcmVzZXRzKTtcclxuXHRcdFx0aWYgKGRhdGEuc2V0dGluZ3MpIHtcclxuXHRcdFx0XHRkYXRhWydXaW5kb3dSZXNpemVyLlRvb2x0aXAnXSA9IGRhdGEuc2V0dGluZ3MudG9vbHRpcDtcclxuXHRcdFx0XHRkYXRhWydXaW5kb3dSZXNpemVyLlRvb2x0aXBEZWxheSddID0gZGF0YS5zZXR0aW5ncy50b29sdGlwRGVsYXk7XHJcblx0XHRcdFx0ZGF0YVsnV2luZG93UmVzaXplci5Qb3B1cERlc2NyaXB0aW9uJ10gPSBkYXRhLnNldHRpbmdzLnBvcHVwRGVzY3JpcHRpb247XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHNldHRpbmdzID0gU2V0dGluZ3MuUGFyc2VWMShkYXRhKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGZvciAobGV0IGtleSBpbiBTZXR0aW5ncy5EZWZhdWx0U2V0dGluZ3MpIHtcclxuXHRcdFx0XHRpZiAoa2V5IGluIGRhdGEpIHtcclxuXHRcdFx0XHRcdHNldHRpbmdzW2tleV0gPSBkYXRhW2tleV07XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIFNldHRpbmdzLlNldChzZXR0aW5ncyk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBSb3RhdGVWaWV3cG9ydCgpOiBQcm9taXNlPGFueT4ge1xyXG5cdFx0cmV0dXJuIF9nZXREZXRhaWxzKCkudGhlbihkZXRhaWxzID0+IFJlc2l6ZSh7XHJcblx0XHRcdHRhcmdldCA6IFByZXNldFRhcmdldC5WSUVXUE9SVCxcclxuXHRcdFx0d2lkdGggIDogZGV0YWlscy5pbm5lckhlaWdodCAvIGRldGFpbHMuem9vbSxcclxuXHRcdFx0aGVpZ2h0IDogZGV0YWlscy5pbm5lcldpZHRoIC8gZGV0YWlscy56b29tXHJcblx0XHR9KSlcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIFNldHRpbmdzR2V0UmVxdWVzdGVkUGFnZSgpOiBQcm9taXNlPHN0cmluZz4ge1xyXG5cdFx0cmV0dXJuIFNldHRpbmdzUGFnZS5DdXJyZW50KCk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBPcGVuU2V0dGluZ3Modmlldzogc3RyaW5nID0gbnVsbCk6IFByb21pc2U8YW55PiB7XHJcblx0XHRyZXR1cm4gU2V0dGluZ3NQYWdlLk9wZW4odmlldyk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBPcGVuUHJlc2V0c1NldHRpbmdzKCk6IFByb21pc2U8YW55PiB7XHJcblx0XHRyZXR1cm4gU2V0dGluZ3NQYWdlLk9wZW4oJyNwcmVzZXRzJyk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBPcGVuUmVsZWFzZU5vdGVzKCk6IFByb21pc2U8YW55PiB7XHJcblx0XHRyZXR1cm4gU2V0dGluZ3NQYWdlLk9wZW4oJyNoZWxwL3JlbGVhc2Utbm90ZXMnKTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIE9wZW5Qcm9QYWdlKCk6IFByb21pc2U8YW55PiB7XHJcblx0XHRyZXR1cm4gU2V0dGluZ3NQYWdlLk9wZW4oJyNwcm8nKTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIFRvZ2dsZVRvb2x0aXAoKTogUHJvbWlzZTxhbnk+IHtcclxuXHRcdGxldCB0YWI6IFRhYnMuSVRhYjtcclxuXHJcblx0XHRyZXR1cm4gX2dldFRhYigpXHJcblx0XHRcdC50aGVuKHQgPT4gX3ZhbGlkYXRlVXJsKHRhYiA9IHQpKVxyXG5cdFx0XHQudGhlbihwID0+IFRvb2x0aXAuVG9nZ2xlKHRhYi5pZCkpXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBHZXRUb29sdGlwSGlkZURlbGF5KCk6IFByb21pc2U8bnVtYmVyPiB7XHJcblx0XHRyZXR1cm4gU2V0dGluZ3MuR2V0KCdoaWRlVG9vbHRpcERlbGF5Jyk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBHZXRUb29sdGlwUG9zaXRpb24oKTogUHJvbWlzZTxhbnk+IHtcclxuXHRcdHJldHVybiBTZXR0aW5ncy5HZXQoJ3Rvb2x0aXBQb3NpdGlvbicpO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gR2V0Wm9vbShwYXJhbXMsIHNlbmRlcik6IFByb21pc2U8bnVtYmVyPiB7XHJcblx0XHRsZXQgdGFiSWQ6IG51bWJlciA9IHNlbmRlci50YWIuaWQ7XHJcblx0XHRsZXQgdGFiczogYW55ID0gY2hyb21lLnRhYnM7XHJcblxyXG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuXHRcdFx0dGFicy5nZXRab29tKHRhYklkLCB6b29tID0+IHJlc29sdmUoem9vbSkpO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfZ2V0VGFiKHdpbklkPzogbnVtYmVyKTogUHJvbWlzZTxUYWJzLklUYWI+IHtcclxuXHRcdHJldHVybiBUYWJzLkdldEFjdGl2ZSh3aW5JZCB8fCBXaW5kb3dzU3RhY2suQ3VycmVudCgpKTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9nZXREZXRhaWxzKCk6IFByb21pc2U8SVdpbmRvd0RldGFpbHM+IHtcclxuXHRcdHJldHVybiBXaW5kb3dzLlVwZGF0ZShXaW5kb3dzU3RhY2suQ3VycmVudCgpLCB7c3RhdGU6ICdub3JtYWwnfSlcclxuXHRcdFx0LnRoZW4od2luID0+IF9nZXRUYWIod2luLmlkKVxyXG5cdFx0XHRcdC50aGVuKHRhYiA9PiBUYWJzLkdldFpvb20odGFiLmlkKVxyXG5cdFx0XHRcdFx0LnRoZW4oem9vbSA9PiB7XHJcblx0XHRcdFx0XHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG5cdFx0XHRcdFx0XHRcdGlkOiB3aW4uaWQsXHJcblx0XHRcdFx0XHRcdFx0dGFiSWQ6IHRhYi5pZCxcclxuXHRcdFx0XHRcdFx0XHR3aWR0aDogd2luLndpZHRoLFxyXG5cdFx0XHRcdFx0XHRcdGhlaWdodDogd2luLmhlaWdodCxcclxuXHRcdFx0XHRcdFx0XHR0b3A6IHdpbi50b3AsXHJcblx0XHRcdFx0XHRcdFx0bGVmdDogd2luLmxlZnQsXHJcblx0XHRcdFx0XHRcdFx0aW5uZXJXaWR0aDogdGFiLndpZHRoLFxyXG5cdFx0XHRcdFx0XHRcdGlubmVySGVpZ2h0OiB0YWIuaGVpZ2h0LFxyXG5cdFx0XHRcdFx0XHRcdHVybDogdGFiLnVybCxcclxuXHRcdFx0XHRcdFx0XHR6b29tOiB6b29tLFxyXG5cdFx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0KVxyXG5cdFx0XHQpXHJcblx0fVxyXG5cclxuXHRpbnRlcmZhY2UgSVdpbmRvd0RldGFpbHMge1xyXG5cdFx0aWQ6IG51bWJlcjtcclxuXHRcdHRhYklkOiBudW1iZXI7XHJcblx0XHR3aWR0aDogbnVtYmVyO1xyXG5cdFx0aGVpZ2h0OiBudW1iZXI7XHJcblx0XHRpbm5lcldpZHRoOiBudW1iZXI7XHJcblx0XHRpbm5lckhlaWdodDogbnVtYmVyO1xyXG5cdFx0dG9wOiBudW1iZXI7XHJcblx0XHRsZWZ0OiBudW1iZXI7XHJcblx0XHR6b29tOiBudW1iZXI7XHJcblx0XHR1cmw/OiBzdHJpbmc7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfX2NvbXB1dGVPcHRpb25zKHBhcmFtczogSVJlc2l6ZU9wdGlvbnMsIHdpbjogSVdpbmRvd0RldGFpbHMpOiBQcm9taXNlPElSZXNpemVPcHRpb25zPiB7XHJcblx0XHRsZXQgb3B0aW9uczogSVJlc2l6ZU9wdGlvbnMgPSB7fTtcclxuXHJcblx0XHRmb3IgKGxldCBwcm9wIG9mIFsnd2lkdGgnLCAnaGVpZ2h0JywgJ3RvcCcsICdsZWZ0J10pIHtcclxuXHRcdFx0aXNTZXQocGFyYW1zW3Byb3BdKSAmJiAob3B0aW9uc1twcm9wXSA9IHBhcmFtc1twcm9wXSlcclxuXHRcdH1cclxuXHJcblx0XHRpZiAocGFyYW1zLnRhcmdldCA9PT0gUHJlc2V0VGFyZ2V0LlZJRVdQT1JUKSB7XHJcblx0XHRcdGlmIChwYXJhbXMud2lkdGgpIHtcclxuXHRcdFx0XHRvcHRpb25zLndpZHRoID0gd2luLndpZHRoIC0gd2luLmlubmVyV2lkdGggKyBNYXRoLnJvdW5kKHBhcmFtcy53aWR0aCAqIHdpbi56b29tKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKHBhcmFtcy5oZWlnaHQpIHtcclxuXHRcdFx0XHRvcHRpb25zLmhlaWdodCA9IHdpbi5oZWlnaHQgLSB3aW4uaW5uZXJIZWlnaHQgKyBNYXRoLnJvdW5kKHBhcmFtcy5oZWlnaHQgKiB3aW4uem9vbSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gU2V0dGluZ3MuR2V0KHthbHdheXNDZW50ZXJUaGVXaW5kb3c6IGZhbHNlLCBsZWZ0QWxpZ25XaW5kb3c6IGZhbHNlfSkudGhlbihzZXR0aW5ncyA9PiB7XHJcblx0XHRcdGxldCBjZW50ZXJlZDogYm9vbGVhbiAgICA9IHNldHRpbmdzLmFsd2F5c0NlbnRlclRoZVdpbmRvdztcclxuXHRcdFx0bGV0IGxlZnRBbGlnbmVkOiBib29sZWFuID0gc2V0dGluZ3MubGVmdEFsaWduV2luZG93O1xyXG5cdFx0XHRsZXQgc2NyZWVuOiBhbnkgICAgICAgICAgPSB3aW5kb3cuc2NyZWVuO1xyXG5cclxuXHRcdFx0aWYgKGNlbnRlcmVkIHx8IHBhcmFtcy5wb3NpdGlvbiA9PT0gUHJlc2V0UG9zaXRpb24uQ0VOVEVSKSB7XHJcblx0XHRcdFx0Ly8gY2VudGVyIHRoZSB3aW5kb3cgaWYgdGhlIGdsb2JhbCBvcHRpb24gaXMgc2V0IG9yIHJlcXVpcmVkIGJ5IHRoZSBwcmVzZXRcclxuXHRcdFx0XHRvcHRpb25zLmxlZnQgPSBNYXRoLmZsb29yKChzY3JlZW4uYXZhaWxXaWR0aCAtIG9wdGlvbnMud2lkdGgpIC8gMikgKyBzY3JlZW4uYXZhaWxMZWZ0O1xyXG5cdFx0XHRcdG9wdGlvbnMudG9wICA9IE1hdGguZmxvb3IoKHNjcmVlbi5hdmFpbEhlaWdodCAtIG9wdGlvbnMuaGVpZ2h0KSAvIDIpICsgc2NyZWVuLmF2YWlsVG9wO1xyXG5cdFx0XHR9IGVsc2UgaWYgKCFsZWZ0QWxpZ25lZCAmJiBpc1NldChvcHRpb25zLndpZHRoKSAmJiAhaXNTZXQob3B0aW9ucy5sZWZ0KSAmJiAhaXNTZXQob3B0aW9ucy50b3ApKSB7XHJcblx0XHRcdFx0Ly8gaWYgdGhlIHVzZXIgaGFzbid0IHNlbGVjdGVkIHRoZSBvbGQgYmVoYXZpb3IgKHdpbmRvdyBzdGF5cyBsZWZ0IGFsaWduZWQpXHJcblx0XHRcdFx0Ly8ga2VlcCB0aGUgcmlnaHQgc2lkZSBvZiB0aGUgd2luZG93ICh3aGVyZSB0aGUgZXh0ZW5zaW9ucycgaWNvbnMgYXJlKSBpbiB0aGUgc2FtZSBwbGFjZVxyXG5cdFx0XHRcdG9wdGlvbnMubGVmdCA9IHdpbi5sZWZ0ICsgd2luLndpZHRoIC0gb3B0aW9ucy53aWR0aDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZShvcHRpb25zKTtcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBSZXNpemUocGFyYW1zOiBJUmVzaXplT3B0aW9ucyk6IFByb21pc2U8V2luZG93cy5JV2luZG93PiB7XHJcblx0XHRsZXQgaW5pdGlhbDogSVdpbmRvd0RldGFpbHM7XHJcblx0XHRsZXQgZGVidWc6IGFueSA9IHtcclxuXHRcdFx0XyA6IChuZXcgRGF0ZSgpKS50b0lTT1N0cmluZygpLFxyXG5cdFx0XHRkZXNpcmVkOiB7XHJcblx0XHRcdFx0d2lkdGg6IHBhcmFtcy53aWR0aCxcclxuXHRcdFx0XHRoZWlnaHQ6IHBhcmFtcy5oZWlnaHQsXHJcblx0XHRcdFx0dG9wOiBwYXJhbXMudG9wLFxyXG5cdFx0XHRcdGxlZnQ6IHBhcmFtcy5sZWZ0LFxyXG5cdFx0XHRcdHRhcmdldDogcGFyYW1zLnRhcmdldCxcclxuXHRcdFx0fVxyXG5cdFx0fTtcclxuXHJcblx0XHRyZXR1cm4gX2dldERldGFpbHMoKVxyXG5cdFx0XHQudGhlbihjdXJyZW50ID0+IHtcclxuXHRcdFx0XHRkZWJ1Zy5pbml0aWFsID0ge1xyXG5cdFx0XHRcdFx0d2lkdGg6IGN1cnJlbnQud2lkdGgsXHJcblx0XHRcdFx0XHRoZWlnaHQ6IGN1cnJlbnQuaGVpZ2h0LFxyXG5cdFx0XHRcdFx0aW5uZXJXaWR0aDogY3VycmVudC5pbm5lcldpZHRoLFxyXG5cdFx0XHRcdFx0aW5uZXJIZWlnaHQ6IGN1cnJlbnQuaW5uZXJIZWlnaHQsXHJcblx0XHRcdFx0XHR0b3A6IGN1cnJlbnQudG9wLFxyXG5cdFx0XHRcdFx0bGVmdDogY3VycmVudC5sZWZ0LFxyXG5cdFx0XHRcdFx0em9vbTogY3VycmVudC56b29tLFxyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0cmV0dXJuIF9fY29tcHV0ZU9wdGlvbnMocGFyYW1zLCBpbml0aWFsID0gY3VycmVudCk7XHJcblx0XHRcdH0pXHJcblx0XHRcdC50aGVuKG9wdGlvbnMgPT4ge1xyXG5cdFx0XHRcdGRlYnVnLmNvbXB1dGVkID0gb3B0aW9ucztcclxuXHRcdFx0XHRyZXR1cm4gX3Jlc2l6ZShpbml0aWFsLmlkLCBvcHRpb25zKTtcclxuXHRcdFx0fSlcclxuXHRcdFx0LmNhdGNoKGVycm9ycyA9PiB7XHJcblx0XHRcdFx0bGV0IGFjdHVhbCA9IGVycm9ycyAmJiBlcnJvcnMuT1VUX09GX0JPVU5EUyAmJiBlcnJvcnMuT1VUX09GX0JPVU5EUy5hY3R1YWwgPyBlcnJvcnMuT1VUX09GX0JPVU5EUy5hY3R1YWwgOiB7fTtcclxuXHJcblx0XHRcdFx0ZGVidWcuYWN0dWFsID0ge1xyXG5cdFx0XHRcdFx0d2lkdGg6IGFjdHVhbC53aWR0aCxcclxuXHRcdFx0XHRcdGhlaWdodDogYWN0dWFsLmhlaWdodCxcclxuXHRcdFx0XHRcdHRvcDogYWN0dWFsLnRvcCxcclxuXHRcdFx0XHRcdGxlZnQ6IGFjdHVhbC5sZWZ0LFxyXG5cdFx0XHRcdFx0dHlwZTogYWN0dWFsLnR5cGUsXHJcblx0XHRcdFx0fTtcclxuXHJcblx0XHRcdFx0cmV0dXJuIFNldHRpbmdzLkdldCh7YWx3YXlzQ2VudGVyVGhlV2luZG93OiBmYWxzZSwgbGVmdEFsaWduV2luZG93OiBmYWxzZX0pLnRoZW4oc2V0dGluZ3MgPT4ge1xyXG5cdFx0XHRcdFx0bGV0IHRvcCA9IGluaXRpYWwudG9wO1xyXG5cdFx0XHRcdFx0bGV0IGxlZnQgPSBpbml0aWFsLmxlZnQgLSAoYWN0dWFsLndpZHRoIC0gaW5pdGlhbC53aWR0aCk7XHJcblxyXG5cdFx0XHRcdFx0bGV0IGNlbnRlcmVkOiBib29sZWFuICAgID0gc2V0dGluZ3MuYWx3YXlzQ2VudGVyVGhlV2luZG93O1xyXG5cdFx0XHRcdFx0bGV0IGxlZnRBbGlnbmVkOiBib29sZWFuID0gc2V0dGluZ3MubGVmdEFsaWduV2luZG93O1xyXG5cdFx0XHRcdFx0bGV0IHNjcmVlbjogYW55ICAgICAgICAgID0gd2luZG93LnNjcmVlbjtcclxuXHJcblx0XHRcdFx0XHRpZiAobGVmdEFsaWduZWQpIHtcclxuXHRcdFx0XHRcdFx0bGVmdCA9IGluaXRpYWwubGVmdDtcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRpZiAoZGVidWcuZGVzaXJlZC50b3AgIT09IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0dG9wID0gZGVidWcuZGVzaXJlZC50b3A7XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0aWYgKGRlYnVnLmRlc2lyZWQubGVmdCAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRsZWZ0ID0gZGVidWcuZGVzaXJlZC5sZWZ0O1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdGlmIChjZW50ZXJlZCB8fCBwYXJhbXMucG9zaXRpb24gPT09IFByZXNldFBvc2l0aW9uLkNFTlRFUikge1xyXG5cdFx0XHRcdFx0XHQvLyBjZW50ZXIgdGhlIHdpbmRvdyBpZiB0aGUgZ2xvYmFsIG9wdGlvbiBpcyBzZXQgb3IgcmVxdWlyZWQgYnkgdGhlIHByZXNldFxyXG5cdFx0XHRcdFx0XHRsZWZ0ID0gTWF0aC5mbG9vcigoc2NyZWVuLmF2YWlsV2lkdGggLSBhY3R1YWwud2lkdGgpIC8gMikgKyBzY3JlZW4uYXZhaWxMZWZ0O1xyXG5cdFx0XHRcdFx0XHR0b3AgID0gTWF0aC5mbG9vcigoc2NyZWVuLmF2YWlsSGVpZ2h0IC0gYWN0dWFsLmhlaWdodCkgLyAyKSArIHNjcmVlbi5hdmFpbFRvcDtcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHQvLyByZXNldCB3aW5kb3cgaW4gY2FzZSBvZiBmYWlsdXJlXHJcblx0XHRcdFx0XHRXaW5kb3dzLlVwZGF0ZShpbml0aWFsLmlkLCB7dG9wLCBsZWZ0fSk7XHJcblx0XHRcdFx0XHRsZXQgbG9nID0gW107XHJcblx0XHRcdFx0XHR0cnkge1xyXG5cdFx0XHRcdFx0XHRsb2cgPSBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2VbJ2RlYnVnTG9nJ10gfHwgJ1tdJyk7XHJcblx0XHRcdFx0XHR9IGNhdGNoIChleCkge31cclxuXHRcdFx0XHRcdGxvZy5zcGxpY2UoOSk7XHJcblx0XHRcdFx0XHRsb2cudW5zaGlmdChkZWJ1Zyk7XHJcblxyXG5cdFx0XHRcdFx0d2luZG93LmxvY2FsU3RvcmFnZVsnZGVidWdMb2cnXSA9IEpTT04uc3RyaW5naWZ5KGxvZyk7XHJcblxyXG5cdFx0XHRcdFx0cmV0dXJuIFByb21pc2UucmVqZWN0KHtlcnJvcnMsIGRlYnVnfSk7XHJcblx0XHRcdFx0fSlcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBMaW1pdFBvcHVwKHBhcmFtczogYW55KTogUHJvbWlzZTxhbnk+IHtcclxuXHRcdHJldHVybiBXaW5kb3dzLlVwZGF0ZShUb29sc1BvcHVwLklEKCksIHBhcmFtcyk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfZXhlY3V0ZVNjcmlwdChjb2RlOiBzdHJpbmcsIHRhYklkPzogbnVtYmVyLCBpbmplY3Q/OiBib29sZWFuKTogUHJvbWlzZTxhbnk+IHtcclxuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcblx0XHRcdGxldCBnZXRUYWJJZCA9IFByb21pc2UucmVzb2x2ZSh0YWJJZCk7XHJcblxyXG5cdFx0XHRpZiAoIXRhYklkKSB7XHJcblx0XHRcdFx0Z2V0VGFiSWQgPSBfZ2V0VGFiKCkudGhlbih0YWIgPT4gUHJvbWlzZS5yZXNvbHZlKHRhYi5pZCkpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRnZXRUYWJJZC50aGVuKHRhYklkID0+IHtcclxuXHRcdFx0XHRsZXQgY29uZmlnOiBhbnkgPSB7fTtcclxuXHJcblx0XHRcdFx0aWYgKGluamVjdCkge1xyXG5cdFx0XHRcdFx0Y29uZmlnLmNvZGUgPSBjb2RlO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRjb25maWcuZmlsZSA9IGNvZGU7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRjaHJvbWUudGFicy5leGVjdXRlU2NyaXB0KHRhYklkIHx8IG51bGwsIGNvbmZpZywgcmVzdWx0ID0+IHtcclxuXHRcdFx0XHRcdGlmIChSdW50aW1lLkVycm9yKCkpIHtcclxuXHRcdFx0XHRcdFx0cmVqZWN0KHsnSU5WQUxJRF9UQUInOiBSdW50aW1lLkVycm9yKCl9KTtcclxuXHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdHJlc29sdmUocmVzdWx0WzBdKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KVxyXG5cdFx0XHR9KVxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9yZXNpemUod2luSWQsIG9wdGlvbnMpOiBQcm9taXNlPFdpbmRvd3MuSVdpbmRvdz4ge1xyXG5cdFx0cmV0dXJuIFdpbmRvd3MuVXBkYXRlKHdpbklkLCBvcHRpb25zKS50aGVuKHVwZGF0ZWQgPT4ge1xyXG5cdFx0XHRsZXQgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xyXG5cclxuXHRcdFx0aWYgKG9wdGlvbnMud2lkdGggJiYgb3B0aW9ucy53aWR0aCA8IHVwZGF0ZWQud2lkdGgpIHtcclxuXHRcdFx0XHRlcnJvcnMucHVzaCgnTUlOX1dJRFRIJyk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChvcHRpb25zLmhlaWdodCAmJiBvcHRpb25zLmhlaWdodCA8IHVwZGF0ZWQuaGVpZ2h0KSB7XHJcblx0XHRcdFx0ZXJyb3JzLnB1c2goJ01JTl9IRUlHSFQnKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKG9wdGlvbnMud2lkdGggJiYgb3B0aW9ucy53aWR0aCA+IHVwZGF0ZWQud2lkdGgpIHtcclxuXHRcdFx0XHRlcnJvcnMucHVzaCgnTUFYX1dJRFRIJyk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChvcHRpb25zLmhlaWdodCAmJiBvcHRpb25zLmhlaWdodCA+IHVwZGF0ZWQuaGVpZ2h0KSB7XHJcblx0XHRcdFx0ZXJyb3JzLnB1c2goJ01BWF9IRUlHSFQnKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKGVycm9ycy5sZW5ndGgpIHtcclxuXHRcdFx0XHRyZXR1cm4gUHJvbWlzZS5yZWplY3QoeydPVVRfT0ZfQk9VTkRTJzoge2tleXM6IGVycm9ycywgdGFyZ2V0OiBvcHRpb25zLCBhY3R1YWw6IHVwZGF0ZWR9fSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vIEFsbCBnb29kIVxyXG5cdFx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVwZGF0ZWQpO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBpc1NldCh2YWw6IGFueSk6IGJvb2xlYW4ge1xyXG5cdFx0cmV0dXJuIHZhbCAhPT0gbnVsbCAmJiB2YWwgIT09IHVuZGVmaW5lZDtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF92YWxpZGF0ZVVybCh0YWI6IFRhYnMuSVRhYik6IFByb21pc2U8c3RyaW5nPiB7XHJcblx0XHRsZXQgcHJvdG9jb2wgPSBTdHJpbmcodGFiLnVybCkuc3BsaXQoJzonKS5zaGlmdCgpO1xyXG5cdFx0bGV0IGFsbG93ZWQgID0gWydodHRwJywgJ2h0dHBzJywgJ2ZpbGUnXTtcclxuXHJcblx0XHRpZiAoYWxsb3dlZC5pbmRleE9mKHByb3RvY29sKSA8IDApIHtcclxuXHRcdFx0cmV0dXJuIFByb21pc2UucmVqZWN0KHsnSU5WQUxJRF9QUk9UT0NPTCcgOiB7cHJvdG9jb2w6IHByb3RvY29sLCB0YWI6IHRhYn19KTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG5cdFx0XHRfZXhlY3V0ZVNjcmlwdChgKGZ1bmN0aW9uKCkge3JldHVybiAnJHtwcm90b2NvbH0nfSkoKWAsIHRhYi5pZCwgdHJ1ZSlcclxuXHRcdFx0XHQudGhlbihyZXNvbHZlKVxyXG5cdFx0XHRcdC5jYXRjaChlcnIgPT4ge1xyXG5cdFx0XHRcdFx0aWYgKHByb3RvY29sID09PSAnZmlsZScpIHtcclxuXHRcdFx0XHRcdFx0cmVqZWN0KHsnRklMRV9QUk9UT0NPTF9QRVJNSVNTSU9OJyA6IHt0YWI6IHRhYiwgZXJyOiBlcnJ9fSk7XHJcblx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRyZWplY3QoeydXRUJTVE9SRV9QRVJNSVNTSU9OJyA6IHt0YWI6IHRhYiwgZXJyOiBlcnJ9fSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9zaWxlbmNlKCkge31cclxuXHJcblx0ZnVuY3Rpb24gc2V0SWNvblR5cGUoc3R5bGU6IHN0cmluZyk6IHZvaWQge1xyXG5cdFx0X19zZXRJY29uKHN0eWxlKTtcclxuXHR9XHJcblxyXG5cdGludGVyZmFjZSBJVmlld3BvcnQge1xyXG5cdFx0d2lkdGg6IG51bWJlcjtcclxuXHRcdGhlaWdodDogbnVtYmVyO1xyXG5cdFx0ZHByOiBudW1iZXI7XHJcblx0XHR6b29tOiBudW1iZXI7XHJcblx0XHRzY3JlZW46IHtcclxuXHRcdFx0YXZhaWxIZWlnaHQ6IG51bWJlcjtcclxuXHRcdFx0YXZhaWxXaWR0aDogbnVtYmVyO1xyXG5cdFx0XHRhdmFpbExlZnQ6IG51bWJlcjtcclxuXHRcdFx0YXZhaWxUb3A6IG51bWJlcjtcclxuXHRcdFx0aGVpZ2h0OiBudW1iZXI7XHJcblx0XHRcdHdpZHRoOiBudW1iZXI7XHJcblx0XHR9O1xyXG5cdH1cclxuXHJcblx0aW50ZXJmYWNlIElSZXNpemVPcHRpb25zIHtcclxuXHRcdHRhcmdldD86IFByZXNldFRhcmdldCxcclxuXHRcdHdpZHRoPzogbnVtYmVyLFxyXG5cdFx0aGVpZ2h0PzogbnVtYmVyLFxyXG5cdFx0cG9zaXRpb24/OiBQcmVzZXRQb3NpdGlvbixcclxuXHRcdHRvcD86IG51bWJlcixcclxuXHRcdGxlZnQ/OiBudW1iZXIsXHJcblx0XHRzZXR0aW5ncz86IGFueVxyXG5cdH1cclxuXHJcblxyXG5cclxuXHJcblx0R2V0U2V0dGluZ3MoKS50aGVuKChzZXR0aW5nczogU2V0dGluZ3MuSUtleXMpID0+IHtcclxuXHRcdHNldEljb25UeXBlKHNldHRpbmdzLnBvcHVwSWNvblN0eWxlKTtcclxuXHJcblx0XHRpZiAoc2V0dGluZ3MuYWx3YXlzU2hvd1RoZVRvb2x0aXApIHtcclxuXHRcdFx0VG9vbHRpcC5FbmFibGVPbkFsbFBhZ2VzKCk7XHJcblx0XHR9XHJcblx0fSlcclxuXHJcblx0ZnVuY3Rpb24gX19zZXRJY29uKHN0eWxlOiBzdHJpbmcpIHtcclxuXHRcdHN0eWxlID0gU3RyaW5nKHN0eWxlKTtcclxuXHJcblx0XHRpZiAoc3R5bGUubWF0Y2goL15cXGQrJC8pKSB7XHJcblx0XHRcdGNvbnN0IHN0eWxlcyA9IFsnZ3JleScsICdkYXJrK2NvbG9yJywgJ2xpZ2h0K2NvbG9yJ107XHJcblx0XHRcdHN0eWxlID0gWydncmV5JywgJ2RhcmsrY29sb3InLCAnbGlnaHQrY29sb3InXVtzdHlsZV0gfHwgJ2RhcmsrY29sb3InO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZldGNoKGNocm9tZS5ydW50aW1lLmdldFVSTCgnYXNzZXRzL2ljb25zL2Jyb3dzZXItaWNvbi0xNi5zdmcnKSlcclxuXHRcdFx0LnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UudGV4dCgpKVxyXG5cdFx0XHQudGhlbihzdmcgPT4gX3Byb2Nlc3NDb2xvcnMoc3ZnKSlcclxuXHRcdFx0LnRoZW4oc3ZnID0+IHtcclxuXHRcdFx0XHRsZXQgZmlsZSAgPSBuZXcgQmxvYihbc3ZnXSwge3R5cGU6IFwiaW1hZ2Uvc3ZnK3htbDtjaGFyc2V0PXV0Zi04XCJ9KTtcclxuXHRcdFx0XHRsZXQgZGF0YSAgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGZpbGUpO1xyXG5cdFx0XHRcdGxldCBsaWdodCA9IHN0eWxlLm1hdGNoKC9saWdodC8pO1xyXG5cclxuXHRcdFx0XHRyZXR1cm4gUHJvbWlzZS5hbGwoW1xyXG5cdFx0XHRcdFx0c3ZnMkltZ0RhdGEoZGF0YSwgMTYsIGxpZ2h0LCAxKSxcclxuXHRcdFx0XHRcdHN2ZzJJbWdEYXRhKGRhdGEsIDMyLCBsaWdodCwgMilcclxuXHRcdFx0XHRdKTtcclxuXHRcdFx0fSkudGhlbigoW2ljb24xNiwgaWNvbjMyXSkgPT4ge1xyXG5cdFx0XHRcdGNocm9tZS5icm93c2VyQWN0aW9uLnNldEljb24oeyBpbWFnZURhdGE6IHtcclxuXHRcdFx0XHRcdFwiMTZcIiA6IGljb24xNixcclxuXHRcdFx0XHRcdFwiMzJcIiA6IGljb24zMixcclxuXHRcdFx0XHR9fSk7XHJcblx0XHRcdH0pXHJcblxyXG5cdFx0ZnVuY3Rpb24gX3Byb2Nlc3NDb2xvcnMoc3ZnKSB7XHJcblx0XHRcdHN3aXRjaCAoc3R5bGUpIHtcclxuXHRcdFx0XHRjYXNlICdsaWdodCc6XHJcblx0XHRcdFx0XHRzdmcgPSBzdmcucmVwbGFjZSgvMzQ3ZjJiLywgJ2VlZScpO1xyXG5cdFx0XHRcdGNhc2UgJ2xpZ2h0K2NvbG9yJzpcclxuXHRcdFx0XHRcdHN2ZyA9IHN2Zy5yZXBsYWNlKC8zMzMvLCAnZWVlJyk7XHJcblx0XHRcdFx0YnJlYWs7XHJcblxyXG5cdFx0XHRcdGNhc2UgJ2RhcmsnOlxyXG5cdFx0XHRcdFx0c3ZnID0gc3ZnLnJlcGxhY2UoLzM0N2YyYi8sICczMzMnKTtcclxuXHRcdFx0XHRicmVhaztcclxuXHJcblx0XHRcdFx0Y2FzZSAnbmV1dHJhbCc6XHJcblx0XHRcdFx0XHRzdmcgPSBzdmcucmVwbGFjZSgvMzQ3ZjJiLywgJzY2NicpO1xyXG5cdFx0XHRcdFx0c3ZnID0gc3ZnLnJlcGxhY2UoLzMzMy8sICc2NjYnKTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZShzdmcpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gc3ZnMkltZ0RhdGEoc291cmNlLCBzaXplLCBsaWdodCwgc2NhbGUgPSAxKTogUHJvbWlzZTxJbWFnZURhdGE+IHtcclxuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcblx0XHRcdGNvbnN0IGNudiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG5cdFx0XHRjb25zdCBjdHggPSBjbnYuZ2V0Q29udGV4dCgnMmQnKTtcclxuXHRcdFx0Y29uc3QgaW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XHJcblxyXG5cdFx0XHRjbnYud2lkdGggID0gc2l6ZTtcclxuXHRcdFx0Y252LmhlaWdodCA9IHNpemU7XHJcblxyXG5cdFx0XHRpbWcud2lkdGggID0gc2l6ZTtcclxuXHRcdFx0aW1nLmhlaWdodCA9IHNpemU7XHJcblxyXG5cdFx0XHRpbWcub25sb2FkID0gX3JlbmRlcjtcclxuXHRcdFx0aW1nLnNyYyAgICA9IHNvdXJjZTtcclxuXHJcblx0XHRcdGZ1bmN0aW9uIF9yZW5kZXIoKSB7XHJcblx0XHRcdFx0bGV0IHNoYWRvdyA9IGxpZ2h0ID9cclxuXHRcdFx0XHRcdGByZ2JhKDI1NSwgMjU1LCAyNTUsICR7MC4wNzUgKiBzY2FsZX0pYCA6XHJcblx0XHRcdFx0XHRgcmdiYSgwLCAwLCAwLCAkezAuMDUgKiBzY2FsZX0pYDtcclxuXHJcblx0XHRcdFx0Y3R4LnNoYWRvd0NvbG9yID0gc2hhZG93O1xyXG5cdFx0XHRcdGN0eC5zaGFkb3dCbHVyID0gMTtcclxuXHRcdFx0XHRjdHguc2hhZG93T2Zmc2V0WCA9IDA7XHJcblx0XHRcdFx0Y3R4LnNoYWRvd09mZnNldFkgPSAxO1xyXG5cdFx0XHRcdGN0eC5kcmF3SW1hZ2UoaW1nLCAwLCAwKTtcclxuXHJcblx0XHRcdFx0cmVzb2x2ZShjdHguZ2V0SW1hZ2VEYXRhKDAsIDAsIHNpemUsIHNpemUpKTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0fVxyXG59XHJcbiJdfQ==
