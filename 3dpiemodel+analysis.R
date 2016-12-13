library('pracma')
library('dplyr')
library('ggplot2')

# radius of the pie chart in pixels
pieRadius <- 300

# Turn degrees into radians
rad <- function(degrees) {
	degrees/180*pi;
}

# Return partially applied function calculating arc length as
# function of t for ellipse with axes a and b.
ellipseArcFunc <- function(a, b) {
	function(t) c(a*cos(t), b*sin(t))
}

# Calculate arc length of ellipse from angle rho to theta
# for ellipse given the arc function (created by ellipseArcFunc)
# Uses pracma package http://www.inside-r.org/packages/cran/pracma/docs/arclength
ellipseArcLengthAux <- function(arcFunc, theta, rho) {
	arclength(arcFunc, rho, rho+theta, tol = 1e-10)$length
}

# Calculate the fraction of the ellipse by arc length that's taken up by the slice
ellipseArcFraction <- function(a, b, theta, rho) {
	localFunc <- function(eA, eB, t, r) {
		arcFunc <- ellipseArcFunc(eA, eB)
		ellipseArcLengthAux(arcFunc, t, r)/ellipseArcLengthAux(arcFunc, 2*pi, 0)
	}
	mapply(localFunc, a, b, theta, rho)
}

ellipseArcLength <- function(a, b, theta, rho) {
	localFunc <- function(eA, eB, t, r) {
		arcFunc <- ellipseArcFunc(eA, eB)
		ellipseArcLengthAux(arcFunc, t, r)
	}
	localFunc(a, b, theta, rho)
}

# Calculate ellipse area for a given angle by summing up quarters first
# then adding the remaining portion
ellipseAreaAux <- function(a, b, theta) {

	quarters <- theta %/% (pi/2)
	area <- a*b*pi/4 * quarters

	theta <- theta - quarters*pi/2

	return(area + ifelse(quarters %% 2 == 0,
				  a*b*pi/4 - .5*a*b*atan(a*tan(pi/2-theta)/b),
				  .5*a*b*atan(a*tan(theta)/b)))
}

# Calculate area for ellipse with axes a and b for a slice with
# angle theta and rotation rho.
ellipseAreaSlice <- function(a, b, theta, rho) {
	ellipseAreaAux(a, b, rho+theta) - ellipseAreaAux(a, b, rho)
}

ellipseArea <- function(a, b) {
	a*b*pi
}

# Calculate the fraction of the ellipse area taken up by slice with angle theta and rotation rho 
ellipseAreaFraction <- function(a, b, theta, rho) {
	ellipseAreaSlice(a, b, theta, rho) / ellipseArea(a, b)
}

# Calculate the projected angles for a circle tilted at viewAngle alpha from the viewer
# Returns the projected centralAngle theta and projected rotationAngle rho
projectAngle <- function(alpha, theta, rho) {
	xA <- cos(rho)
	yA <- sin(rho)
	
	xB = cos(rho+theta)
	yB = sin(rho+theta)
	
	yAProj <- yA*sin(alpha)
	yBProj <- yB*sin(alpha)
	
	rotationProj <- atan2(yAProj, xA)
	centralProj <- atan2(yBProj, xB) - rotationProj
	
	# Avoid the π to -π discontinuity when we cross the negative x axis (also keep angles in [0..2π])
	rotationProj <- ifelse(rotationProj < 0, rotationProj + 2*pi, rotationProj)

	centralProj <- ifelse(centralProj < 0,  centralProj + 2*pi, centralProj)
	
	list(thetaProj = centralProj, rhoProj = rotationProj)
}

classifyOrientation <- function(bisectorAngle) {
	ifelse((bisectorAngle > 30) & (bisectorAngle < 150), 'Back',
		   ifelse ((bisectorAngle > 210) & (bisectorAngle < 330),
		   'Front', 'Side'))
}

