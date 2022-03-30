var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
/// <reference path="./Utils/Dictionaries.ts" />
var Core;
(function (Core) {
    class TemplateRegistry {
        static getTemplate(id) {
            if (!TemplateRegistry._cache[id]) {
                TemplateRegistry._cache[id] = document.getElementById(id);
            }
            return TemplateRegistry._cache[id].cloneNode(true);
        }
    }
    TemplateRegistry._cache = {};
    Core.TemplateRegistry = TemplateRegistry;
})(Core || (Core = {}));
/// <reference path="../../typings/rivets.d.ts" />
/// <reference path="./TemplateRegistry.ts" />
var Core;
(function (Core) {
    var Components;
    (function (Components) {
        // function template(): string {
        // 	return Core.TemplateRegistry.getTemplate(this.component.name);
        // }
        function initialize(element, data) {
            return data;
        }
        function create(name, config) {
            config = config || {
                name: null,
                static: null,
                template: null,
                initialize: null,
            };
            return rivets.components[name] = {
                name: name,
                static: config.static || [],
                template: config.template || function (el) {
                    el = el || this.el;
                    let children = [].slice.call(el ? el.children : []);
                    let template = Core.TemplateRegistry.getTemplate(name);
                    let content = template.content.querySelector('content');
                    if (children && content) {
                        for (let node of children) {
                            content.parentNode.insertBefore(node, content);
                        }
                    }
                    content && content.parentNode.removeChild(content);
                    return template.innerHTML;
                },
                initialize: config.initialize || initialize
            };
        }
        Components.create = create;
    })(Components = Core.Components || (Core.Components = {}));
})(Core || (Core = {}));
var Core;
(function (Core) {
    class CustomElement {
        constructor(node, data) {
            node._data = node._data || {};
            this._node = node;
            for (let key in data) {
                if (node._data[key] === undefined) {
                    node._data[key] = data[key];
                }
                this[key] = this.getData(key);
            }
            let self = this.constructor;
            for (let attr of self._attributes) {
                this._linkAttr(attr);
            }
        }
        getData(key) {
            return this._node._data[key];
        }
        setData(key, val) {
            if (this._node._data[key] !== val) {
                this._node._data[key] = val;
                this._node.dispatchEvent(new CustomEvent(key + '-change'));
            }
        }
        _linkAttr(key) {
            this[key] = this.getData(key);
            this._node.addEventListener(key + '-update', (e) => {
                this[key] = this.getData(key);
            }, false);
        }
    }
    CustomElement._attributes = [];
    Core.CustomElement = CustomElement;
})(Core || (Core = {}));
var Core;
(function (Core) {
    var Decorators;
    (function (Decorators) {
        function ComputedFrom(...keys) {
            return function ComputedFrom(target, key, descriptor) {
                target.__dependencies = target.__dependencies || {};
                target.__dependencies[key] = keys;
            };
        }
        Decorators.ComputedFrom = ComputedFrom;
        var Observe = rivets._.Binding.prototype.observe;
        rivets._.Binding.prototype.observe = function (obj, keypath, callback) {
            var path = keypath.split('.');
            var root, prop;
            if (path.length < 2) {
                root = obj;
                prop = path[0];
            }
            else {
                root = obj[path[0]];
                prop = path[1];
            }
            if (root && root.__dependencies) {
                this.options = this.options || {};
                this.options.dependencies = this.options.dependencies || root.__dependencies[prop];
            }
            return Observe.call(this, obj, keypath, callback);
        };
    })(Decorators = Core.Decorators || (Core.Decorators = {}));
})(Core || (Core = {}));
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
/// <reference path="./Decorators/ComputedFrom.ts" />
/// <reference path="./Utils/Enums.ts" />
/// <reference path="./Utils/UUID.ts" />
var Core;
(function (Core) {
    var ComputedFrom = Core.Decorators.ComputedFrom;
    class Preset {
        constructor(data) {
            this.id = data.id || Core.Utils.UUID();
            this.width = data.width || null;
            this.height = data.height || null;
            this.top = isNaN(parseInt(data.top, 10)) ? null : data.top;
            this.left = isNaN(parseInt(data.left, 10)) ? null : data.left;
            this.description = data.description || null;
            this.position = data.position || Core.PresetPosition.DEFAULT;
            this.type = parseInt(data.type, 10) == data.type ? data.type : Core.PresetType.DESKTOP;
            this.target = data.target || Core.PresetTarget.WINDOW;
        }
        title() {
            let title = this.width + ' &times; ' + this.height;
            if (!this.width) {
                title = '<em>Height:</em> ' + this.height;
            }
            if (!this.height) {
                title = '<em>Width:</em> ' + this.width;
            }
            return title;
        }
        icon() {
            let icon = '';
            switch (this.type) {
                case Core.PresetType.PHONE:
                    icon = '#icon-phone';
                    break;
                case Core.PresetType.TABLET:
                    icon = '#icon-tablet';
                    break;
                case Core.PresetType.LAPTOP:
                    icon = '#icon-laptop';
                    break;
                default:
                    icon = '#icon-desktop';
                    break;
            }
            return icon;
        }
    }
    __decorate([
        ComputedFrom('width', 'height'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], Preset.prototype, "title", null);
    __decorate([
        ComputedFrom('type'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], Preset.prototype, "icon", null);
    Core.Preset = Preset;
})(Core || (Core = {}));
/// <reference path="../../Core/CustomElement.ts" />
var Views;
(function (Views) {
    var Common;
    (function (Common) {
        class Icon extends Core.CustomElement {
            constructor(node, data) {
                super(node, data);
                this.src = data.src;
            }
            get src() {
                return this.getData('src');
            }
            set src(val) {
                this.setData('src', val);
                this._setSrc(val);
            }
            _setSrc(val) {
                var svg, use;
                svg = this._node.querySelector('svg');
                if (val && val[0] == '#') {
                    val = '../assets/icons/sprite.svg' + val;
                }
                while (svg.firstChild) {
                    svg.removeChild(svg.firstChild);
                }
                if (val) {
                    use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
                    use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', val);
                    svg.appendChild(use);
                }
            }
        }
        Icon._attributes = [];
        Common.Icon = Icon;
        Core.Components.create('wr-icon', {
            static: ['class', 'src'],
            initialize: function (el, data) {
                data.src = data.src || el.getAttribute('src');
                return new Icon(el, data);
            }
        });
    })(Common = Views.Common || (Views.Common = {}));
})(Views || (Views = {}));
var Core;
(function (Core) {
    var Utils;
    (function (Utils) {
        var DOM;
        (function (DOM) {
            function q(selector, context) {
                if (typeof selector !== 'string') {
                    return selector;
                }
                return (context || document).querySelector(selector);
            }
            DOM.q = q;
            function qAll(selector, context) {
                let result = selector;
                if (typeof selector === 'string') {
                    result = (context || document).querySelectorAll(selector);
                }
                return [].slice.call(result);
            }
            DOM.qAll = qAll;
            function on(event, target, listener, capture) {
                let node = q(target);
                capture = !!capture;
                if (node) {
                    node.addEventListener(event, listener, capture);
                }
            }
            DOM.on = on;
            function trigger(event, target, config) {
                let node = q(target);
                if (node) {
                    node.dispatchEvent(new CustomEvent(event, config));
                }
            }
            DOM.trigger = trigger;
            function remove(selector, context) {
                let node = q(selector);
                node && node.parentNode.removeChild(node);
                return node;
            }
            DOM.remove = remove;
            function addClass(target, className) {
                let node = q(target);
                if (node) {
                    node.classList.add(className);
                }
            }
            DOM.addClass = addClass;
            function removeClass(target, className) {
                let node = q(target);
                if (node) {
                    node.classList.remove(className);
                }
            }
            DOM.removeClass = removeClass;
            function toggleClass(target, className) {
                let node = q(target);
                if (node) {
                    node.classList.toggle(className);
                }
                return hasClass(node, className);
            }
            DOM.toggleClass = toggleClass;
            function hasClass(target, className) {
                let node = q(target);
                if (node) {
                    return node.classList.contains(className);
                }
            }
            DOM.hasClass = hasClass;
            function empty(target) {
                let node = q(target);
                while (node.firstChild) {
                    node.removeChild(node.firstChild);
                }
            }
            DOM.empty = empty;
            function hide(target, className, waitFor) {
                return _toggleClass(target, false, className, waitFor);
            }
            DOM.hide = hide;
            function show(target, className, waitFor) {
                return _toggleClass(target, true, className, waitFor);
            }
            DOM.show = show;
            function animate(target, className, propertyName) {
                return _toggleClass(target, true, className, null, propertyName);
            }
            DOM.animate = animate;
            function _hasTransition(node) {
                let duration = window.getComputedStyle(node).transitionDuration.split(',');
                for (let part of duration) {
                    if (parseFloat(part) > 0) {
                        return true;
                    }
                }
                return false;
            }
            function _toggleClass(target, state, className = 'visible', waitFor, propertyName) {
                var node = q(target);
                var action = state ? 'add' : 'remove';
                waitFor = waitFor || node;
                if (!node) {
                    return Promise.resolve(null);
                }
                if (!_hasTransition(waitFor)) {
                    node.classList[action](className);
                    return Promise.resolve(node);
                }
                return new Promise((resolve, reject) => {
                    function transitionEnded(evt) {
                        if ((!propertyName || propertyName === evt.propertyName) && waitFor === evt.target) {
                            waitFor.removeEventListener('transitionend', transitionEnded);
                            resolve(waitFor);
                        }
                    }
                    waitFor.addEventListener('transitionend', transitionEnded);
                    node.classList[action](className);
                });
            }
            function eventPath(evt) {
                let node = evt.relatedTarget;
                let path = [];
                while (node = node.parentNode) {
                    path.push(node);
                }
                return path;
            }
            DOM.eventPath = eventPath;
        })(DOM = Utils.DOM || (Utils.DOM = {}));
    })(Utils = Core.Utils || (Core.Utils = {}));
})(Core || (Core = {}));
/// <reference path="../../../typings/tab-nav.d.ts" />
/// <reference path="../../Core/Utils/DOM.ts" />
var Views;
(function (Views) {
    var Common;
    (function (Common) {
        var $ = Core.Utils.DOM;
        const KEY_ESC = 27;
        class ModalMessage {
            constructor(title, message, blocking = false, actions = [], options = {}) {
                this.title = title;
                this.message = message;
                this.blocking = blocking;
                this.actions = actions;
                this.options = options;
                this.visible = false;
                this.onClose = new ModalEventRegistry();
                this.show();
            }
            show() {
                return $.show(document.body, 'wr_modal_visible').then(_ => {
                    let modal = $.q('.WR_modal');
                    let action = $.q('.WR_modal_actions .main', modal) || $.q('.WR_modal_actions button:last-child', modal);
                    if (this.options.class) {
                        $.addClass(modal, this.options.class);
                    }
                    action && action.focus();
                    this.visible = true;
                    TabNav.limitTo(modal);
                    if (!this.blocking) {
                        this._dismiss = (evt) => {
                            if (evt.keyCode === KEY_ESC) {
                                evt.preventDefault();
                                evt.stopPropagation();
                                for (let action of this.actions) {
                                    action.onDismiss && action.handler();
                                }
                                this.hide();
                                return false;
                            }
                        };
                        document.addEventListener('keyup', this._dismiss);
                    }
                    return Promise.resolve();
                });
            }
            hide() {
                return $.hide(document.body, 'wr_modal_visible', $.q('.WR_modal')).then(_ => {
                    this.visible = false;
                    document.removeEventListener('keyup', this._dismiss);
                    TabNav.reset();
                    this.onClose.trigger();
                    return Promise.resolve();
                });
            }
        }
        Common.ModalMessage = ModalMessage;
        class ModalEventRegistry {
            constructor() {
                this._handlers = [];
            }
            addListener(handler) {
                let handlers = this._handlers;
                let existing = handlers.indexOf(handler);
                if (existing > -1) {
                    return false;
                }
                handlers.push(handler);
                return true;
            }
            removeListener(handler) {
                let handlers = this._handlers;
                let existing = handlers.indexOf(handler);
                if (existing === -1) {
                    return false;
                }
                handlers.splice(existing, 1);
                return true;
            }
            removeAllListeners() {
                this._handlers = [];
            }
            trigger(context, data) {
                for (let handler of this._handlers) {
                    handler.call(context, data);
                }
            }
        }
        Common.ModalEventRegistry = ModalEventRegistry;
    })(Common = Views.Common || (Views.Common = {}));
})(Views || (Views = {}));
var Core;
(function (Core) {
    var Input;
    (function (Input) {
        Input.Keys = {
            BACKSPACE: 8,
            TAB: 9,
            ENTER: 13,
            SHIFT: 16,
            ALT: 18,
            ESCAPE: 27,
            SPACE: 32,
            END: 35,
            HOME: 36,
            LEFT: 37,
            UP: 38,
            RIGHT: 39,
            DOWN: 40,
            DELETE: 46,
            ARROWS: [37, 40],
            DIGITS: [48, 57],
            NUMPAD: [96, 105],
            FUNC: [112, 123]
        };
    })(Input = Core.Input || (Core.Input = {}));
})(Core || (Core = {}));
/// <reference path="../../Core/CustomElement.ts" />
/// <reference path="../../Core/Components.ts" />
/// <reference path="../../Core/Input/Keys.ts" />
var Views;
(function (Views) {
    var Common;
    (function (Common) {
        var Keys = Core.Input.Keys;
        class NumericInput extends Core.CustomElement {
            constructor(node, data) {
                super(node, data);
                node.onkeydown = filterKeys;
            }
            get val() {
                return this.getData('val');
            }
            set val(val) {
                this.setData('val', val);
            }
        }
        NumericInput._attributes = ['val'];
        Common.NumericInput = NumericInput;
        function filterKeys(e) {
            var key = e.keyCode;
            switch (true) {
                case !e.shiftKey && (key >= Keys.DIGITS[0] && key <= Keys.DIGITS[1]):
                case (key >= Keys.NUMPAD[0] && key <= Keys.NUMPAD[1]):
                case (key >= Keys.FUNC[0] && key <= Keys.FUNC[1]):
                case key == Keys.LEFT:
                case key == Keys.RIGHT:
                case key == Keys.TAB:
                case key == Keys.BACKSPACE:
                case key == Keys.DELETE:
                case key == Keys.ENTER:
                case key == Keys.HOME:
                case key == Keys.END:
                case key == Keys.ESCAPE:
                case e.ctrlKey || e.metaKey:
                    // allowed
                    break;
                default:
                    return _cancel(e);
                    break;
            }
        }
        function _cancel(e) {
            e.preventDefault();
            return false;
        }
        Core.Components.create('wr-numeric-input', {
            static: ['maxlength', 'placeholder', 'val'],
            initialize: function (el, data) {
                return new NumericInput(el, data);
            }
        });
    })(Common = Views.Common || (Views.Common = {}));
})(Views || (Views = {}));
var Views;
(function (Views) {
    var Common;
    (function (Common) {
        Core.Components.create('wr-preset', {
            static: [],
            initialize: function (el, data) {
                if (!(data.preset instanceof Core.Preset)) {
                    data.preset = new Core.Preset(data.preset);
                }
                return data;
            }
        });
    })(Common = Views.Common || (Views.Common = {}));
})(Views || (Views = {}));
/// <reference path="../../Core/CustomElement.ts" />
/// <reference path="../../Core/Components.ts" />
var Views;
(function (Views) {
    var Common;
    (function (Common) {
        class StatusToggle extends Core.CustomElement {
            constructor(node, data) {
                super(node, data);
            }
            get ischecked() {
                return this.getData('ischecked');
            }
            set ischecked(val) {
                this.setData('ischecked', val);
            }
        }
        StatusToggle._attributes = ['ischecked'];
        Common.StatusToggle = StatusToggle;
        Core.Components.create('wr-status-toggle', {
            static: ['on', 'off', 'ischecked'],
            initialize: function (el, data) {
                return new StatusToggle(el, data);
            }
        });
    })(Common = Views.Common || (Views.Common = {}));
})(Views || (Views = {}));
var Core;
(function (Core) {
    var Binders;
    (function (Binders) {
        class BaseBinding {
            publish() {
            }
            formattedValue(val) {
            }
        }
        Binders.BaseBinding = BaseBinding;
    })(Binders = Core.Binders || (Core.Binders = {}));
})(Core || (Core = {}));
/// <reference path="../../../typings/rivets.d.ts" />
/// <reference path="./BaseBinding.ts" />
var Core;
(function (Core) {
    var Binders;
    (function (Binders) {
        function AttributeBinding(el, value) {
            let bindings = this.view.bindings;
            for (let i = 0, l = bindings.length; i < l; i++) {
                if (el === bindings[i].el && bindings[i].componentView) {
                    let view = bindings[i].componentView;
                    view.models = view.models || [];
                    view.models[this.type] = value;
                }
            }
            if (value) {
                el.setAttribute(this.type, value);
            }
            else {
                el.removeAttribute(this.type);
            }
        }
        Binders.AttributeBinding = AttributeBinding;
        rivets.binders['*'] = AttributeBinding;
    })(Binders = Core.Binders || (Core.Binders = {}));
})(Core || (Core = {}));
/// <reference path="../../../typings/rivets.d.ts" />
/// <reference path="./BaseBinding.ts" />
var Core;
(function (Core) {
    var Binders;
    (function (Binders) {
        class DeepBinding extends Binders.BaseBinding {
            constructor() {
                super(...arguments);
                this.publishes = true;
                this.priority = 3000;
            }
            bind(el) {
                this.model && el.addEventListener(this.args[0] + '-change', this.publish, false);
            }
            unbind(el) {
                el.removeEventListener(this.args[0] + '-change', this.publish, false);
            }
            routine(el, value) {
                if (!this.model) {
                    return false;
                }
                el._data = el._data || {};
                el._data[this.args[0]] = this.formattedValue(value);
                el.dispatchEvent(new CustomEvent(this.args[0] + '-update'));
            }
            getValue(el) {
                return this.formattedValue(el._data ? el._data[this.args[0]] : null);
            }
        }
        Binders.DeepBinding = DeepBinding;
        rivets.binders['deep-*'] = new DeepBinding();
    })(Binders = Core.Binders || (Core.Binders = {}));
})(Core || (Core = {}));
/// <reference path="../../../typings/rivets.d.ts" />
var Core;
(function (Core) {
    var Formatters;
    (function (Formatters) {
        function FriendlyCmdShortcut(value) {
            return String(value)
                .replace(/\+/g, ' + ')
                .replace('Command', 'Cmd')
                .replace(' Arrow', '')
                || '<not set>';
        }
        Formatters.FriendlyCmdShortcut = FriendlyCmdShortcut;
        function FriendlyCmdDescription(cmd) {
            if (cmd.name === '_execute_browser_action') {
                return 'Show extension popup';
            }
            return cmd.description || cmd.shortcut;
        }
        Formatters.FriendlyCmdDescription = FriendlyCmdDescription;
        rivets.formatters['FriendlyCmdShortcut'] = FriendlyCmdShortcut;
        rivets.formatters['FriendlyCmdDescription'] = FriendlyCmdDescription;
    })(Formatters = Core.Formatters || (Core.Formatters = {}));
})(Core || (Core = {}));
/// <reference path="../../../typings/rivets.d.ts" />
var Core;
(function (Core) {
    var Formatters;
    (function (Formatters) {
        function FriendlyDate(value) {
            var d = new Date(`${value} +00:00`);
            return d.toLocaleString();
        }
        Formatters.FriendlyDate = FriendlyDate;
        rivets.formatters['FriendlyDate'] = FriendlyDate;
    })(Formatters = Core.Formatters || (Core.Formatters = {}));
})(Core || (Core = {}));
/// <reference path="../../../typings/rivets.d.ts" />
var Core;
(function (Core) {
    var Formatters;
    (function (Formatters) {
        Formatters.IntAndNull = {
            read: function (value) {
                let val = parseInt(value, 10);
                return isNaN(val) ? null : val;
            },
            publish: function (value) {
                let val = parseInt(value, 10);
                return isNaN(val) ? null : val;
            }
        };
        rivets.formatters['IntAndNull'] = Formatters.IntAndNull;
    })(Formatters = Core.Formatters || (Core.Formatters = {}));
})(Core || (Core = {}));
/// <reference path="../../../typings/rivets.d.ts" />
var Core;
(function (Core) {
    var Formatters;
    (function (Formatters) {
        Formatters.IntOrNull = {
            read: function (value) {
                return parseInt(value, 10) || null;
            },
            publish: function (value) {
                return parseInt(value, 10) || null;
            }
        };
        rivets.formatters['IntOrNull'] = Formatters.IntOrNull;
    })(Formatters = Core.Formatters || (Core.Formatters = {}));
})(Core || (Core = {}));
/// <reference path="../../../typings/rivets.d.ts" />
var Core;
(function (Core) {
    var Formatters;
    (function (Formatters) {
        function Negate(value) {
            return !value;
        }
        Formatters.Negate = Negate;
        rivets.formatters['Negate'] = Negate;
    })(Formatters = Core.Formatters || (Core.Formatters = {}));
})(Core || (Core = {}));
/// <reference path="../../../typings/rivets.d.ts" />
var Core;
(function (Core) {
    var Formatters;
    (function (Formatters) {
        Formatters.Nullify = {
            read: function (value) {
                return value || null;
            },
            publish: function (value) {
                return value || null;
            }
        };
        rivets.formatters['Nullify'] = Formatters.Nullify;
    })(Formatters = Core.Formatters || (Core.Formatters = {}));
})(Core || (Core = {}));
/// <reference path="../../../typings/rivets.d.ts" />
var Core;
(function (Core) {
    var Formatters;
    (function (Formatters) {
        function Stringify(value) {
            return JSON.stringify(value);
        }
        Formatters.Stringify = Stringify;
        rivets.formatters['Stringify'] = Stringify;
    })(Formatters = Core.Formatters || (Core.Formatters = {}));
})(Core || (Core = {}));
/// <reference path="../../../typings/rivets.d.ts" />
var Core;
(function (Core) {
    var Formatters;
    (function (Formatters) {
        function ToBool(value) {
            return !!value;
        }
        Formatters.ToBool = ToBool;
        function ArrayNotEmpty(value) {
            return value && value.length;
        }
        Formatters.ArrayNotEmpty = ArrayNotEmpty;
        Formatters.IntToBool = {
            read: function (value) {
                return !!value;
            },
            publish: function (value) {
                return value ? 1 : 0;
            }
        };
        rivets.formatters['ToBool'] = ToBool;
        rivets.formatters['IntToBool'] = Formatters.IntToBool;
        rivets.formatters['ArrayNotEmpty'] = ArrayNotEmpty;
    })(Formatters = Core.Formatters || (Core.Formatters = {}));
})(Core || (Core = {}));
/// <reference path="../../../typings/rivets.d.ts" />
var Core;
(function (Core) {
    var Formatters;
    (function (Formatters) {
        Formatters.ToInt = {
            read: function (value) {
                return parseInt(value, 10) || 0;
            },
            publish: function (value) {
                return parseInt(value, 10) || 0;
            }
        };
        rivets.formatters['ToInt'] = Formatters.ToInt;
    })(Formatters = Core.Formatters || (Core.Formatters = {}));
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb3JlL1RlbXBsYXRlUmVnaXN0cnkudHMiLCJzcmMvY29yZS9Db21wb25lbnRzLnRzIiwic3JjL2NvcmUvQ3VzdG9tRWxlbWVudC50cyIsInNyYy9jb3JlL0RlY29yYXRvcnMvQ29tcHV0ZWRGcm9tLnRzIiwic3JjL2NvcmUvVXRpbHMvRW51bXMudHMiLCJzcmMvY29yZS9VdGlscy9VVUlELnRzIiwic3JjL2NvcmUvUHJlc2V0LnRzIiwic3JjL3ZpZXdzL2NvbW1vbi9pY29uLnRzIiwic3JjL0NvcmUvVXRpbHMvRE9NLnRzIiwic3JjL3ZpZXdzL2NvbW1vbi9Nb2RhbC50cyIsInNyYy9Db3JlL0lucHV0L0tleXMudHMiLCJzcmMvdmlld3MvY29tbW9uL251bWVyaWMtaW5wdXQudHMiLCJzcmMvdmlld3MvY29tbW9uL3ByZXNldC50cyIsInNyYy92aWV3cy9jb21tb24vc3RhdHVzLXRvZ2dsZS50cyIsInNyYy9jb3JlL0JpbmRlcnMvQmFzZUJpbmRpbmcudHMiLCJzcmMvY29yZS9CaW5kZXJzL0F0dHJpYnV0ZUJpbmRpbmcudHMiLCJzcmMvY29yZS9CaW5kZXJzL0RlZXBCaW5kaW5nLnRzIiwic3JjL2NvcmUvRm9ybWF0dGVycy9GcmllbmRseUNvbW1hbmRzLnRzIiwic3JjL2NvcmUvRm9ybWF0dGVycy9GcmllbmRseURhdGUudHMiLCJzcmMvY29yZS9Gb3JtYXR0ZXJzL0ludEFuZE51bGwudHMiLCJzcmMvY29yZS9Gb3JtYXR0ZXJzL0ludE9yTnVsbC50cyIsInNyYy9jb3JlL0Zvcm1hdHRlcnMvTmVnYXRlLnRzIiwic3JjL2NvcmUvRm9ybWF0dGVycy9OdWxsaWZ5LnRzIiwic3JjL2NvcmUvRm9ybWF0dGVycy9TdHJpbmdpZnkudHMiLCJzcmMvY29yZS9Gb3JtYXR0ZXJzL1RvQm9vbC50cyIsInNyYy9jb3JlL0Zvcm1hdHRlcnMvVG9JbnQudHMiLCJzcmMvY29yZS9VdGlscy9SZXF1ZXN0LnRzIiwic3JjL2NvcmUvVXRpbHMvVW5pcXVlU3RhY2sudHMiLCJzcmMvY29yZS9VdGlscy9VdGlscy50cyIsInNyYy9jb3JlL1V0aWxzL0RpY3Rpb25hcmllcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxnREFBZ0Q7QUFFaEQsSUFBTyxJQUFJLENBY1Y7QUFkRCxXQUFPLElBQUk7SUFHVixNQUFhLGdCQUFnQjtRQUc1QixNQUFNLENBQUMsV0FBVyxDQUFDLEVBQVU7WUFDNUIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRTtnQkFDakMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7YUFDMUQ7WUFFRCxPQUFxQixnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xFLENBQUM7O0lBUk0sdUJBQU0sR0FBdUIsRUFBRSxDQUFDO0lBRDNCLHFCQUFnQixtQkFVNUIsQ0FBQTtBQUNGLENBQUMsRUFkTSxJQUFJLEtBQUosSUFBSSxRQWNWO0FDaEJELGtEQUFrRDtBQUNsRCw4Q0FBOEM7QUFFOUMsSUFBTyxJQUFJLENBd0NWO0FBeENELFdBQU8sSUFBSTtJQUFDLElBQUEsVUFBVSxDQXdDckI7SUF4Q1csV0FBQSxVQUFVO1FBQ3JCLGdDQUFnQztRQUNoQyxrRUFBa0U7UUFDbEUsSUFBSTtRQUVKLFNBQVMsVUFBVSxDQUFDLE9BQW9CLEVBQUUsSUFBUztZQUNsRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxTQUFnQixNQUFNLENBQUMsSUFBWSxFQUFFLE1BQVk7WUFDaEQsTUFBTSxHQUFHLE1BQU0sSUFBSTtnQkFDbEIsSUFBSSxFQUFFLElBQUk7Z0JBQ1YsTUFBTSxFQUFFLElBQUk7Z0JBQ1osUUFBUSxFQUFFLElBQUk7Z0JBQ2QsVUFBVSxFQUFFLElBQUk7YUFDaEIsQ0FBQTtZQUVELE9BQU8sTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJ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WSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBRXRFLE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUxlLFlBQU0sU0FLckIsQ0FBQTtJQUNGLENBQUMsRUFQVyxLQUFLLEdBQUwsVUFBSyxLQUFMLFVBQUssUUFPaEI7QUFBRCxDQUFDLEVBUE0sSUFBSSxLQUFKLElBQUksUUFPViIsImZpbGUiOiJjb3JlL2NvbW1vbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL1V0aWxzL0RpY3Rpb25hcmllcy50c1wiIC8+XHJcblxyXG5tb2R1bGUgQ29yZSB7XHJcblx0aW1wb3J0IElEaWN0ID0gQ29yZS5VdGlscy5JRGljdDtcclxuXHJcblx0ZXhwb3J0IGNsYXNzIFRlbXBsYXRlUmVnaXN0cnkge1xyXG5cdFx0c3RhdGljIF9jYWNoZTogSURpY3Q8SFRNTEVsZW1lbnQ+ID0ge307XHJcblxyXG5cdFx0c3RhdGljIGdldFRlbXBsYXRlKGlkOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XHJcblx0XHRcdGlmICghVGVtcGxhdGVSZWdpc3RyeS5fY2FjaGVbaWRdKSB7XHJcblx0XHRcdFx0VGVtcGxhdGVSZWdpc3RyeS5fY2FjaGVbaWRdID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gPEhUTUxFbGVtZW50PiBUZW1wbGF0ZVJlZ2lzdHJ5Ll9jYWNoZVtpZF0uY2xvbmVOb2RlKHRydWUpO1xyXG5cdFx0fVxyXG5cdH1cclxufVxyXG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vdHlwaW5ncy9yaXZldHMuZC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL1RlbXBsYXRlUmVnaXN0cnkudHNcIiAvPlxyXG5cclxubW9kdWxlIENvcmUuQ29tcG9uZW50cyB7XHJcblx0Ly8gZnVuY3Rpb24gdGVtcGxhdGUoKTogc3RyaW5nIHtcclxuXHQvLyBcdHJldHVybiBDb3JlLlRlbXBsYXRlUmVnaXN0cnkuZ2V0VGVtcGxhdGUodGhpcy5jb21wb25lbnQubmFtZSk7XHJcblx0Ly8gfVxyXG5cclxuXHRmdW5jdGlvbiBpbml0aWFsaXplKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBkYXRhOiBhbnkpOiBhbnkge1xyXG5cdFx0cmV0dXJuIGRhdGE7XHJcblx0fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gY3JlYXRlKG5hbWU6IHN0cmluZywgY29uZmlnPzogYW55KTogcml2ZXRzLkNvbXBvbmVudCB7XHJcblx0XHRjb25maWcgPSBjb25maWcgfHwge1xyXG5cdFx0XHRuYW1lOiBudWxsLFxyXG5cdFx0XHRzdGF0aWM6IG51bGwsXHJcblx0XHRcdHRlbXBsYXRlOiBudWxsLFxyXG5cdFx0XHRpbml0aWFsaXplOiBudWxsLFxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiByaXZldHMuY29tcG9uZW50c1tuYW1lXSA9IHtcclxuXHRcdFx0bmFtZTogbmFtZSxcclxuXHRcdFx0c3RhdGljOiBjb25maWcuc3RhdGljIHx8IFtdLFxyXG5cdFx0XHR0ZW1wbGF0ZTogY29uZmlnLnRlbXBsYXRlIHx8IGZ1bmN0aW9uKGVsKSB7XHJcblx0XHRcdFx0ZWwgPSBlbCB8fCB0aGlzLmVsO1xyXG5cclxuXHRcdFx0XHRsZXQgY2hpbGRyZW46IE5vZGVbXSA9IFtdLnNsaWNlLmNhbGwoZWwgPyBlbC5jaGlsZHJlbiA6IFtdKTtcclxuXHRcdFx0XHRsZXQgdGVtcGxhdGU6IGFueSAgICA9IENvcmUuVGVtcGxhdGVSZWdpc3RyeS5nZXRUZW1wbGF0ZShuYW1lKTtcclxuXHRcdFx0XHRsZXQgY29udGVudDogTm9kZSAgICA9IHRlbXBsYXRlLmNvbnRlbnQucXVlcnlTZWxlY3RvcignY29udGVudCcpO1xyXG5cclxuXHRcdFx0XHRpZiAoY2hpbGRyZW4gJiYgY29udGVudCkge1xyXG5cdFx0XHRcdFx0Zm9yIChsZXQgbm9kZSBvZiBjaGlsZHJlbikge1xyXG5cdFx0XHRcdFx0XHRjb250ZW50LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKG5vZGUsIGNvbnRlbnQpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0Y29udGVudCAmJiBjb250ZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoY29udGVudCk7XHJcblxyXG5cdFx0XHRcdHJldHVybiB0ZW1wbGF0ZS5pbm5lckhUTUw7XHJcblx0XHRcdH0sXHJcblx0XHRcdGluaXRpYWxpemU6IGNvbmZpZy5pbml0aWFsaXplIHx8IGluaXRpYWxpemVcclxuXHRcdH1cclxuXHR9XHJcbn1cclxuIiwiXHJcbm1vZHVsZSBDb3JlIHtcclxuXHRleHBvcnQgaW50ZXJmYWNlIEVuaGFuY2VkSFRNTEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XHJcblx0XHRfZGF0YTogYW55O1xyXG5cdH1cclxuXHJcblx0aW50ZXJmYWNlIElDdXN0b21FbGVtZW50IHtcclxuXHRcdF9hdHRyaWJ1dGVzOiBzdHJpbmdbXTtcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBjbGFzcyBDdXN0b21FbGVtZW50IHtcclxuXHRcdHByb3RlY3RlZCBfbm9kZTogRW5oYW5jZWRIVE1MRWxlbWVudDtcclxuXHRcdHN0YXRpYyBfYXR0cmlidXRlczogc3RyaW5nW10gPSBbXTtcclxuXHJcblx0XHRjb25zdHJ1Y3Rvcihub2RlLCBkYXRhKSB7XHJcblx0XHRcdG5vZGUuX2RhdGEgPSBub2RlLl9kYXRhIHx8IHt9O1xyXG5cdFx0XHR0aGlzLl9ub2RlID0gbm9kZTtcclxuXHJcblx0XHRcdGZvciAobGV0IGtleSBpbiBkYXRhKSB7XHJcblx0XHRcdFx0aWYgKG5vZGUuX2RhdGFba2V5XSA9PT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0XHRub2RlLl9kYXRhW2tleV0gPSBkYXRhW2tleV07XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHR0aGlzW2tleV0gPSB0aGlzLmdldERhdGEoa2V5KTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0bGV0IHNlbGY6IElDdXN0b21FbGVtZW50ID0gPGFueT4gdGhpcy5jb25zdHJ1Y3RvcjtcclxuXHRcdFx0Zm9yIChsZXQgYXR0ciBvZiBzZWxmLl9hdHRyaWJ1dGVzKSB7XHJcblx0XHRcdFx0dGhpcy5fbGlua0F0dHIoYXR0cik7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRnZXREYXRhKGtleSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5fbm9kZS5fZGF0YVtrZXldO1xyXG5cdFx0fVxyXG5cclxuXHRcdHNldERhdGEoa2V5LCB2YWwpIHtcclxuXHRcdFx0aWYgKHRoaXMuX25vZGUuX2RhdGFba2V5XSAhPT0gdmFsKSB7XHJcblx0XHRcdFx0dGhpcy5fbm9kZS5fZGF0YVtrZXldID0gdmFsO1xyXG5cdFx0XHRcdHRoaXMuX25vZGUuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoa2V5ICsgJy1jaGFuZ2UnKSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRfbGlua0F0dHIoa2V5KSB7XHJcblx0XHRcdHRoaXNba2V5XSA9IHRoaXMuZ2V0RGF0YShrZXkpO1xyXG5cclxuXHRcdFx0dGhpcy5fbm9kZS5hZGRFdmVudExpc3RlbmVyKGtleSArICctdXBkYXRlJywgKGUpID0+IHtcclxuXHRcdFx0XHR0aGlzW2tleV0gPSB0aGlzLmdldERhdGEoa2V5KTtcclxuXHRcdFx0fSwgZmFsc2UpO1xyXG5cdFx0fVxyXG5cdH1cclxufSIsIlxyXG5cclxubW9kdWxlIENvcmUuRGVjb3JhdG9ycyB7XHJcblx0ZXhwb3J0IGZ1bmN0aW9uIENvbXB1dGVkRnJvbSguLi5rZXlzOiBzdHJpbmdbXSk6IE1ldGhvZERlY29yYXRvciB7XHJcblx0XHRyZXR1cm4gZnVuY3Rpb24gQ29tcHV0ZWRGcm9tKHRhcmdldDogYW55LCBrZXk6IHN0cmluZywgZGVzY3JpcHRvcjogYW55KTogdm9pZCB7XHJcblx0XHRcdHRhcmdldC5fX2RlcGVuZGVuY2llcyA9IHRhcmdldC5fX2RlcGVuZGVuY2llcyB8fCB7fTtcclxuXHRcdFx0dGFyZ2V0Ll9fZGVwZW5kZW5jaWVzW2tleV0gPSBrZXlzO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0dmFyIE9ic2VydmUgPSByaXZldHMuXy5CaW5kaW5nLnByb3RvdHlwZS5vYnNlcnZlO1xyXG5cdHJpdmV0cy5fLkJpbmRpbmcucHJvdG90eXBlLm9ic2VydmUgPSBmdW5jdGlvbihvYmo6IGFueSwga2V5cGF0aDogYW55LCBjYWxsYmFjazogYW55KTogYW55IHtcclxuXHRcdHZhciBwYXRoID0ga2V5cGF0aC5zcGxpdCgnLicpO1xyXG5cdFx0dmFyIHJvb3QsIHByb3A7XHJcblxyXG5cdFx0aWYgKHBhdGgubGVuZ3RoIDwgMikge1xyXG5cdFx0XHRyb290ID0gb2JqO1xyXG5cdFx0XHRwcm9wID0gcGF0aFswXTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHJvb3QgPSBvYmpbcGF0aFswXV07XHJcblx0XHRcdHByb3AgPSBwYXRoWzFdO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChyb290ICYmIHJvb3QuX19kZXBlbmRlbmNpZXMpIHtcclxuXHRcdFx0dGhpcy5vcHRpb25zID0gdGhpcy5vcHRpb25zIHx8IHt9O1xyXG5cdFx0XHR0aGlzLm9wdGlvbnMuZGVwZW5kZW5jaWVzID0gdGhpcy5vcHRpb25zLmRlcGVuZGVuY2llcyB8fCByb290Ll9fZGVwZW5kZW5jaWVzW3Byb3BdO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIE9ic2VydmUuY2FsbCh0aGlzLCBvYmosIGtleXBhdGgsIGNhbGxiYWNrKTtcclxuXHR9XHJcbn1cclxuIiwiXHJcbm1vZHVsZSBDb3JlIHtcclxuXHRleHBvcnQgZW51bSBQcmVzZXRUeXBlIHtcclxuXHRcdFBIT05FID0gMCxcclxuXHRcdFRBQkxFVCxcclxuXHRcdExBUFRPUCxcclxuXHRcdERFU0tUT1BcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBlbnVtIFByZXNldFRhcmdldCB7XHJcblx0XHRXSU5ET1cgPSAwLFxyXG5cdFx0VklFV1BPUlRcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBlbnVtIFByZXNldFBvc2l0aW9uIHtcclxuXHRcdERFRkFVTFQgPSAwLFxyXG5cdFx0Q1VTVE9NLFxyXG5cdFx0Q0VOVEVSXHJcblx0fVxyXG5cclxuXHRleHBvcnQgZW51bSBQb3B1cEljb25TdHlsZSB7XHJcblx0XHRNT05PQ0hST01FID0gMCxcclxuXHRcdENPTE9SRUQsXHJcblx0XHRDT05UUkFTVFxyXG5cdH1cclxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi8uLi90eXBpbmdzL2h0bWw1LmQudHNcIiAvPlxyXG5cclxubW9kdWxlIENvcmUuVXRpbHMge1xyXG5cdGV4cG9ydCBmdW5jdGlvbiBVVUlEKCk6IHN0cmluZyB7XHJcblx0XHRsZXQgdXVpZDogc3RyaW5nO1xyXG5cdFx0bGV0IGJ5dGVzID0gY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhuZXcgVWludDhBcnJheSgyMSkpO1xyXG5cdFx0bGV0IGhleGVkID0gdmFsID0+ICh2YWwgJSAxNikudG9TdHJpbmcoMTYpO1xyXG5cclxuXHRcdGJ5dGVzWzEyXSA9IDQ7XHJcblx0XHRieXRlc1sxNl0gPSBieXRlc1sxNl0gJiAweDMgfCAweDg7XHJcblxyXG5cdFx0dXVpZCA9IEFycmF5LmZyb20oYnl0ZXMsIGhleGVkKS5qb2luKCcnKTtcclxuXHRcdHV1aWQgPSB1dWlkICsgRGF0ZS5ub3coKS50b1N0cmluZygxNik7XHJcblx0XHR1dWlkID0gdXVpZC5yZXBsYWNlKC9eKC57OH0pKC57NH0pKC57NH0pKC57NH0pLywgJyQxLSQyLSQzLSQ0LScpO1xyXG5cclxuXHRcdHJldHVybiB1dWlkLnRvVXBwZXJDYXNlKCk7XHJcblx0fVxyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vRGVjb3JhdG9ycy9Db21wdXRlZEZyb20udHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vVXRpbHMvRW51bXMudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vVXRpbHMvVVVJRC50c1wiIC8+XG5cbm1vZHVsZSBDb3JlIHtcblx0aW1wb3J0IENvbXB1dGVkRnJvbSA9IENvcmUuRGVjb3JhdG9ycy5Db21wdXRlZEZyb207XG5cblx0ZXhwb3J0IGNsYXNzIFByZXNldCB7XG5cdFx0aWQ6IHN0cmluZztcblx0XHR3aWR0aDogbnVtYmVyO1xuXHRcdGhlaWdodDogbnVtYmVyO1xuXHRcdHRvcDogbnVtYmVyO1xuXHRcdGxlZnQ6IG51bWJlcjtcblx0XHRkZXNjcmlwdGlvbjogc3RyaW5nO1xuXHRcdHBvc2l0aW9uOiBQcmVzZXRQb3NpdGlvbjtcblx0XHR0eXBlOiBQcmVzZXRUeXBlO1xuXHRcdHRhcmdldDogUHJlc2V0VGFyZ2V0O1xuXG5cdFx0Y29uc3RydWN0b3IoZGF0YTogYW55KSB7XG5cdFx0XHR0aGlzLmlkID0gZGF0YS5pZCB8fCBDb3JlLlV0aWxzLlVVSUQoKTtcblx0XHRcdHRoaXMud2lkdGggPSBkYXRhLndpZHRoIHx8IG51bGw7XG5cdFx0XHR0aGlzLmhlaWdodCA9IGRhdGEuaGVpZ2h0IHx8IG51bGw7XG5cdFx0XHR0aGlzLnRvcCA9IGlzTmFOKHBhcnNlSW50KGRhdGEudG9wLCAxMCkpID8gbnVsbCA6IGRhdGEudG9wO1xuXHRcdFx0dGhpcy5sZWZ0ID0gaXNOYU4ocGFyc2VJbnQoZGF0YS5sZWZ0LCAxMCkpID8gbnVsbCA6IGRhdGEubGVmdDtcblx0XHRcdHRoaXMuZGVzY3JpcHRpb24gPSBkYXRhLmRlc2NyaXB0aW9uIHx8IG51bGw7XG5cdFx0XHR0aGlzLnBvc2l0aW9uID0gZGF0YS5wb3NpdGlvbiB8fCBQcmVzZXRQb3NpdGlvbi5ERUZBVUxUO1xuXHRcdFx0dGhpcy50eXBlID0gcGFyc2VJbnQoZGF0YS50eXBlLCAxMCkgPT0gZGF0YS50eXBlID8gZGF0YS50eXBlIDogUHJlc2V0VHlwZS5ERVNLVE9QO1xuXHRcdFx0dGhpcy50YXJnZXQgPSBkYXRhLnRhcmdldCB8fCBQcmVzZXRUYXJnZXQuV0lORE9XO1xuXHRcdH1cblxuXHRcdEBDb21wdXRlZEZyb20oJ3dpZHRoJywgJ2hlaWdodCcpXG5cdFx0dGl0bGUoKSB7XG5cdFx0XHRsZXQgdGl0bGU6IHN0cmluZyA9IHRoaXMud2lkdGggKyAnICZ0aW1lczsgJyArIHRoaXMuaGVpZ2h0O1xuXG5cdFx0XHRpZiAoIXRoaXMud2lkdGgpIHtcblx0XHRcdFx0dGl0bGUgPSAnPGVtPkhlaWdodDo8L2VtPiAnICsgdGhpcy5oZWlnaHQ7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghdGhpcy5oZWlnaHQpIHtcblx0XHRcdFx0dGl0bGUgPSAnPGVtPldpZHRoOjwvZW0+ICcgKyB0aGlzLndpZHRoO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdGl0bGU7XG5cdFx0fVxuXG5cdFx0QENvbXB1dGVkRnJvbSgndHlwZScpXG5cdFx0aWNvbigpIHtcblx0XHRcdGxldCBpY29uID0gJyc7XG5cblx0XHRcdHN3aXRjaCAodGhpcy50eXBlKSB7XG5cdFx0XHRcdGNhc2UgUHJlc2V0VHlwZS5QSE9ORSA6XG5cdFx0XHRcdFx0aWNvbiA9ICcjaWNvbi1waG9uZSc7XG5cdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdGNhc2UgUHJlc2V0VHlwZS5UQUJMRVQgOlxuXHRcdFx0XHRcdGljb24gPSAnI2ljb24tdGFibGV0Jztcblx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0Y2FzZSBQcmVzZXRUeXBlLkxBUFRPUCA6XG5cdFx0XHRcdFx0aWNvbiA9ICcjaWNvbi1sYXB0b3AnO1xuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdGljb24gPSAnI2ljb24tZGVza3RvcCc7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gaWNvbjtcblx0XHR9XG5cdH1cblxuXHRleHBvcnQgaW50ZXJmYWNlIElQcmVzZXQge1xuXHRcdGlkPzogc3RyaW5nO1xuXHRcdHdpZHRoPzogbnVtYmVyO1xuXHRcdGhlaWdodD86IG51bWJlcjtcblx0XHRkZXNjcmlwdGlvbj86IHN0cmluZztcblx0XHRwb3NpdGlvbj86IFByZXNldFBvc2l0aW9uO1xuXHRcdHR5cGU/OiBQcmVzZXRUeXBlO1xuXHRcdHRhcmdldD86IFByZXNldFRhcmdldDtcblx0fVxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi9Db3JlL0N1c3RvbUVsZW1lbnQudHNcIiAvPlxyXG5cclxubW9kdWxlIFZpZXdzLkNvbW1vbiB7XHJcblx0ZXhwb3J0IGNsYXNzIEljb24gZXh0ZW5kcyBDb3JlLkN1c3RvbUVsZW1lbnQge1xyXG5cdFx0c3RhdGljIF9hdHRyaWJ1dGVzID0gW107XHJcblxyXG5cdFx0Y29uc3RydWN0b3Iobm9kZSwgZGF0YSkge1xyXG5cdFx0XHRzdXBlcihub2RlLCBkYXRhKTtcclxuXHRcdFx0dGhpcy5zcmMgPSBkYXRhLnNyYztcclxuXHRcdH1cclxuXHJcblx0XHRnZXQgc3JjKCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5nZXREYXRhKCdzcmMnKTtcclxuXHRcdH1cclxuXHJcblx0XHRzZXQgc3JjKHZhbCkge1xyXG5cdFx0XHR0aGlzLnNldERhdGEoJ3NyYycsIHZhbCk7XHJcblx0XHRcdHRoaXMuX3NldFNyYyh2YWwpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHByaXZhdGUgX3NldFNyYyh2YWwpIHtcclxuXHRcdFx0dmFyIHN2ZywgdXNlO1xyXG5cclxuXHRcdFx0c3ZnID0gdGhpcy5fbm9kZS5xdWVyeVNlbGVjdG9yKCdzdmcnKTtcclxuXHJcblx0XHRcdGlmICh2YWwgJiYgdmFsWzBdID09ICcjJykge1xyXG5cdFx0XHRcdHZhbCA9ICcuLi9hc3NldHMvaWNvbnMvc3ByaXRlLnN2ZycgKyB2YWw7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHdoaWxlIChzdmcuZmlyc3RDaGlsZCkge1xyXG5cdFx0XHRcdHN2Zy5yZW1vdmVDaGlsZChzdmcuZmlyc3RDaGlsZCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmICh2YWwpIHtcclxuXHRcdFx0XHR1c2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgJ3VzZScpO1xyXG5cdFx0XHRcdHVzZS5zZXRBdHRyaWJ1dGVOUygnaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluaycsICdocmVmJywgdmFsKTtcclxuXHRcdFx0XHRzdmcuYXBwZW5kQ2hpbGQodXNlKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Q29yZS5Db21wb25lbnRzLmNyZWF0ZSgnd3ItaWNvbicsIHtcclxuXHRcdHN0YXRpYzogWydjbGFzcycsICdzcmMnXSxcclxuXHRcdGluaXRpYWxpemU6IGZ1bmN0aW9uKGVsLCBkYXRhKSB7XHJcblx0XHRcdGRhdGEuc3JjID0gZGF0YS5zcmMgfHwgZWwuZ2V0QXR0cmlidXRlKCdzcmMnKTtcclxuXHRcdFx0cmV0dXJuIG5ldyBJY29uKGVsLCBkYXRhKTtcclxuXHRcdH1cclxuXHR9KVxyXG59IiwibW9kdWxlIENvcmUuVXRpbHMuRE9NIHtcclxuXHRleHBvcnQgZnVuY3Rpb24gcShzZWxlY3Rvcjogc3RyaW5nIHwgSFRNTEVsZW1lbnQsIGNvbnRleHQ/OiBFbGVtZW50KTogSFRNTEVsZW1lbnQge1xyXG5cdFx0aWYgKHR5cGVvZiBzZWxlY3RvciAhPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0cmV0dXJuIHNlbGVjdG9yO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiA8SFRNTEVsZW1lbnQ+IChjb250ZXh0IHx8IGRvY3VtZW50KS5xdWVyeVNlbGVjdG9yKDxzdHJpbmc+IHNlbGVjdG9yKTtcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBmdW5jdGlvbiBxQWxsKHNlbGVjdG9yOiBzdHJpbmcgfCBOb2RlTGlzdCB8IEhUTUxFbGVtZW50W10sIGNvbnRleHQ/OiBFbGVtZW50KTogSFRNTEVsZW1lbnRbXSB7XHJcblx0XHRsZXQgcmVzdWx0ID0gc2VsZWN0b3I7XHJcblxyXG5cdFx0aWYgKHR5cGVvZiBzZWxlY3RvciA9PT0gJ3N0cmluZycpIHtcclxuXHRcdFx0cmVzdWx0ID0gKGNvbnRleHQgfHwgZG9jdW1lbnQpLnF1ZXJ5U2VsZWN0b3JBbGwoPHN0cmluZz4gc2VsZWN0b3IpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBbXS5zbGljZS5jYWxsKHJlc3VsdCk7XHJcblx0fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gb24oZXZlbnQ6IHN0cmluZywgdGFyZ2V0OiBzdHJpbmcgfCBOb2RlLCBsaXN0ZW5lcjogRnVuY3Rpb24sIGNhcHR1cmU/OiBib29sZWFuKSB7XHJcblx0XHRsZXQgbm9kZSA9IHEoPEhUTUxFbGVtZW50PiB0YXJnZXQpO1xyXG5cdFx0Y2FwdHVyZSA9ICEhY2FwdHVyZTtcclxuXHJcblx0XHRpZiAobm9kZSkge1xyXG5cdFx0XHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIDxFdmVudExpc3RlbmVyPiBsaXN0ZW5lciwgY2FwdHVyZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gdHJpZ2dlcihldmVudDogc3RyaW5nLCB0YXJnZXQ6IHN0cmluZyB8IE5vZGUsIGNvbmZpZz86IGFueSkge1xyXG5cdFx0bGV0IG5vZGUgPSBxKDxIVE1MRWxlbWVudD4gdGFyZ2V0KTtcclxuXHJcblx0XHRpZiAobm9kZSkge1xyXG5cdFx0XHRub2RlLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KGV2ZW50LCBjb25maWcpKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGV4cG9ydCBmdW5jdGlvbiByZW1vdmUoc2VsZWN0b3I6IHN0cmluZyB8IEhUTUxFbGVtZW50LCBjb250ZXh0PzogRWxlbWVudCk6IEhUTUxFbGVtZW50IHtcclxuXHRcdGxldCBub2RlID0gcSg8SFRNTEVsZW1lbnQ+IHNlbGVjdG9yKTtcclxuXHJcblx0XHRub2RlICYmIG5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcclxuXHJcblx0XHRyZXR1cm4gbm9kZTtcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBmdW5jdGlvbiBhZGRDbGFzcyh0YXJnZXQ6IHN0cmluZyB8IEhUTUxFbGVtZW50LCBjbGFzc05hbWU6IHN0cmluZykge1xyXG5cdFx0bGV0IG5vZGUgPSBxKHRhcmdldCk7XHJcblxyXG5cdFx0aWYgKG5vZGUpIHtcclxuXHRcdFx0bm9kZS5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gcmVtb3ZlQ2xhc3ModGFyZ2V0OiBzdHJpbmcgfCBIVE1MRWxlbWVudCwgY2xhc3NOYW1lOiBzdHJpbmcpIHtcclxuXHRcdGxldCBub2RlID0gcSh0YXJnZXQpO1xyXG5cclxuXHRcdGlmIChub2RlKSB7XHJcblx0XHRcdG5vZGUuY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIHRvZ2dsZUNsYXNzKHRhcmdldDogc3RyaW5nIHwgSFRNTEVsZW1lbnQsIGNsYXNzTmFtZTogc3RyaW5nKSB7XHJcblx0XHRsZXQgbm9kZSA9IHEodGFyZ2V0KTtcclxuXHJcblx0XHRpZiAobm9kZSkge1xyXG5cdFx0XHRub2RlLmNsYXNzTGlzdC50b2dnbGUoY2xhc3NOYW1lKTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gaGFzQ2xhc3Mobm9kZSwgY2xhc3NOYW1lKTtcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBmdW5jdGlvbiBoYXNDbGFzcyh0YXJnZXQ6IHN0cmluZyB8IEhUTUxFbGVtZW50LCBjbGFzc05hbWU6IHN0cmluZykge1xyXG5cdFx0bGV0IG5vZGUgPSBxKHRhcmdldCk7XHJcblxyXG5cdFx0aWYgKG5vZGUpIHtcclxuXHRcdFx0cmV0dXJuIG5vZGUuY2xhc3NMaXN0LmNvbnRhaW5zKGNsYXNzTmFtZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gZW1wdHkodGFyZ2V0OiBzdHJpbmcgfCBIVE1MRWxlbWVudCkge1xyXG5cdFx0bGV0IG5vZGUgPSBxKHRhcmdldCk7XHJcblxyXG5cdFx0d2hpbGUgKG5vZGUuZmlyc3RDaGlsZCkge1xyXG5cdFx0XHRub2RlLnJlbW92ZUNoaWxkKG5vZGUuZmlyc3RDaGlsZCk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gaGlkZSh0YXJnZXQ6IHN0cmluZyB8IEhUTUxFbGVtZW50LCBjbGFzc05hbWU/OiBzdHJpbmcsIHdhaXRGb3I/OiBIVE1MRWxlbWVudCk6IFByb21pc2U8YW55PiB7XHJcblx0XHRyZXR1cm4gX3RvZ2dsZUNsYXNzKHRhcmdldCwgZmFsc2UsIGNsYXNzTmFtZSwgd2FpdEZvcik7XHJcblx0fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gc2hvdyh0YXJnZXQ6IHN0cmluZyB8IEhUTUxFbGVtZW50LCBjbGFzc05hbWU/OiBzdHJpbmcsIHdhaXRGb3I/OiBIVE1MRWxlbWVudCk6IFByb21pc2U8YW55PiB7XHJcblx0XHRyZXR1cm4gX3RvZ2dsZUNsYXNzKHRhcmdldCwgdHJ1ZSwgY2xhc3NOYW1lLCB3YWl0Rm9yKTtcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBmdW5jdGlvbiBhbmltYXRlKHRhcmdldDogc3RyaW5nIHwgSFRNTEVsZW1lbnQsIGNsYXNzTmFtZT86IHN0cmluZywgcHJvcGVydHlOYW1lPzogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcclxuXHRcdHJldHVybiBfdG9nZ2xlQ2xhc3ModGFyZ2V0LCB0cnVlLCBjbGFzc05hbWUsIG51bGwsIHByb3BlcnR5TmFtZSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfaGFzVHJhbnNpdGlvbihub2RlOiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xyXG5cdFx0bGV0IGR1cmF0aW9uID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUobm9kZSkudHJhbnNpdGlvbkR1cmF0aW9uLnNwbGl0KCcsJyk7XHJcblxyXG5cdFx0Zm9yIChsZXQgcGFydCBvZiBkdXJhdGlvbikge1xyXG5cdFx0XHRpZiAocGFyc2VGbG9hdChwYXJ0KSA+IDApIHtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBmYWxzZTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF90b2dnbGVDbGFzcyh0YXJnZXQ6IHN0cmluZyB8IEhUTUxFbGVtZW50LCBzdGF0ZTogYm9vbGVhbiwgY2xhc3NOYW1lOiBzdHJpbmcgPSAndmlzaWJsZScsIHdhaXRGb3I/OiBIVE1MRWxlbWVudCwgcHJvcGVydHlOYW1lPzogc3RyaW5nKTogUHJvbWlzZTxIVE1MRWxlbWVudD4ge1xyXG5cdFx0dmFyIG5vZGUgPSBxKHRhcmdldCk7XHJcblx0XHR2YXIgYWN0aW9uID0gc3RhdGUgPyAnYWRkJyA6ICdyZW1vdmUnO1xyXG5cclxuXHRcdHdhaXRGb3IgPSB3YWl0Rm9yIHx8IG5vZGU7XHJcblxyXG5cdFx0aWYgKCFub2RlKSB7XHJcblx0XHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKCFfaGFzVHJhbnNpdGlvbih3YWl0Rm9yKSkge1xyXG5cdFx0XHRub2RlLmNsYXNzTGlzdFthY3Rpb25dKGNsYXNzTmFtZSk7XHJcblx0XHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUobm9kZSk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuXHRcdFx0ZnVuY3Rpb24gdHJhbnNpdGlvbkVuZGVkKGV2dCkge1xyXG5cdFx0XHRcdGlmICgoIXByb3BlcnR5TmFtZSB8fCBwcm9wZXJ0eU5hbWUgPT09IGV2dC5wcm9wZXJ0eU5hbWUpICYmIHdhaXRGb3IgPT09IGV2dC50YXJnZXQpIHtcclxuXHRcdFx0XHRcdHdhaXRGb3IucmVtb3ZlRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIHRyYW5zaXRpb25FbmRlZCk7XHJcblx0XHRcdFx0XHRyZXNvbHZlKHdhaXRGb3IpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0d2FpdEZvci5hZGRFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgdHJhbnNpdGlvbkVuZGVkKTtcclxuXHRcdFx0bm9kZS5jbGFzc0xpc3RbYWN0aW9uXShjbGFzc05hbWUpO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gZXZlbnRQYXRoKGV2dDogRXZlbnQpOiBIVE1MRWxlbWVudFtdIHtcclxuXHRcdGxldCBub2RlOk5vZGUgPSA8Tm9kZT4gKDxNb3VzZUV2ZW50PiBldnQpLnJlbGF0ZWRUYXJnZXQ7XHJcblx0XHRsZXQgcGF0aDpOb2RlW10gPSBbXTtcclxuXHJcblx0XHR3aGlsZSAobm9kZSA9IG5vZGUucGFyZW50Tm9kZSkge1xyXG5cdFx0XHRwYXRoLnB1c2gobm9kZSk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIDxIVE1MRWxlbWVudFtdPiBwYXRoO1xyXG5cdH1cclxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi8uLi90eXBpbmdzL3RhYi1uYXYuZC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi9Db3JlL1V0aWxzL0RPTS50c1wiIC8+XHJcblxyXG5cclxubW9kdWxlIFZpZXdzLkNvbW1vbiB7XHJcblx0aW1wb3J0ICQgPSBDb3JlLlV0aWxzLkRPTTtcclxuXHJcblx0Y29uc3QgS0VZX0VTQyA9IDI3O1xyXG5cclxuXHRleHBvcnQgY2xhc3MgTW9kYWxNZXNzYWdlIHtcclxuXHRcdHB1YmxpYyB2aXNpYmxlOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRwcml2YXRlIF9kaXNtaXNzOiBFdmVudExpc3RlbmVyO1xyXG5cclxuXHRcdGNvbnN0cnVjdG9yKFxyXG5cdFx0XHRwdWJsaWMgdGl0bGU6IHN0cmluZyxcclxuXHRcdFx0cHVibGljIG1lc3NhZ2U6IHN0cmluZyxcclxuXHRcdFx0cHVibGljIGJsb2NraW5nOiBib29sZWFuID0gZmFsc2UsXHJcblx0XHRcdHB1YmxpYyBhY3Rpb25zOiBNb2RhbE1lc3NhZ2VBY3Rpb25bXSA9IFtdLFxyXG5cdFx0XHRwdWJsaWMgb3B0aW9uczogYW55ID0ge30sXHJcblx0XHQpIHsgdGhpcy5zaG93KCk7IH1cclxuXHJcblx0XHRvbkNsb3NlID0gbmV3IE1vZGFsRXZlbnRSZWdpc3RyeSgpO1xyXG5cclxuXHRcdHNob3coKTogUHJvbWlzZTxhbnk+IHtcclxuXHRcdFx0cmV0dXJuICQuc2hvdyhkb2N1bWVudC5ib2R5LCAnd3JfbW9kYWxfdmlzaWJsZScpLnRoZW4oXyA9PiB7XHJcblx0XHRcdFx0bGV0IG1vZGFsICA9ICQucSgnLldSX21vZGFsJyk7XHJcblx0XHRcdFx0bGV0IGFjdGlvbiA9ICQucSgnLldSX21vZGFsX2FjdGlvbnMgLm1haW4nLCBtb2RhbCkgfHwgJC5xKCcuV1JfbW9kYWxfYWN0aW9ucyBidXR0b246bGFzdC1jaGlsZCcsIG1vZGFsKTtcclxuXHJcblx0XHRcdFx0aWYgKHRoaXMub3B0aW9ucy5jbGFzcykge1xyXG5cdFx0XHRcdFx0JC5hZGRDbGFzcyhtb2RhbCwgdGhpcy5vcHRpb25zLmNsYXNzKTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGFjdGlvbiAmJiBhY3Rpb24uZm9jdXMoKTtcclxuXHRcdFx0XHR0aGlzLnZpc2libGUgPSB0cnVlO1xyXG5cdFx0XHRcdFRhYk5hdi5saW1pdFRvKG1vZGFsKTtcclxuXHJcblx0XHRcdFx0aWYgKCF0aGlzLmJsb2NraW5nKSB7XHJcblx0XHRcdFx0XHR0aGlzLl9kaXNtaXNzID0gKGV2dDogS2V5Ym9hcmRFdmVudCkgPT4ge1xyXG5cdFx0XHRcdFx0XHRpZiAoZXZ0LmtleUNvZGUgPT09IEtFWV9FU0MpIHtcclxuXHRcdFx0XHRcdFx0XHRldnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0XHRcdFx0XHRldnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblxyXG5cdFx0XHRcdFx0XHRcdGZvciAobGV0IGFjdGlvbiBvZiB0aGlzLmFjdGlvbnMpIHtcclxuXHRcdFx0XHRcdFx0XHRcdGFjdGlvbi5vbkRpc21pc3MgJiYgYWN0aW9uLmhhbmRsZXIoKTtcclxuXHRcdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRcdHRoaXMuaGlkZSgpO1xyXG5cclxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuX2Rpc21pc3MpO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblx0XHRoaWRlKCk6IFByb21pc2U8YW55PiB7XHJcblx0XHRcdHJldHVybiAkLmhpZGUoZG9jdW1lbnQuYm9keSwgJ3dyX21vZGFsX3Zpc2libGUnLCAkLnEoJy5XUl9tb2RhbCcpKS50aGVuKF8gPT4ge1xyXG5cdFx0XHRcdHRoaXMudmlzaWJsZSA9IGZhbHNlO1xyXG5cdFx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5fZGlzbWlzcyk7XHJcblx0XHRcdFx0VGFiTmF2LnJlc2V0KCk7XHJcblx0XHRcdFx0dGhpcy5vbkNsb3NlLnRyaWdnZXIoKTtcclxuXHRcdFx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGludGVyZmFjZSBNb2RhbEV2ZW50SGFuZGxlciB7XHJcblx0XHQoZGF0YT86IGFueSk6IGFueTtcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBjbGFzcyBNb2RhbEV2ZW50UmVnaXN0cnkge1xyXG5cdFx0cHJpdmF0ZSBfaGFuZGxlcnM6IE1vZGFsRXZlbnRIYW5kbGVyW10gPSBbXTtcclxuXHJcblx0XHRjb25zdHJ1Y3RvcigpIHt9XHJcblxyXG5cdFx0YWRkTGlzdGVuZXIoaGFuZGxlcjogTW9kYWxFdmVudEhhbmRsZXIpOiBib29sZWFuIHtcclxuXHRcdFx0bGV0IGhhbmRsZXJzID0gdGhpcy5faGFuZGxlcnM7XHJcblx0XHRcdGxldCBleGlzdGluZyA9IGhhbmRsZXJzLmluZGV4T2YoaGFuZGxlcik7XHJcblxyXG5cdFx0XHRpZiAoZXhpc3RpbmcgPiAtMSkge1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aGFuZGxlcnMucHVzaChoYW5kbGVyKTtcclxuXHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJlbW92ZUxpc3RlbmVyKGhhbmRsZXI6IE1vZGFsRXZlbnRIYW5kbGVyKTogYm9vbGVhbiB7XHJcblx0XHRcdGxldCBoYW5kbGVycyA9IHRoaXMuX2hhbmRsZXJzO1xyXG5cdFx0XHRsZXQgZXhpc3RpbmcgPSBoYW5kbGVycy5pbmRleE9mKGhhbmRsZXIpO1xyXG5cclxuXHRcdFx0aWYgKGV4aXN0aW5nID09PSAtMSkge1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aGFuZGxlcnMuc3BsaWNlKGV4aXN0aW5nLCAxKTtcclxuXHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJlbW92ZUFsbExpc3RlbmVycygpIHtcclxuXHRcdFx0dGhpcy5faGFuZGxlcnMgPSBbXTtcclxuXHRcdH1cclxuXHJcblx0XHR0cmlnZ2VyKGNvbnRleHQ/OiBhbnksIGRhdGE/OiBhbnkpOiB2b2lkIHtcclxuXHRcdFx0Zm9yIChsZXQgaGFuZGxlciBvZiB0aGlzLl9oYW5kbGVycykge1xyXG5cdFx0XHRcdGhhbmRsZXIuY2FsbChjb250ZXh0LCBkYXRhKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGludGVyZmFjZSBNb2RhbE1lc3NhZ2VBY3Rpb24ge1xyXG5cdFx0dGl0bGU6IHN0cmluZztcclxuXHRcdGljb24/OiBzdHJpbmc7XHJcblx0XHRoYW5kbGVyOiBGdW5jdGlvbjtcclxuXHRcdG1haW4/OiBib29sZWFuO1xyXG5cdFx0b25EaXNtaXNzPzogYm9vbGVhbjtcclxuXHR9XHJcbn0iLCJcclxubW9kdWxlIENvcmUuSW5wdXQge1xyXG5cdGV4cG9ydCBjb25zdCBLZXlzID0ge1xyXG5cdFx0QkFDS1NQQUNFIDogOCxcclxuXHRcdFRBQiAgICAgICA6IDksXHJcblx0XHRFTlRFUiAgICAgOiAxMyxcclxuXHRcdFNISUZUICAgICA6IDE2LFxyXG5cdFx0QUxUICAgICAgIDogMTgsXHJcblx0XHRFU0NBUEUgICAgOiAyNyxcclxuXHRcdFNQQUNFICAgICA6IDMyLFxyXG5cdFx0RU5EICAgICAgIDogMzUsXHJcblx0XHRIT01FICAgICAgOiAzNixcclxuXHRcdExFRlQgICAgICA6IDM3LFxyXG5cdFx0VVAgICAgICAgIDogMzgsXHJcblx0XHRSSUdIVCAgICAgOiAzOSxcclxuXHRcdERPV04gICAgICA6IDQwLFxyXG5cdFx0REVMRVRFICAgIDogNDYsXHJcblx0XHRBUlJPV1MgICAgOiBbMzcsIDQwXSxcclxuXHRcdERJR0lUUyAgICA6IFs0OCwgNTddLFxyXG5cdFx0TlVNUEFEICAgIDogWzk2LCAxMDVdLFxyXG5cdFx0RlVOQyAgICAgIDogWzExMiwgMTIzXVxyXG5cdH1cclxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi9Db3JlL0N1c3RvbUVsZW1lbnQudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vQ29yZS9Db21wb25lbnRzLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL0NvcmUvSW5wdXQvS2V5cy50c1wiIC8+XHJcblxyXG5tb2R1bGUgVmlld3MuQ29tbW9uIHtcclxuXHRpbXBvcnQgS2V5cyA9IENvcmUuSW5wdXQuS2V5cztcclxuXHJcblx0ZXhwb3J0IGNsYXNzIE51bWVyaWNJbnB1dCBleHRlbmRzIENvcmUuQ3VzdG9tRWxlbWVudCB7XHJcblx0XHRzdGF0aWMgX2F0dHJpYnV0ZXMgPSBbJ3ZhbCddO1xyXG5cclxuXHRcdGNvbnN0cnVjdG9yKG5vZGUsIGRhdGEpIHtcclxuXHRcdFx0c3VwZXIobm9kZSwgZGF0YSk7XHJcblxyXG5cdFx0XHRub2RlLm9ua2V5ZG93biA9IGZpbHRlcktleXM7XHJcblx0XHR9XHJcblxyXG5cdFx0Z2V0IHZhbCgpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuZ2V0RGF0YSgndmFsJyk7XHJcblx0XHR9XHJcblxyXG5cdFx0c2V0IHZhbCh2YWwpIHtcclxuXHRcdFx0dGhpcy5zZXREYXRhKCd2YWwnLCB2YWwpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZmlsdGVyS2V5cyhlKSB7XHJcblx0XHR2YXIga2V5ID0gZS5rZXlDb2RlO1xyXG5cclxuXHRcdHN3aXRjaCAodHJ1ZSkge1xyXG5cdFx0XHRjYXNlICFlLnNoaWZ0S2V5ICYmIChrZXkgPj0gS2V5cy5ESUdJVFNbMF0gJiYga2V5IDw9IEtleXMuRElHSVRTWzFdKTpcclxuXHRcdFx0Y2FzZSAoa2V5ID49IEtleXMuTlVNUEFEWzBdICYmIGtleSA8PSBLZXlzLk5VTVBBRFsxXSk6XHJcblx0XHRcdGNhc2UgKGtleSA+PSBLZXlzLkZVTkNbMF0gJiYga2V5IDw9IEtleXMuRlVOQ1sxXSk6XHJcblx0XHRcdGNhc2Uga2V5ID09IEtleXMuTEVGVDpcclxuXHRcdFx0Y2FzZSBrZXkgPT0gS2V5cy5SSUdIVDpcclxuXHRcdFx0Y2FzZSBrZXkgPT0gS2V5cy5UQUI6XHJcblx0XHRcdGNhc2Uga2V5ID09IEtleXMuQkFDS1NQQUNFOlxyXG5cdFx0XHRjYXNlIGtleSA9PSBLZXlzLkRFTEVURTpcclxuXHRcdFx0Y2FzZSBrZXkgPT0gS2V5cy5FTlRFUjpcclxuXHRcdFx0Y2FzZSBrZXkgPT0gS2V5cy5IT01FOlxyXG5cdFx0XHRjYXNlIGtleSA9PSBLZXlzLkVORDpcclxuXHRcdFx0Y2FzZSBrZXkgPT0gS2V5cy5FU0NBUEU6XHJcblx0XHRcdGNhc2UgZS5jdHJsS2V5IHx8IGUubWV0YUtleTpcclxuXHRcdFx0XHQvLyBhbGxvd2VkXHJcblx0XHRcdGJyZWFrO1xyXG5cclxuXHRcdFx0ZGVmYXVsdDpcclxuXHRcdFx0XHRyZXR1cm4gX2NhbmNlbChlKTtcclxuXHRcdFx0YnJlYWs7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfY2FuY2VsKGUpIHtcclxuXHRcdGUucHJldmVudERlZmF1bHQoKTtcclxuXHRcdHJldHVybiBmYWxzZTtcclxuXHR9XHJcblxyXG5cdENvcmUuQ29tcG9uZW50cy5jcmVhdGUoJ3dyLW51bWVyaWMtaW5wdXQnLCB7XHJcblx0XHRzdGF0aWM6IFsnbWF4bGVuZ3RoJywgJ3BsYWNlaG9sZGVyJywgJ3ZhbCddLFxyXG5cdFx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oZWwsIGRhdGEpIHtcclxuXHRcdFx0cmV0dXJuIG5ldyBOdW1lcmljSW5wdXQoZWwsIGRhdGEpO1xyXG5cdFx0fVxyXG5cdH0pXHJcbn0iLCJcclxubW9kdWxlIFZpZXdzLkNvbW1vbiB7XHJcblx0Q29yZS5Db21wb25lbnRzLmNyZWF0ZSgnd3ItcHJlc2V0Jywge1xyXG5cdFx0c3RhdGljOiBbXSxcclxuXHRcdGluaXRpYWxpemU6IGZ1bmN0aW9uKGVsLCBkYXRhKSB7XHJcblx0XHRcdGlmICghKGRhdGEucHJlc2V0IGluc3RhbmNlb2YgQ29yZS5QcmVzZXQpKSB7XHJcblx0XHRcdFx0ZGF0YS5wcmVzZXQgPSBuZXcgQ29yZS5QcmVzZXQoZGF0YS5wcmVzZXQpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gZGF0YTtcclxuXHRcdH1cclxuXHR9KVxyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL0NvcmUvQ3VzdG9tRWxlbWVudC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi9Db3JlL0NvbXBvbmVudHMudHNcIiAvPlxyXG5cclxubW9kdWxlIFZpZXdzLkNvbW1vbiB7XHJcblx0ZXhwb3J0IGNsYXNzIFN0YXR1c1RvZ2dsZSBleHRlbmRzIENvcmUuQ3VzdG9tRWxlbWVudCB7XHJcblx0XHRzdGF0aWMgX2F0dHJpYnV0ZXMgPSBbJ2lzY2hlY2tlZCddO1xyXG5cclxuXHRcdGNvbnN0cnVjdG9yKG5vZGUsIGRhdGEpIHtcclxuXHRcdFx0c3VwZXIobm9kZSwgZGF0YSk7XHJcblx0XHR9XHJcblxyXG5cdFx0Z2V0IGlzY2hlY2tlZCgpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuZ2V0RGF0YSgnaXNjaGVja2VkJyk7XHJcblx0XHR9XHJcblxyXG5cdFx0c2V0IGlzY2hlY2tlZCh2YWwpIHtcclxuXHRcdFx0dGhpcy5zZXREYXRhKCdpc2NoZWNrZWQnLCB2YWwpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Q29yZS5Db21wb25lbnRzLmNyZWF0ZSgnd3Itc3RhdHVzLXRvZ2dsZScsIHtcclxuXHRcdHN0YXRpYzogWydvbicsICdvZmYnLCAnaXNjaGVja2VkJ10sXHJcblx0XHRpbml0aWFsaXplOiBmdW5jdGlvbihlbCwgZGF0YSkge1xyXG5cdFx0XHRyZXR1cm4gbmV3IFN0YXR1c1RvZ2dsZShlbCwgZGF0YSk7XHJcblx0XHR9XHJcblx0fSlcclxufSIsIlxyXG5cclxubW9kdWxlIENvcmUuQmluZGVycyB7XHJcblx0ZXhwb3J0IGNsYXNzIEJhc2VCaW5kaW5nIHtcclxuXHRcdG1vZGVsOiBhbnk7XHJcblx0XHRhcmdzOiBzdHJpbmdbXTtcclxuXHJcblx0XHRwdWJsaXNoKCkge1xyXG5cclxuXHRcdH1cclxuXHJcblx0XHRmb3JtYXR0ZWRWYWx1ZSh2YWw6IGFueSk6IGFueSB7XHJcblxyXG5cdFx0fVxyXG5cdH1cclxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi8uLi90eXBpbmdzL3JpdmV0cy5kLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vQmFzZUJpbmRpbmcudHNcIiAvPlxyXG5cclxubW9kdWxlIENvcmUuQmluZGVycyB7XHJcblx0ZXhwb3J0IGZ1bmN0aW9uIEF0dHJpYnV0ZUJpbmRpbmcoZWw6IEhUTUxFbGVtZW50LCB2YWx1ZTogYW55KSB7XHJcblx0XHRsZXQgYmluZGluZ3MgPSB0aGlzLnZpZXcuYmluZGluZ3M7XHJcblxyXG5cdFx0Zm9yIChsZXQgaSA9IDAsIGwgPSBiaW5kaW5ncy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuXHRcdFx0aWYgKGVsID09PSBiaW5kaW5nc1tpXS5lbCAmJiBiaW5kaW5nc1tpXS5jb21wb25lbnRWaWV3KSB7XHJcblx0XHRcdFx0bGV0IHZpZXcgPSBiaW5kaW5nc1tpXS5jb21wb25lbnRWaWV3O1xyXG5cdFx0XHRcdHZpZXcubW9kZWxzID0gdmlldy5tb2RlbHMgfHwgW107XHJcblx0XHRcdFx0dmlldy5tb2RlbHNbdGhpcy50eXBlXSA9IHZhbHVlO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKHZhbHVlKSB7XHJcblx0XHRcdGVsLnNldEF0dHJpYnV0ZSh0aGlzLnR5cGUsIHZhbHVlKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGVsLnJlbW92ZUF0dHJpYnV0ZSh0aGlzLnR5cGUpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cml2ZXRzLmJpbmRlcnNbJyonXSA9IEF0dHJpYnV0ZUJpbmRpbmc7XHJcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vLi4vdHlwaW5ncy9yaXZldHMuZC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL0Jhc2VCaW5kaW5nLnRzXCIgLz5cclxuXHJcbm1vZHVsZSBDb3JlLkJpbmRlcnMge1xyXG5cdGV4cG9ydCBjbGFzcyBEZWVwQmluZGluZyBleHRlbmRzIEJhc2VCaW5kaW5nIHtcclxuXHRcdHB1Ymxpc2hlczogYm9vbGVhbiA9IHRydWU7XHJcblx0XHRwcmlvcml0eTogbnVtYmVyID0gMzAwMDtcclxuXHJcblx0XHRiaW5kKGVsKSB7XHJcblx0XHRcdHRoaXMubW9kZWwgJiYgZWwuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmFyZ3NbMF0gKyAnLWNoYW5nZScsIHRoaXMucHVibGlzaCwgZmFsc2UpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHVuYmluZChlbCkge1xyXG5cdFx0XHRlbC5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuYXJnc1swXSArICctY2hhbmdlJywgdGhpcy5wdWJsaXNoLCBmYWxzZSk7XHJcblx0XHR9XHJcblxyXG5cdFx0cm91dGluZShlbCwgdmFsdWUpIHtcclxuXHRcdFx0aWYgKCF0aGlzLm1vZGVsKSB7XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRlbC5fZGF0YSA9IGVsLl9kYXRhIHx8IHt9O1xyXG5cdFx0XHRlbC5fZGF0YVt0aGlzLmFyZ3NbMF1dID0gdGhpcy5mb3JtYXR0ZWRWYWx1ZSh2YWx1ZSk7XHJcblxyXG5cdFx0XHRlbC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCh0aGlzLmFyZ3NbMF0gKyAnLXVwZGF0ZScpKTtcclxuXHRcdH1cclxuXHJcblx0XHRnZXRWYWx1ZShlbCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5mb3JtYXR0ZWRWYWx1ZShlbC5fZGF0YSA/IGVsLl9kYXRhW3RoaXMuYXJnc1swXV0gOiBudWxsKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHJpdmV0cy5iaW5kZXJzWydkZWVwLSonXSA9IG5ldyBEZWVwQmluZGluZygpO1xyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uLy4uL3R5cGluZ3Mvcml2ZXRzLmQudHNcIiAvPlxyXG5cclxubW9kdWxlIENvcmUuRm9ybWF0dGVycyB7XHJcblx0ZXhwb3J0IGZ1bmN0aW9uIEZyaWVuZGx5Q21kU2hvcnRjdXQodmFsdWU6IGFueSk6IHN0cmluZyB7XHJcblx0XHRyZXR1cm4gU3RyaW5nKHZhbHVlKVxyXG5cdFx0XHQucmVwbGFjZSgvXFwrL2csICcgKyAnKVxyXG5cdFx0XHQucmVwbGFjZSgnQ29tbWFuZCcsICdDbWQnKVxyXG5cdFx0XHQucmVwbGFjZSgnIEFycm93JywgJycpXHJcblx0XHRcdHx8ICc8bm90IHNldD4nO1xyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIEZyaWVuZGx5Q21kRGVzY3JpcHRpb24oY21kOiBhbnkpOiBzdHJpbmcge1xyXG5cdFx0aWYgKGNtZC5uYW1lID09PSAnX2V4ZWN1dGVfYnJvd3Nlcl9hY3Rpb24nKSB7XHJcblx0XHRcdHJldHVybiAnU2hvdyBleHRlbnNpb24gcG9wdXAnO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBjbWQuZGVzY3JpcHRpb24gfHwgY21kLnNob3J0Y3V0O1xyXG5cdH1cclxuXHJcblxyXG5cdHJpdmV0cy5mb3JtYXR0ZXJzWydGcmllbmRseUNtZFNob3J0Y3V0J10gPSBGcmllbmRseUNtZFNob3J0Y3V0O1xyXG5cdHJpdmV0cy5mb3JtYXR0ZXJzWydGcmllbmRseUNtZERlc2NyaXB0aW9uJ10gPSBGcmllbmRseUNtZERlc2NyaXB0aW9uO1xyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uLy4uL3R5cGluZ3Mvcml2ZXRzLmQudHNcIiAvPlxuXG5tb2R1bGUgQ29yZS5Gb3JtYXR0ZXJzIHtcblx0ZXhwb3J0IGZ1bmN0aW9uIEZyaWVuZGx5RGF0ZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcblx0XHR2YXIgZCA9IG5ldyBEYXRlKGAke3ZhbHVlfSArMDA6MDBgKTtcblx0XHRyZXR1cm4gZC50b0xvY2FsZVN0cmluZygpO1xuXHR9XG5cblx0cml2ZXRzLmZvcm1hdHRlcnNbJ0ZyaWVuZGx5RGF0ZSddID0gRnJpZW5kbHlEYXRlO1xufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi8uLi90eXBpbmdzL3JpdmV0cy5kLnRzXCIgLz5cclxuXHJcbm1vZHVsZSBDb3JlLkZvcm1hdHRlcnMge1xyXG5cdGV4cG9ydCBjb25zdCBJbnRBbmROdWxsID0ge1xyXG5cdFx0cmVhZDogZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0bGV0IHZhbCA9IHBhcnNlSW50KHZhbHVlLCAxMCk7XHJcblx0XHRcdHJldHVybiBpc05hTih2YWwpID8gbnVsbCA6IHZhbDtcclxuXHRcdH0sXHJcblxyXG5cdFx0cHVibGlzaDogZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0bGV0IHZhbCA9IHBhcnNlSW50KHZhbHVlLCAxMCk7XHJcblx0XHRcdHJldHVybiBpc05hTih2YWwpID8gbnVsbCA6IHZhbDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHJpdmV0cy5mb3JtYXR0ZXJzWydJbnRBbmROdWxsJ10gPSBJbnRBbmROdWxsO1xyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uLy4uL3R5cGluZ3Mvcml2ZXRzLmQudHNcIiAvPlxyXG5cclxubW9kdWxlIENvcmUuRm9ybWF0dGVycyB7XHJcblx0ZXhwb3J0IGNvbnN0IEludE9yTnVsbCA9IHtcclxuXHRcdHJlYWQ6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdHJldHVybiBwYXJzZUludCh2YWx1ZSwgMTApIHx8IG51bGw7XHJcblx0XHR9LFxyXG5cclxuXHRcdHB1Ymxpc2g6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdHJldHVybiBwYXJzZUludCh2YWx1ZSwgMTApIHx8IG51bGw7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRyaXZldHMuZm9ybWF0dGVyc1snSW50T3JOdWxsJ10gPSBJbnRPck51bGw7XHJcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vLi4vdHlwaW5ncy9yaXZldHMuZC50c1wiIC8+XHJcblxyXG5tb2R1bGUgQ29yZS5Gb3JtYXR0ZXJzIHtcclxuXHRleHBvcnQgZnVuY3Rpb24gTmVnYXRlKHZhbHVlOiBhbnkpOiBib29sZWFuIHtcclxuXHRcdHJldHVybiAhdmFsdWU7XHJcblx0fVxyXG5cclxuXHRyaXZldHMuZm9ybWF0dGVyc1snTmVnYXRlJ10gPSBOZWdhdGU7XHJcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vLi4vdHlwaW5ncy9yaXZldHMuZC50c1wiIC8+XHJcblxyXG5tb2R1bGUgQ29yZS5Gb3JtYXR0ZXJzIHtcclxuXHRleHBvcnQgY29uc3QgTnVsbGlmeSA9IHtcclxuXHRcdHJlYWQ6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdHJldHVybiB2YWx1ZSB8fCBudWxsO1xyXG5cdFx0fSxcclxuXHJcblx0XHRwdWJsaXNoOiBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRyZXR1cm4gdmFsdWUgfHwgbnVsbDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHJpdmV0cy5mb3JtYXR0ZXJzWydOdWxsaWZ5J10gPSBOdWxsaWZ5O1xyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uLy4uL3R5cGluZ3Mvcml2ZXRzLmQudHNcIiAvPlxyXG5cclxubW9kdWxlIENvcmUuRm9ybWF0dGVycyB7XHJcblx0ZXhwb3J0IGZ1bmN0aW9uIFN0cmluZ2lmeSh2YWx1ZTogYW55KTogc3RyaW5nIHtcclxuXHRcdHJldHVybiBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XHJcblx0fVxyXG5cclxuXHRyaXZldHMuZm9ybWF0dGVyc1snU3RyaW5naWZ5J10gPSBTdHJpbmdpZnk7XHJcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vLi4vdHlwaW5ncy9yaXZldHMuZC50c1wiIC8+XHJcblxyXG5tb2R1bGUgQ29yZS5Gb3JtYXR0ZXJzIHtcclxuXHRleHBvcnQgZnVuY3Rpb24gVG9Cb29sKHZhbHVlOiBhbnkpOiBib29sZWFuIHtcclxuXHRcdHJldHVybiAhIXZhbHVlO1xyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIEFycmF5Tm90RW1wdHkodmFsdWU6IGFueSk6IGJvb2xlYW4ge1xyXG5cdFx0cmV0dXJuIHZhbHVlICYmIHZhbHVlLmxlbmd0aDtcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBjb25zdCBJbnRUb0Jvb2wgPSB7XHJcblx0XHRyZWFkOiBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRyZXR1cm4gISF2YWx1ZTtcclxuXHRcdH0sXHJcblxyXG5cdFx0cHVibGlzaDogZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0cmV0dXJuIHZhbHVlID8gMSA6IDA7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRyaXZldHMuZm9ybWF0dGVyc1snVG9Cb29sJ10gPSBUb0Jvb2w7XHJcblx0cml2ZXRzLmZvcm1hdHRlcnNbJ0ludFRvQm9vbCddID0gSW50VG9Cb29sO1xyXG5cdHJpdmV0cy5mb3JtYXR0ZXJzWydBcnJheU5vdEVtcHR5J10gPSBBcnJheU5vdEVtcHR5O1xyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uLy4uL3R5cGluZ3Mvcml2ZXRzLmQudHNcIiAvPlxyXG5cclxubW9kdWxlIENvcmUuRm9ybWF0dGVycyB7XHJcblx0ZXhwb3J0IGNvbnN0IFRvSW50ID0ge1xyXG5cdFx0cmVhZDogZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0cmV0dXJuIHBhcnNlSW50KHZhbHVlLCAxMCkgfHwgMDtcclxuXHRcdH0sXHJcblxyXG5cdFx0cHVibGlzaDogZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0cmV0dXJuIHBhcnNlSW50KHZhbHVlLCAxMCkgfHwgMDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHJpdmV0cy5mb3JtYXR0ZXJzWydUb0ludCddID0gVG9JbnQ7XHJcbn0iLCJcclxubW9kdWxlIENvcmUuVXRpbHMuUmVxdWVzdCB7XHJcblxyXG5cdGV4cG9ydCBmdW5jdGlvbiBHZXQodXJsOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xyXG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuXHRcdFx0dmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG5cclxuXHRcdFx0eGhyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCByZXNvbHZlKTtcclxuXHRcdFx0eGhyLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgcmVqZWN0KTtcclxuXHRcdFx0eGhyLmFkZEV2ZW50TGlzdGVuZXIoJ2Fib3J0JywgcmVqZWN0KTtcclxuXHRcdFx0eGhyLm9wZW4oJ0dFVCcsIHVybCk7XHJcblx0XHRcdHhoci5zZW5kKCk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBmdW5jdGlvbiBHZXRKU09OKHVybDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcclxuXHRcdHJldHVybiBHZXQodXJsKS50aGVuKGRhdGEgPT4gUHJvbWlzZS5yZXNvbHZlKEpTT04ucGFyc2UoZGF0YS50YXJnZXQucmVzcG9uc2VUZXh0KSkpO1xyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIFBvc3QodXJsOiBzdHJpbmcsIGRhdGE6IGFueSk6IFByb21pc2U8YW55PiB7XHJcblx0XHRyZXR1cm4gX3Bvc3QodXJsLCBkYXRhKS50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLnRleHQoKSk7XHJcblx0fVxyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gUG9zdEpTT04odXJsOiBzdHJpbmcsIGRhdGE6IGFueSk6IFByb21pc2U8YW55PiB7XHJcblx0XHRyZXR1cm4gX3Bvc3QodXJsLCBkYXRhKS50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLmpzb24oKSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfcG9zdCh1cmw6IHN0cmluZywgZGF0YTogYW55KTogUHJvbWlzZTxhbnk+IHtcclxuXHRcdGxldCBwYXJ0cyA9IFtdO1xyXG5cdFx0Zm9yIChsZXQgayBpbiBkYXRhKSB7XHJcblx0XHRcdGxldCBuYW1lID0gZW5jb2RlVVJJQ29tcG9uZW50KGspO1xyXG5cdFx0XHRsZXQgdmFsdWUgPSBlbmNvZGVVUklDb21wb25lbnQoZGF0YVtrXSk7XHJcblx0XHRcdHBhcnRzLnB1c2goYCR7bmFtZX09JHt2YWx1ZX1gKTtcclxuXHRcdH1cclxuXHRcdGNvbnN0IGluaXQgPSB7XHJcblx0XHRcdG1ldGhvZDogJ1BPU1QnLFxyXG5cdFx0XHRib2R5OiBwYXJ0cy5qb2luKCcmJyksXHJcblx0XHRcdGhlYWRlcnM6IHtcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZFwifVxyXG5cdFx0fTtcclxuXHJcblx0XHRyZXR1cm4gZmV0Y2godXJsLCBpbml0KTtcclxuXHR9XHJcbn0iLCJtb2R1bGUgQ29yZS5VdGlscyB7XHJcblx0ZXhwb3J0IGNsYXNzIFVuaXF1ZVN0YWNrIHtcclxuXHRcdHByaXZhdGUgX3ZhbHVlcyA9IFtdO1xyXG5cclxuXHRcdHB1YmxpYyBhcHBlbmQodmFsdWUpIHtcclxuXHRcdFx0dGhpcy5yZW1vdmUodmFsdWUpO1xyXG5cdFx0XHR0aGlzLl92YWx1ZXMucHVzaCh2YWx1ZSk7XHJcblx0XHR9XHJcblxyXG5cdFx0cHVibGljIHJlbW92ZSh2YWx1ZSkge1xyXG5cdFx0XHRsZXQgZXhpc3RpbmcgPSB0aGlzLl92YWx1ZXMuaW5kZXhPZih2YWx1ZSk7XHJcblx0XHRcdChleGlzdGluZyA+IC0xKSAmJiB0aGlzLl92YWx1ZXMuc3BsaWNlKGV4aXN0aW5nLCAxKTtcclxuXHRcdH1cclxuXHJcblx0XHRwdWJsaWMgY3VycmVudCgpIHtcclxuXHRcdFx0bGV0IGxhc3QgPSB0aGlzLl92YWx1ZXMubGVuZ3RoIC0gMTtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX3ZhbHVlc1tsYXN0XTtcclxuXHRcdH1cclxuXHR9XHJcbn0iLCJtb2R1bGUgQ29yZS5VdGlscyB7XG5cdGV4cG9ydCBmdW5jdGlvbiBJc0JldGEoKTogYm9vbGVhbiB7XG5cdFx0Y29uc3QgbWFuaWZlc3Q6IGFueSA9IGNocm9tZS5ydW50aW1lLmdldE1hbmlmZXN0KCk7XG5cdFx0Y29uc3QgaXNCZXRhOiBib29sZWFuID0gQm9vbGVhbihtYW5pZmVzdC52ZXJzaW9uX25hbWUubWF0Y2goL2JldGEvaSkpO1xuXG5cdFx0cmV0dXJuIGlzQmV0YTtcblx0fVxufSIsIm1vZHVsZSBDb3JlLlV0aWxzIHtcclxuXHRleHBvcnQgaW50ZXJmYWNlIElEaWN0PFQ+IHtcclxuXHRcdFtpbmRleDogc3RyaW5nXTogVDtcclxuXHR9XHJcbn0iXX0=
