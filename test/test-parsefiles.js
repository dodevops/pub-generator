/**
 * test-parsefiles
 * copyright 2015, Jurgen Leschner - github.com/jldec - MIT license
 *
**/

suite('test-parsefiles');

var u = require('pub-util');
var assert = require('assert');
var deepdiff = require('deep-diff');

var sources = [{ path:__dirname + '/md', fragmentDelim:true }];
var opts = require('pub-resolve-opts')( { sources:sources } );

var getSources = require('../getsources');
var serializeFiles = require('../serialize')().serializeFiles;

var files = [
  { path: '/draft-page.md' },
  { path: '/index.md' },
  { path: '/page1-bis.md' },
  { path: '/page1.md' },
  { path: '/page2~.md' },
  { path: '/page3.md' },
  { path: '/page4.md' },
];

var fragments =
[
  { _href: '/draft-page',
    _hdr: '---- (draft) ----\n\n',
    _draft: true,
    _txt: 'just some text\n',
    _file: files[0] },

  { _href: '/',
    _hdr: '',
    _txt: '# root page\n- hello world\n\n## heading2\n\npara\n\n',
    _file: files[1] },

  { _href: '/#fragment-1',
    _hdr: '---- ----\n\n',
    _txt: '## fragment 1',
    _file: files[1] },

  { // NOTE update page: header changes _href
    _href: '/page1-bis',
    _hdr: '---- /page1-bis (update /page1) ----\n\n',
    _txt: '# page1-bis\nupdated content\ncontent\n',
    _file: files[2],
    _update: {
      _href: '/page1',
      _hdr: '',
      _txt: '# page1\ncontent\ncontent\n',
      _file: files[3] }},

  { _href: '/page2',
    a: '1',
    _hdr: '---- ----\na:1\n\n',
    _txt: '# page2\ncontent\ncontent\n\n',
    _file: files[4] },

  { _href: '/page2#fragment-1',
    _hdr: '---- ----\n\n',
    _txt: '# page2#1\ncontent\ncontent\n\n',
    _file: files[4] },

  { _href: '/page3',
    _hdr: '---- /page3 ----\n\n',
    _txt: '# page3\nhas 2 additional fragments and some detached fragments\n\n',
    _file: files[5] },

  { _href: '/page3#fragment-1',
    _hdr: '---- /page3#fragment-1 ----\n\n',
    _txt: '# fragment 1\n\n',
    _file: files[5] },

  { _href: '/pagex#orphan-fragment-1',
    _hdr: '---- /pagex#orphan-fragment-1 ----\n\n',
    _txt: 'This fragment is an orphan without a parent page\n\n',
    _file: files[5] },

  { _href: '/page1-bis#in-page3',
    _hdr: '---- /page1-bis#in-page3 ----\n\n',
    _txt: 'This fragment has to use the updated /page1-bis page qualifier (not the original /page1)\n\n',
    _file: files[5] },

  { _href: '/page3#fragment-2',
    _hdr: '---- /page3#fragment-2 ----\n\n',
    _txt: 'This fragment would end up on the same page as the previous fragment without the /page3 qualifier',
    _file: files[5] },

  { _href: '/page4',
    _hdr: '---- (update) ----\n\n',
    _txt: '# page 4\n\nupdated text\n\n',
    _file: files[6],
    _update: {
      _href: '/page4',
      _hdr: '',
      _txt: '# page4\n\ninitial text\n\n',
      _file: files[6] }}
];

files[0].fragments = [fragments[0]];

files[1].fragments = [fragments[1],
                      fragments[2]];

files[2].fragments = [fragments[3]];

files[3].fragments = [fragments[3]._update];

files[4].fragments = [fragments[4],
                      fragments[5]];

files[5].fragments = [fragments[6],
                      fragments[7],
                      fragments[8],
                      fragments[9],
                      fragments[10]];

files[6].fragments = [fragments[11]._update,
                      fragments[11]];

files[0].source = sources[0];
files[1].source = sources[0];
files[2].source = sources[0];
files[3].source = sources[0];
files[4].source = sources[0];
files[5].source = sources[0];
files[6].source = sources[0];

sources[0].files = files;
sources[0].fragments =  u.map(fragments, function(f) { return f._update || f; });
sources[0].updates = u.filter(fragments, function(f) { return f._update; });
sources[0].drafts =  u.filter(fragments, function(f) { return f._draft; });

test('md directory tree', function(done) {

  // start from clone of sources without files
  var _sources = [u.omit(sources[0], 'files')];

  getSources(_sources, opts, function(err, actual) {
    if (err) return done(err);

    // console.log(u.inspect(actual, {depth:3}));

    assertNoDiff(actual, fragments, 'parsed');

    _sources[0].files = serializeFiles(_sources[0].files); // replace memoized files

    getSources(_sources, opts, function(err, actual2) {
      if (err) return done(err);
      assertNoDiff(actual, actual2, 'serialized');
      done();
    });
  });
});

function assertNoDiff(actual, expected, msg) {
  var diff = deepdiff(actual, expected);
  var maxdiff = 5;
  if (diff) {
    assert(false, 'deepDiff ' + msg + '\n'
      + u.inspect(diff.slice(0,maxdiff), {depth:3})
      + (diff.length > maxdiff ? '\n...(truncated)' : ''));
  }
}
