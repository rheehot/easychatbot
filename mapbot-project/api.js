module.exports = function(app) {

	const admin = require("firebase-admin");
	const serviceAccount = require("./ghbot-c3314-firebase-adminsdk-paj84-46fe7c006c.json");

	admin.initializeApp({
	  credential: admin.credential.cert(serviceAccount),
	  databaseURL: "https://ghbot-c3314.firebaseio.com/"
	});

	const request = require('request');
	const client_id = 'pluxtgu4ibH8gAd3Cmi0'; // NAVER CLIENT ID
	const client_secret = 'pGIgEN8n2X'; // NAVER SECRET ID


	function getGeocode(address){
		return new Promise((resolve, reject) => {
			const api_url = 'https://openapi.naver.com/v1/map/geocode?query=' + encodeURI(address); // json
		    	    
		    const options = {
		       url: api_url,
		       headers: {'X-Naver-Client-Id':client_id, 'X-Naver-Client-Secret': client_secret}
		    };
		    request.get(options, function (error, response, body) {
		     if (!error && response.statusCode == 200) {		     	
		       resolve(body);
		     } else {
		       reject(error);		       
		     }
		    });
	    });		
	}

	function getReverseGeocode(lat, lng){
		return new Promise((resolve, reject) => {
			const api_key = 'AIzaSyA3T9IWK03wh2YF312uk8coy84pEZy8Pjw'; // GOOGLE API KEY
			const api_url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${api_key}`;
		    
		    request.get({url: api_url}, function (error, response, body) {
		     if (!error && response.statusCode == 200) {		     	
		       resolve(body);
		     } else {
		       reject(error);		       
		     }
		    });
	    });		
	}

	app.putGhData = function() {
		const fs = require('fs');			

		fs.readFile(__dirname+'/ghlist.json', 'utf8', function(err, data) {

			const jsonObj = JSON.parse(data);			
			const rows = jsonObj.result.body.rows[0].row;
								

			for(var i=0; i<rows.length; i++){
				const row = rows[i];
				console.log(row);

				const gh_koname = row.bplcNm; 
				const gh_enname = row.engStnTrnmNm;
				const gh_address = row.rdnWhlAddr; 
				const tel = row.siteTel;
				
				getGeocode(gh_address).then((result) => {
					const resultObj = JSON.parse(result);
					const lat = resultObj.result.items[0].point.y;				
					const lng = resultObj.result.items[0].point.x;				

					getReverseGeocode(lat,lng).then((data) => {
						const jsonObj = JSON.parse(data);			
						const gh_enaddress = jsonObj.results[0].formatted_address;
						
						writeData(gh_koname, gh_enname, gh_address, gh_enaddress, tel, lat, lng);	
					}).catch((error) => {
						console.error(error);
					});				
				}).catch((error) => {
					console.error(error);
				});				
			}

		});
	}	

	function writeData(name, enname, address, en_address, phone, lat, lng){
	  admin.database().ref().child("guesthouses").push({ 
	  	name,
	  	enname,
	  	address,
	  	en_address,
		phone,
		lat,
	    lng
	  });
	}

		
}