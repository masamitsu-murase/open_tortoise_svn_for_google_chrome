
var gDavSvn = (function(){
    var doXmlHttpRequest = function(method, url, header, body, callback){
        var url = url.replace(/\/$/, "");

        var xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        for (var key in header){
            xhr.setRequestHeader(key, header[key]);
        }
        xhr.onreadystatechange = function(){
            // if (xhr.readyState == 4){
            //     alert(xhr.getAllResponseHeaders() + "\n" + xhr.responseText);
            // }
            callback(xhr);
        };
        xhr.send(body);
    };

    var davSvnOptions = function(url, header, body, callback){
        doXmlHttpRequest("OPTIONS", url, header, body, function(res){
            if (res.readyState == 4){
                callback(res);
            }
        });
    };

    var davSvnPropfind = function(url, header, body, callback){
        doXmlHttpRequest("PROPFIND", url, header, body, function(res){
            if (res.readyState == 4){
                callback(res);
            }
        });
    };

    var davSvnReport = function(url, header, body, callback){
        doXmlHttpRequest("REPORT", url, header, body, function(res){
            if (res.readyState == 4){
                callback(res);
            }
        });
    };

    var davSvnCheckConnection = function(url, callback){
        var body = '<?xml version="1.0" encoding="utf-8"?>'
            + '<D:options xmlns:D="DAV:"><D:activity-collection-set/></D:options>';
        davSvnOptions(url, {}, body, function(res){
            var obj = {};
            try{
                var allowed_actions = (res.getResponseHeader("Allow") || "").split(/\s*,/);
                if (allowed_actions.indexOf("PROPFIND") < 0){
                    callback(null);
                    return;
                }

                obj.rev = res.getResponseHeader("SVN-Youngest-Rev");
            }catch(e){
                callback(null);
                return;
            }

            callback(obj);
        });
    };

    var davSvnGetVcc = function(url, callback){
        var body = '<?xml version="1.0" encoding="utf-8"?>'
            + '<propfind xmlns="DAV:"><prop>'
            + '<version-controlled-configuration xmlns="DAV:"/>'
            + '<resourcetype xmlns="DAV:"/>'
            + '<baseline-relative-path xmlns="http://subversion.tigris.org/xmlns/dav/"/>'
            + '<repository-uuid xmlns="http://subversion.tigris.org/xmlns/dav/"/>'
            + '</prop></propfind>';

        davSvnPropfind(url, { "Depth": 0 }, body, function(res){
            var obj = {};

            try{
                var doc = res.responseXML;
                if (!(obj.vcc = doc.getElementsByTagName("version-controlled-configuration")[0]
                      .getElementsByTagName("href")[0].firstChild.nodeValue)){
                    callback(null);
                    return;
                }

                var elem = doc.getElementsByTagName("baseline-relative-path")[0];
                if (!elem){
                    callback(null);
                    return;
                }
                obj.path = (elem.firstChild ? elem.firstChild.nodeValue : "");
            }catch(e){
                callback(null);
                return;
            }

            callback(obj);
        });
    };

    var davSvnGetCheckInInfo = function(vcc_url, callback){
        var body = '<?xml version="1.0" encoding="utf-8"?>'
            + '<propfind xmlns="DAV:"><prop><checked-in xmlns="DAV:"/></prop></propfind>';

        davSvnPropfind(vcc_url, { "Depth": 0 }, body, function(res){
            var obj = {};

            try{
                var doc = res.responseXML;
                if (!(obj.bln = doc.getElementsByTagName("checked-in")[0]
                      .getElementsByTagName("href")[0].firstChild.nodeValue)){
                    callback(null);
                    return;
                }
            }catch(e){
                callback(null);
                return;
            }

            callback(obj);
        });
    };

    var davSvnGetBc = function(bln_url, revision, callback){
        var body = '<?xml version="1.0" encoding="utf-8"?>'
            + '<propfind xmlns="DAV:"><prop>'
            + '<baseline-collection xmlns="DAV:"/><version-name xmlns="DAV:"/>'
            + '</prop></propfind>';
        var param = { "Depth": 0 };
        if (revision !== null){
            param["Label"] = revision;
        }
        davSvnPropfind(bln_url, param, body, function(res){
            var obj = {};
            try{
                var doc = res.responseXML;
                if (!(obj.bc = doc.getElementsByTagName("baseline-collection")[0]
                      .getElementsByTagName("href")[0].firstChild.nodeValue)){
                    callback(null);
                    return;
                }

                if (!(obj.rev = parseInt(doc.getElementsByTagName("version-name")[0]
                                         .firstChild.nodeValue))){
                    callback(null);
                    return;
                }
            }catch(e){
                callback(null);
                return;
            }

            callback(obj);
        });
    };

    var davSvnGetLogs = function(bc_url, start_rev, end_rev, limit, callback){
        var body = '<S:log-report xmlns:S="svn:">'
            + '<S:start-revision>' + start_rev + '</S:start-revision>'
            + '<S:end-revision>' + end_rev + '</S:end-revision>'
            + '<S:limit>' + limit + '</S:limit>'
            + '<S:revprop>svn:author</S:revprop>'
            + '<S:revprop>svn:date</S:revprop>'
            + '<S:revprop>svn:log</S:revprop>'
            + '<S:path></S:path>'
            + '</S:log-report>';
        davSvnReport(bc_url, {}, body, function(res){
            var logs = [];
            try{
                var doc = res.responseXML;
                var tags = doc.getElementsByTagName("log-item");
                for (var i=0; i<tags.length; i++){
                    var log = tags[i];
                    logs.push({
                        revision: log.getElementsByTagName("version-name")[0].firstChild.nodeValue,
                        comment: log.getElementsByTagName("comment")[0].firstChild.nodeValue,
                        author: log.getElementsByTagName("creator-displayname")[0].firstChild.nodeValue,
                        date: log.getElementsByTagName("date")[0].firstChild.nodeValue
                    });
                }
            }catch(e){
                callback(null);
                return;
            }
            callback(logs);
        });
    };

    var davSvnLog = function(url, start_rev, end_rev, limit, callback){
        var base_url = url.match(/^https?:\/\/[^\/?#]+/)[0];
        end_rev = (end_rev || 0);

        // nest nest nest nest...
        davSvnCheckConnection(url, function(obj_options){
            if (!obj_options){
                callback({ ret: false });
                return;
            }

            davSvnGetVcc(url, function(vcc){
                if (!vcc){
                    callback({ ret: false });
                    return;
                }

                var vcc_url = base_url + vcc.vcc;
                davSvnGetCheckInInfo(vcc_url, function(check_in){
                    if (!check_in){
                        callback({ ret: false });
                        return;
                    }

                    var bln_url = base_url + check_in.bln;
                    davSvnGetBc(bln_url, null, function(bc){
                        if (!bc){
                            callback({ ret: false });
                            return;
                        }

                        if (start_rev == "HEAD" || start_rev === null){
                            start_rev = bc.rev;
                        }
                        davSvnGetBc(bln_url, start_rev, function(bc){
                            if (!bc){
                                callback({ ret: false });
                                return;
                            }

                            var bc_url = base_url + bc.bc + vcc.path;
                            davSvnGetLogs(bc_url, start_rev, end_rev, limit, function(logs){
                                if (!logs){
                                    callback({ ret: false });
                                    return;
                                }

                                callback({ ret: true, logs: logs });
                            });
                        });
                    });
                });
            });
        });
    };

    return {
        log: davSvnLog
    };
})();
