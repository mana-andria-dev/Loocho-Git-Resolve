var NodeGit = require('nodegit');
var tmp = require('tmp');
var fs = require('fs');
var _ = require('lodash');
var NOOT = require('noot')('errors');
var path = require("path");
var promisify = require("promisify-node");
var fse = promisify(require("fs-extra"));
fse.ensureDir = promisify(fse.ensureDir);
var request = require('request');
var configurator = planorequire('modules/configurator');

module.exports = function(app) {

  /**
   * readDir
   * Read directory
   *
   * @param {String} path
   * @param {Function} cb
   */
  var readDir = function(path, cb) {
    return fs.readdir(path, function (err, folders) {
      if (err) return cb(err);
      return cb(null, folders);
    });
  };

  /**
   * readDir
   * Read directory
   *
   * @param {String} dir
   * @param {Array} data
   * @param {String} customApp
   * @param {Function} cb
   */
  var elemList = function (dir, data, customApp, cb) {
    var customAppFound = false;
    _.forEach(data, function (folderOrFile) {

      var path = dir + '/';
      // If customApp exist, create path e.g: 'https://github.com/NoaServices/Loocho-Custom-Apps/loocho/app/1'
      if (customApp) path += customApp + '/' + folderOrFile;
      
      // If customApp does not exist, create path e.g: 'https://github.com/NoaServices/Loocho-Custom-Apps/loocho/app'
      else path += folderOrFile;

      // Test if path is directory `true` or file `false`
      fs.stat(path, function (err, stats) {
        if (err) throw err;

        if (stats.isDirectory()) {
          customAppFound = true;
          // Find all element found in the path
          return readDir(path, function (err, results) {
            if (err) return cb(err); 

            // If customApp exist, i.e the path is the version path, so return all files founds        
            if (customApp) return cb(null, { folder: customApp, version: folderOrFile, files: results });

            return elemList(dir, results, folderOrFile, function (err, results) {
              return cb(null, results);
            });
          });          
        }

        if (!customAppFound) return cb(null, []);
      });      
    });
  };

  /**
   * getFilesToRead
   *
   * @param {String} dir
   * @param {Function} cb
   * @param {Response} res
   */
  var getFilesToRead = function (res, dir, cb) {
    var nbFileReaded = [];
    return readDir(dir, function (err, customApps) {
      if (err) return cb('The loocho directory does not exist in the repository');
      return elemList(dir, customApps, false, function (err, result) {
        return cb(null, result);
      });
    });    
  };

  /**
   * getApp
   * Get all find in the repository
   *
   * @param {String} path
   * @param {Response} res
   */
  var getApp = function (res, path) {
    var app = [];
    var dir = path + '/loocho';
    var nbVersionFound = 0;
    // Read all file finded from the github repository
    return getFilesToRead(res, dir, function (err, results) {
      if (err) return res.json({ err: err });
      if (Array.isArray(results)) return res.json([]);

      var obj = {};
      obj[results.folder] = {};

      // Count the number of version found of all customApp
      nbVersionFound++;

      // Initialiaze the number of file readed
      var nbFileReaded = 0;

      // Read file
      _.forEach(results.files, function (fileToRead) {
        var path = dir + '/' + results.folder + '/' + results.version + '/' + fileToRead;
        return fs.readFile(path, 'utf8', function (err, content) {
          nbFileReaded++;
          if (err) return res.json(err);

          /**
           * Create object of the content of customApp
           * {
           *  "agenda": {
           *    "code.js": "var agenda = 1;",
           *    "version": "1",
           *    "style.css": ".class {\n\tcolor: 'red';\n}",
           *    "template0.html": "<h1>\n\agenda v1\n</h1>"
           *  }
           * }
           */
          obj[results.folder][fileToRead] = content;
          obj[results.folder].version = results.version;
          if (nbFileReaded !== results.files.length) return;

          app.push(obj);
          if (app.length !== nbVersionFound) return;

          // Send the array who content the object generated
          return res.json(app);
        });
      });

    });     
  };

  /**
   * cloneRepository
   * clone a repository github
   *
   * @param {Request} req
   * @param {Function} cb
   */
  var cloneRepository = function(req, cb) {
    var branch = req.query.branch;      
    var url = req.query.url;      
    var githubToken = req.query.token;
    var cloneOptions = { checkoutBranch: branch };
    cloneOptions.fetchOpts = {
      callbacks: {
        certificateCheck: function() { return 1; },
        credentials: function() {
          return NodeGit.Cred.userpassPlaintextNew(githubToken, "x-oauth-basic");
        }
      }
    };
    //create a random temporary directory in the client disc
    tmp.setGracefulCleanup();
    return tmp.tmpName(function _tempNameGenerated(err, path) {
      var clone = NodeGit.Clone(url, path, cloneOptions);
      return clone.then(function() {
        return cb(null, path);
      }).catch(function(err) {
        return cb(err);
      });  
    });    
  }

  /**
   * cloneRepos
   *
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   */
  var cloneRepos = function (req, res, next) {
    if (!req.query.branch) return next(NOOT.Errors.BadRequest('Missing branch parameter in URL'));
    if (!req.query.url) return next(NOOT.Errors.BadRequest('Missing url parameter in URL'));
    if (!req.query.token) return next(NOOT.Errors.BadRequest('Missing token parameter in URL'));

    return cloneRepository(req, function (err, path) {
      if (err) return res.json({ err: err.toString() });
      return getApp(res, path);
    });

  };

  /**
   * pushToRepos
   * push a Custum-App in the repository
   *
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   */
  var pushToRepos = function (req, res, next) {
    if (!req.query.branch) return next(NOOT.Errors.BadRequest('Missing branch parameter in URL'));
    if (!req.query.url) return next(NOOT.Errors.BadRequest('Missing url parameter in URL'));
    if (!req.query.token) return next(NOOT.Errors.BadRequest('Missing token parameter in URL'));
    if (!req.query.authorization) return next(NOOT.Errors.BadRequest('Missing token parameter in URL'));

    return cloneRepository(req, function (err, pathFolder) {
      if (err) return res.json({ err: err.toString() });      
      var repoFolder = path.resolve(pathFolder);
      var fileTemplate = req.body.fileTemplate;
      var fileCode = req.body.fileCode;
      var fileCss = req.body.fileCss;
      var fileWorker = req.body.fileWorker;
      var directoryName = 'loocho/' + req.body.path;
      var user = req.body.user;
      var repo, index, oid, remote;
      // Open the repository directory.
      return NodeGit.Repository.open(repoFolder)
        .then(function(repoResult) {
          repo = repoResult;
          return fse.ensureDir(path.join(repo.workdir(), directoryName));
        })
        .then(function() {
          fse.writeFile(path.join(repo.workdir(), directoryName, fileTemplate), req.body.content.tmpl || '');
          fse.writeFile(path.join(repo.workdir(), directoryName, fileCode), req.body.content.code || '');
          fse.writeFile(path.join(repo.workdir(), directoryName, fileCss), req.body.content.css || '');
          fse.writeFile(path.join(repo.workdir(), directoryName, fileWorker), req.body.content.worker || '');
          return repo.refreshIndex();
        })
        .then(function(index) {
          return index.addByPath(directoryName + fileTemplate)
            .then(function() {
              index.write();
              return index.writeTree();
            })
            .then(function() {
              return index.addByPath(directoryName + fileCode);
            })
            .then(function() {
              index.write();
              return index.writeTree();
            })
            .then(function() {
              return index.addByPath(directoryName + fileCss);
            })
            .then(function() {
              index.write();
              return index.writeTree();
            })            
            .then(function() {
              return index.addByPath(directoryName + fileWorker);
            })
            .then(function() {
              index.write();
              return index.writeTree();
            });              
        })
        .then(function(oidResult) {
          oid = oidResult;
          return NodeGit.Reference.nameToId(repo, 'HEAD');
        })
        .then(function(head) {
          return repo.getCommit(head);
        })

        // create commit
        .then(function(parent) {
          var author = committer = NodeGit.Signature.create(user.name, user.email, new Date().getTime(), 1);
          return repo.createCommit('HEAD', author, committer, 'update', oid, [parent]);           
        })

        // push into the repository
        .then(function() {
          return repo.getRemote('origin');
        })
        .then(function(remoteResult) {
          remote = remoteResult;
          var githubToken = req.query.token;
          return remote.push(
            ['+refs/heads/' + req.query.branch + ':refs/heads/' + req.query.branch],
            {
              callbacks: {
                certificateCheck: function() { return 1; },
                credentials: function() { return NodeGit.Cred.userpassPlaintextNew(githubToken, 'x-oauth-basic'); }
              }
            }
          );
        })
        .then(function() {
          res.json({ message: 'application created in the repository' });
        });
    });
  }

  /**
   * Routes declaration
   */
  app.get('/cloneRepos', cloneRepos);
  app.post('/pushToRepos', pushToRepos);
}