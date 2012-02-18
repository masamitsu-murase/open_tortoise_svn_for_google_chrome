
(function(){
    var INFO_ATTRIBUTE1 = "data-tsvn-info";  // for HTML5
    var INFO_ATTRIBUTE2 = "rel";             // for HTML4.01

    var target_url_list = [];

    var load = function(){
        try{
            var body = getBody();
            body.addEventListener("click", handleClickEvent, false);
            // body.addEventListener("mouseenter", handleMouseEnterEvent, false);
            body.addEventListener("mouseover", handleMouseEnterEvent, false);

            chrome.extension.sendRequest({ action: "targetUrlList" }, function(response){
                if (response.ret && (response.target_url_list instanceof Array)){
                    target_url_list = response.target_url_list;
                }
            });
        }catch(e){
        }
    };

    var getBody = function(){
        var bodies = document.getElementsByTagName("body");
        if (!bodies || bodies.length != 1){
            return;
        }
        return bodies[0];
    };

    var findAnchorInAncestors = function(elem){
        try{
            var fail_safe = 0;
            while(elem && fail_safe++ < 100){
                if (elem.tagName.toLowerCase() == "a"){
                    return elem;
                }
                elem = elem.parentNode;
            }
        }catch(e){
        }
        return null;
    };

    //////////////////////////////////////////////////////
    var SvnFrame = function(left, top, url_data){
        var body = getBody();
        var frame = document.createElement("div");
        body.appendChild(frame);
        frame.style.position = "absolute";
        frame.style.top = top + "px";
        frame.style.left = left + "px";
        frame.style.maxHeight = "30em";
        frame.style.width = "20em";
        frame.style.backgroundColor = "#FF0000";
        frame.style.overflow = "auto";
        frame.style.padding = "2em";

        var img_div = document.createElement("div");
        frame.appendChild(img_div);
        img_div.style.textAlign = "center";
        var img = document.createElement("img");
        img.src = chrome.extension.getURL("images/loading.gif");
        img_div.appendChild(img);

        var self = this;
        frame.addEventListener("mouseout", function(event){
            if (self.frame && event.target == self.frame){
                body.removeChild(self.frame);
                self.frame = null;
            }
        }, false);

        this.frame = frame;
        this.img_div = img_div;
    };
    SvnFrame.prototype = {
        updateFrame: function(logs){
            if (!this.frame){
                return;
            }

            this.frame.removeChild(this.img_div);
            var div = document.createElement("div");
            this.frame.appendChild(div);
            logs.forEach(function(log){
                var dl = document.createElement("dl");
                div.appendChild(dl);
                [ [ "Revision", log.revision ],
                  [ "Author", log.author ],
                  [ "Date", log.date ],
                  [ "Comment", log.comment ] ].forEach(function(item){
                      var dt = document.createElement("dt");
                      dl.appendChild(dt);
                      dt.appendChild(document.createTextNode(item[0]));
                      var dd = document.createElement("dd");
                      dl.appendChild(dd);
                      dd.appendChild(document.createTextNode(item[1]));
                  });
            });
        },
        isVisible: function(){
            return (this.frame != null);
        }
    };

    //////////////////////////////////////////////////////
    var handleMouseEnterEvent = function(event){
        var anchor = findAnchorInAncestors(event.target);
        if (!anchor){
            return;
        }

        var url_data = gCommon.parseUrl(anchor.href);
        if (!url_data ||
            !target_url_list.some(function(u){ return url_data.url.substr(0, u.length) == u; })){
            return;
        }

        var svn_frame = new SvnFrame(event.pageX - 20, event.pageY - 20, url_data);
        chrome.extension.sendRequest({ action: "webdav_svn",
                                       url: url_data.url,
                                       limit: 3 },
                                     function(response){
                                         if (response.ret){
                                             svn_frame.updateFrame(response.logs);
                                         }else{
                                             alert("hoge");
                                         }
                                     });
    };

    //////////////////////////////////////////////////////
    var handleClickEvent = function(event){
        var anchor = findAnchorInAncestors(event.target);
        if (!anchor){
            return;
        }

        var url_data = gCommon.parseUrl(anchor.href);
        if (!url_data ||
            !target_url_list.some(function(u){ return url_data.url.substr(0, u.length) == u; })){
            return;
        }

        var callback_type = null;
        var callback_args = [];

        // Action:
        //  priority 1
        //  "action" is defined by HTML attribute.
        var info = null;
        if (anchor.hasAttribute(INFO_ATTRIBUTE1)){
            info = anchor.getAttribute(INFO_ATTRIBUTE1);
        }else if (anchor.hasAttribute(INFO_ATTRIBUTE2)){
            info = anchor.getAttribute(INFO_ATTRIBUTE2);
        }
        if (info){
            var reg = /\btsvn\[(.*?)\](?:\[(.*?)\])?/;
            var match_data = info.match(reg);
            if (match_data){
                callback_type = match_data[1];
                if (match_data[2]){
                    callback_args = match_data[2].split(",");
                }
            }
        }else{
            // If tsvn attribute does not exist, URL parameter "p" or "r" is used as a revision.
            if (url_data.params.r){
                callback_args = [ url_data.params.r ];
            }else if (url_data.params.p){
                callback_args = [ url_data.params.p ];
            }
        }
        if (!callback_type){
            callback_type = gCommon.DEFAULT_ACTION;
        }

        chrome.extension.sendRequest({ action: callback_type,
                                       raw_url: url_data.raw_url,
                                       url: url_data.url,
                                       args: callback_args },
                                     function(response){
                                         if (!response.ret){
                                             alert(chrome.i18n.getMessage("cannot_open_tortoisesvn"));
                                         }
                                     });
        event.preventDefault();
    };

    window.addEventListener("load", load);
})();

