App.module("WatchList", function(WatchList, App, Backbone, Marionette, $, _){

    WatchList.BaseView = Marionette.LayoutView.extend({
        template: 'watch-list/base',
        className: 'watch-list',

        regions: {
            list: '.watched-nodes-region',
            modal: '.modal-region'
        },

        events: {
            'click .watch-settings-link': 'showSettings',
            'click .clear-list': 'clearList'
        },

        initialize: function() {
            var self = this;

            this.collection = App.collections.watched;

            this._currentHour = App.masterClock.get('hour');

            // only update lists every hour for performance
            // let individual views (when active) handle countdowns.
            this.listenTo(App.masterClock, 'change', function() {
                // be sure to check for race-conditioned nodes that missed the last hour rollover
                if (self._currentHour !== App.masterClock.get('hour')) {
                    self._currentHour = App.masterClock.get('hour');
                    self.collection.sort();
                }
            });
        },

        onBeforeShow: function() {
            this.showList();
        },

        showList: function() {
            this.list.show(new WatchList.NodeList({
                collection: this.collection
            }));
        },

        showSettings: function() {
            App.vent.trigger('modal:open', {
                    childView: App.Views.Preferences,
                    title: 'Watch List Preferences',
                    model: App.userSettings
                });      
        },

        clearList: function() {
            App.vent.trigger('node:deselect:all');
        },

        onBeforeDestroy: function() {
            App.vent.trigger('modal:close');
        }
    });

    WatchList.NodeView = App.Views.NodeView.extend({
        template: 'watch-list/node',

        className: function() {
            return 'node-block col-md-3 col-sm-6 col-xs-12 ' + App.Views.NodeView.prototype.className.apply(this, arguments);
        },

        modelEvents: {
            'change': 'render'
        },

        serializeData: function() {
            var scrip;

            if(this.model.get('red_scrip')) {
                scrip = {
                    icon: 'red_scrip',
                    rating: this.model.get('red_scrip')
                };
            } else if(this.model.get('blue_scrip')) {
                scrip = {
                    icon: 'blue_scrip',
                    rating: this.model.get('blue_scrip')
                };
            }

            return _.extend({
                isCustom: this.model.get('type') === 'custom',
                isActive: this.model.get('active'),
                untilHours: this.model.get('earth_time_until').hours > 0,
                classes: this.getContentClasses(),
                scrip: scrip
            }, this.model.toJSON());
        }
    });

    WatchList.NodeList = Marionette.CollectionView.extend({
        className: 'watched-node-list',
        childView: WatchList.NodeView,

        initialize: function() {
            var self = this;

            this.collection.sort();
            this.listenTo(App.masterClock, 'change', function() {
                self.collection.sort();
            });
        }
    });

    App.on('before:start', function() {
        App.commands.setHandler('show:watchList', function() {
            App.mainRegion.show(new WatchList.BaseView());
        });
    });

});