classifyOrientation45 <- function(bisectorAngle) {
	bisectorAngle <- mod(bisectorAngle, 360)
	ifelse((bisectorAngle > 45) & (bisectorAngle < 135), 'Back',
		   ifelse ((bisectorAngle > 225) & (bisectorAngle < 315),
		   		'Front', 'Side'))
}

cond1 <- function(data) {
	subset(data, condition=="cond1")
}

cond2 <- function(data) {
	subset(data, condition=="cond2")
}

makePredictions <- function() {
	viewAngle <- c()
	theta <- c()
	thetaProj <- c()
	rhos <- c()
	rhoProj <- c()
	bisectors <- c()
	bisectorsProj <- c()
	area <- c()
	arc <- c()
	angles <- deg2rad(c(5, 10, 20, 30, 45, 60, 75, 90, 135, 180))
	for (alpha in deg2rad(c(90, 60, 30, 15))) {
		for (rho in deg2rad(0:359)) {
			verticalFactor <- sin(alpha)
			anglesProj <- projectAngle(alpha, angles, rho)
			viewAngle <- append(viewAngle, rep_len(alpha, length(angles)))
			theta <- append(theta, angles)
			thetaProj <- append(thetaProj, anglesProj$thetaProj)
			rhos <- append(rhos, rep_len(rho, length((angles))))
			rhoProj <- append(rhoProj, anglesProj$rhoProj)
			bisectors <- rho + angles/2
			bisectorsProj <- append(bisectorsProj, projectAngle(alpha, bisectors, 0)$theta)
			area <- append(area, ellipseAreaFraction(pieRadius, pieRadius*verticalFactor, anglesProj$thetaProj, anglesProj$rhoProj))
			arc <- append(arc, ellipseArcFraction(pieRadius, pieRadius*verticalFactor, anglesProj$thetaProj, anglesProj$rhoProj))
		}
	}
  
	predictions <- data.frame(viewAngle=rad2deg(viewAngle), rad2deg(theta), rad2deg(thetaProj), rad2deg(rhos), rad2deg(rhoProj), rad2deg(bisectors), rad2deg(bisectorsProj), area, arc)
	return(predictions)
}

# predictions <- makePredictions()
# write.csv(predictions, file="3dpiepredictions-r.csv")

setwd('/Users/rkosara/Dropbox (Tableau)/Research/3D Pie Charts')
data <- read.csv('results-3dpiestudy.csv')

# Add thetaProj and rhoProj columns (both in radians)
projections <- with(data, projectAngle(rad(viewAngle), rad(centralAngle), rad(rotation)))
data <- cbind(data, projections)

# Why are projFraction and areaFraction the same?
# areaFraction should be linear with value and centralAngle
data <- mutate(data,
				error = answer-value,
				absError = abs(error),
				logError = log2(absError+1/8),
				verticalFactor = sin(rad(viewAngle)),
				fraction = value/100,
				projFraction = thetaProj/(2*pi),
#				areaFraction = ellipseAreaFraction(pieRadius, pieRadius*verticalFactor, thetaProj, rhoProj),
				areaFraction = projFraction,
				arcFraction = ellipseArcFraction(pieRadius, pieRadius*verticalFactor, thetaProj, rhoProj),
				threeDee = (viewAngle != 90), # TRUE if chart is 3D, FALSE if 2D
				opposite = (abs(100-value-answer) < absError) & (abs(50-value) > 5),
				bisectorAngle = rotation+centralAngle/2,
				bisectorProj = projectAngle(rad(viewAngle), rad(bisectorAngle), 0)$theta,
				orientation = factor(classifyOrientation45(bisectorAngle)),
				viewAngle = factor(viewAngle, levels=c(90, 60, 30, 15))
			)

# write.csv(data, file='results-3dpiestudy-enriched.csv')

# How many are opposites?
oppositeCount <- cond1(data) %>% filter(opposite == TRUE) %>% summarize(count=n())
oppositeFraction <- oppositeCount$count/length(cond1(data)$resultID)

