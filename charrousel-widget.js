YUI.add("charrousel-widget", function(Y) {
    
    var L = Y.Lang,
        getClassName = Y.ClassNameManager.getClassName;
    
    Y.Charrousel = Y.Base.create("charrousel", Y.Widget, [ Y.CharrouselBase ], {
        
        _handles : [],
        
        //HTML templates
        TEMPLATES : {
            PREV : "<button class='{css}' data-dir='prev'>&lt;</button>",
            NEXT : "<button class='{css}' data-dir='next'>&gt;</button>",
            PAGES : "<ul class='{css}' role='presentation'>{pages}</ul>",
            PAGE : "<li class='{css}' role='presentation'><button data-page='{page}'>{label}</button></li>",
            NAV : "<div class='{css}' role='toolbar'>{prev}{pages}{next}</div>"
        },
        
        //Widget lifecycle functions
        initializer : function() {
            var t = this,
                loc = Y.one(t.get("show.location"));
            
            // Cache - they're write once, and not going to change
            t._cb = t.get("contentBox");
            t._bb = t.get("boundingBox");
            
            t._css = Y.Charrousel.CLASSNAMES;
            
            //syncUI depends on renderUI, so if a page changes before the widget is rendered it bails
            t.onceAfter("render", function() {
                t._handles.push(t.after("pageChange", t.syncUI));
            });
            
            //show.location is optional & may not be a node, default it to the contentBox or wrap it w/ a node
            t.set("show.location", loc || t._cb);
        },
        
        destructor : function() {
            var t = this,
                show = t.get("show"),
                nav;
            
            new Y.EventTarget(t._handles).detach();
            
            //delete nav if necessary
            if((show.pages || show.prev || show.next) && this.get("rendered")) {
                nav = show.location.one("." + t._css.nav)
                
                nav && nav.remove(true);
            }
            
            t._cb = t._bb = t._handles = t._css = null;
        },
        
        renderUI : function() {
            var t = this,
                attrs = t.getAttrs([ "show", "items", "list", "visible", "classes" ]),
                show = attrs.show,
                list = attrs.list,
                visible = attrs.visible,
                classes = attrs.classes,
                items = attrs.items,
                size = items && items.size && items.size(),
                output = {
                    css : t._css.nav + " " + (classes.nav || ""),
                    next : "",
                    prev : "",
                    pages : ""
                },
                pages, i, il, node;
            
            t.set("show.pages", show.pages && t._pages > 1);
            
            //build pagination control if requested
            if(t._pages > 1 && (show.pages || show.next || show.prev)) {
                show.next && (output.next = Y.Lang.sub(t.TEMPLATES.NEXT, { 
                    css : [ t._css.button, t._css.buttons.next, (classes.next || '') ].join(" ")
                }));
                show.prev && (output.prev = Y.Lang.sub(t.TEMPLATES.PREV, { 
                    css : [ t._css.button, t._css.buttons.prev, (classes.prev || '') ].join(" ")
                }));
                
                if(show.pages) {
                    pages = "";
                    
                    for(i = 0, il = t._pages; i < il; i++) {
                        pages += Y.Lang.sub(t.TEMPLATES.PAGE, { 
                            css : t._css.page + (classes.page ? " " + classes.page : ""),
                            page : i,
                            label : i + 1
                        });
                    }
                    
                    output.pages = Y.Lang.sub(t.TEMPLATES.PAGES, {
                        css : t._css.pages + " " + (classes.pages || ""),
                        pages : pages
                    });
                }
                
                show.location.append(Y.Lang.sub(t.TEMPLATES.NAV, output));
            } else {
                this.setAttrs({
                    "show.pages" : false,
                    "show.prev"  : false,
                    "show.next"  : false
                });
            }
            
            //apply aria roles
            items.setAttribute("role", "option");
            list.setAttribute("role", "listbox");
            
            //add page notation classes to items
            if(attrs.visible > 1) {
                items.modulus(attrs.visible).addClass(t._css.itempage.first);
                items.modulus(attrs.visible, attrs.visible - 1).addClass(t._css.itempage.last);
            }
            
            classes.list && list.addClass(classes.list);
            classes.item && items.addClass(classes.item);
            classes.content && t._cb.addClass(classes.content);
            classes.bounding && t._bb.addClass(classes.bounding);
        },
        
        bindUI : function() {
            var t = this,
                show = t.get("show");
            
            //page links
            show.pages && t._handles.push(show.location.delegate("click", function(e) {
                e.preventDefault();
                
                t.set("page", parseInt(this.getAttribute("data-page"), 10), { source : "page-click" });
            }, "." + t._css.page + " > button"));
            
            //prev/next links
            (show.prev || show.next) && t._handles.push(show.location.delegate("click", function(e) {
                e.preventDefault();
                
                var dir = this.getAttribute("data-dir");
                
                t[dir] && t[dir](null, { source : dir + "-click" });
            }, "." + t._css.button));
        },
        
        syncUI : function() {
            var t = this,
                show = t.get("show"),
                page = t.get("page"),
                pageClass = t._css.current.page,
                itemClass = t._css.current.item,
                pages;
            
            //update page numbers
            pages = show.pages && show.location.all("." + t._css.page);
            if(pages && pages.size()) {
                pages.removeClass(pageClass);
                pages.item(page).addClass(pageClass);
            }
            
            //if we aren't circular need to disable/re-enable buttons
            if(!t.get("circular")) {
                show.prev && 
                    show.location.one("." + t._css.buttons.prev)[
                        ((page > 0) ? "remove" : "set") + "Attribute"
                    ]("disabled");
                
                show.next && 
                    show.location.one("." + t._css.buttons.next)[
                        ((page < (t._pages - 1)) ? "remove" : "set") + "Attribute"
                    ]("disabled");
            }
            
            //Remove class from everyone but selected page
            this.pageItems().addClass(itemClass);
            this.otherItems().removeClass(itemClass);
        }
    }, {
        ATTRS : {
            //determine elements to show/render
            show : {
                value : {
                    //where to render the items, anything falsey is appended to the contentBox
                    location : null,
                    
                    //which items to render
                    pages : true,
                    next  : true,
                    prev  : true
                }
            },
            
            //Y.Node reference to list
            list : {
                setter : function(node) {
                    node = Y.one(node);
                    if(node) {
                        node.addClass(this._css.list);
                    }
                    
                    return node;
                }
            },
            
            //Y.NodeList reference to items in the list
            items : {
                setter : function(nodes) {
                    if(L.isString(nodes)) {
                        nodes = Y.all(nodes);
                    }
                    
                    if(nodes.size && nodes.size()) {
                        nodes.addClass(this._css.item);
                    }
                    
                    return nodes;
                }
            },
            
            //any extra CSS classes for generated items
            classes : {
                value : {
                    list     : "yui3-g",
                    item     : "yui3-u",
                    content  : false, 
                    bounding : false, 
                    pages    : "yui3-u yui3-g",
                    page     : "yui3-u",
                    nav      : "yui3-g",
                    prev     : "yui3-u",
                    next     : "yui3-u"
                }
            }
        },
        
        HTML_PARSER : {
            list : '> ol',
            items : [ '> ol > li' ]
        },
        
        CLASSNAMES : {
            list     : getClassName("charrousel", "list"),
            item     : getClassName("charrousel", "item"),
            nav      : getClassName("charrousel", "nav"),
            paging   : getClassName("charrousel", "paging"),
            pages    : getClassName("charrousel", "pages"),
            page     : getClassName("charrousel", "page"),
            disabled : getClassName("charrousel", "paging", "disabled"),
            itempage : {
                first: getClassName("charrousel", "item", "page", "first"),
                last : getClassName("charrousel", "item", "page", "last")
            },
            current  : {
                page : getClassName("charrousel", "page", "current"),
                item : getClassName("charrousel", "item", "current")
            },
            button   : getClassName("charrousel", "nav", "btn"),
            buttons  : {
                prev : getClassName("charrousel", "nav", "prev"),
                next : getClassName("charrousel", "nav", "next")
            }
        }
    });

}, "@VERSION@", { requires : [ 
    "charrousel-base",
    "node-base",
    "base-build",
    "widget"
] });