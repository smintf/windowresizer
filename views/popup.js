/// <reference path="../../../typings/rivets.d.ts" />
/// <reference path="../../../typings/ExtAPI.d.ts" />
/// <reference path="../../../typings/tab-nav.d.ts" />
/// <reference path="../../../typings/common.d.ts" />
var Views;
(function (Views) {
    var Popup;
    (function (Popup_1) {
        var Keys = Core.Input.Keys;
        var $ = Core.Utils.DOM;
        var ModalMessage = Views.Common.ModalMessage;
        class AffiliateBanner {
            constructor(url, image, caption, accent = '#eee') {
                this.url = url;
                this.image = image;
                this.caption = caption;
                this.accent = accent;
            }
        }
        Popup_1.AffiliateBanner = AffiliateBanner;
        class Popup {
            constructor() {
                this.presets = [];
                this.quick = { width: null, height: null, target: 0 };
                this.showKeys = false;
                this.alternatePresetsBg = false;
                this.autoClosePopup = false;
                this.hidePresetsDescription = false;
                this.hidePopupTooltips = false;
                this.hideQuickResize = false;
                this._panels = [];
                this._clickFocus = false;
                this.license = null;
                this.collapsedSidebar = false;
                this.errorMessage = null;
                this.errorMessageTimeout = null;
                this.showQuickTips = false;
                this.presetsIconsStyle = '';
                this.presetsPrimaryLine = '';
                this.hideError = () => {
                    clearTimeout(this.errorMessageTimeout);
                    this.errorMessageTimeout = null;
                };
                this.hideQuickTips = () => {
                    this.showQuickTips = false;
                    window.localStorage['showQuickTips'] = '0';
                };
                this.presets = [];
                this.collapsedSidebar = window.localStorage['collapsed-sidebar'] === '1';
                this.hideQuickResize = window.localStorage['hideQuickResize'] === '1';
                this.showQuickTips = window.localStorage['showQuickTips'] !== '0';
                this._initPanels();
                this.quickResize = this._preventDefault(this.quickResize);
                this.handlePresetClick = this.handlePresetClick.bind(this);
                this.handleToolsClick = this.handleToolsClick.bind(this);
                this.toggleResizeInfo = this.toggleResizeInfo.bind(this);
                this.rotateViewport = this.rotateViewport.bind(this);
                this.handleKeyDown = this.handleKeyDown.bind(this);
                this.handleKeyUp = this.handleKeyUp.bind(this);
                this._showKeys = this._showKeys.bind(this);
                this._hideKeys = this._hideKeys.bind(this);
                this.dismissMessage = this.dismissMessage.bind(this);
                this.hideBanner = this.hideBanner.bind(this);
                ExtAPI.invoke('get-banner').then(b => this.showBanner(b)).catch(LOG_ERROR);
                ExtAPI.invoke('get-settings').then(settings => {
                    this.presetsIconsStyle = settings.presetsIconsStyle;
                    this.presetsPrimaryLine = settings.presetsPrimaryLine;
                    this.alternatePresetsBg = settings.alternatePresetsBg;
                    this.autoClosePopup = settings.autoClosePopup;
                    this.hidePresetsDescription = settings.hidePresetsDescription;
                    this.hidePopupTooltips = settings.hidePopupTooltips;
                    this.hideQuickResize = settings.hideQuickResize;
                    window.localStorage['hideQuickResize'] = settings.hideQuickResize ? 1 : 0;
                    this.license = settings.license;
                    for (let presetData of settings.presets) {
                        this.presets.push(new Core.Preset(presetData));
                    }
                    this._showTheUpdateMessage();
                }).catch(LOG_ERROR);
            }
            _showTheUpdateMessage() {
                let updated = window.localStorage['wasUpdated'];
                if (updated) {
                    this.showMessage('UPDATED', '');
                    let modalMsg = document.createElement('div');
                    const _cleanup = () => {
                        modalView.unbind();
                        window.localStorage.removeItem('wasUpdated');
                        chrome.browserAction.setBadgeText({ text: '' });
                    };
                    if (updated == 1) {
                        modalMsg.innerHTML = `
						<p>
							Window Resizer has just received a major update, bringing lots of
							changes like a new UI, a rotate tool, better control of the resize
							tooltip and plenty more!
						</p>

						<a rv-on-click="showReleaseNotes" href="#">&raquo; Read more</a>
					`;
                    }
                    else {
                        modalMsg.innerHTML = `
						<ul>
							<li><b>Minor</b> UI fixes &amp; tweaks</li>
						</ul>

						<a rv-on-click="showReleaseNotes" href="#">&raquo; Find out more</a>
					`;
                    }
                    if (!this.license) {
                        modalMsg.innerHTML += `
						<div style="text-align: center; margin: 14px 0 -10px; padding: 14px 0 0; border-top: 1px solid #ddd;">
							<strong>Want to support this extension?</strong>
						</div>
						<style>.WR_modal_actions{text-align:center}</style>
					`;
                        this.currentMessage.actions[0].title = 'Ok, whatever!';
                        this.currentMessage.actions[0].title = 'Nope, free is good!';
                        this.currentMessage.actions.unshift({ title: 'Buy Pro', icon: '#icon-cart', main: true, handler: () => {
                                _cleanup();
                                this.showProPage({}, this);
                            } });
                    }
                    let modalView = rivets.bind(modalMsg, this);
                    $.q('.WR_modal_message').appendChild(modalMsg);
                    this.currentMessage.onClose.addListener(_cleanup);
                }
            }
            dismissMessage() {
                TabNav.reset();
                this.currentMessage.hide().then(x => {
                    this.currentMessage = null;
                });
            }
            _createMessage(title, message) {
                let modal = new ModalMessage(title, message);
                modal.onClose.addListener(() => {
                    this._panel.focus();
                });
                return modal;
            }
            showMessage(title, message) {
                this.currentMessage = this._createMessage(title, message);
                this.currentMessage.actions.push({ title: 'OK', handler: this.dismissMessage });
            }
            showReleaseNotes(evt, ctx) {
                ctx.currentMessage.hide().then(() => {
                    chrome.browserAction.setBadgeText({ text: '' });
                    ExtAPI.invoke('open-release-notes').catch(error => {
                        ctx._handleCommonErrors(error);
                    });
                });
            }
            showProPage(evt, ctx) {
                ExtAPI.invoke('open-pro-page').catch(error => {
                    ctx._handleCommonErrors(error);
                });
            }
            showError(message) {
                clearTimeout(this.errorMessageTimeout);
                this.errorMessage = message;
                this.errorMessageTimeout = setTimeout(() => this.hideError(), 2000);
            }
            showBanner(banner) {
                this.currentBanner = banner;
                if (banner) {
                    let sheet = window.document.styleSheets[0];
                    sheet.insertRule(`#promo .banner:hover .dim { color: ${banner.accent}; }`, sheet.cssRules.length);
                    $.addClass('#promo', 'visible');
                }
            }
            hideBanner() {
                $.hide('#promo');
                $.addClass('#info', 'empty');
                //this.currentBanner = null;
                ExtAPI.invoke('hide-banner').then(firstTime => {
                    if (!firstTime)
                        return;
                    // this.showMessage('Notice', 'No more recommendations for you today!<br />See you again tomorrow! :)');
                });
            }
            quickResize(evt, ctx) {
                this._resize(this.quick);
            }
            resizePreset(ctx) {
                this._resize(ctx.item);
            }
            openPresetsSettings(evt, ctx) {
                ExtAPI.invoke('open-presets-settings').catch(error => {
                    ctx._handleCommonErrors(error);
                });
            }
            openSettings(evt, ctx) {
                ExtAPI.invoke('open-settings').catch(error => {
                    ctx._handleCommonErrors(error);
                });
            }
            bugReport(evt, ctx) {
                ExtAPI.invoke('open-url', {
                    url: 'https://windowresizer.userecho.com/'
                }).catch(LOG_ERROR);
            }
            toggleResizeInfo(evt, ctx) {
                ExtAPI.invoke('toggle-tooltip').catch(error => {
                    ctx._handleCommonErrors(error);
                });
            }
            openAsPopup(evt, ctx) {
                ExtAPI.invoke('open-as-popup').then(response => {
                    !isStandalonePopup() && window.close();
                }).catch(error => {
                    ctx._handleCommonErrors(error);
                });
            }
            rotateViewport() {
                ExtAPI.invoke('rotate-viewport').catch(error => {
                    this._handleCommonErrors(error);
                });
            }
            toggleSidebar(evt, ctx) {
                ctx.collapsedSidebar = !ctx.collapsedSidebar;
                window.localStorage['collapsed-sidebar'] = ctx.collapsedSidebar ? 1 : 0;
                ctx._focusPanel(0);
            }
            _resize(config) {
                this.hideError();
                ExtAPI.invoke('resize', config).catch(error => {
                    console.log(error);
                    this._handleCommonErrors(error);
                });
            }
            _preventDefault(method) {
                return (evt, ctx) => {
                    evt.preventDefault();
                    method.call(this, evt, ctx);
                };
            }
            _handleCommonErrors(error) {
                this._handleOOBError(error.errors);
                this._handleProtocolError(error);
                if (error.FILE_PROTOCOL_PERMISSION) {
                    let title = 'Insufficient permissions';
                    let message = 'You need to explicitly allow access to <em>file://</em> URLs on the extensions management page.';
                    let action = { title: 'OK', handler: () => {
                            this.dismissMessage();
                            chrome.tabs.create({ url: 'chrome://extensions/?id=' + chrome.runtime.id });
                        } };
                    this.currentMessage = this._createMessage(title, message);
                    this.currentMessage.actions.push(action);
                }
                if (error.WEBSTORE_PERMISSION) {
                    let title = 'Permissions error';
                    let message = 'The tooltip can\'t be displayed on this tab because extensions are not allowed to alter the content of the Chrome Webstore pages.';
                    let action = { title: 'OK', handler: this.dismissMessage };
                    this.currentMessage = this._createMessage(title, message);
                    this.currentMessage.actions.push(action);
                }
            }
            _handleOOBError(error) {
                if (error && error.OUT_OF_BOUNDS) {
                    this.showError(`Chrome couldn't apply the exact desired dimensions!`);
                    return;
                    // var keys = error.OUT_OF_BOUNDS.keys;
                    // var errs = [];
                    // if (keys.indexOf('MAX_HEIGHT') > -1) {
                    // 	errs.push('the target <b>height</b> is greater than the maximum allowed by your current screen resolution');
                    // }
                    // if (keys.indexOf('MAX_WIDTH') > -1) {
                    // 	errs.push('the target <b>width</b> is greater than the maximum allowed by your current screen resolution');
                    // }
                    // if (keys.indexOf('MIN_HEIGHT') > -1) {
                    // 	errs.push('the target <b>height</b> is lower than the minimum allowed by your browser window');
                    // }
                    // if (keys.indexOf('MIN_WIDTH') > -1) {
                    // 	errs.push('the target <b>width</b> is lower than the maximum allowed by your browser window');
                    // }
                    // this.showMessage('ERROR', '<ul><li>' + errs.join('</li><li>') + '</li></ul><b>HINT:</b> Adjust the zoom level then try again. (Zoom in for fewer and zoom out for more CSS pixels)');
                }
            }
            _handleProtocolError(error) {
                if (error.INVALID_PROTOCOL) {
                    var err = error.INVALID_PROTOCOL;
                    if (!err.tab.url) {
                        let title = 'Insufficient permissions';
                        let message = 'In order for the extension to work on regular windows in <em>detached</em> mode, it needs to be able to inject custom code in the context of all pages, without user interaction.';
                        this.currentMessage = this._createMessage(title, message);
                        this.currentMessage.actions.push({ title: 'Cancel', handler: this.dismissMessage });
                        this.currentMessage.actions.push({ title: 'Grant permissions', main: true, handler: () => {
                                this.dismissMessage();
                                chrome.permissions.request({ permissions: ['tabs'], origins: ['<all_urls>'] }, granted => { });
                            } });
                    }
                    else {
                        this.showMessage('Invalid protocol: <b>' + String(err.protocol) + '://</b>', 'This feature only works on pages loaded using one of the following protocols: <br /><b>http://</b>, <b>https://</b> or <b>file://</b>');
                    }
                }
            }
            _showKeys() {
                this.showKeys = true;
            }
            _hideKeys() {
                this.showKeys = false;
            }
            _initPanels() {
                this._panels.push(new ListPanel('#presetsPanel', 'wr-preset'));
                this._panels.push(new ListPanel('#toolsPanel', 'button'));
                this._panel = this._panels[0];
            }
            _focusPanel(idx) {
                if (idx === 1 && this.collapsedSidebar) {
                    return;
                }
                let panel = this._panels[idx];
                if (panel != this._panel) {
                    this._panel && this._panel.blur();
                    this._panel = panel;
                    this._panel.focus();
                }
            }
            handleBannerClick(evt, ctx) {
                const target = evt.currentTarget;
                const url = target.getAttribute('data-url');
                const action = target.getAttribute('data-action');
                if (url) {
                    ExtAPI.invoke('open-url', { url }).catch(LOG_ERROR);
                }
                else {
                    ctx[action]();
                }
            }
            handlePresetClick(evt, ctx) {
                this._focusPanel(0);
                //this._panel.reset();
                this._panel.selectItem(evt.currentTarget);
                this.resizePreset(ctx);
                this.autoClosePopup && !isStandalonePopup() && window.close();
            }
            handleToolsClick(evt, ctx) {
                if (evt.target instanceof HTMLButtonElement) {
                    this._focusPanel(1);
                    this._panel.selectItem(evt.target);
                }
            }
            handleKeyDown(evt, ctx) {
                let keyCode = evt.keyCode;
                let handled = true;
                switch (keyCode) {
                    case Keys.SHIFT:
                        if (!this.showKeys) {
                            this.showKeys = true;
                        }
                        break;
                    case Keys.SPACE:
                    case Keys.ENTER:
                        $.addClass(this._panel.currentNode(), 'active');
                        break;
                    case Keys.UP:
                        this._panel.prev();
                        break;
                    case Keys.DOWN:
                        this._panel.next();
                        break;
                    case Keys.RIGHT:
                        this._focusPanel(1);
                        break;
                    case Keys.LEFT:
                        this._focusPanel(0);
                        break;
                    default:
                        handled = false;
                        break;
                }
                let node = _getPresetByKeyCode(keyCode);
                if (node) {
                    this._panel.focus();
                    this._focusPanel(0);
                    this._panel.selectItem(node);
                    $.addClass(node, 'active');
                    handled = true;
                }
                if (!handled) {
                    let char = String.fromCharCode(keyCode);
                    let node = $.q(`[data-key="${char}"]`);
                    if (node) {
                        this._panel.focus();
                        this._focusPanel(1);
                        this._panel.selectItem(node);
                        $.addClass(node, 'active');
                        handled = true;
                    }
                }
                if (handled) {
                    evt.preventDefault();
                }
            }
            handleKeyUp(evt, ctx) {
                let keyCode = evt.keyCode;
                let handled = true;
                switch (keyCode) {
                    case Keys.SHIFT:
                        if (this.showKeys) {
                            this.showKeys = false;
                        }
                        break;
                    case Keys.SPACE:
                    case Keys.ENTER:
                        $.removeClass(this._panel.currentNode(), 'active');
                        $.trigger('click', this._panel.currentNode());
                        break;
                    default:
                        handled = false;
                        break;
                }
                let node = _getPresetByKeyCode(keyCode);
                if (node) {
                    $.removeClass(node, 'active');
                    $.trigger('click', node);
                    handled = true;
                }
                if (!handled) {
                    let char = String.fromCharCode(keyCode);
                    let node = $.q(`[data-key="${char}"]`);
                    if (node) {
                        $.removeClass(node, 'active');
                        $.trigger('click', node);
                        handled = true;
                    }
                }
                if (handled) {
                    evt.preventDefault();
                }
            }
            initNavigation() {
                let main = $.q('#main');
                $.on('keydown', main, this.handleKeyDown, true);
                $.on('keyup', main, this.handleKeyUp, true);
                let h = new FocusHandler(main);
                main.focus();
            }
        }
        Popup_1.Popup = Popup;
        class FocusHandler {
            constructor(target) {
                this.ignore = false;
                this.focused = false;
                this.target = target;
                this.__initHandlers();
                $.on('focus', this.target, this.onFocus, true);
                $.on('blur', this.target, this.onBlur, true);
                $.on('mousedown', this.target, this.onMouseDown, true);
                $.on('keydown', document, this.onKeyDown, true);
            }
            __initHandlers() {
                var handlers = ['onFocus', 'onBlur', 'onKeyDown', 'onMouseDown'];
                for (var method of handlers) {
                    this[method] = __eventHandler(this, this[method]);
                }
                function __eventHandler(context, method) {
                    return function (evt) {
                        return method.call(context, evt, this);
                    };
                }
            }
            onBlur(evt) {
                if (!this.target.contains(evt.relatedTarget)) {
                    $.removeClass(this.target, 'focused');
                }
                this.focused = false;
            }
            onFocus(evt) {
                if (!this.ignore) {
                    $.addClass(this.target, 'focused');
                }
                this.focused = true;
            }
            onKeyDown(evt) {
                this.ignore = false;
                if (this.focused) {
                    $.addClass(this.target, 'focused');
                }
            }
            onMouseDown(evt) {
                $.removeClass(this.target, 'focused');
                this.ignore = true;
            }
        }
        function _stealFocus(evt, ctx) {
            evt.preventDefault();
            evt.stopPropagation();
            this.focus();
        }
        function _getPresetByKeyCode(keyCode) {
            var node;
            if ((keyCode >= Keys.DIGITS[0] && keyCode <= Keys.DIGITS[1])
                || (keyCode >= Keys.NUMPAD[0] && keyCode <= Keys.NUMPAD[1])) {
                let idx = (keyCode % 48) || 10;
                node = $.q(`wr-preset:nth-of-type(${idx})`);
            }
            return node;
        }
        class ListPanel {
            constructor(parent, list) {
                this.parent = null;
                this.list = null;
                this.current = -1;
                this.autoInit = true;
                this._selected = 'selected';
                this._focused = 'focused';
                this.parent = $.q(parent);
                this.list = list;
            }
            next() {
                let nodes = $.qAll(this.list, this.parent);
                let next = (this.current + 1) % nodes.length;
                this.select(next, nodes);
            }
            prev() {
                let nodes = $.qAll(this.list, this.parent);
                let prev = (nodes.length + this.current - 1) % nodes.length;
                this.select(prev, nodes);
            }
            select(next, nodes, noFocus) {
                for (let i = 0, l = nodes.length; i < l; i++) {
                    let node = nodes[i];
                    node.classList.remove(this._selected);
                }
                let node = nodes[next];
                this._selectNode(node);
                this.current = next;
                if (!noFocus) {
                    this.focus();
                }
            }
            focus() {
                this.parent.classList.add('focused');
                if (this.autoInit && this.current < 0) {
                    this.next();
                }
                this._selectNode(this.currentNode());
            }
            blur() {
                this.parent.classList.remove('focused');
            }
            reset() {
                let nodes = $.qAll(this.list, this.parent);
                for (let i = 0, l = nodes.length; i < l; i++) {
                    let node = nodes[i];
                    node.classList.remove(this._selected);
                }
                this.current = -1;
            }
            selectItem(item) {
                let nodes = $.qAll(this.list, this.parent);
                let found = -1;
                for (let i = 0, l = nodes.length; i < l; i++) {
                    if (item == nodes[i]) {
                        found = i;
                    }
                }
                if (found > -1 && found != this.current) {
                    let node = nodes[found];
                    this.reset();
                    this._selectNode(node);
                    this.current = found;
                }
            }
            currentNode() {
                let nodes = $.qAll(this.list, this.parent);
                return nodes[this.current];
            }
            _selectNode(node) {
                node.classList.add(this._selected);
                node.setAttribute('tabindex', '0');
                node.focus();
                node.setAttribute('tabindex', '-1');
            }
        }
        Popup_1.view = new Popup();
        var binding = rivets.bind(document.body, Popup_1.view);
        Popup_1.view.initNavigation();
        chrome.runtime.onMessage.addListener(msg => {
            if (msg.UpdatedSettings) {
                if ('license' in msg.UpdatedSettings) {
                    Popup_1.view.currentBanner = null;
                }
                if ('presetsIconsStyle' in msg.UpdatedSettings) {
                    Popup_1.view.presetsIconsStyle = msg.UpdatedSettings.presetsIconsStyle;
                }
                if ('presetsPrimaryLine' in msg.UpdatedSettings) {
                    Popup_1.view.presetsPrimaryLine = msg.UpdatedSettings.presetsPrimaryLine;
                }
                if ('alternatePresetsBg' in msg.UpdatedSettings) {
                    Popup_1.view.alternatePresetsBg = msg.UpdatedSettings.alternatePresetsBg;
                }
                if ('autoClosePopup' in msg.UpdatedSettings) {
                    Popup_1.view.autoClosePopup = msg.UpdatedSettings.autoClosePopup;
                }
                if ('hidePresetsDescription' in msg.UpdatedSettings) {
                    Popup_1.view.hidePresetsDescription = msg.UpdatedSettings.hidePresetsDescription;
                }
                if ('hidePopupTooltips' in msg.UpdatedSettings) {
                    Popup_1.view.hidePopupTooltips = msg.UpdatedSettings.hidePopupTooltips;
                }
                if ('hideQuickResize' in msg.UpdatedSettings) {
                    Popup_1.view.hideQuickResize = msg.UpdatedSettings.hideQuickResize;
                    window.localStorage['hideQuickResize'] = msg.UpdatedSettings.hideQuickResize ? 1 : 0;
                }
                if ('presets' in msg.UpdatedSettings) {
                    Popup_1.view.presets = [];
                    for (let presetData of msg.UpdatedSettings.presets) {
                        Popup_1.view.presets.push(new Core.Preset(presetData));
                    }
                }
            }
        });
        function LOG_ERROR(err) {
            console.log(err);
        }
        function isStandalonePopup() {
            return window.location.hash.indexOf('popup-view') > -1;
        }
        function _constrainWindowSize() {
            var limit = {};
            if (window.innerWidth < 340) {
                limit.width = 340 + window.outerWidth - window.innerWidth;
            }
            if (window.innerHeight < 400) {
                limit.height = 400 + window.outerHeight - window.innerHeight;
            }
            if (limit.width || limit.height) {
                ExtAPI.invoke('limit-popup', limit);
            }
        }
        if (isStandalonePopup()) {
            window.addEventListener('resize', _constrainWindowSize);
        }
    })(Popup = Views.Popup || (Views.Popup = {}));
})(Views || (Views = {}));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy92aWV3cy9wb3B1cC9wb3B1cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxREFBcUQ7QUFDckQscURBQXFEO0FBQ3JELHNEQUFzRDtBQUN0RCxxREFBcUQ7QUFFckQsSUFBTyxLQUFLLENBbXlCWDtBQW55QkQsV0FBTyxLQUFLO0lBQUMsSUFBQSxLQUFLLENBbXlCakI7SUFueUJZLFdBQUEsT0FBSztRQUNqQixJQUFPLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQztRQUM5QixJQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztRQUUxQixJQUFPLFlBQVksR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQztRQUdoRCxNQUFhLGVBQWU7WUFDM0IsWUFDUSxHQUFXLEVBQ1gsS0FBYSxFQUNiLE9BQWUsRUFDZixTQUFpQixNQUFNO2dCQUh2QixRQUFHLEdBQUgsR0FBRyxDQUFRO2dCQUNYLFVBQUssR0FBTCxLQUFLLENBQVE7Z0JBQ2IsWUFBTyxHQUFQLE9BQU8sQ0FBUTtnQkFDZixXQUFNLEdBQU4sTUFBTSxDQUFpQjtZQUM1QixDQUFDO1NBQ0o7UUFQWSx1QkFBZSxrQkFPM0IsQ0FBQTtRQUVELE1BQWEsS0FBSztZQTJCakI7Z0JBMUJBLFlBQU8sR0FBVSxFQUFFLENBQUM7Z0JBQ3BCLFVBQUssR0FBRyxFQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFDLENBQUM7Z0JBQy9DLGFBQVEsR0FBRyxLQUFLLENBQUM7Z0JBS2pCLHVCQUFrQixHQUFZLEtBQUssQ0FBQztnQkFDcEMsbUJBQWMsR0FBWSxLQUFLLENBQUM7Z0JBQ2hDLDJCQUFzQixHQUFZLEtBQUssQ0FBQztnQkFDeEMsc0JBQWlCLEdBQVksS0FBSyxDQUFDO2dCQUNuQyxvQkFBZSxHQUFZLEtBQUssQ0FBQztnQkFHdkIsWUFBTyxHQUFnQixFQUFF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bnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uLy4uL3R5cGluZ3Mvcml2ZXRzLmQudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vLi4vdHlwaW5ncy9FeHRBUEkuZC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi8uLi90eXBpbmdzL3RhYi1uYXYuZC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi8uLi90eXBpbmdzL2NvbW1vbi5kLnRzXCIgLz5cclxuXHJcbm1vZHVsZSBWaWV3cy5Qb3B1cCB7XHJcblx0aW1wb3J0IEtleXMgPSBDb3JlLklucHV0LktleXM7XHJcblx0aW1wb3J0ICQgPSBDb3JlLlV0aWxzLkRPTTtcclxuXHJcblx0aW1wb3J0IE1vZGFsTWVzc2FnZSA9IFZpZXdzLkNvbW1vbi5Nb2RhbE1lc3NhZ2U7XHJcblx0aW1wb3J0IE1vZGFsTWVzc2FnZUFjdGlvbiA9IFZpZXdzLkNvbW1vbi5Nb2RhbE1lc3NhZ2VBY3Rpb247XHJcblxyXG5cdGV4cG9ydCBjbGFzcyBBZmZpbGlhdGVCYW5uZXIge1xyXG5cdFx0Y29uc3RydWN0b3IoXHJcblx0XHRcdHB1YmxpYyB1cmw6IHN0cmluZyxcclxuXHRcdFx0cHVibGljIGltYWdlOiBzdHJpbmcsXHJcblx0XHRcdHB1YmxpYyBjYXB0aW9uOiBzdHJpbmcsXHJcblx0XHRcdHB1YmxpYyBhY2NlbnQ6IHN0cmluZyA9ICcjZWVlJ1xyXG5cdFx0KSB7fVxyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGNsYXNzIFBvcHVwIHtcclxuXHRcdHByZXNldHM6IGFueVtdID0gW107XHJcblx0XHRxdWljayA9IHt3aWR0aDogbnVsbCwgaGVpZ2h0OiBudWxsLCB0YXJnZXQ6IDB9O1xyXG5cdFx0c2hvd0tleXMgPSBmYWxzZTtcclxuXHJcblx0XHRjdXJyZW50TWVzc2FnZTogTW9kYWxNZXNzYWdlO1xyXG5cdFx0Y3VycmVudEJhbm5lcjogQWZmaWxpYXRlQmFubmVyO1xyXG5cclxuXHRcdGFsdGVybmF0ZVByZXNldHNCZzogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0YXV0b0Nsb3NlUG9wdXA6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdGhpZGVQcmVzZXRzRGVzY3JpcHRpb246IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdGhpZGVQb3B1cFRvb2x0aXBzOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRoaWRlUXVpY2tSZXNpemU6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcblx0XHRwcm90ZWN0ZWQgX3BhbmVsOiBMaXN0UGFuZWw7XHJcblx0XHRwcm90ZWN0ZWQgX3BhbmVsczogTGlzdFBhbmVsW10gPSBbXTtcclxuXHRcdHByb3RlY3RlZCBfY2xpY2tGb2N1czogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuXHRcdHB1YmxpYyBsaWNlbnNlOiBhbnkgPSBudWxsO1xyXG5cdFx0cHVibGljIGNvbGxhcHNlZFNpZGViYXI6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcblx0XHRwdWJsaWMgZXJyb3JNZXNzYWdlOiBzdHJpbmcgPSBudWxsO1xyXG5cdFx0cHVibGljIGVycm9yTWVzc2FnZVRpbWVvdXQ6IGFueSA9IG51bGw7XHJcblx0XHRwdWJsaWMgc2hvd1F1aWNrVGlwczogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0cHVibGljIHByZXNldHNJY29uc1N0eWxlOiBzdHJpbmcgPSAnJztcclxuXHRcdHB1YmxpYyBwcmVzZXRzUHJpbWFyeUxpbmU6IHN0cmluZyA9ICcnO1xyXG5cclxuXHRcdGNvbnN0cnVjdG9yKCkge1xyXG5cdFx0XHR0aGlzLnByZXNldHMgPSBbXTtcclxuXHRcdFx0dGhpcy5jb2xsYXBzZWRTaWRlYmFyID0gd2luZG93LmxvY2FsU3RvcmFnZVsnY29sbGFwc2VkLXNpZGViYXInXSA9PT0gJzEnO1xyXG5cdFx0XHR0aGlzLmhpZGVRdWlja1Jlc2l6ZSA9IHdpbmRvdy5sb2NhbFN0b3JhZ2VbJ2hpZGVRdWlja1Jlc2l6ZSddID09PSAnMSc7XHJcblx0XHRcdHRoaXMuc2hvd1F1aWNrVGlwcyA9IHdpbmRvdy5sb2NhbFN0b3JhZ2VbJ3Nob3dRdWlja1RpcHMnXSAhPT0gJzAnO1xyXG5cclxuXHRcdFx0dGhpcy5faW5pdFBhbmVscygpO1xyXG5cclxuXHRcdFx0dGhpcy5xdWlja1Jlc2l6ZSA9IHRoaXMuX3ByZXZlbnREZWZhdWx0KHRoaXMucXVpY2tSZXNpemUpO1xyXG5cclxuXHRcdFx0dGhpcy5oYW5kbGVQcmVzZXRDbGljayA9IHRoaXMuaGFuZGxlUHJlc2V0Q2xpY2suYmluZCh0aGlzKTtcclxuXHRcdFx0dGhpcy5oYW5kbGVUb29sc0NsaWNrICA9IHRoaXMuaGFuZGxlVG9vbHNDbGljay5iaW5kKHRoaXMpO1xyXG5cdFx0XHR0aGlzLnRvZ2dsZVJlc2l6ZUluZm8gID0gdGhpcy50b2dnbGVSZXNpemVJbmZvLmJpbmQodGhpcyk7XHJcblx0XHRcdHRoaXMucm90YXRlVmlld3BvcnQgICAgPSB0aGlzLnJvdGF0ZVZpZXdwb3J0LmJpbmQodGhpcyk7XHJcblxyXG5cdFx0XHR0aGlzLmhhbmRsZUtleURvd24gPSB0aGlzLmhhbmRsZUtleURvd24uYmluZCh0aGlzKTtcclxuXHRcdFx0dGhpcy5oYW5kbGVLZXlVcCA9IHRoaXMuaGFuZGxlS2V5VXAuYmluZCh0aGlzKTtcclxuXHJcblx0XHRcdHRoaXMuX3Nob3dLZXlzID0gdGhpcy5fc2hvd0tleXMuYmluZCh0aGlzKTtcclxuXHRcdFx0dGhpcy5faGlkZUtleXMgPSB0aGlzLl9oaWRlS2V5cy5iaW5kKHRoaXMpO1xyXG5cclxuXHRcdFx0dGhpcy5kaXNtaXNzTWVzc2FnZSA9IHRoaXMuZGlzbWlzc01lc3NhZ2UuYmluZCh0aGlzKTtcclxuXHRcdFx0dGhpcy5oaWRlQmFubmVyID0gdGhpcy5oaWRlQmFubmVyLmJpbmQodGhpcyk7XHJcblxyXG5cdFx0XHRFeHRBUEkuaW52b2tlKCdnZXQtYmFubmVyJykudGhlbihiID0+IHRoaXMuc2hvd0Jhbm5lcihiKSkuY2F0Y2goTE9HX0VSUk9SKTtcclxuXHRcdFx0RXh0QVBJLmludm9rZSgnZ2V0LXNldHRpbmdzJykudGhlbihzZXR0aW5ncyA9PiB7XHJcblx0XHRcdFx0dGhpcy5wcmVzZXRzSWNvbnNTdHlsZSA9IHNldHRpbmdzLnByZXNldHNJY29uc1N0eWxlO1xyXG5cdFx0XHRcdHRoaXMucHJlc2V0c1ByaW1hcnlMaW5lID0gc2V0dGluZ3MucHJlc2V0c1ByaW1hcnlMaW5lO1xyXG5cdFx0XHRcdHRoaXMuYWx0ZXJuYXRlUHJlc2V0c0JnID0gc2V0dGluZ3MuYWx0ZXJuYXRlUHJlc2V0c0JnO1xyXG5cdFx0XHRcdHRoaXMuYXV0b0Nsb3NlUG9wdXAgPSBzZXR0aW5ncy5hdXRvQ2xvc2VQb3B1cDtcclxuXHRcdFx0XHR0aGlzLmhpZGVQcmVzZXRzRGVzY3JpcHRpb24gPSBzZXR0aW5ncy5oaWRlUHJlc2V0c0Rlc2NyaXB0aW9uO1xyXG5cdFx0XHRcdHRoaXMuaGlkZVBvcHVwVG9vbHRpcHMgPSBzZXR0aW5ncy5oaWRlUG9wdXBUb29sdGlwcztcclxuXHRcdFx0XHR0aGlzLmhpZGVRdWlja1Jlc2l6ZSA9IHNldHRpbmdzLmhpZGVRdWlja1Jlc2l6ZTtcclxuXHRcdFx0XHR3aW5kb3cubG9jYWxTdG9yYWdlWydoaWRlUXVpY2tSZXNpemUnXSA9IHNldHRpbmdzLmhpZGVRdWlja1Jlc2l6ZSA/IDEgOiAwO1xyXG5cdFx0XHRcdHRoaXMubGljZW5zZSA9IHNldHRpbmdzLmxpY2Vuc2U7XHJcblxyXG5cdFx0XHRcdGZvciAobGV0IHByZXNldERhdGEgb2Ygc2V0dGluZ3MucHJlc2V0cykge1xyXG5cdFx0XHRcdFx0dGhpcy5wcmVzZXRzLnB1c2gobmV3IENvcmUuUHJlc2V0KHByZXNldERhdGEpKTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdHRoaXMuX3Nob3dUaGVVcGRhdGVNZXNzYWdlKCk7XHJcblx0XHRcdH0pLmNhdGNoKExPR19FUlJPUik7XHJcblx0XHR9XHJcblxyXG5cdFx0X3Nob3dUaGVVcGRhdGVNZXNzYWdlKCkge1xyXG5cdFx0XHRsZXQgdXBkYXRlZCA9IHdpbmRvdy5sb2NhbFN0b3JhZ2VbJ3dhc1VwZGF0ZWQnXTtcclxuXHJcblx0XHRcdGlmICh1cGRhdGVkKSB7XHJcblx0XHRcdFx0dGhpcy5zaG93TWVzc2FnZSgnVVBEQVRFRCcsICcnKTtcclxuXHRcdFx0XHRsZXQgbW9kYWxNc2cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuXHRcdFx0XHRjb25zdCBfY2xlYW51cCA9ICgpID0+IHtcclxuXHRcdFx0XHRcdG1vZGFsVmlldy51bmJpbmQoKTtcclxuXHRcdFx0XHRcdHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnd2FzVXBkYXRlZCcpO1xyXG5cdFx0XHRcdFx0Y2hyb21lLmJyb3dzZXJBY3Rpb24uc2V0QmFkZ2VUZXh0KHt0ZXh0IDogJyd9KTtcclxuXHRcdFx0XHR9O1xyXG5cclxuXHRcdFx0XHRpZiAodXBkYXRlZCA9PSAxKSB7XHJcblx0XHRcdFx0XHRtb2RhbE1zZy5pbm5lckhUTUwgPSBgXHJcblx0XHRcdFx0XHRcdDxwPlxyXG5cdFx0XHRcdFx0XHRcdFdpbmRvdyBSZXNpemVyIGhhcyBqdXN0IHJlY2VpdmVkIGEgbWFqb3IgdXBkYXRlLCBicmluZ2luZyBsb3RzIG9mXHJcblx0XHRcdFx0XHRcdFx0Y2hhbmdlcyBsaWtlIGEgbmV3IFVJLCBhIHJvdGF0ZSB0b29sLCBiZXR0ZXIgY29udHJvbCBvZiB0aGUgcmVzaXplXHJcblx0XHRcdFx0XHRcdFx0dG9vbHRpcCBhbmQgcGxlbnR5IG1vcmUhXHJcblx0XHRcdFx0XHRcdDwvcD5cclxuXHJcblx0XHRcdFx0XHRcdDxhIHJ2LW9uLWNsaWNrPVwic2hvd1JlbGVhc2VOb3Rlc1wiIGhyZWY9XCIjXCI+JnJhcXVvOyBSZWFkIG1vcmU8L2E+XHJcblx0XHRcdFx0XHRgO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRtb2RhbE1zZy5pbm5lckhUTUwgPSBgXHJcblx0XHRcdFx0XHRcdDx1bD5cclxuXHRcdFx0XHRcdFx0XHQ8bGk+PGI+TWlub3I8L2I+IFVJIGZpeGVzICZhbXA7IHR3ZWFrczwvbGk+XHJcblx0XHRcdFx0XHRcdDwvdWw+XHJcblxyXG5cdFx0XHRcdFx0XHQ8YSBydi1vbi1jbGljaz1cInNob3dSZWxlYXNlTm90ZXNcIiBocmVmPVwiI1wiPiZyYXF1bzsgRmluZCBvdXQgbW9yZTwvYT5cclxuXHRcdFx0XHRcdGA7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRpZiAoIXRoaXMubGljZW5zZSkge1xyXG5cdFx0XHRcdFx0bW9kYWxNc2cuaW5uZXJIVE1MICs9IGBcclxuXHRcdFx0XHRcdFx0PGRpdiBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjsgbWFyZ2luOiAxNHB4IDAgLTEwcHg7IHBhZGRpbmc6IDE0cHggMCAwOyBib3JkZXItdG9wOiAxcHggc29saWQgI2RkZDtcIj5cclxuXHRcdFx0XHRcdFx0XHQ8c3Ryb25nPldhbnQgdG8gc3VwcG9ydCB0aGlzIGV4dGVuc2lvbj88L3N0cm9uZz5cclxuXHRcdFx0XHRcdFx0PC9kaXY+XHJcblx0XHRcdFx0XHRcdDxzdHlsZT4uV1JfbW9kYWxfYWN0aW9uc3t0ZXh0LWFsaWduOmNlbnRlcn08L3N0eWxlPlxyXG5cdFx0XHRcdFx0YDtcclxuXHJcblx0XHRcdFx0XHR0aGlzLmN1cnJlbnRNZXNzYWdlLmFjdGlvbnNbMF0udGl0bGUgPSAnT2ssIHdoYXRldmVyISc7XHJcblx0XHRcdFx0XHR0aGlzLmN1cnJlbnRNZXNzYWdlLmFjdGlvbnNbMF0udGl0bGUgPSAnTm9wZSwgZnJlZSBpcyBnb29kISc7XHJcblxyXG5cdFx0XHRcdFx0dGhpcy5jdXJyZW50TWVzc2FnZS5hY3Rpb25zLnVuc2hpZnQoe3RpdGxlOiAnQnV5IFBybycsIGljb246ICcjaWNvbi1jYXJ0JywgbWFpbjogdHJ1ZSwgaGFuZGxlcjogKCkgPT4ge1xyXG5cdFx0XHRcdFx0XHRfY2xlYW51cCgpO1xyXG5cdFx0XHRcdFx0XHR0aGlzLnNob3dQcm9QYWdlKHt9LCB0aGlzKTtcclxuXHRcdFx0XHRcdH19KVxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0bGV0IG1vZGFsVmlldyA9IHJpdmV0cy5iaW5kKG1vZGFsTXNnLCB0aGlzKTtcclxuXHRcdFx0XHQkLnEoJy5XUl9tb2RhbF9tZXNzYWdlJykuYXBwZW5kQ2hpbGQobW9kYWxNc2cpO1xyXG5cclxuXHRcdFx0XHR0aGlzLmN1cnJlbnRNZXNzYWdlLm9uQ2xvc2UuYWRkTGlzdGVuZXIoX2NsZWFudXApO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZGlzbWlzc01lc3NhZ2UoKSB7XHJcblx0XHRcdFRhYk5hdi5yZXNldCgpO1xyXG5cclxuXHRcdFx0dGhpcy5jdXJyZW50TWVzc2FnZS5oaWRlKCkudGhlbih4ID0+IHtcclxuXHRcdFx0XHR0aGlzLmN1cnJlbnRNZXNzYWdlID0gbnVsbDtcclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblxyXG5cdFx0X2NyZWF0ZU1lc3NhZ2UodGl0bGU6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nKTogTW9kYWxNZXNzYWdlIHtcclxuXHRcdFx0bGV0IG1vZGFsID0gbmV3IE1vZGFsTWVzc2FnZSh0aXRsZSwgbWVzc2FnZSk7XHJcblxyXG5cdFx0XHRtb2RhbC5vbkNsb3NlLmFkZExpc3RlbmVyKCgpID0+IHtcclxuXHRcdFx0XHR0aGlzLl9wYW5lbC5mb2N1cygpO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdHJldHVybiBtb2RhbDtcclxuXHRcdH1cclxuXHJcblx0XHRzaG93TWVzc2FnZSh0aXRsZTogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcpIHtcclxuXHRcdFx0dGhpcy5jdXJyZW50TWVzc2FnZSA9IHRoaXMuX2NyZWF0ZU1lc3NhZ2UodGl0bGUsIG1lc3NhZ2UpO1xyXG5cdFx0XHR0aGlzLmN1cnJlbnRNZXNzYWdlLmFjdGlvbnMucHVzaCh7dGl0bGU6ICdPSycsIGhhbmRsZXI6IHRoaXMuZGlzbWlzc01lc3NhZ2V9KTtcclxuXHRcdH1cclxuXHJcblx0XHRzaG93UmVsZWFzZU5vdGVzKGV2dCwgY3R4KSB7XHJcblx0XHRcdGN0eC5jdXJyZW50TWVzc2FnZS5oaWRlKCkudGhlbigoKSA9PiB7XHJcblx0XHRcdFx0Y2hyb21lLmJyb3dzZXJBY3Rpb24uc2V0QmFkZ2VUZXh0KHt0ZXh0IDogJyd9KTtcclxuXHJcblx0XHRcdFx0RXh0QVBJLmludm9rZSgnb3Blbi1yZWxlYXNlLW5vdGVzJykuY2F0Y2goZXJyb3IgPT4ge1xyXG5cdFx0XHRcdFx0Y3R4Ll9oYW5kbGVDb21tb25FcnJvcnMoZXJyb3IpO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cclxuXHRcdHNob3dQcm9QYWdlKGV2dCwgY3R4KSB7XHJcblx0XHRcdEV4dEFQSS5pbnZva2UoJ29wZW4tcHJvLXBhZ2UnKS5jYXRjaChlcnJvciA9PiB7XHJcblx0XHRcdFx0Y3R4Ll9oYW5kbGVDb21tb25FcnJvcnMoZXJyb3IpO1xyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblx0XHRzaG93RXJyb3IobWVzc2FnZSkge1xyXG5cdFx0XHRjbGVhclRpbWVvdXQodGhpcy5lcnJvck1lc3NhZ2VUaW1lb3V0KTtcclxuXHRcdFx0dGhpcy5lcnJvck1lc3NhZ2UgPSBtZXNzYWdlO1xyXG5cdFx0XHR0aGlzLmVycm9yTWVzc2FnZVRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuaGlkZUVycm9yKCksIDIwMDApO1xyXG5cdFx0fVxyXG5cclxuXHRcdGhpZGVFcnJvciA9ICgpID0+IHtcclxuXHRcdFx0Y2xlYXJUaW1lb3V0KHRoaXMuZXJyb3JNZXNzYWdlVGltZW91dCk7XHJcblx0XHRcdHRoaXMuZXJyb3JNZXNzYWdlVGltZW91dCA9IG51bGw7XHJcblx0XHR9XHJcblxyXG5cdFx0aGlkZVF1aWNrVGlwcyA9ICgpID0+IHtcclxuXHRcdFx0dGhpcy5zaG93UXVpY2tUaXBzID0gZmFsc2U7XHJcblx0XHRcdHdpbmRvdy5sb2NhbFN0b3JhZ2VbJ3Nob3dRdWlja1RpcHMnXSA9ICcwJztcclxuXHRcdH1cclxuXHJcblx0XHRzaG93QmFubmVyKGJhbm5lcjogQWZmaWxpYXRlQmFubmVyKSB7XHJcblx0XHRcdHRoaXMuY3VycmVudEJhbm5lciA9IGJhbm5lcjtcclxuXHJcblx0XHRcdGlmIChiYW5uZXIpIHtcclxuXHRcdFx0XHRsZXQgc2hlZXQgPSA8Q1NTU3R5bGVTaGVldD4gd2luZG93LmRvY3VtZW50LnN0eWxlU2hlZXRzWzBdO1xyXG5cdFx0XHRcdHNoZWV0Lmluc2VydFJ1bGUoYCNwcm9tbyAuYmFubmVyOmhvdmVyIC5kaW0geyBjb2xvcjogJHtiYW5uZXIuYWNjZW50fTsgfWAsIHNoZWV0LmNzc1J1bGVzLmxlbmd0aCk7XHJcblxyXG5cdFx0XHRcdCQuYWRkQ2xhc3MoJyNwcm9tbycsICd2aXNpYmxlJyk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRoaWRlQmFubmVyKCkge1xyXG5cdFx0XHQkLmhpZGUoJyNwcm9tbycpO1xyXG5cdFx0XHQkLmFkZENsYXNzKCcjaW5mbycsICdlbXB0eScpO1xyXG5cdFx0XHQvL3RoaXMuY3VycmVudEJhbm5lciA9IG51bGw7XHJcblxyXG5cdFx0XHRFeHRBUEkuaW52b2tlKCdoaWRlLWJhbm5lcicpLnRoZW4oZmlyc3RUaW1lID0+IHtcclxuXHRcdFx0XHRpZiAoIWZpcnN0VGltZSkgcmV0dXJuO1xyXG5cclxuXHRcdFx0XHQvLyB0aGlzLnNob3dNZXNzYWdlKCdOb3RpY2UnLCAnTm8gbW9yZSByZWNvbW1lbmRhdGlvbnMgZm9yIHlvdSB0b2RheSE8YnIgLz5TZWUgeW91IGFnYWluIHRvbW9ycm93ISA6KScpO1xyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cclxuXHRcdHF1aWNrUmVzaXplKGV2dCwgY3R4KSB7XHJcblx0XHRcdHRoaXMuX3Jlc2l6ZSh0aGlzLnF1aWNrKTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXNpemVQcmVzZXQoY3R4KSB7XHJcblx0XHRcdHRoaXMuX3Jlc2l6ZShjdHguaXRlbSk7XHJcblx0XHR9XHJcblxyXG5cdFx0b3BlblByZXNldHNTZXR0aW5ncyhldnQsIGN0eCkge1xyXG5cdFx0XHRFeHRBUEkuaW52b2tlKCdvcGVuLXByZXNldHMtc2V0dGluZ3MnKS5jYXRjaChlcnJvciA9PiB7XHJcblx0XHRcdFx0Y3R4Ll9oYW5kbGVDb21tb25FcnJvcnMoZXJyb3IpO1xyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblx0XHRvcGVuU2V0dGluZ3MoZXZ0LCBjdHgpIHtcclxuXHRcdFx0RXh0QVBJLmludm9rZSgnb3Blbi1zZXR0aW5ncycpLmNhdGNoKGVycm9yID0+IHtcclxuXHRcdFx0XHRjdHguX2hhbmRsZUNvbW1vbkVycm9ycyhlcnJvcik7XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cclxuXHRcdGJ1Z1JlcG9ydChldnQsIGN0eCkge1xyXG5cdFx0XHRFeHRBUEkuaW52b2tlKCdvcGVuLXVybCcsIHtcclxuXHRcdFx0XHR1cmw6ICdodHRwczovL3dpbmRvd3Jlc2l6ZXIudXNlcmVjaG8uY29tLydcclxuXHRcdFx0fSkuY2F0Y2goTE9HX0VSUk9SKTtcclxuXHRcdH1cclxuXHJcblx0XHR0b2dnbGVSZXNpemVJbmZvKGV2dCwgY3R4KSB7XHJcblx0XHRcdEV4dEFQSS5pbnZva2UoJ3RvZ2dsZS10b29sdGlwJykuY2F0Y2goZXJyb3IgPT4ge1xyXG5cdFx0XHRcdGN0eC5faGFuZGxlQ29tbW9uRXJyb3JzKGVycm9yKTtcclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblxyXG5cdFx0b3BlbkFzUG9wdXAoZXZ0LCBjdHgpIHtcclxuXHRcdFx0RXh0QVBJLmludm9rZSgnb3Blbi1hcy1wb3B1cCcpLnRoZW4ocmVzcG9uc2UgPT4ge1xyXG5cdFx0XHRcdCFpc1N0YW5kYWxvbmVQb3B1cCgpICYmIHdpbmRvdy5jbG9zZSgpO1xyXG5cdFx0XHR9KS5jYXRjaChlcnJvciA9PiB7XHJcblx0XHRcdFx0Y3R4Ll9oYW5kbGVDb21tb25FcnJvcnMoZXJyb3IpO1xyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblx0XHRyb3RhdGVWaWV3cG9ydCgpIHtcclxuXHRcdFx0RXh0QVBJLmludm9rZSgncm90YXRlLXZpZXdwb3J0JykuY2F0Y2goZXJyb3IgPT4ge1xyXG5cdFx0XHRcdHRoaXMuX2hhbmRsZUNvbW1vbkVycm9ycyhlcnJvcik7XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cclxuXHRcdHRvZ2dsZVNpZGViYXIoZXZ0LCBjdHgpIHtcclxuXHRcdFx0Y3R4LmNvbGxhcHNlZFNpZGViYXIgPSAhY3R4LmNvbGxhcHNlZFNpZGViYXI7XHJcblx0XHRcdHdpbmRvdy5sb2NhbFN0b3JhZ2VbJ2NvbGxhcHNlZC1zaWRlYmFyJ10gPSBjdHguY29sbGFwc2VkU2lkZWJhciA/IDEgOiAwO1xyXG5cdFx0XHRjdHguX2ZvY3VzUGFuZWwoMCk7XHJcblx0XHR9XHJcblxyXG5cdFx0X3Jlc2l6ZShjb25maWcpIHtcclxuXHRcdFx0dGhpcy5oaWRlRXJyb3IoKTtcclxuXHRcdFx0RXh0QVBJLmludm9rZSgncmVzaXplJywgY29uZmlnKS5jYXRjaChlcnJvciA9PiB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coZXJyb3IpXHJcblx0XHRcdFx0dGhpcy5faGFuZGxlQ29tbW9uRXJyb3JzKGVycm9yKTtcclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblxyXG5cdFx0X3ByZXZlbnREZWZhdWx0KG1ldGhvZCkge1xyXG5cdFx0XHRyZXR1cm4gKGV2dCwgY3R4KSA9PiB7XHJcblx0XHRcdFx0ZXZ0LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdFx0bWV0aG9kLmNhbGwodGhpcywgZXZ0LCBjdHgpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0X2hhbmRsZUNvbW1vbkVycm9ycyhlcnJvcikge1xyXG5cdFx0XHR0aGlzLl9oYW5kbGVPT0JFcnJvcihlcnJvci5lcnJvcnMpO1xyXG5cdFx0XHR0aGlzLl9oYW5kbGVQcm90b2NvbEVycm9yKGVycm9yKTtcclxuXHJcblx0XHRcdGlmIChlcnJvci5GSUxFX1BST1RPQ09MX1BFUk1JU1NJT04pIHtcclxuXHRcdFx0XHRsZXQgdGl0bGUgICA9ICdJbnN1ZmZpY2llbnQgcGVybWlzc2lvbnMnO1xyXG5cdFx0XHRcdGxldCBtZXNzYWdlID0gJ1lvdSBuZWVkIHRvIGV4cGxpY2l0bHkgYWxsb3cgYWNjZXNzIHRvIDxlbT5maWxlOi8vPC9lbT4gVVJMcyBvbiB0aGUgZXh0ZW5zaW9ucyBtYW5hZ2VtZW50IHBhZ2UuJztcclxuXHRcdFx0XHRsZXQgYWN0aW9uICA9IHt0aXRsZTogJ09LJywgaGFuZGxlcjogKCkgPT4ge1xyXG5cdFx0XHRcdFx0dGhpcy5kaXNtaXNzTWVzc2FnZSgpO1xyXG5cdFx0XHRcdFx0Y2hyb21lLnRhYnMuY3JlYXRlKHt1cmw6ICdjaHJvbWU6Ly9leHRlbnNpb25zLz9pZD0nICsgY2hyb21lLnJ1bnRpbWUuaWR9KTtcclxuXHRcdFx0XHR9fVxyXG5cclxuXHRcdFx0XHR0aGlzLmN1cnJlbnRNZXNzYWdlID0gdGhpcy5fY3JlYXRlTWVzc2FnZSh0aXRsZSwgbWVzc2FnZSk7XHJcblx0XHRcdFx0dGhpcy5jdXJyZW50TWVzc2FnZS5hY3Rpb25zLnB1c2goYWN0aW9uKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKGVycm9yLldFQlNUT1JFX1BFUk1JU1NJT04pIHtcclxuXHRcdFx0XHRsZXQgdGl0bGUgICA9ICdQZXJtaXNzaW9ucyBlcnJvcic7XHJcblx0XHRcdFx0bGV0IG1lc3NhZ2UgPSAnVGhlIHRvb2x0aXAgY2FuXFwndCBiZSBkaXNwbGF5ZWQgb24gdGhpcyB0YWIgYmVjYXVzZSBleHRlbnNpb25zIGFyZSBub3QgYWxsb3dlZCB0byBhbHRlciB0aGUgY29udGVudCBvZiB0aGUgQ2hyb21lIFdlYnN0b3JlIHBhZ2VzLic7XHJcblx0XHRcdFx0bGV0IGFjdGlvbiAgPSB7dGl0bGU6ICdPSycsIGhhbmRsZXI6IHRoaXMuZGlzbWlzc01lc3NhZ2V9O1xyXG5cclxuXHRcdFx0XHR0aGlzLmN1cnJlbnRNZXNzYWdlID0gdGhpcy5fY3JlYXRlTWVzc2FnZSh0aXRsZSwgbWVzc2FnZSk7XHJcblx0XHRcdFx0dGhpcy5jdXJyZW50TWVzc2FnZS5hY3Rpb25zLnB1c2goYWN0aW9uKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdF9oYW5kbGVPT0JFcnJvcihlcnJvcikge1xyXG5cdFx0XHRpZiAoZXJyb3IgJiYgZXJyb3IuT1VUX09GX0JPVU5EUykge1xyXG5cdFx0XHRcdHRoaXMuc2hvd0Vycm9yKGBDaHJvbWUgY291bGRuJ3QgYXBwbHkgdGhlIGV4YWN0IGRlc2lyZWQgZGltZW5zaW9ucyFgKTtcclxuXHRcdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0XHRcdC8vIHZhciBrZXlzID0gZXJyb3IuT1VUX09GX0JPVU5EUy5rZXlzO1xyXG5cdFx0XHRcdC8vIHZhciBlcnJzID0gW107XHJcblxyXG5cdFx0XHRcdC8vIGlmIChrZXlzLmluZGV4T2YoJ01BWF9IRUlHSFQnKSA+IC0xKSB7XHJcblx0XHRcdFx0Ly8gXHRlcnJzLnB1c2goJ3RoZSB0YXJnZXQgPGI+aGVpZ2h0PC9iPiBpcyBncmVhdGVyIHRoYW4gdGhlIG1heGltdW0gYWxsb3dlZCBieSB5b3VyIGN1cnJlbnQgc2NyZWVuIHJlc29sdXRpb24nKTtcclxuXHRcdFx0XHQvLyB9XHJcblxyXG5cdFx0XHRcdC8vIGlmIChrZXlzLmluZGV4T2YoJ01BWF9XSURUSCcpID4gLTEpIHtcclxuXHRcdFx0XHQvLyBcdGVycnMucHVzaCgndGhlIHRhcmdldCA8Yj53aWR0aDwvYj4gaXMgZ3JlYXRlciB0aGFuIHRoZSBtYXhpbXVtIGFsbG93ZWQgYnkgeW91ciBjdXJyZW50IHNjcmVlbiByZXNvbHV0aW9uJyk7XHJcblx0XHRcdFx0Ly8gfVxyXG5cclxuXHRcdFx0XHQvLyBpZiAoa2V5cy5pbmRleE9mKCdNSU5fSEVJR0hUJykgPiAtMSkge1xyXG5cdFx0XHRcdC8vIFx0ZXJycy5wdXNoKCd0aGUgdGFyZ2V0IDxiPmhlaWdodDwvYj4gaXMgbG93ZXIgdGhhbiB0aGUgbWluaW11bSBhbGxvd2VkIGJ5IHlvdXIgYnJvd3NlciB3aW5kb3cnKTtcclxuXHRcdFx0XHQvLyB9XHJcblxyXG5cdFx0XHRcdC8vIGlmIChrZXlzLmluZGV4T2YoJ01JTl9XSURUSCcpID4gLTEpIHtcclxuXHRcdFx0XHQvLyBcdGVycnMucHVzaCgndGhlIHRhcmdldCA8Yj53aWR0aDwvYj4gaXMgbG93ZXIgdGhhbiB0aGUgbWF4aW11bSBhbGxvd2VkIGJ5IHlvdXIgYnJvd3NlciB3aW5kb3cnKTtcclxuXHRcdFx0XHQvLyB9XHJcblxyXG5cdFx0XHRcdC8vIHRoaXMuc2hvd01lc3NhZ2UoJ0VSUk9SJywgJzx1bD48bGk+JyArIGVycnMuam9pbignPC9saT48bGk+JykgKyAnPC9saT48L3VsPjxiPkhJTlQ6PC9iPiBBZGp1c3QgdGhlIHpvb20gbGV2ZWwgdGhlbiB0cnkgYWdhaW4uIChab29tIGluIGZvciBmZXdlciBhbmQgem9vbSBvdXQgZm9yIG1vcmUgQ1NTIHBpeGVscyknKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdF9oYW5kbGVQcm90b2NvbEVycm9yKGVycm9yKSB7XHJcblx0XHRcdGlmIChlcnJvci5JTlZBTElEX1BST1RPQ09MKSB7XHJcblx0XHRcdFx0dmFyIGVyciA9IGVycm9yLklOVkFMSURfUFJPVE9DT0w7XHJcblxyXG5cdFx0XHRcdGlmICghZXJyLnRhYi51cmwpIHtcclxuXHRcdFx0XHRcdGxldCB0aXRsZSA9ICdJbnN1ZmZpY2llbnQgcGVybWlzc2lvbnMnO1xyXG5cdFx0XHRcdFx0bGV0IG1lc3NhZ2UgPSAnSW4gb3JkZXIgZm9yIHRoZSBleHRlbnNpb24gdG8gd29yayBvbiByZWd1bGFyIHdpbmRvd3MgaW4gPGVtPmRldGFjaGVkPC9lbT4gbW9kZSwgaXQgbmVlZHMgdG8gYmUgYWJsZSB0byBpbmplY3QgY3VzdG9tIGNvZGUgaW4gdGhlIGNvbnRleHQgb2YgYWxsIHBhZ2VzLCB3aXRob3V0IHVzZXIgaW50ZXJhY3Rpb24uJztcclxuXHJcblx0XHRcdFx0XHR0aGlzLmN1cnJlbnRNZXNzYWdlID0gdGhpcy5fY3JlYXRlTWVzc2FnZSh0aXRsZSwgbWVzc2FnZSk7XHJcblx0XHRcdFx0XHR0aGlzLmN1cnJlbnRNZXNzYWdlLmFjdGlvbnMucHVzaCh7dGl0bGU6ICdDYW5jZWwnLCBoYW5kbGVyOiB0aGlzLmRpc21pc3NNZXNzYWdlfSlcclxuXHRcdFx0XHRcdHRoaXMuY3VycmVudE1lc3NhZ2UuYWN0aW9ucy5wdXNoKHt0aXRsZTogJ0dyYW50IHBlcm1pc3Npb25zJywgbWFpbjogdHJ1ZSwgaGFuZGxlcjogKCkgPT4ge1xyXG5cdFx0XHRcdFx0XHR0aGlzLmRpc21pc3NNZXNzYWdlKCk7XHJcblx0XHRcdFx0XHRcdGNocm9tZS5wZXJtaXNzaW9ucy5yZXF1ZXN0KHtwZXJtaXNzaW9uczogWyd0YWJzJ10sIG9yaWdpbnM6IFsnPGFsbF91cmxzPiddfSwgZ3JhbnRlZCA9PiB7fSk7XHJcblx0XHRcdFx0XHR9fSlcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0dGhpcy5zaG93TWVzc2FnZShcclxuXHRcdFx0XHRcdFx0J0ludmFsaWQgcHJvdG9jb2w6IDxiPicgKyBTdHJpbmcoZXJyLnByb3RvY29sKSArICc6Ly88L2I+JyxcclxuXHRcdFx0XHRcdFx0J1RoaXMgZmVhdHVyZSBvbmx5IHdvcmtzIG9uIHBhZ2VzIGxvYWRlZCB1c2luZyBvbmUgb2YgdGhlIGZvbGxvd2luZyBwcm90b2NvbHM6IDxiciAvPjxiPmh0dHA6Ly88L2I+LCA8Yj5odHRwczovLzwvYj4gb3IgPGI+ZmlsZTovLzwvYj4nXHJcblx0XHRcdFx0XHQpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdF9zaG93S2V5cygpIHtcclxuXHRcdFx0dGhpcy5zaG93S2V5cyA9IHRydWU7XHJcblx0XHR9XHJcblx0XHRfaGlkZUtleXMoKSB7XHJcblx0XHRcdHRoaXMuc2hvd0tleXMgPSBmYWxzZTtcclxuXHRcdH1cclxuXHJcblx0XHRfaW5pdFBhbmVscygpIHtcclxuXHRcdFx0dGhpcy5fcGFuZWxzLnB1c2gobmV3IExpc3RQYW5lbCgnI3ByZXNldHNQYW5lbCcsICd3ci1wcmVzZXQnKSk7XHJcblx0XHRcdHRoaXMuX3BhbmVscy5wdXNoKG5ldyBMaXN0UGFuZWwoJyN0b29sc1BhbmVsJywgJ2J1dHRvbicpKTtcclxuXHJcblx0XHRcdHRoaXMuX3BhbmVsID0gdGhpcy5fcGFuZWxzWzBdO1xyXG5cdFx0fVxyXG5cclxuXHRcdF9mb2N1c1BhbmVsKGlkeDogbnVtYmVyKSB7XHJcblx0XHRcdGlmIChpZHggPT09IDEgJiYgdGhpcy5jb2xsYXBzZWRTaWRlYmFyKSB7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRsZXQgcGFuZWwgPSB0aGlzLl9wYW5lbHNbaWR4XTtcclxuXHJcblx0XHRcdGlmIChwYW5lbCAhPSB0aGlzLl9wYW5lbCkge1xyXG5cdFx0XHRcdHRoaXMuX3BhbmVsICYmIHRoaXMuX3BhbmVsLmJsdXIoKTtcclxuXHJcblx0XHRcdFx0dGhpcy5fcGFuZWwgPSBwYW5lbDtcclxuXHRcdFx0XHR0aGlzLl9wYW5lbC5mb2N1cygpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0aGFuZGxlQmFubmVyQ2xpY2soZXZ0LCBjdHgpIHtcclxuXHRcdFx0Y29uc3QgdGFyZ2V0ID0gZXZ0LmN1cnJlbnRUYXJnZXQ7XHJcblx0XHRcdGNvbnN0IHVybCA9IHRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdXJsJyk7XHJcblx0XHRcdGNvbnN0IGFjdGlvbiA9IHRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtYWN0aW9uJyk7XHJcblxyXG5cdFx0XHRpZiAodXJsKSB7XHJcblx0XHRcdFx0RXh0QVBJLmludm9rZSgnb3Blbi11cmwnLCB7dXJsfSkuY2F0Y2goTE9HX0VSUk9SKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRjdHhbYWN0aW9uXSgpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0aGFuZGxlUHJlc2V0Q2xpY2soZXZ0LCBjdHgpIHtcclxuXHRcdFx0dGhpcy5fZm9jdXNQYW5lbCgwKTtcclxuXHRcdFx0Ly90aGlzLl9wYW5lbC5yZXNldCgpO1xyXG5cdFx0XHR0aGlzLl9wYW5lbC5zZWxlY3RJdGVtKGV2dC5jdXJyZW50VGFyZ2V0KTtcclxuXHJcblx0XHRcdHRoaXMucmVzaXplUHJlc2V0KGN0eCk7XHJcblxyXG5cdFx0XHR0aGlzLmF1dG9DbG9zZVBvcHVwICYmICFpc1N0YW5kYWxvbmVQb3B1cCgpICYmIHdpbmRvdy5jbG9zZSgpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGhhbmRsZVRvb2xzQ2xpY2soZXZ0LCBjdHgpIHtcclxuXHRcdFx0aWYgKGV2dC50YXJnZXQgaW5zdGFuY2VvZiBIVE1MQnV0dG9uRWxlbWVudCkge1xyXG5cdFx0XHRcdHRoaXMuX2ZvY3VzUGFuZWwoMSk7XHJcblx0XHRcdFx0dGhpcy5fcGFuZWwuc2VsZWN0SXRlbShldnQudGFyZ2V0KTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGhhbmRsZUtleURvd24oZXZ0LCBjdHgpIHtcclxuXHRcdFx0bGV0IGtleUNvZGUgPSBldnQua2V5Q29kZTtcclxuXHRcdFx0bGV0IGhhbmRsZWQgPSB0cnVlO1xyXG5cclxuXHRcdFx0c3dpdGNoIChrZXlDb2RlKSB7XHJcblx0XHRcdFx0Y2FzZSBLZXlzLlNISUZUOlxyXG5cdFx0XHRcdFx0aWYgKCF0aGlzLnNob3dLZXlzKSB7XHJcblx0XHRcdFx0XHRcdHRoaXMuc2hvd0tleXMgPSB0cnVlO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdGJyZWFrO1xyXG5cclxuXHRcdFx0XHRjYXNlIEtleXMuU1BBQ0U6XHJcblx0XHRcdFx0Y2FzZSBLZXlzLkVOVEVSOlxyXG5cdFx0XHRcdFx0JC5hZGRDbGFzcyh0aGlzLl9wYW5lbC5jdXJyZW50Tm9kZSgpLCAnYWN0aXZlJyk7XHJcblx0XHRcdFx0YnJlYWs7XHJcblxyXG5cdFx0XHRcdGNhc2UgS2V5cy5VUDpcclxuXHRcdFx0XHRcdHRoaXMuX3BhbmVsLnByZXYoKTtcclxuXHRcdFx0XHRicmVhaztcclxuXHJcblx0XHRcdFx0Y2FzZSBLZXlzLkRPV046XHJcblx0XHRcdFx0XHR0aGlzLl9wYW5lbC5uZXh0KCk7XHJcblx0XHRcdFx0YnJlYWs7XHJcblxyXG5cdFx0XHRcdGNhc2UgS2V5cy5SSUdIVDpcclxuXHRcdFx0XHRcdHRoaXMuX2ZvY3VzUGFuZWwoMSk7XHJcblx0XHRcdFx0YnJlYWs7XHJcblxyXG5cdFx0XHRcdGNhc2UgS2V5cy5MRUZUOlxyXG5cdFx0XHRcdFx0dGhpcy5fZm9jdXNQYW5lbCgwKTtcclxuXHRcdFx0XHRicmVhaztcclxuXHJcblx0XHRcdFx0ZGVmYXVsdDpcclxuXHRcdFx0XHRcdGhhbmRsZWQgPSBmYWxzZTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0bGV0IG5vZGUgPSBfZ2V0UHJlc2V0QnlLZXlDb2RlKGtleUNvZGUpO1xyXG5cdFx0XHRpZiAobm9kZSkge1xyXG5cdFx0XHRcdHRoaXMuX3BhbmVsLmZvY3VzKCk7XHJcblx0XHRcdFx0dGhpcy5fZm9jdXNQYW5lbCgwKTtcclxuXHRcdFx0XHR0aGlzLl9wYW5lbC5zZWxlY3RJdGVtKG5vZGUpO1xyXG5cclxuXHRcdFx0XHQkLmFkZENsYXNzKG5vZGUsICdhY3RpdmUnKTtcclxuXHRcdFx0XHRoYW5kbGVkID0gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKCFoYW5kbGVkKSB7XHJcblx0XHRcdFx0bGV0IGNoYXIgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGtleUNvZGUpO1xyXG5cdFx0XHRcdGxldCBub2RlID0gJC5xKGBbZGF0YS1rZXk9XCIke2NoYXJ9XCJdYCk7XHJcblxyXG5cdFx0XHRcdGlmIChub2RlKSB7XHJcblx0XHRcdFx0XHR0aGlzLl9wYW5lbC5mb2N1cygpO1xyXG5cdFx0XHRcdFx0dGhpcy5fZm9jdXNQYW5lbCgxKTtcclxuXHRcdFx0XHRcdHRoaXMuX3BhbmVsLnNlbGVjdEl0ZW0obm9kZSk7XHJcblxyXG5cdFx0XHRcdFx0JC5hZGRDbGFzcyhub2RlLCAnYWN0aXZlJyk7XHJcblx0XHRcdFx0XHRoYW5kbGVkID0gdHJ1ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblxyXG5cdFx0XHRpZiAoaGFuZGxlZCkge1xyXG5cdFx0XHRcdGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0aGFuZGxlS2V5VXAoZXZ0LCBjdHgpIHtcclxuXHRcdFx0bGV0IGtleUNvZGUgPSBldnQua2V5Q29kZTtcclxuXHRcdFx0bGV0IGhhbmRsZWQgPSB0cnVlO1xyXG5cclxuXHRcdFx0c3dpdGNoIChrZXlDb2RlKSB7XHJcblx0XHRcdFx0Y2FzZSBLZXlzLlNISUZUOlxyXG5cdFx0XHRcdFx0aWYgKHRoaXMuc2hvd0tleXMpIHtcclxuXHRcdFx0XHRcdFx0dGhpcy5zaG93S2V5cyA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdGJyZWFrO1xyXG5cclxuXHRcdFx0XHRjYXNlIEtleXMuU1BBQ0U6XHJcblx0XHRcdFx0Y2FzZSBLZXlzLkVOVEVSOlxyXG5cdFx0XHRcdFx0JC5yZW1vdmVDbGFzcyh0aGlzLl9wYW5lbC5jdXJyZW50Tm9kZSgpLCAnYWN0aXZlJyk7XHJcblx0XHRcdFx0XHQkLnRyaWdnZXIoJ2NsaWNrJywgdGhpcy5fcGFuZWwuY3VycmVudE5vZGUoKSk7XHJcblx0XHRcdFx0YnJlYWs7XHJcblxyXG5cdFx0XHRcdGRlZmF1bHQ6XHJcblx0XHRcdFx0XHRoYW5kbGVkID0gZmFsc2U7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGxldCBub2RlID0gX2dldFByZXNldEJ5S2V5Q29kZShrZXlDb2RlKTtcclxuXHRcdFx0aWYgKG5vZGUpIHtcclxuXHRcdFx0XHQkLnJlbW92ZUNsYXNzKG5vZGUsICdhY3RpdmUnKTtcclxuXHRcdFx0XHQkLnRyaWdnZXIoJ2NsaWNrJywgbm9kZSk7XHJcblx0XHRcdFx0aGFuZGxlZCA9IHRydWU7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmICghaGFuZGxlZCkge1xyXG5cdFx0XHRcdGxldCBjaGFyID0gU3RyaW5nLmZyb21DaGFyQ29kZShrZXlDb2RlKTtcclxuXHRcdFx0XHRsZXQgbm9kZSA9ICQucShgW2RhdGEta2V5PVwiJHtjaGFyfVwiXWApO1xyXG5cclxuXHRcdFx0XHRpZiAobm9kZSkge1xyXG5cdFx0XHRcdFx0JC5yZW1vdmVDbGFzcyhub2RlLCAnYWN0aXZlJyk7XHJcblx0XHRcdFx0XHQkLnRyaWdnZXIoJ2NsaWNrJywgbm9kZSk7XHJcblx0XHRcdFx0XHRoYW5kbGVkID0gdHJ1ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChoYW5kbGVkKSB7XHJcblx0XHRcdFx0ZXZ0LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRpbml0TmF2aWdhdGlvbigpIHtcclxuXHRcdFx0bGV0IG1haW4gPSAkLnEoJyNtYWluJyk7XHJcblxyXG5cdFx0XHQkLm9uKCdrZXlkb3duJywgbWFpbiwgdGhpcy5oYW5kbGVLZXlEb3duLCB0cnVlKTtcclxuXHRcdFx0JC5vbigna2V5dXAnLCBtYWluLCB0aGlzLmhhbmRsZUtleVVwLCB0cnVlKTtcclxuXHJcblx0XHRcdGxldCBoID0gbmV3IEZvY3VzSGFuZGxlcihtYWluKTtcclxuXHJcblx0XHRcdG1haW4uZm9jdXMoKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGNsYXNzIEZvY3VzSGFuZGxlciB7XHJcblx0XHRwcm90ZWN0ZWQgaWdub3JlID0gZmFsc2U7XHJcblx0XHRwcm90ZWN0ZWQgZm9jdXNlZCA9IGZhbHNlO1xyXG5cdFx0cHJvdGVjdGVkIHRhcmdldDogSFRNTEVsZW1lbnQ7XHJcblxyXG5cdFx0Y29uc3RydWN0b3IodGFyZ2V0OiBIVE1MRWxlbWVudCkge1xyXG5cdFx0XHR0aGlzLnRhcmdldCA9IHRhcmdldDtcclxuXHRcdFx0dGhpcy5fX2luaXRIYW5kbGVycygpO1xyXG5cclxuXHRcdFx0JC5vbignZm9jdXMnLCB0aGlzLnRhcmdldCwgdGhpcy5vbkZvY3VzLCB0cnVlKTtcclxuXHRcdFx0JC5vbignYmx1cicsIHRoaXMudGFyZ2V0LCB0aGlzLm9uQmx1ciwgdHJ1ZSk7XHJcblx0XHRcdCQub24oJ21vdXNlZG93bicsIHRoaXMudGFyZ2V0LCB0aGlzLm9uTW91c2VEb3duLCB0cnVlKTtcclxuXHRcdFx0JC5vbigna2V5ZG93bicsIGRvY3VtZW50LCB0aGlzLm9uS2V5RG93biwgdHJ1ZSk7XHJcblx0XHR9XHJcblxyXG5cdFx0X19pbml0SGFuZGxlcnMoKSB7XHJcblx0XHRcdHZhciBoYW5kbGVycyA9IFsnb25Gb2N1cycsICdvbkJsdXInLCAnb25LZXlEb3duJywgJ29uTW91c2VEb3duJ107XHJcblxyXG5cdFx0XHRmb3IgKHZhciBtZXRob2Qgb2YgaGFuZGxlcnMpIHtcclxuXHRcdFx0XHR0aGlzW21ldGhvZF0gPSBfX2V2ZW50SGFuZGxlcih0aGlzLCB0aGlzW21ldGhvZF0pO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBfX2V2ZW50SGFuZGxlcihjb250ZXh0LCBtZXRob2QpIHtcclxuXHRcdFx0XHRyZXR1cm4gZnVuY3Rpb24oZXZ0KSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gbWV0aG9kLmNhbGwoY29udGV4dCwgZXZ0LCB0aGlzKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRvbkJsdXIoZXZ0KSB7XHJcblx0XHRcdGlmICghdGhpcy50YXJnZXQuY29udGFpbnMoZXZ0LnJlbGF0ZWRUYXJnZXQpKSB7XHJcblx0XHRcdFx0JC5yZW1vdmVDbGFzcyh0aGlzLnRhcmdldCwgJ2ZvY3VzZWQnKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy5mb2N1c2VkID0gZmFsc2U7XHJcblx0XHR9XHJcblxyXG5cdFx0b25Gb2N1cyhldnQpIHtcclxuXHRcdFx0aWYgKCF0aGlzLmlnbm9yZSkge1xyXG5cdFx0XHRcdCQuYWRkQ2xhc3ModGhpcy50YXJnZXQsICdmb2N1c2VkJyk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRoaXMuZm9jdXNlZCA9IHRydWU7XHJcblx0XHR9XHJcblxyXG5cdFx0b25LZXlEb3duKGV2dCkge1xyXG5cdFx0XHR0aGlzLmlnbm9yZSA9IGZhbHNlO1xyXG5cdFx0XHRpZiAodGhpcy5mb2N1c2VkKSB7XHJcblx0XHRcdFx0JC5hZGRDbGFzcyh0aGlzLnRhcmdldCwgJ2ZvY3VzZWQnKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdG9uTW91c2VEb3duKGV2dCkge1xyXG5cdFx0XHQkLnJlbW92ZUNsYXNzKHRoaXMudGFyZ2V0LCAnZm9jdXNlZCcpO1xyXG5cdFx0XHR0aGlzLmlnbm9yZSA9IHRydWU7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHJcblxyXG5cdGZ1bmN0aW9uIF9zdGVhbEZvY3VzKGV2dCwgY3R4KSB7XHJcblx0XHRldnQucHJldmVudERlZmF1bHQoKVxyXG5cdFx0ZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cdFx0dGhpcy5mb2N1cygpO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gX2dldFByZXNldEJ5S2V5Q29kZShrZXlDb2RlOiBudW1iZXIpOiBIVE1MRWxlbWVudCB7XHJcblx0XHR2YXIgbm9kZTogSFRNTEVsZW1lbnQ7XHJcblxyXG5cdFx0aWYgKChrZXlDb2RlID49IEtleXMuRElHSVRTWzBdICYmIGtleUNvZGUgPD0gS2V5cy5ESUdJVFNbMV0pXHJcblx0XHR8fCAoa2V5Q29kZSA+PSBLZXlzLk5VTVBBRFswXSAmJiBrZXlDb2RlIDw9IEtleXMuTlVNUEFEWzFdKSkge1xyXG5cdFx0XHRsZXQgaWR4ICA9IChrZXlDb2RlICUgNDgpIHx8IDEwO1xyXG5cdFx0XHRub2RlID0gJC5xKGB3ci1wcmVzZXQ6bnRoLW9mLXR5cGUoJHtpZHh9KWApO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBub2RlO1xyXG5cdH1cclxuXHJcblx0Y2xhc3MgTGlzdFBhbmVsIHtcclxuXHRcdHBhcmVudDogRWxlbWVudCA9IG51bGw7XHJcblx0XHRsaXN0OiBzdHJpbmcgPSBudWxsO1xyXG5cdFx0Y3VycmVudDogbnVtYmVyID0gLTE7XHJcblxyXG5cdFx0YXV0b0luaXQ6IGJvb2xlYW4gPSB0cnVlO1xyXG5cclxuXHRcdF9zZWxlY3RlZDogc3RyaW5nID0gJ3NlbGVjdGVkJztcclxuXHRcdF9mb2N1c2VkOiBzdHJpbmcgPSAnZm9jdXNlZCc7XHJcblxyXG5cdFx0Y29uc3RydWN0b3IocGFyZW50OiBzdHJpbmcsIGxpc3Q6IHN0cmluZykge1xyXG5cdFx0XHR0aGlzLnBhcmVudCA9IDxFbGVtZW50PiAkLnEocGFyZW50KTtcclxuXHRcdFx0dGhpcy5saXN0ID0gbGlzdDtcclxuXHRcdH1cclxuXHJcblx0XHRuZXh0KCkge1xyXG5cdFx0XHRsZXQgbm9kZXMgPSAkLnFBbGwodGhpcy5saXN0LCB0aGlzLnBhcmVudCk7XHJcblx0XHRcdGxldCBuZXh0ID0gKHRoaXMuY3VycmVudCArIDEpICUgbm9kZXMubGVuZ3RoO1xyXG5cclxuXHRcdFx0dGhpcy5zZWxlY3QobmV4dCwgbm9kZXMpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHByZXYoKSB7XHJcblx0XHRcdGxldCBub2RlcyA9ICQucUFsbCh0aGlzLmxpc3QsIHRoaXMucGFyZW50KTtcclxuXHRcdFx0bGV0IHByZXYgPSAobm9kZXMubGVuZ3RoICsgdGhpcy5jdXJyZW50IC0gMSkgJSBub2Rlcy5sZW5ndGg7XHJcblxyXG5cdFx0XHR0aGlzLnNlbGVjdChwcmV2LCBub2Rlcyk7XHJcblx0XHR9XHJcblxyXG5cdFx0c2VsZWN0KG5leHQsIG5vZGVzLCBub0ZvY3VzPykge1xyXG5cdFx0XHRmb3IgKGxldCBpID0gMCwgbCA9IG5vZGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG5cdFx0XHRcdGxldCBub2RlID0gPEVsZW1lbnQ+IG5vZGVzW2ldO1xyXG5cdFx0XHRcdG5vZGUuY2xhc3NMaXN0LnJlbW92ZSh0aGlzLl9zZWxlY3RlZCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGxldCBub2RlID0gPEhUTUxFbGVtZW50PiBub2Rlc1tuZXh0XTtcclxuXHRcdFx0dGhpcy5fc2VsZWN0Tm9kZShub2RlKTtcclxuXHJcblx0XHRcdHRoaXMuY3VycmVudCA9IG5leHQ7XHJcblxyXG5cdFx0XHRpZiAoIW5vRm9jdXMpIHtcclxuXHRcdFx0XHR0aGlzLmZvY3VzKCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRmb2N1cygpIHtcclxuXHRcdFx0dGhpcy5wYXJlbnQuY2xhc3NMaXN0LmFkZCgnZm9jdXNlZCcpO1xyXG5cclxuXHRcdFx0aWYgKHRoaXMuYXV0b0luaXQgJiYgdGhpcy5jdXJyZW50IDwgMCkge1xyXG5cdFx0XHRcdHRoaXMubmV4dCgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLl9zZWxlY3ROb2RlKHRoaXMuY3VycmVudE5vZGUoKSk7XHJcblx0XHR9XHJcblxyXG5cdFx0Ymx1cigpIHtcclxuXHRcdFx0dGhpcy5wYXJlbnQuY2xhc3NMaXN0LnJlbW92ZSgnZm9jdXNlZCcpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJlc2V0KCkge1xyXG5cdFx0XHRsZXQgbm9kZXMgPSAkLnFBbGwodGhpcy5saXN0LCB0aGlzLnBhcmVudCk7XHJcblxyXG5cdFx0XHRmb3IgKGxldCBpID0gMCwgbCA9IG5vZGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG5cdFx0XHRcdGxldCBub2RlID0gbm9kZXNbaV07XHJcblx0XHRcdFx0bm9kZS5jbGFzc0xpc3QucmVtb3ZlKHRoaXMuX3NlbGVjdGVkKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy5jdXJyZW50ID0gLTE7XHJcblx0XHR9XHJcblxyXG5cdFx0c2VsZWN0SXRlbShpdGVtOiBOb2RlKSB7XHJcblx0XHRcdGxldCBub2RlcyA9ICQucUFsbCh0aGlzLmxpc3QsIHRoaXMucGFyZW50KTtcclxuXHRcdFx0bGV0IGZvdW5kID0gLTE7XHJcblxyXG5cdFx0XHRmb3IgKGxldCBpID0gMCwgbCA9IG5vZGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG5cdFx0XHRcdGlmIChpdGVtID09IG5vZGVzW2ldKSB7XHJcblx0XHRcdFx0XHRmb3VuZCA9IGk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoZm91bmQgPiAtMSAmJiBmb3VuZCAhPSB0aGlzLmN1cnJlbnQpIHtcclxuXHRcdFx0XHRsZXQgbm9kZSA9IDxIVE1MRWxlbWVudD4gbm9kZXNbZm91bmRdO1xyXG5cdFx0XHRcdHRoaXMucmVzZXQoKTtcclxuXHRcdFx0XHR0aGlzLl9zZWxlY3ROb2RlKG5vZGUpO1xyXG5cdFx0XHRcdHRoaXMuY3VycmVudCA9IGZvdW5kO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0Y3VycmVudE5vZGUoKSB7XHJcblx0XHRcdGxldCBub2RlcyA9ICQucUFsbCh0aGlzLmxpc3QsIHRoaXMucGFyZW50KTtcclxuXHRcdFx0cmV0dXJuIDxIVE1MRWxlbWVudD4gbm9kZXNbdGhpcy5jdXJyZW50XTtcclxuXHRcdH1cclxuXHJcblx0XHRfc2VsZWN0Tm9kZShub2RlOiBIVE1MRWxlbWVudCkge1xyXG5cdFx0XHRub2RlLmNsYXNzTGlzdC5hZGQodGhpcy5fc2VsZWN0ZWQpO1xyXG5cdFx0XHRub2RlLnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAnMCcpO1xyXG5cdFx0XHRub2RlLmZvY3VzKCk7XHJcblx0XHRcdG5vZGUuc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsICctMScpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZXhwb3J0IHZhciB2aWV3ID0gbmV3IFBvcHVwKCk7XHJcblx0dmFyIGJpbmRpbmcgPSByaXZldHMuYmluZChkb2N1bWVudC5ib2R5LCB2aWV3KTtcclxuXHR2aWV3LmluaXROYXZpZ2F0aW9uKCk7XHJcblxyXG5cdGNocm9tZS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcihtc2cgPT4ge1xyXG5cdFx0aWYgKG1zZy5VcGRhdGVkU2V0dGluZ3MpIHtcclxuXHJcblx0XHRcdGlmICgnbGljZW5zZScgaW4gbXNnLlVwZGF0ZWRTZXR0aW5ncykge1xyXG5cdFx0XHRcdHZpZXcuY3VycmVudEJhbm5lciA9IG51bGw7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmICgncHJlc2V0c0ljb25zU3R5bGUnIGluIG1zZy5VcGRhdGVkU2V0dGluZ3MpIHtcclxuXHRcdFx0XHR2aWV3LnByZXNldHNJY29uc1N0eWxlID0gbXNnLlVwZGF0ZWRTZXR0aW5ncy5wcmVzZXRzSWNvbnNTdHlsZTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKCdwcmVzZXRzUHJpbWFyeUxpbmUnIGluIG1zZy5VcGRhdGVkU2V0dGluZ3MpIHtcclxuXHRcdFx0XHR2aWV3LnByZXNldHNQcmltYXJ5TGluZSA9IG1zZy5VcGRhdGVkU2V0dGluZ3MucHJlc2V0c1ByaW1hcnlMaW5lO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoJ2FsdGVybmF0ZVByZXNldHNCZycgaW4gbXNnLlVwZGF0ZWRTZXR0aW5ncykge1xyXG5cdFx0XHRcdHZpZXcuYWx0ZXJuYXRlUHJlc2V0c0JnID0gbXNnLlVwZGF0ZWRTZXR0aW5ncy5hbHRlcm5hdGVQcmVzZXRzQmc7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmICgnYXV0b0Nsb3NlUG9wdXAnIGluIG1zZy5VcGRhdGVkU2V0dGluZ3MpIHtcclxuXHRcdFx0XHR2aWV3LmF1dG9DbG9zZVBvcHVwID0gbXNnLlVwZGF0ZWRTZXR0aW5ncy5hdXRvQ2xvc2VQb3B1cDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKCdoaWRlUHJlc2V0c0Rlc2NyaXB0aW9uJyBpbiBtc2cuVXBkYXRlZFNldHRpbmdzKSB7XHJcblx0XHRcdFx0dmlldy5oaWRlUHJlc2V0c0Rlc2NyaXB0aW9uID0gbXNnLlVwZGF0ZWRTZXR0aW5ncy5oaWRlUHJlc2V0c0Rlc2NyaXB0aW9uO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoJ2hpZGVQb3B1cFRvb2x0aXBzJyBpbiBtc2cuVXBkYXRlZFNldHRpbmdzKSB7XHJcblx0XHRcdFx0dmlldy5oaWRlUG9wdXBUb29sdGlwcyA9IG1zZy5VcGRhdGVkU2V0dGluZ3MuaGlkZVBvcHVwVG9vbHRpcHM7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmICgnaGlkZVF1aWNrUmVzaXplJyBpbiBtc2cuVXBkYXRlZFNldHRpbmdzKSB7XHJcblx0XHRcdFx0dmlldy5oaWRlUXVpY2tSZXNpemUgPSBtc2cuVXBkYXRlZFNldHRpbmdzLmhpZGVRdWlja1Jlc2l6ZTtcclxuXHRcdFx0XHR3aW5kb3cubG9jYWxTdG9yYWdlWydoaWRlUXVpY2tSZXNpemUnXSA9IG1zZy5VcGRhdGVkU2V0dGluZ3MuaGlkZVF1aWNrUmVzaXplID8gMSA6IDA7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmICgncHJlc2V0cycgaW4gbXNnLlVwZGF0ZWRTZXR0aW5ncykge1xyXG5cdFx0XHRcdHZpZXcucHJlc2V0cyA9IFtdO1xyXG5cdFx0XHRcdGZvciAobGV0IHByZXNldERhdGEgb2YgbXNnLlVwZGF0ZWRTZXR0aW5ncy5wcmVzZXRzKSB7XHJcblx0XHRcdFx0XHR2aWV3LnByZXNldHMucHVzaChuZXcgQ29yZS5QcmVzZXQocHJlc2V0RGF0YSkpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0pXHJcblxyXG5cclxuXHRmdW5jdGlvbiBMT0dfRVJST1IoZXJyOiBhbnkpIHtcclxuXHRcdGNvbnNvbGUubG9nKGVycik7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBpc1N0YW5kYWxvbmVQb3B1cCgpIHtcclxuXHRcdHJldHVybiB3aW5kb3cubG9jYXRpb24uaGFzaC5pbmRleE9mKCdwb3B1cC12aWV3JykgPiAtMTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9jb25zdHJhaW5XaW5kb3dTaXplKCkge1xyXG5cdFx0dmFyIGxpbWl0OiBhbnkgPSB7fTtcclxuXHJcblx0XHRpZiAod2luZG93LmlubmVyV2lkdGggPCAzNDApIHtcclxuXHRcdFx0bGltaXQud2lkdGggPSAzNDAgKyB3aW5kb3cub3V0ZXJXaWR0aCAtIHdpbmRvdy5pbm5lcldpZHRoO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh3aW5kb3cuaW5uZXJIZWlnaHQgPCA0MDApIHtcclxuXHRcdFx0bGltaXQuaGVpZ2h0ID0gNDAwICsgd2luZG93Lm91dGVySGVpZ2h0IC0gd2luZG93LmlubmVySGVpZ2h0O1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChsaW1pdC53aWR0aCB8fCBsaW1pdC5oZWlnaHQpIHtcclxuXHRcdFx0RXh0QVBJLmludm9rZSgnbGltaXQtcG9wdXAnLCBsaW1pdCk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRpZiAoaXNTdGFuZGFsb25lUG9wdXAoKSkge1xyXG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIF9jb25zdHJhaW5XaW5kb3dTaXplKTtcclxuXHR9XHJcbn1cclxuIl19
