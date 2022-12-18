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
    "js/background/background.js"
];
const full_paths = other_scripts.map(path => chrome.runtime.getURL(path));
try {
    importScripts(...full_paths);
} catch (e) {
    console.error(e);
    throw e;
}
