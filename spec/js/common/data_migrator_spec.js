
var localStorage = {};
var chrome;

(function() {
    "use strict";

    var ctx = OpenTsvn;

    describe("DataMigrator", function() {
        var setChromeMock = function(local_get) {
            chrome = {
              storage: {
                local: {
                  get: local_get,
                  set: function(obj, callback) {
                      chrome.storage.local.data = obj;
                      if (callback) {
                        setTimeout(callback, 0);
                      } else {
                        return new Promise((resolve, reject) => {
                          resolve();
                        });
                      }
                  }
                }
              },
              runtime: {
                lastError: false
              }
            };
        };

        it("can find saved data", function(done) {
            ctx.Misc.async(function*() {
                var migrator;

                setChromeMock(function(obj, callback) {
                    callback({ data_version: null });
                });
                migrator = new ctx.DataMigrator();
                expect(yield migrator.isSavedDataFound()).toBe(false);

                setChromeMock(function(obj, callback) {
                    callback({ data_version: 1 });
                });
                migrator = new ctx.DataMigrator();
                expect(yield migrator.isSavedDataFound()).toBe(true);

                done();
            });
        });

        it("can migrate old data", function(done) {
            ctx.Misc.async(function*() {
                var migrator = new ctx.DataMigrator();
                setChromeMock(function(obj, callback) {
                    callback({ data_version: null });
                });

                yield migrator.migrate();

                expect(chrome.storage.local.data.data_version).toEqual(1);

                done();
            });
        });
    });
})();

