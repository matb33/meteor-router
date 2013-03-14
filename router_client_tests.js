Tinytest.add("Router page", function(test) {
  Meteor.Router.resetFilters();
  Meteor.Router.add({
    '/foo': 'foo',
    '/bar/:id': function(id) {
      Session.set('id', id);
      return 'bar';
    }
  });
  Meteor.Router.add(/page\/(\d+)/, function(number) {
    Session.set('pageNo', number);
    return 'page';
  });
  
  test.equal(Meteor.Router.page(), null);
  
  Meteor.Router.to('/foo');
  test.equal(Meteor.Router.page(), 'foo');
  
  Meteor.Router.to('/bar/1');
  test.equal(Meteor.Router.page(), 'bar');
  test.equal(Session.get('id'), '1');
  
  Meteor.Router.to('/page/7');
  test.equal(Meteor.Router.page(), 'page');
  test.equal(Session.get('pageNo'), '7');
});

Tinytest.add("Router reactivity", function(test) {
  var context_called = 0;
  Meteor.Router.resetFilters();
  Meteor.Router.add({
    '/foo': 'foo',
    '/bar': 'bar',
    '/bar/2': function() {
      // do something unrelated
      Session.set('router-test-page', 2);
      return 'bar';
    }
  })
  
  Deps.autorun(function() {
    Meteor.Router.page();
    context_called += 1;
  });
  
  test.equal(context_called, 1);
  
  Meteor.Router.to('/foo')
  Deps.flush()
  test.equal(context_called, 2);
  
  Meteor.Router.to('/bar')
  Deps.flush()
  test.equal(context_called, 3);
  
  // returns 'bar' to shouldn't trigger reactivity
  Meteor.Router.to('/bar/2')
  Deps.flush()
  test.equal(context_called, 3);
});

Tinytest.add("Router filtering", function(test) {
  Meteor.Router.resetFilters();
  Meteor.Router.add({
    '/foo': 'foo',
    '/bar': 'bar',
    '/baz': 'baz'
  })
  
  Meteor.Router.filters({
    'something_else': function() { return 'something_else'; },
    'third': function() { return 'a third thing' }
  })
  Meteor.Router.filter('something_else', {only: 'foo'});
  Meteor.Router.filter('third', {except: ['something_else', 'baz']});
  
  Meteor.Router.to('/foo');
  test.equal(Meteor.Router.page(), 'something_else');
  
  Meteor.Router.to('/bar');
  test.equal(Meteor.Router.page(), 'a third thing');
  
  Meteor.Router.to('/baz');
  test.equal(Meteor.Router.page(), 'baz');
});

Tinytest.add("FilteredRouter filter reactivity", function(test) {
  Meteor.Router.resetFilters();
  Meteor.Router.add('/foo', 'foo');
  
  Meteor.Router.filters({
    'something_else': function(page) {
      if (Session.get('something_else')) {
        return 'something_else';
      } else {
        return page;
      }
    }
  });
  Meteor.Router.filter('something_else');
  
  Session.set('something_else', null);
  Deps.flush();
  Meteor.Router.to('/foo');
  test.equal(Meteor.Router.page(), 'foo');
  
  Session.set('something_else', true);
  Deps.flush();
  test.equal(Meteor.Router.page(), 'something_else');
});