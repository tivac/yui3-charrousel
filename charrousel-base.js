YUI.add("charrousel-base", function(Y) {
    
    var L = Y.Lang;
    
    function CharrouselBase() { }
    
    CharrouselBase.ATTRS = {
        //elements to show per page
        visible : {
            value : 1,
            validator : L.isNumber
        },
        
        //current page
        page : {
            value : 0,
            validator : function(val, name) {
                var prev = this.get(name);
                
                if(L.isValue(prev)) {
                    return (prev !== val) && (val <= this._pages && val >= 0);
                }
            }
        },
        
        //items
        items : {
            value : []
        },
        
        //loop
        circular : {
            value : false,
            validator : L.isBoolean
        }
    };
    
    CharrouselBase.prototype = {
        
        _pages : 0,
        
        initializer : function() {
            this._baseHandles = [
                this.after([ "itemsChange", "visibleChange" ], this._calculatePages),
                this.publish("moved", { preventable : false, emitFacade : false })
            ];
            
            this._calculatePages();
        },
        
        destructor : function() {
            new Y.EventTarget(this._baseHandles).detach();
            
            delete this._pages;
            delete this._baseHandles;
        },
        
        _calculatePages : function(e) {
            var attr = e && e.attrName, 
                items = attr && attr === "items" ? e.newVal : this.get("items"),
                visible = attr && attr === "visible" ? e.newVal : this.get("visible"),
                size = items && L.isFunction(items.size) ? items.size() : items.length;
            
            //cache number of pages we're dealing w/ to shorten algorithms
            this._pages = Math.ceil(size / visible);
        },
        
        _move : function(dist, o) {
            var attrs = this.getAttrs([ "page", "circular" ]),
                page = attrs.page + dist,
                pages = this._pages,
                total = pages - 1;
            
            if(page < 0 || page > total) {
                if(attrs.circular) {
                    page = page % pages + (page < 0 ? pages : 0);
                } else {
                    page = Math.max(page, 0);
                    page = Math.min(page, total);
                }
            }
            
            this.set("page", page, o);
        },
        
        //move backwards specified number of pages
        //will wrap if circular is true
        prev : function(pages, o) {
            this._move(-1 * (pages || 1), o);
        },
        
        //move forwards specified number of pages
        //will wrap if circular is true
        next : function(pages, o) {
            this._move(pages || 1, o);
        },
        
        //returns items for a specific page
        //uses current page if one is not passed in
        pageItems : function(page) { 
            var items = this.get("items"),
                visible = this.get("visible"),
                p = L.isNumber(page) ? page : this.get("page"),
                start = p * visible;
            
            return items.slice(start, start + visible);
        },
        
        //returns items that are NOT on the specified page
        //uses current page if undefined
        otherItems : function(page) {
            var items = this.get("items").slice(0),
                visible = this.get("visible"),
                p = L.isValue(page) ? page : this.get("page"),
                start = p * visible;
            
            items.splice(start, visible);
            
            return items;
        }
    };
    
    Y.CharrouselBase = CharrouselBase;
    
}, "@VERSION@");