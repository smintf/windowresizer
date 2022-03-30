var TabNav;
(function (TabNav) {
    var TAB_KEY = 9;
    var currentTarget;
    function limitTo(target, autofocus) {
        if (!currentTarget) {
            document.addEventListener('keydown', constrainNav);
        }
        currentTarget = target;
        if (autofocus) {
            target.focus();
            focusNextElement();
        }
    }
    TabNav.limitTo = limitTo;
    function reset() {
        currentTarget = null;
        document.removeEventListener('keydown', constrainNav);
    }
    TabNav.reset = reset;
    function constrainNav(evt) {
        if (evt.keyCode !== TAB_KEY || !currentTarget) {
            return;
        }
        evt.preventDefault();
        evt.stopPropagation();
        focusNextElement();
        return false;
    }
    function focusNextElement() {
        var focused = document.activeElement;
        var nodes = getFocusable().sort(byTabIndex);
        var next = (nodes.indexOf(focused) + 1) % nodes.length;
        nodes[next] && nodes[next].focus();
    }
    function getFocusable() {
        var valid = [];
        var nodes = currentTarget.querySelectorAll('*');
        for (var i = 0, l = nodes.length; i < l; i++) {
            var elem = nodes[i];
            if (elem.tabIndex > -1) {
                valid.push(elem);
            }
        }
        return valid;
    }
    function byTabIndex(n1, n2) {
        var t1 = n1.tabIndex;
        var t2 = n2.tabIndex;
        if (t1 === t2)
            return 0;
        if (t1 === 0)
            return 1;
        if (t2 === 0)
            return -1;
        return t1 - t2;
    }
})(TabNav || (TabNav = {}));

//# sourceMappingURL=tab-nav.js.map
