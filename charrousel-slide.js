YUI.add("charrousel-slide", function(Y) {
    
    var L = Y.Lang,
        num = function(v) {
            return parseInt(v, 10);
        },
        getClassName = Y.ClassNameManager.getClassName,
        _classes = {
            copy      : getClassName("charrousel", "item", "copy"),
            lastcopy  : getClassName("charrousel", "item", "copy", "last"),
            firstcopy : getClassName("charrousel", "item", "copy", "first")
        },
        //set up some sizing arrays to determine the "real" size of an element
        _PADDING = "padding",
        _BORDER  = "border",
        _MARGIN  = "margin",
        _RIGHT   = "Right",
        _LEFT    = "Left",
        _TOP     = "Top",
        _BOTTOM  = "Bottom",
        _sizing = {
            width : [ 
                "width", _PADDING + _LEFT, _PADDING + _RIGHT, _BORDER + _LEFT, _BORDER + _RIGHT, _MARGIN + _LEFT, _MARGIN + _RIGHT 
            ],
            height : [ 
                "height", _PADDING + _TOP, _PADDING + _BOTTOM, _BORDER + _TOP, _BORDER + _BOTTOM, _MARGIN + _TOP, _MARGIN + _BOTTOM 
            ]
        },
        _realSize = function(node, sizes) {
            var size = 0;
            
            Y.Array.each(sizes, function(v) {
                size += num(node.getComputedStyle(v)) || 0;
            });
            
            return size;
        };
    
    //empty constructor
    Y.CharrouselSlide = Y.Base.create("charrousel-slide", Y.Plugin.Base, [ ], {
        initializer : function() {
            var t = this;
            
            t._host = t.get("host");
            
            t._handles = [
                t._host.after("render", t._render, t)
            ];
            
            t._host.once("render", function() {
                t._handles.push(t._host.on("pageChange", t._pageChange, t));
            });
        },
        
        destructor : function() {
            new Y.EventTarget(this._handles).detach();
            
            delete this._host;
            this._lastcopy && delete this._lastcopy;
        },
        
        //after base render we add some new items/classes as necessary
        _render : function() {
            var t = this,
                items = t._host.get("items"),
                list = t._host.get("list"),
                visible = t._host.get("visible"),
                first = items && items.item(0),
                width = 0,
                left = 0;
            
            t._remainder = items.size() % visible;
            
            //calculate width of each item & save it for later
            items.each(function(n) {
                var w = _realSize(n, _sizing.width);
                
                n.setData("width", w);
                
                width += w;
            });
            
            //circular charrousels copy the first page of items to the end & the last page to the begining 
            //to help make for a seamless scroll
            if(t._host.get("circular") && t._host._pages > 1) {
                items.slice(0, visible).each(function(node) {
                    var w = node.getData("width"),
                        n = node.cloneNode(true);
                    
                    list.append(n.addClass(_classes.copy).addClass(_classes.firstcopy));
                    
                    width += w;
                });
                
                items.slice(-1 * (t._remainder || visible)).each(function(node) {
                    var w = node.getData("width"),
                        n = node.cloneNode(true);
                    
                    list.prepend(n.addClass(_classes.copy).addClass(_classes.lastcopy).setData("width", w));
                    
                    left  += w;
                    width += w;
                });
                
                t._lastcopy = list.all("." + _classes.lastcopy);
            }
            
            //set the important node styles
            t._host._cb.setStyle("overflow", "hidden");
            
            list.setStyles({
                left : -1 * left,
                width : width,
                position: "relative"
            });
        },
        
        //listen to page changes, determine direction, and animate
        _pageChange : function(e) {
            var t = this,
                attrs = t._host.getAttrs([ "items", "visible", "circular", "list" ]),
                nodes = attrs.items.slice(0, (e.newVal * attrs.visible)),
                first2last = (e.prevVal === 0 && e.newVal  === (t._host._pages - 1)),
                last2first = (e.newVal  === 0 && e.prevVal === (t._host._pages - 1)),
                left,
                after;
            
            //circular charrousels require some more work
            if(attrs.circular && t._host._pages > 1) { 
                
                //don't even need to calculate
                if(first2last) {
                    left = 0;
                    after = 0;
                    
                    t._lastcopy.concat(nodes).each(function(n) {
                        after += n.getData("width");
                    });
                } else if(last2first) {
                    //determine position of first "real" page
                    after = 0;
                    t._lastcopy.each(function(n) {
                        after += n.getData("width");
                    });
                    
                    left = after;
                    
                    //size up every real node to get to the end of the list
                    attrs.items.each(function(n) {
                        left += n.getData("width");
                    });
                } else {
                    //take copy of last page into account
                    nodes = t._lastcopy.concat(nodes);
                }
            } 
            
            //calculate the left offset
            if(L.isUndefined(left)) {
                left = 0;
                
                nodes.each(function(n) {
                    left += n.getData("width");
                });
            }
            
            t._move({
                left : -1 * left,
                after : -1 * after
            });
        },
        
        //transition the list
        _move : function(o) {
            var t = this,
                list = t._host.get("list"),
                transition = t.get("transition");
            
            //slide the list
            list.transition(Y.merge(transition, {
                left : o.left + "px"
            }), function() {
                L.isNumber(o.after) && list.setStyle("left", o.after);
                
                t.fire("moved", o);
            });
        }
    }, {
        NS : "slide",
        ATTRS : {
            transition : {
                value : {
                    easing : 'ease-in',
                    duration : 0.25
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