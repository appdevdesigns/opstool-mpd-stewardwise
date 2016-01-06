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
    
    
    find: function(req, res) {
        
        var results = {
            // `id` included to accommodate client side model paradigm.
            // These results are not actually a record that can be stored.
            id: 1,
        /*
            mpdGoal: <number>,
            avgIncome: <number>,
            avgExpense: <number>,
            percentForeignContrib: <number>,
            percentLocalContrib: <number>,
            needRemaining: <number>,
            percentOfNeed: <number>,
        */
        };
        
        var nssrenID = req.stewardwise.nssren.nssren_id;
        var renGUID = req.stewardwise.nssren.ren_guid;
        var account;
        var baseSalary;
        
        var startingPeriod;
        var months = 12; // number of months to count
        
        async.series([
            
            // Fiscal period from 12 months ago
            function(next) {
                LNSSCoreGLTrans.getPastPeriod(12)
                .fail(next)
                .done(function(data) {
                    startingPeriod = data;
                    next();
                });
            },
            
            // Additional staff info
            function(next) {
                LNSSRen.staffInfo({ nssrenID: nssrenID })
                .fail(next)
                .done(function(data) {
                    if (!data || !data[0]) {
                        next(new Error('Staff info not found'));
                    } else {
                        results.mpdGoal = Math.round(data[0].mpdGoal || 0);
                        account = data[0].accountNum;
                        baseSalary = data[0].baseSalary;
                        
                        // Number of months will be less than 12 if the
                        // staff has only recently joined.
                        var offset = LNSSCoreGLTrans.periodDiff(
                            data[0].periodJoined, 
                            startingPeriod
                        );
                        months = Math.max(1, 12 - offset);
                        
                        next();
                    }
                });
            },
            
            // Average income
            function(next) {
                LNSSCoreGLTrans.sumIncome(startingPeriod, account)
                .fail(next)
                .done(function(data) {
                    results.avgIncome = Math.round(
                        data[account] / months
                    );
                    next();
                });
            },
            
            // Average expenses
            function(next) {
                LNSSCoreGLTrans.sumExpenditure(startingPeriod, account)
                .fail(next)
                .done(function(data) {
                    results.avgExpense = Math.round(
                        data[account] / months
                    );
                    next();
                });
            },
            
            // % local contributions
            function(next) {
                LNSSCoreGLTrans.sumLocalContrib(startingPeriod, account)
                .fail(next)
                .done(function(data) {
                    var avgLocalContrib = data[account] / months;
                    results.percentLocalContrib = Math.round(
                        avgLocalContrib / results.avgExpense * 100
                    );
                    next();
                });
            },
            
            // % foreign contributions
            function(next) {
                LNSSCoreGLTrans.sumForeignContrib(startingPeriod, account)
                .fail(next)
                .done(function(data) {
                    var avgForeignContrib = data[account] / months;
                    results.percentForeignContrib = Math.round(
                        avgForeignContrib / results.avgExpense * 100
                    );
                    next();
                });
            },
            
            // Other calculations
            function(next) {
                var need = Math.max(
                    results.avgExpense,
                    results.mpdGoal,
                    baseSalary
                );
                results.percentOfNeed = Math.round(
                    Math.min(
                        results.avgIncome / need * 100,
                        100
                    )
                );
                results.needRemaining = Math.round(
                    Math.max(
                        need - results.avgIncome,
                        0
                    )
                );
                next();
            }
        
        ], function(err) {
            results.percentOfNeed = 105;
            if (err) {
                res.AD.error(err);
            } else {
                res.AD.success([results]);
            }
        });
        
    },
    
    
    findFixtures: function(req, res) {
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

