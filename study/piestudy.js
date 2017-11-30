
var VIEWANGLES = [90, 60, 30, 15];

var HEIGHTS = [0, 10, 50]

var NUMS_LOW = [4,7,7,7,9,9,10,10,11,11,12,12,14,16,16,18,18,18,19,20,20,21,22,23,24,25,26,26,27,27,28,32,32];

var NUMS_MID = [34,35,37,37,38,39,40,41,43,43,47,47,49,50,50,52,53,55,56,56,56,57,59,59,60,61,61,63,65,66];

var NUMS_HIGH = [67,68,70,73,74,74,76,76,76,76,79,80,83,84,85,86,88,89,91,91,93,93,93,94,95,95,96];

var NUM_ROTATIONS = 3;

var RESULTSURL = 'http://study.eagereyes.org/pies/submit_csv.php';

var COMPLETIONURL = 'https://www.prolific.ac/submissions/complete?cc=NFBM5ZW3';

var CONDITION = 'directinput';

var trialIndex = 0;

var inBreak = false;

/**
 * Make the combinations for the study trials. All angles here are in degrees for nicer logging.
 * Need to be converted to radians for drawing.
 */
function makeTrials(resultID, condition, demographics) {

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
		
	trials[trialIndex].endTime = (new Date()).getTime();
	trials[trialIndex].duration = trials[trialIndex].endTime-trials[trialIndex].startTime;
	trials[trialIndex].step = trialIndex;
		
	$('#percent').val('');
	$('#nextBtn').prop('disabled', true);
	d3.select('#progress-'+trialIndex).classed('complete', true);

	trialIndex++;

	if (trialIndex < trials.length) {
//	if (trialIndex < 10) {
		trials[trialIndex].answer = .5;
		drawInfo.guess = .5;
		if (trialIndex === trials.length/3 || trialIndex === 2*trials.length/3) {
			takeBreak();
		} else {
			trials[trialIndex].startTime = (new Date()).getTime();
			updatePie();
		}
	} else {
		$('#question').hide();
		$('#pie').hide();
		$('#studyPanel').hide();

		submitResults();
		
		$('#thankyou').show();
		setTimeout(function() { window.location = COMPLETIONURL; }, 3000);
	}
}

function updatePie() {
	var trial = trials[trialIndex];
	draw3DPie(drawInfo, rad(trial.centralAngle), rad(trial.viewAngle), rad(trial.rotation), RADIUS, trial.height, false, XPAD);
	drawInteractionPie(drawInfo, drawInfo.guess*Math.PI*2, RADIUS, XPAD+2*RADIUS+XSEP);
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
	trials[trialIndex].startTime = (new Date()).getTime();
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

	$('#instructions').hide();
	$('#demographics').hide();
	$('#cond2question').hide();
	
	trials = makeTrials(resultID, CONDITION, demographics);

	trials[trialIndex].answer = .5;
	drawInfo.guess = .5;

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

	d3.request(RESULTSURL)
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
