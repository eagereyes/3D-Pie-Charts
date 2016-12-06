
var VARIATIONS = ['baseline', 'circular', 'circular-center', 'off-center', 'centered-circle', 'centered-square', 'floating-circle']

var VALUES_1 = [ 2,  3,  4,  6,  7,  8,  9, 11, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24];
var VALUES_2 = [26, 27, 28, 29, 31, 32, 34, 36, 37, 38, 39, 41, 42, 43, 44, 46, 47, 48, 49];
var VALUES_3 = [51, 52, 53, 54, 56, 57, 58, 59, 61, 62, 63, 64, 67, 68, 69, 71, 72, 73, 74];
var VALUES_4 = [76, 77, 78, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 96, 97];

var NUM_ROTATIONS = 3;

var RESULTSURL = 'http://study.eagereyes.org/area-charts/submit_csv.php';

var trialIndex = 0;

var inBreak = false;

/**
 * Make the combinations for the study trials. All angles here are in degrees for nicer logging.
 * Need to be converted to radians for drawing.
 */
function makeTrials(resultID, condition, demographics) {
	
	var nums = [VALUES_1, VALUES_2, VALUES_3, VALUES_4];
	var numIndex = [0, 0, 0];
	
	var trials = [];

	for (var i = 0; i < VARIATIONS.length; i++) {
		for (var j = 0; j < nums.length; j++) {
			for (var k = 0; k < NUM_ROTATIONS; k++) {

				var value = nums[j][Math.floor(Math.random()*nums[j].length)];

				var trial = {
					resultID: resultID,
					variation: VARIATIONS[i],
					percentage: value,
					rotation: Math.floor(Math.random()*360),
					age: demographics.age,
					sex: demographics.sex,
					degree: demographics.degree
				};

				trials.push(trial);
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
	var radius = HEIGHT/2-5;
	drawWeirdPie(drawInfo, radius, trial.rotation, trial.percentage, trial.variation);
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
