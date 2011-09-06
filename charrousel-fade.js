YUI.add("charrousel-fade", function(Y) {
    
    var L = Y.Lang,
        getClassName = Y.ClassNameManager.getClassName,
        _classes = {
            hiding : getClassName("charrousel", "item", "hiding")
        },
        _parentClasses = Y.Charrousel.CLASSNAMES;
    
    //empty constructor
    Y.CharrouselFade = Y.Base.create("charrousel-fade", Y.Plugin.Base, [ ], {
        initializer : function() {
            var t = this;
            
            t._host = t.get("host");
            
            t._handles = [
                t.on("transitionChange", t._transitionChange)
            ];
            
            //don't listen to page changes until host is rendered, we wouldn't have anything to do anyways
            t._host.once("render", function() {
                t._handles.push(t._host.on("pageChange", t._pageChange, t));
            });
            
            t._transitionChange();
        },
        
        destructor : function() {
            new Y.EventTarget(this._handles).detach();
            
            this._handles = this._hide = this._show = null;
        },
        
        _transitionChange : function(e) {
            var o = (e && e.newVal) || this.get("transition");
            
            this._hide = Y.merge(o.base, o.hide);
            this._show = Y.merge(o.base, o.show);
        },
        
        _pageChange : function(e) {
            var t = this,
                items = t._host.get("items"),
                visible = t._host.get("visible"),
                hide = t._host.pageItems(e.prevVal),
                show = t._host.pageItems(e.newVal),
                hideCSS = _classes.hiding;
            
            show.setStyle("opacity", 0);
            show.addClass(_parentClasses.current.item);
            hide.addClass(hideCSS);
            
            hide.transition(t._hide, function() {
                this.removeClass(hideCSS);
                
                t.fire("moved", { prevVal : e.prevVal, newVal : e.newVal });
            });
            
            show.transition(t._show);
        }
    }, {
        NS : "fade",
        ATTRS : {
            transition : {
                value : {
                    base : {
                        easing : 'ease-in',
                        duration : 0.25
                    },
                    hide : {
                        opacity : 0
                    },
                    show : {
                        opacity : 1,
                        delay : 0.125
                    }
                }
            }
        }
    });
    
}, "@VERSION@", { requires : [ 
    "charrousel-widget",
    "base-build",
    "plugin",
    "transition"
] });