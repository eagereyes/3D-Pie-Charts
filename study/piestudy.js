
var VIEWANGLES = [90, 60, 30, 15];

var HEIGHTS = [0, 10, 50]

var NUM_RANGE = [4, 96];
var NUM_RANGE_SUBSETS = 3;

var NUM_ROTATIONS = 3;

var RESULTSURL = 'http://study.eagereyes.org/3dpies/submit_csv.php';

var trialIndex = 0;

var inBreak = false;

/**
 * Make the combinations for the study trials. All angles here are in degrees for nicer logging.
 * Need to be converted to radians for drawing.
 */
function makeTrials(resultID, condition, demographics) {
	
	var trials = [];

	for (var i = 0; i < VIEWANGLES.length; i++) {

		for (var j = 0; j < HEIGHTS.length; j++) {
			
			// no need to vary height for "head on" condition
			if (i == 0 && j > 0)
				continue;

			for (var r = 0; r < NUM_ROTATIONS; r++) {
							
				for (var k = 0; k < NUM_RANGE_SUBSETS; k++) {
					
					// pick a random integer in the given range
					var min = NUM_RANGE[0];
					var max = NUM_RANGE[1];
					var range = (max - min) / NUM_RANGE_SUBSETS;
					var value = Math.random()*range + min + range*k;
					value = Math.round(value);
					
					var trial = {
						resultID: resultID,
						condition: condition,
						viewAngle: VIEWANGLES[i],
						height: HEIGHTS[j],
						value: value,
						centralAngle: value/100.*360,
						rotation: Math.floor(Math.random()*360),
						age: demographics.age,
						sex: demographics.sex,
						degree: demographics.degree,
						issue: ''
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

	if (inBreak) // otherwise, you can keep hitting return to advance during break
		return;

	$('.error').hide();

	var response = +$('#percent').val();
	
	if (response < 1 || response > 99) {
		$('#outofrange').show();
		$('#percent').val('');
		$('#nextBtn').prop('disabled', true);
		trials[trialIndex].issue = 'range';
		return
	} else if (trialIndex < 10 && Math.abs(response-trials[trialIndex].value) > Math.abs(response-(100-trials[trialIndex].value))) {
		$('#wrongpart').show();
		$('#percent').val('');
		$('#nextBtn').prop('disabled', true);
		trials[trialIndex].issue = 'opposite';
		return
	}
		
	trials[trialIndex].endTime = (new Date()).getTime();
	trials[trialIndex].duration = trials[trialIndex].endTime-trials[trialIndex].startTime;
	trials[trialIndex].step = trialIndex;
	trials[trialIndex].answer = response;
		
	$('#percent').val('');
	$('#nextBtn').prop('disabled', true);
	d3.select('#progress-'+trialIndex).classed('complete', true);

	trialIndex++;
	if (trialIndex < trials.length) {
//	if (trialIndex < 10) {
		if (trialIndex === trials.length/3 || trialIndex === 2*trials.length/3) {
			takeBreak();
		} else {
			updatePie();
		}
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
	$('#percent').focus();
}

function takeBreak() {
	inBreak = true;
	hideStudyStuff();
	$('#break').show();
}

function endBreak() {
	inBreak = false;
	$('#break').hide();
	$('#percent').val('');
	$('#nextBtn').prop('disabled', true);
	showStudyStuff();
	updatePie();
}

function showStudyStuff() {
	$('#question').show();
	$('#pie').show();
	$('#studyPanel').show();

	$('#percent').focus();
}

function hideStudyStuff() {
	$('#question').hide();
	$('#pie').hide();
	$('#studyPanel').hide();
}

function showDemographics() {
	$('#instructions').hide();
	$('#demographics').show();
}

function startStudy() {

	$('#demographics').hide();
	$('#cond2question').hide();
	
	showStudyStuff();

	var progressbar = d3.select('#progressbar');
	for (var i = 0; i < trials.length; i++) {
		progressbar.append('div')
			.attr('class', 'progressbox')
			.attr('id', 'progress-'+i);

		if (i+1 === trials.length/3 || i+1 === 2*trials.length/3) {
			progressbar.append('span')
				.text('|');
		}		
	}
	
	d3.select('#progressbar').selectAll('.progressbox')
		.data(d3.range(trials.length))
		.enter().append('div')
		.attr('class', 'progressbox')
		.attr('id', function(d) { return 'progress-'+d; });

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
			'data='+encodeURIComponent(csv))
		.on('error', function(error) {
			console.error('ERROR: '+error);
		// })
		// .on('load', function(response) {
		// 	console.log('Success: '+JSON.stringify(response));
		});
}
