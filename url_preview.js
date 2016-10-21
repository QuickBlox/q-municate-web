const express = require('express');
const app = express();
const ogs = require('open-graph-scraper');

app.get('/', function (req, res) {
	var url = req.query.url;

    var options = {
        'url': url
    };

    ogs(options, function (err, results) {
    	if (results) {
        	res.send(results.data);
    	}
    });

});

app.listen(3000, function () {
    console.log('OpenGraph listen on localhost:3000');
});