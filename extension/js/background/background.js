const other_scripts = [
    "js/common/misc.js",
    "js/common/action_matcher.js",
    "js/common/misc_settings.js",
    "js/common/error.js",
    "js/common/data_migrator.js",
    "js/common/svn_url.js",
    "js/background/badge_manager.js",
    "js/background/context_menu.js",
    "js/background/message_receiver.js",
    "js/background/tortoise_svn_opener.js",
    // "js/background/background.js"
];
const full_paths = other_scripts.map(path => chrome.runtime.getURL(path));
importScripts(...full_paths);

var OpenTsvn;
if (!OpenTsvn) OpenTsvn = {};

(function(ctx) {
    "use strict";

    var opener = new ctx.TortoiseSvnOpener();
    var context_menu = new ctx.ContextMenu(opener);
    context_menu.registerHandler();

    var onInstalledCallback = function() {
        context_menu.createContextMenu();

        var data_migrator = new ctx.DataMigrator();
        data_migrator.migrate();
    };

    if (chrome.runtime.onInstalled) {
        chrome.runtime.onInstalled.addListener(onInstalledCallback);
    } else {
        // Firefox 50 does not support onInstalled.
        onInstalledCallback();
    }

    var badge_manager = new ctx.BadgeManager();

    new ctx.MessageReceiver([ opener, badge_manager ]);

    chrome.browserAction.onClicked.addListener(function() {
        badge_manager.showWarning(false);
        chrome.runtime.openOptionsPage();
    });
})(OpenTsvn);
