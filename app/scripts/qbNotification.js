(function(global, factory) {
    'use strict';

    if(typeof define === 'function' && define.amd) {
        // AMD environment
        define(function() {
            return factory(global);
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        // CommonJS-like
        module.exports = factory(global);
    } else {
        // Browser environment (root is window)
        global.QBNotification = factory(global);
    }
} (typeof window !== 'undefined' ? window : this, function (window) {
    var Notify = window.Notification || window.navigator.webkitNotifications,
        ERRORS = {
            title: 'QBNotification(): first arg (title) must be not empty string.',
            no_support: 'This browser don\'t support Notification',
            no_access: 'Before you need to get permission to display notification by QBNotification.requestPermission()',
            timeout: 'Timeout must be integer'
        };

    function isFunction(i) {
        return typeof i === 'function';
    }

    /**
     * [QBNotification]
     * @param {[string]} title [Title of notification. Required value]
     * @param {[type]} opts    [Additonal options.See this.options
     *                          + callbacks: onClick, onError, onClose, onShow]
     */
    function QBNotification(title, opts) {
        if(!QBNotification.isSupported()) {
            throw new Error(ERRORS.no_support);
        }

        if (typeof title !== 'string' || title.trim() === '') {
            throw new Error(ERRORS.title);
        }

        this.title = title;
        this.callbacks = {};

        this.options = {
            dir: 'auto',
            lang: 'en',
            body: '',
            tag: '',
            icon: '',
            requireInteraction: false,

            timeout: 5,
            debug: false
        };

        if (typeof opts === 'object') {
            for (var i in opts) {
                if (opts.hasOwnProperty(i)) {
                    this.options[i] = opts[i];
                }
            }

            if (isFunction(this.options.onClick)) {
                this.callbacks.onclick = this.options.onClick;
            }

            if (isFunction(this.options.onError)) {
                this.callbacks.onerror = this.options.onError;
            }

            if (isFunction(this.options.onClose)) {
                this.callbacks.onclose = this.options.onClose;
            }

            if (isFunction(this.options.onShow)) {
                this.callbacks.onshow = this.options.onShow;
            }
        }
    }

    /**
     * [isSupported - check is Notification avaible]
     * Static method
     * @return {[boolean]} [flag]
     */
    QBNotification.isSupported = function() {
        return (!Notify || !Notify.requestPermission) ? false : true;
    };

    /**
     * [needsPermission]
     */
    QBNotification.needsPermission = function(){
        return (Notify && Notify.permission && Notify.permission === 'granted') ? false : true;
    };

    /**
     * [requestPermission - need get permission from user before
     * show notification]
     * @param  {Function} cb [callback function which get state as params. Optional]
     */
    QBNotification.requestPermission = function(cb) {
        if(!QBNotification.isSupported()) {
            throw new Error(ERRORS.no_support);
        }

        Notify.requestPermission(function(state) {
            if(isFunction(cb)) { cb(state); }
        });
    };

    /**
     * [show]
     */
    QBNotification.prototype.show = function () {
        var self = this;

        if(QBNotification.needsPermission()) {
            console.warn('QBNotification says: ' + ERRORS.no_access);
            return;
        }

        self.notify = new Notify(this.title, {
            'body': this.options.body,
            'tag': this.options.tag,
            'icon': this.options.icon,
            'lang': this.options.lang,
            'requireInteraction': this.options.requireInteraction
        });

        /** set callbacks */
        for (var prop in self.callbacks) {
            if( self.callbacks.hasOwnProperty( prop ) ) {
                self.notify[prop] = self.callbacks[prop];
            }
        }

        if (!self.options.requireInteraction &&self.options.timeout && !isNaN(+self.options.timeout)) {
            setTimeout(self.close.bind(this), self.options.timeout * 1000);
        }
    };

    /**
     * [close]
     */
    QBNotification.prototype.close = function() {
        this.notify.close();
    };

    return QBNotification;
}));