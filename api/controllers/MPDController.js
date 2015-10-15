/**
 * AccountController
 *
 * @description :: Server-side logic for managing Accounts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var fs = require('fs');
var path = require('path');

var fixtureData = null;

module.exports = {
	
    _config: {
        model: "mpd",
        actions: true,
        shortcuts: true,
        rest: true
    },
    
    find:function(req, res){
        if (fixtureData == null){
            
            var pathToFile = path.join(__dirname, "..", "..", "test", "fixtures", "MPD.json");
            fs.readFile(pathToFile, {encoding:'utf8'}, function(err, data){ 
                
                if (err) {
                    res.serverError(err);
                } else {
                    fixtureData = JSON.parse(data);
                    res.send(fixtureData);
                }
            })
            
        } else {
            res.send(fixtureData);
        }
    }
};

