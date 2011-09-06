YUI.add("charrousel-timer", function(Y) {
    
    var L = Y.Lang;
    
    Y.CharrouselTimer = Y.Base.create("charrousel-timer", Y.Plugin.Base, [ ], {
        initializer : function() {
            var t = this;
            
            t._host = t.get("host");
            t._circular = t._host.get("circular");
            
            t._handles = [
                t._host.after("render", t._setup, t),
                t._host.after("pageChange", t._pageChange, t),
                t._host.after("circularChange", function(e) {
                    t._circular = e.newVal;
                }, t),
                
                t.after("delayChange", t._setup)
            ];
        },
        
        destructor : function() {
            var t = this;
            
            new Y.EventTarget(t._handles).detach();
            
            t._cancel();
            
            delete t._timer;
            delete t._circular;
        },
        
        _cancel : function() {
            var t = this;
            
            t._timer && L.isFunction(t._timer.cancel) && t._timer.cancel();
        },
        
        _setup : function() {
            var t = this;
            
            t._cancel();
            
            t._timer = Y.later(t.get("delay"), t, t._pulse);
        },
        
        _pulse : function() {
            var t = this,
                p = t._host.get("page");
            
            if(t._circular || (p + 1) < t._host._pages) {
                t._host.next();
            } else {
                t._host.set("page", 0);
            }
            
            t._setup();
        },
        
        _pageChange : function(e) {
            this[(e.source && e.source.indexOf("click") > -1) ? "_cancel" : "_setup"]();
        }
    }, {
        NS : "timer",
        ATTRS : {
            delay : {
                value : 5000
            }
        }
    });
}, "@VERSION@", { requires : [ 
    "charrousel-widget",
    "base-build",
    "plugin"
] });