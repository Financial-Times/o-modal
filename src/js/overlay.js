'use strict';

var Delegate = require('dom-delegate');
var delegate;
var viewport = require('o-viewport');
viewport.listenTo('resize');
var oLayers = require('o-layers');
var utils = require('./utils');
var overlays = [];

var setOptions = function(opts, trigger) {
    
    // get config from data attributes if they're haven't been passed via JS
    if (!opts) {
        opts = {};
        Array.prototype.forEach.call(trigger.attributes, function(attr) {
            if (attr.name.indexOf('data-o-overlay') === 0) {
                // Remove the unnecessary part of the string the first time this is run for each attribute
                var key = attr.name.replace('data-o-overlay-', '');
                opts = utils.optionsFromKey(key, attr.value.toLowerCase(), opts);
            }
        });
    }

    if (!opts.html && opts.src) {
        if (/^(https?\:\/)?\//.test(opts.src)) {
            opts.html = utils.getContentFromURL(opts.src);
        } else {
            opts.html = utils.copyContent(document.querySelector(opts.src));
        }
    }

    if (!opts.html) {
        throw new Error('"o-overlay error": Content for the overlay needs to be set via the "html" or the "src" option.');
    }

    // There can't be a heading with an empty title
    if (opts.heading && (!opts.heading.title || !opts.heading.title.trim())) {
        throw new Error('"o-overlay error": To have a heading, a non-empty title needs to be set');
    }

    // If the overlay doesn't have an arrow, and the property modal hasn't been set, the default will be modal = true
    if (!opts.arrow && typeof opts.modal === 'undefined') {
        opts.modal = true;
    }

    if (opts.arrow) {
        // A direction needs to be set for the arrow overlay UI to work
        if (!opts.arrow.direction) {
            throw new Error('"o-overlay error": To use the arrow overlay UI, you need to set a default direction for the arrow');
        }

        // If the direction of the arrow is 'top' or 'bottom', the heading can't be shaded
        if ((opts.arrow.direction === 'top' || opts.arrow.direction === 'bottom') && opts.shaded) {
            throw new Error('"o-overlay error": The direction of the error c"o-overlay error": an\'t be set to "top" or "bottom" when the shaded heading option is set to true.');
        }

        // Default target for the arrow will be the trigger
        if (!opts.arrow.target) {
            opts.arrow.target = trigger;
        } else {
            opts.arrow.target = document.querySelector(opts.arrow.target);
        }
    }

    return opts;
};


var Overlay = function(opts, trigger) {
    this.trigger = trigger;
    this.context = oLayers.getLayerContext(this.trigger);
    this.opts = setOptions(opts, trigger);

    if (!this.opts) {
        throw new Error('"o-overlay error": Options haven\'t been set properly');
    }

    // Check if the overlay has been previously instantiated and if it has, close it
    for (var i = 0; i < overlays.length; i++) {
        if (overlays[i].opts.html === this.opts.html) {
            overlays[i].close();
            return;
        }
    }
    overlays.push(this);
    
    this.create();
};

