
var VIEWANGLES = [90, 60, 30, 15];

var HEIGHTS = [0, 10, 50]

var NUMS_LOW = [4,7,7,7,9,9,10,10,11,11,12,12,14,16,16,18,18,18,19,20,20,21,22,23,24,25,26,26,27,27,28,32,32];

var NUMS_MID = [34,35,37,37,38,39,40,41,43,43,47,47,49,50,50,52,53,55,56,56,56,57,59,59,60,61,61,63,65,66];

var NUMS_HIGH = [67,68,70,73,74,74,76,76,76,76,79,80,83,84,85,86,88,89,91,91,93,93,93,94,95,95,96];

var NUM_ROTATIONS = 3;

var RESULTSURL = 'http://study.eagereyes.org/3dpies/submit_csv.php';

var trialIndex = 0;

/**
 * Make the combinations for the study trials. All angles here are in degrees for nicer logging.
 * Need to be converted to radians for drawing.
 */
function makeTrials(resultID, condition) {

	d3.shuffle(NUMS_LOW);
	d3.shuffle(NUMS_MID);
	d3.shuffle(NUMS_HIGH);
	
	var nums = [NUMS_LOW, NUMS_MID, NUMS_HIGH];
	var numIndex = [0, 0, 0];
	
	var trials = [];

	for (var i = 0; i < VIEWANGLES.length; i++) {

		for (var j = 0; j < HEIGHTS.length; j++) {
			
			if (i == 0 && j > 0)
				continue;

			for (var r = 0; r < NUM_ROTATIONS; r++) {
							
				for (var k = 0; k < nums.length; k++) {
					
					var value = nums[k][numIndex[k]];
					
					numIndex[k] = (numIndex[k] + 1) % nums[k].length;
					
					var trial = {
						resultID: resultID,
						condition: condition,
						viewAngle: VIEWANGLES[i],
						height: HEIGHTS[j],
						value: value,
						centralAngle: value/100.*360,
						rotation: Math.floor(Math.random()*360)
					};
					
					trials.push(trial);
				}
			}
		}
	}	
	
	d3.shuffle(trials);
	
	return trials;
}

function nextStep() {
	trials[trialIndex].endTime = (new Date()).getTime();
	trials[trialIndex].duration = trials[trialIndex].endTime-trials[trialIndex].startTime;
	trials[trialIndex].step = trialIndex;
	trials[trialIndex].answer = +$('#percent').val();
		
	$('#percent').val('');

	trialIndex++;
//	if (trialIndex < trials.length) {
	if (trialIndex < 10) {
		updatePie();
	} else {
		$('#question').hide();
		$('#pie').hide();
		$('#studyPanel').hide();

		submitResults();
		
		$('#thankyou').show();
	}
}

function updatePie() {
	var trial = trials[trialIndex];
	draw3DPie(drawInfo, rad(trial.centralAngle), rad(trial.viewAngle), rad(trial.rotation), HEIGHT/2, trial.height);
	trials[trialIndex].startTime = (new Date()).getTime();
}

function startStudy() {
	$('#instructions').hide();
	
	$('#question').show();
	$('#pie').show();
	$('#studyPanel').show();

	trialIndex = 0;
	updatePie();
}

function submitResults() {
	var csv = '' + Object.keys(trials[0]).join(',') + '\n';
    trials.forEach(function (trial) {
        var values = [];
        for (var key in trial)
            values.push(trial[key]);
        csv += values.join(',') + '\n';
    });
	
//	console.log(csv);

	d3.xhr(RESULTSURL)
		.header('content-type', 'application/x-www-form-urlencoded')
		.post('resultID='+encodeURIComponent(trials[0].resultID)+'&'+
			'data='+encodeURIComponent(JSON.stringify(csv)))
		.on('error', function(error) {
			console.error('ERROR: '+error);
		})
		.on('load', function(response) {
			console.log('Success: '+JSON.stingify(response));
		});
}
