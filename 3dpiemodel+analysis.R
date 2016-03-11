library('pracma')
library('dplyr')
library('ggplot2')

# Return partially applied function calculating arc length as
# function of t for ellipse with axes a and b.
ellipseArc <- function(a, b) {
  function(t) c(a*cos(t), b*sin(t))
}

# Calculate arc length of ellipse from angle rho to phi
# for ellipse with axes a and b using numerical integration
# Uses pracma package http://www.inside-r.org/packages/cran/pracma/docs/arclength
ellipseArcLength <- function(a, b, phi, rho = 0) {
  arclength(ellipseArc(1, .5), rho, rho+phi, tol = 1e-10)$length
}

# Calculate ellipse area for a given angle by summing up quarters first
# then adding the remaining portion
ellipseAreaAux <- function(a, b, phi) {
  area <- 0
  quarters <- 0
  while (phi > pi/2) {
    area = area + a*b*pi/4
    phi = phi - pi/2
    quarters = quarters + 1
  }
  
  if (quarters %% 2 == 0) {
    area + a*b*pi/4 - .5*a*b*atan(a*tan(pi/2-phi)/b)
  } else {
    area + .5*a*b*atan(a*tan(phi)/b)
  }
}

# Calculate area for ellipse with axes a and b for a slice with
# angle phi and rotation rho.
ellipseArea <- function(a, b, phi, rho = 0) {
  ellipseAreaAux(a, b, rho+phi) - ellipseAreaAux(a, b, rho)
}

# Calculate the projected angles for a circle tilted at viewAngle alpha from the viewer
# Returns the projected centralAngle phi and projected rotationAngle rho
projectAngle <- function(alpha, phi, rho) {
  xA <- cos(rho)
  yA <- sin(rho)
  
  xB = cos(rho+phi)
  yB = sin(rho+phi)
  
  yAProj <- yA*sin(alpha)
  yBProj <- yB*sin(alpha)
  
  rotationProj <- atan2(yAProj, xA)
  centralProj <- atan2(yBProj, xB) - rotationProj
  
  # Avoid the π to -π discontinuity when we cross the negative x axis (also keep angles in [0..2π])
  if (rotationProj < 0) {
    rotationProj = rotationProj + 2*pi
  }
  
  if (centralProj < 0) {
    centralProj = centralProj + 2*pi
  }
  
  list(phiProj=centralProj, rhoProj = rotationProj)
}

angles <- sapply(1:359, deg2rad)
area <- sapply(angles, function(phi) { ellipseArea(1, .5, phi)})
arc <- sapply(angles, function(phi) { ellipseArcLength(1, .5, phi)})
predictions <- data.frame(angles, arc, area)

setwd('/Users/rkosara/Dropbox (Tableau)/Research/3D Pie Charts')
data <- read.csv('pilot-data.csv')
data <- transform(data, logError = log2(abs(answer-value)+1/8))

dataAggregated = data %>%
  group_by(viewAngle, resultID) %>%
  summarize(meanError = mean(logError))

ggplot(dataAggregated, aes(x=viewAngle, fill=factor(viewAngle))) +
     geom_violin(size=1, aes(
         y=meanError, 
         color=factor(viewAngle)),
         show.legend = FALSE) + 
     labs(x = "Chart Type", y = "Log Error")