dataFiltered <- data %>%
	# Remove responses that were likely for the other slice
	filter(opposite == FALSE) # %>%
	# Remove the two extreme outliers, one from each condition
#	filter(resultID != '1457717965741x399922', resultID != '1457717878733x902968')

baseline <- dataFiltered %>%
	filter(viewAngle == 90) %>%
	group_by(resultID) %>%
	summarize(AbsErrorBaseline = mean(absError),
			  errorBaseline = mean(error))

dataFiltered <- dataFiltered %>%
	left_join(baseline, by = 'resultID') %>%
	mutate(normalizedAbsError = absError/AbsErrorBaseline,
		   normalizedError = error/errorBaseline)

dataAggregated <- dataFiltered %>%
	group_by(viewAngle, resultID, condition, orientation, height) %>%
	summarize(meanLogError = mean(logError), meanError = mean(error),
			  meanAbsError = mean(absError), normalizedAbsError = mean(normalizedAbsError),
			  normalizedError = mean(normalizedError))

# Log error by view Angle for the two conditions
ggplot(dataAggregated, aes(x=viewAngle, y=meanLogError, fill=factor(viewAngle))) +
	geom_violin(size=1, aes(y=meanError, color=factor(viewAngle)), show.legend=FALSE) +
	stat_summary(fun.y=mean, geom="point", shape=5, size=3, show.legend=FALSE) +
	labs(x = "View Angle", y = "Log Error") + facet_grid(condition ~ .)

# Error by view Angle for condition 1
ggplot(cond1(dataAggregated), aes(x=viewAngle, y=meanError, fill=factor(viewAngle))) +
	geom_violin(size=1, aes(y=meanError, color=factor(viewAngle)), show.legend=FALSE) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend=FALSE) +
	labs(x = "View Angle", y = "Error")

# Error by view Angle for condition 2
ggplot(cond2(dataAggregated), aes(x=viewAngle, y=meanError, fill=factor(viewAngle))) +
	geom_violin(size=1, aes(y=meanError, color=factor(viewAngle)), show.legend=FALSE) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend=FALSE) +
	labs(x = "View Angle", y = "Error")

# Error by view Angle for the two conditions
ggplot(dataAggregated, aes(x=orientation, y=meanError, fill=factor(orientation))) +
	geom_violin(size=1, aes(y=meanError, color=factor(orientation)), show.legend=FALSE) +
	stat_summary(fun.y=mean, geom="point", shape=5, size=3, show.legend=FALSE) +
	labs(x = "View Angle", y = "Log Error") + facet_grid(condition ~ viewAngle)

# Error by body height for condition 1
ggplot(cond1(dataAggregated), aes(x=factor(height), y=meanError)) +
	geom_violin(size=1, aes(y=meanError), show.legend=FALSE, fill="gray") +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend=FALSE) +
	labs(x = "Body Height", y = "Error")

# t test between the aggregated means for conditions 1 and 2
t.test(cond1(dataAggregated)$meanError, cond2(dataAggregated)$meanError)

dataByUser <- dataFiltered %>%
	group_by(resultID, condition) %>%
	summarize(meanError = mean(absError))

# Error by central angle
ggplot(dataFiltered, aes(centralAngle, absError)) +
	geom_point() + geom_smooth() + facet_grid(condition ~ .) + coord_polar()

ggplot(dataFiltered, aes(centralAngle, absError)) +
	geom_point() + geom_smooth() + facet_grid(viewAngle ~ condition) + coord_polar()


# Error by bisector - flat as a pancake! Same with rotation.
ggplot(dataFiltered, aes(bisectorAngle, absError)) +
	geom_point() + geom_smooth() + facet_grid(condition ~ .) # + coord_polar()

ggplot(dataFiltered, aes(rotation, absError)) +
	geom_point() + geom_smooth() + facet_grid(viewAngle ~ condition) + # + coord_polar()
	labs(x = "Rotation Angle", y = "Absolute Error")

