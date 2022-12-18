var OpenTsvn;
if (!OpenTsvn) OpenTsvn = {};

(function(ctx) {
    "use strict";

    const DATA_VERSION = 1;

    var DataMigrator = class {
        migrate() {
            return ctx.Misc.async(function*() {
                var found = yield this.isSavedDataFound();

                if (found) {
                    return;
                }

                yield chrome.storage.local.set({ data_version: DATA_VERSION });
            }, this);
        }

        isSavedDataFound() {
            return new Promise(function(resolve, reject) {
                chrome.storage.local.get({ data_version: null }, function(obj) {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                        return;
                    }

                    if (obj.data_version === null) {
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                });
            });
        }
    };

    ctx.DataMigrator = DataMigrator;
})(OpenTsvn);