Overlay.prototype = {

    create: function() {
        var wrapperEl = document.createElement('div');
        wrapperEl.className = 'o-overlay';
        this.wrapper = wrapperEl;

        if (this.opts.modal) {
            wrapperEl.classList.add('o-overlay--modal');
            var shadow = document.createElement('div');
            shadow.className = 'o-overlay-shadow';
            this.shadow = shadow;
            document.body.appendChild(shadow);
        }

        if (this.opts.heading) {
            var heading = document.createElement('header');
            heading.classList.add('o-overlay__heading');

            if (this.opts.heading.shaded) {
                heading.classList.add('o-overlay__heading--shaded');
            }

            var button = document.createElement('button');
            button.className = 'o-overlay__close';
            var buttonIcon = document.createElement('div');
            buttonIcon.className = 'o-overlay__close-icon';
            button.appendChild(buttonIcon);

            var title = document.createElement('span');
            title.setAttribute('role', 'heading');
            title.className = 'o-overlay__title';
            title.innerHTML = this.opts.heading.title;

            heading.appendChild(title);
            heading.appendChild(button);
            wrapperEl.appendChild(heading);
        }

        var content = document.createElement('section');
        content.className = 'o-overlay__content';
        wrapperEl.appendChild(content);

        this.content = content;
        
        this.broadcast('new', 'oLayers');

        if (typeof this.opts.html === 'string') {
            this.content.innerHTML = this.opts.html;
        } else {
            this.content.appendChild(this.opts.html);
        }

        this.show();
    },

    show: function() {
        this.content.focus();

        this.delegates = {
            doc: new Delegate(document.body),
            wrap: new Delegate(this.wrapper),
            context: new Delegate(this.context)
        };
            
        this.close = this.close.bind(this);
        this.resizeListener = this.resizeListener.bind(this);
        this.delegates.doc.on('oViewport.resize', 'body', this.resizeListener);
        this.delegates.context.on('oLayers.new', this.close);

        if (this.opts.heading) {
            this.delegates.wrap.on('click', '.o-overlay__close', this.close);
        }

        this.closeOnExternalClick = this.closeOnExternalClick.bind(this);
        this.delegates.doc.on('click', 'body', this.closeOnExternalClick);

        this.closeOnEscapePress = this.closeOnEscapePress.bind(this);
        this.delegates.doc.on('keyup', this.closeOnEscapePress);

        this.context.appendChild(this.wrapper);
        this.width = this.getWidth();
        this.height = this.getHeight();
        this.respondToWindow(viewport.getSize());
    },

    realign: function(dimension, size) {
        var edge = dimension === 'width' ? 'left' : 'top';

        if (size <= this[dimension]) {
            this.wrapper.classList.add('o-overlay--full-' + dimension);
            this.wrapper.style['margin' + utils.capitalise(edge)] = 0;
        } else {
            this.wrapper.classList.remove('o-overlay--full-' + dimension);
            this.wrapper.style['margin' + utils.capitalise(edge)] = -(this.wrapper['offset' + utils.capitalise(dimension)]/2) + 'px';
        }
    },

    close: function() {
        this.delegates.doc.off();
        this.delegates.wrap.off();
        this.delegates.context.off();
        this.context.removeChild(this.wrapper);
        if (this.opts.modal) {
            this.shadow.parentNode.removeChild(this.shadow);
        }
        // Remove overlay from the array
        for (var i = 0; i < overlays.length; i++) {
            if (overlays[i].opts.html === this.opts.html) {
                overlays.splice(i, 1);
                return;
            }
        }
    },

    closeOnExternalClick: function(ev) {
        // Close the overlay if it's not modal and the click wasn't made on the actual overlay
        if (!this.wrapper.contains(ev.target)) {
            if (!this.opts.modal) {
                this.close();
            }
        }
    },

    closeOnEscapePress: function(ev) {
        if (ev.keyCode === 27) {
            this.close();
        }
    },

    resizeListener: function(ev) {
        if (!this.wrapper.contains(ev.target)) {
            this.respondToWindow(ev.detail.viewport);
        }
    },

    broadcast: function(eventType, namespace, data) {
        namespace = namespace || 'oOverlay';
        var target = namespace === 'oLayers' ? this.context : this.wrapper;
        
        target.dispatchEvent(new CustomEvent(namespace + '.' + eventType, {
            detail: {
                layer: this,
                data: data || {}
            },
            // We don't want it to bubble above it's layer context and trigger a listener on a parent context
            bubbles: namespace !== 'oLayers' ? true : false
        }));
    },

    respondToWindow: function(size) {
        this.realign('width', size.width);
        this.realign('height', size.height);
    },

    getWidth: function () {
        return this.wrapper.offsetWidth + utils.getSpacing(this.wrapper, 'left') + utils.getSpacing(this.wrapper, 'right');
    },

    getHeight: function () {
        return this.wrapper.offsetHeight + utils.getSpacing(this.wrapper, 'top') + utils.getSpacing(this.wrapper, 'bottom');
    },

    fills: function(dimension) {
        return this.wrapper.classList.contains('o-overlay--full-' + dimension);
    }
};

Overlay.init = function(el) {
    if (!el) {
        el = document.body;
    }
    delegate = delegate || new Delegate(el);

    delegate.on('click', '.o-overlay-trigger', function(ev) {
        new Overlay(null, ev.target);
    });
};

Overlay.destroy = function() {
    delegate && delegate.off('click', '.o-overlay-trigger');
};

Overlay.getOverlays = function() {
    return overlays;
};

module.exports = Overlay;