ggplot(dataFiltered, aes(bisectorAngle, absError)) + scale_x_continuous(breaks=seq(0, 530, 90)) +
	geom_point() + geom_smooth() + facet_grid(viewAngle ~ .) + # + coord_polar()
	labs(x = "Bisector Angle", y = "Absolute Error")

# Error by represented value
ggplot(dataFiltered, aes(value, absError)) +
	geom_point() + geom_smooth() + facet_grid(viewAngle ~ .) + # + coord_polar()
	labs(x = "Percentage", y = "Absolute Error")


summary(lm(absError ~ bisectorAngle + condition, dataFiltered))

# Value against answer, basic
ggplot(dataFiltered, aes(value, answer)) +
	geom_point() + geom_smooth() + facet_grid(condition ~ .)

predictionsAggregated <- dataFiltered %>%
	group_by(value, viewAngle) %>%
	summarize(projFractionMin = min(projFraction)*100,
			  projFractionMax = max(projFraction)*100,
			  areaFractionMin = min(areaFraction)*100,
			  areaFractionMax = max(areaFraction)*100 #,
#			  arcFractionAgg = min(arcFraction)*100
	)

# Value against answer, with overlays
ggplot(dataFiltered, aes(value, answer)) +
	geom_ribbon(data = predictionsAggregated, inherit.aes = FALSE, aes(value, ymax=projFractionMax, ymin=projFractionMin), fill="gray") +
# 	geom_line(data = predictionsAggregated, inherit.aes = FALSE, aes(value, projFractionMin)) +
# 	geom_line(data = predictionsAggregated, inherit.aes = FALSE, aes(value, projFractionMax)) +
	geom_line(data = predictionsAggregated, inherit.aes = FALSE, aes(value, areaFractionMin)) +
	geom_line(data = predictionsAggregated, inherit.aes = FALSE, aes(value, areaFractionMax)) +
#	geom_line(data = predictionsAggregated, inherit.aes = FALSE, aes(value, arcFractionAgg)) +
	geom_point() +
	facet_grid(viewAngle ~ condition)

# Answer vs. projected angle - interesting step at .5
ggplot(dataFiltered, aes(projFraction, answer)) +
	geom_point() + geom_smooth() + facet_grid(viewAngle ~ condition)

ggplot(dataFiltered, aes(projFraction, value)) +
	geom_point() + facet_grid(viewAngle ~ condition)

ggplot(dataByUser, aes(condition, meanError)) + geom_point() + geom_boxplot(alpha=.5)

ggplot(dataFiltered, aes(value, areaFraction)) + geom_point() + facet_grid(viewAngle ~ .)

## Create just the predictions and plot them
# predictions <- makePredictions()

# ggplot(predictions) +
# 	geom_line(aes(theta, thetaProj, group=viewAngle), color="red") +
# 	geom_line(aes(theta, area, group=viewAngle), color="blue") +
# 	geom_line(aes(theta, arc, group=viewAngle), color="green")

rmse <- dataFiltered %>%
		group_by(condition) %>%
		summarize(mseArea = sqrt(mean((answer-fraction*100)^2)),
				 mseArc = sqrt(mean((answer-arcFraction*100)^2)),
				 mseAngle = sqrt(mean((answer-projFraction*100)^2)))

# Akaike Information Content, AIC
rss <- dataFiltered %>%
	group_by(condition) %>%
	summarize(rssArea = sum((answer-fraction*100)^2),
			  rssArc = sum((answer-arcFraction*100)^2),
			  rssAngle = sum((answer-projFraction*100)^2))

# k = 3 for arc and angle (viewAngle, rotation, value), and we're only considering half the data for each (only condition 1)
aicArc <- 2*3+length(dataFiltered)/2*log(rss$rssArea[2])
aicAngle <- 2*3+length(dataFiltered)/2*log(rss$rssArea[3])

# k = 1 for fraction, since it only takes value into account!
aicArea <- 2*1+length(dataFiltered)/2*log(rss$rssArea[1])

