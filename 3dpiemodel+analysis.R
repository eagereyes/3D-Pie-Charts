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
ellipseArcLength <- function(arcFunc, theta, rho = 0) {
	arclength(arcFunc, rho, rho+theta, tol = 1e-10)$length
}

# Calculate the fraction of the ellipse by arc length that's taken up by the slice
ellipseArcFraction <- function(a, b, theta, rho) {
	localFunc <- function(eA, eB, t, r) {
		arcFunc <- ellipseArcFunc(eA, eB)
		ellipseArcLength(arcFunc, t, r)/ellipseArcLength(arcFunc, 2*pi, 0)
	}
	mapply(localFunc, a, b, theta, rho)
}

# Calculate ellipse area for a given angle by summing up quarters first
# then adding the remaining portion
ellipseAreaAux <- function(a, b, theta) {

	quarters <- theta / (pi/2)
	area <- a*b*pi/4 * quarters

	theta = theta - quarters*pi/2
		
	area + ifelse(quarters %% 2 == 0,
				  a*b*pi/4 - .5*a*b*atan(a*tan(pi/2-theta)/b),
				  .5*a*b*atan(a*tan(theta)/b))
}

# Calculate area for ellipse with axes a and b for a slice with
# angle theta and rotation rho.
ellipseAreaSlice <- function(a, b, theta, rho = 0) {
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
	
	list(thetaProj=centralProj, rhoProj = rotationProj)
}

makePredictions <- function() {
	angles <- sapply(1:359, deg2rad)
	area <- sapply(angles, function(theta) { ellipseAreaSlice(1, .5, theta)})
	arc <- sapply(angles, function(theta) { ellipseArcLength(1, .5, theta)})
	predictions <- data.frame(angles, arc, area)
  
	return(predictions)
}

setwd('/Users/rkosara/Dropbox (Tableau)/Research/3D Pie Charts')
data <- read.csv('results-3dpiestudy.csv')

# Add thetaProj and rhoProj columns (both in radians)
projections <- with(data, projectAngle(rad(viewAngle), rad(centralAngle), rad(rotation)))
data <- cbind(data, projections)

data <- within(data, {
				logError = log2(abs(answer-value)+1/8)
				verticalFactor = sin(rad(viewAngle))
				fraction = value/100
				projFraction = thetaProj/(2*pi)
				areaFraction = ellipseAreaFraction(pieRadius, pieRadius*verticalFactor, thetaProj, rhoProj)
#				arcFraction = ellipseArcFraction(pieRadius, pieRadius*verticalFactor, thetaProj, rhoProj)
				viewAngle = factor(viewAngle)
				})

dataAggregated = data %>%
	group_by(viewAngle, resultID, condition) %>%
	summarize(meanError = mean(logError))

# Error by view Angle for the two conditions
ggplot(dataAggregated, aes(x=viewAngle, y=meanError, fill=factor(viewAngle))) +
	geom_violin(size=1, aes(y=meanError, color=factor(viewAngle)), show.legend=FALSE) +
	stat_summary(fun.y=mean, geom="point", shape=5, size=4, show.legend=FALSE) +
	labs(x = "View Angle", y = "Log Error") + facet_grid(condition ~ .)

# t test between the aggregated means for condition 1 and 2
cond1 <- subset(dataAggregated, condition=="cond1")$meanError
cond2 <- subset(dataAggregated, condition=="cond2")$meanError
t.test(cond1, cond2)