# Normalized error by view angle for the two conditions
ggplot(cond1(dataAggregated), aes(x=viewAngle, y=normalizedAbsError, fill=factor(viewAngle))) +
	geom_violin(size=1, aes(y=normalizedAbsError, color=factor(viewAngle)), show.legend=FALSE) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend=FALSE) +
	labs(x = "View Angle", y = "Normalized Absolute Error") # + facet_grid(condition ~ .)

# Absolute error (not normalized) by view angle for the two conditions
ggplot(cond1(dataAggregated), aes(x=viewAngle, y=meanAbsError, fill=factor(viewAngle))) +
	geom_violin(size=1, aes(y=meanAbsError, color=factor(viewAngle)), show.legend=FALSE) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend=FALSE) +
	labs(x = "View Angle", y = "Absolute Error") # + facet_grid(condition ~ .)

# Errors by view angle and condition
errors <- dataFiltered %>%
	group_by(condition, viewAngle) %>%
	summarize(abs=mean(absError), err=mean(error), sd=sd(error))

ggplot(errors, aes(viewAngle, group=condition, color=condition)) + geom_line(aes(y=err)) + geom_line(aes(y=abs))

# Errors by height and condition
errors <- dataFiltered %>%
	group_by(condition, height) %>%
	summarize(abs=mean(normalizedAbsError), err=mean(error), sd=sd(error))

# Modeling
d <- dataFiltered %>% transform(viewAngle=unclass(viewAngle))
model1 <- lm(answer ~ viewAngle + height + value + rotation, cond1(d))
model2 <- lm(answer ~ viewAngle + height + value + rotation, cond2(d))

rssModel1 <- sum(residuals(model1)^2)
# AIC, k = 4
aicModel1 <- 2*4+length(dataFiltered)/2*log(rssModel1)

# Use just the two factors with a real influence
# Who picked these stupid names?
model1b <- lm(answer ~ viewAngle + value, cond1(d))
rssModel1b <- sum(residuals(model1b)^2)
# k = 2 for this model?
aicModel1b <- 2*2+length(dataFiltered)/2*log(rssModel1b)

# Experiment 2!
summary(lm(answer ~ viewAngle + height + value + rotation, cond2(d)))
summary(lm(error ~ viewAngle, cond2(d)))

# Variation where we use Cook's D to remove highly influential values, rather than the opposites
d <- data %>% transform(viewAngle=unclass(viewAngle))
model1 <- lm(answer ~ viewAngle + height + value + rotation, cond1(d))
influential <- influence.measures(model1)
infRows <- which(apply(influential$is.inf, 1, any))
dataCleaned <- d[-infRows,]
summary(lm(answer ~ viewAngle + height + value + rotation, cond1(dataCleaned)))

model2 <- lm(answer ~ viewAngle + height + value + rotation, cond2(d))
influential <- influence.measures(model2)
infRows <- which(apply(influential$is.inf, 1, any))
dataCleaned <- d[-infRows,]
summary(lm(answer ~ viewAngle + height + value + rotation, cond2(dataCleaned)))

##########
# New figures Sep 2016
#
#

lowerCI <- function(v) {
	mean(v) - sd(v)*1.96/sqrt(length(v))
}

upperCI <- function(v) {
	mean(v) + sd(v)*1.96/sqrt(length(v))
}

# Body height CIs
ggplot(cond1(dataAggregated), aes(x=factor(height), y=meanAbsError)) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
	labs(x = "Body Height", y = "Absolute Error")

# Orientation/Direction based on the classification of the bisector
ggplot(cond1(dataAggregated), aes(x=orientation, y=meanAbsError)) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
	labs(x = "Orientation", y = "Absolute Error")

ggplot(cond1(dataAggregated), aes(x=orientation, y=meanError)) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
	geom_hline(yintercept=0, linetype="dotted") +
	labs(x = "Orientation", y = "Error")

# Facets
ggplot(cond1(dataAggregated), aes(x=orientation, y=meanError)) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
	geom_hline(yintercept=0, linetype="dotted") +
	facet_wrap( ~ viewAngle, ncol=2) +
	labs(x = "Orientation", y = "Error")

ggplot(cond1(dataAggregated), aes(x=viewAngle, y=meanError)) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
	geom_hline(yintercept=0, linetype="dotted") +
	facet_grid( ~ orientation) +
	labs(x = "Orientation, View Angle", y = "Error")

# Error by view angle
ggplot(cond1(dataAggregated), aes(x=viewAngle, y=meanError, fill=factor(viewAngle))) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
	geom_hline(yintercept=0, linetype="dotted") +
	labs(x = "View Angle", y = "Error")

ggplot(cond1(dataAggregated), aes(x=viewAngle, y=meanAbsError, fill=factor(viewAngle))) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
	labs(x = "View Angle", y = "Absolute Error")

ggplot(cond1(dataAggregated), aes(x=viewAngle, y=meanAbsError, fill=factor(viewAngle))) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
	labs(x = "View Angle", y = "Absolute Error")

#####
#############
#########
######
##

model1bPredicted <- predict(model1b, mutate(dataFiltered, viewAngle = unclass(viewAngle)))
dataFiltered <- cbind(dataFiltered, model1bPredicted)

## Signed error by percentage
ggplot(cond1(dataFiltered), aes(value, answer-value)) +
	geom_hline(yintercept=0, linetype="dotted") +
	geom_smooth(aes(y=projFraction*100-value), color="orange") +
	geom_smooth(aes(y=arcFraction*100-value), color="purple") +
	geom_smooth(aes(y=model1bPredicted-value), color="blue") +
	geom_smooth(aes(y=answer-value), color="black") +
	facet_grid(orientation ~ viewAngle) +
	labs(x = "Percentage, View Angle", y = "Error, Slice Orientation")

## Absolute error by percentage
ggplot(cond1(dataFiltered), aes(value, abs(answer-value))) +
	geom_hline(yintercept=0, linetype="dotted") +
	geom_smooth(aes(y=abs(projFraction*100-value)), color="orange") +
	geom_smooth(aes(y=abs(arcFraction*100-value)), color="purple") +
	geom_smooth(aes(y=abs(model1bPredicted-value)), color="blue") +
	geom_smooth(aes(y=abs(answer-value)), color="black") +
	facet_grid(orientation ~ viewAngle) +
	labs(x = "Percentage, View Angle", y = "Absolute Error, Slice Orientation")


dataFiltered <- mutate(dataFiltered, angleClassified = factor(floor(centralAngle/90)*90, labels=c("0-89", "90-179", "180-269", "270-359")))

# Signed error by rotation
ggplot(cond1(dataFiltered), aes(mod(bisectorAngle, 360), answer-value)) +
	geom_hline(yintercept=0, linetype="dotted") +
	geom_smooth(aes(y=projFraction*100-value), color="orange") +
	geom_smooth(aes(y=arcFraction*100-value), color="purple") +
	geom_smooth(aes(y=model1bPredicted-value), color="blue") +
	geom_smooth(aes(y=answer-value), color="black") +
#	facet_wrap(~ viewAngle, ncol=2) +
	facet_grid(angleClassified ~ viewAngle) +
	labs(x = "Rotation, View Angle", y = "Error, Central Angle Binned")

# Absolute error by rotation
ggplot(cond1(dataFiltered), aes(mod(bisectorAngle, 360), abs(answer-value))) +
	geom_hline(yintercept=0, linetype="dotted") +
	geom_smooth(aes(y=abs(projFraction*100-value)), color="orange") +
	geom_smooth(aes(y=abs(arcFraction*100-value)), color="purple") +
	geom_smooth(aes(y=abs(model1bPredicted-value)), color="blue") +
	geom_smooth(aes(y=abs(answer-value)), color="black") +
	#	facet_wrap(~ viewAngle, ncol=2) +
	facet_grid(angleClassified ~ viewAngle) +
	labs(x = "Rotation, View Angle", y = "Absolute Error, Central Angle Binned")
