#!/usr/bin/python
# -*- coding: utf-8 -*-

import csv
import math
from scipy.integrate import quad

def ellipseArea(a, b, angle):
	area = 0
	quarters = 0
	while angle > math.pi / 2:
		area += a * b * math.pi / 4
		angle -= math.pi / 2
		quarters += 1

	if quarters % 2 == 0: # starts at a vertical edge
		area += a * b * math.pi / 4 - \
				.5 * a * b * math.atan(a * math.tan(math.pi / 2 - angle) / b)
	else: # starts at horizontal edge
		area += .5 * a * b * math.atan(a * math.tan(angle) / b)

	return area

# Function to integrate from 0 to 2π to get ellipse perimeter
def ellipseArcFunction(t, params):
	a, b = params
	return math.sqrt(a*a * math.sin(t)*math.sin(t) + b*b * math.cos(t)*math.cos(t))

def ellipseArc(a, b, angle):
	length, err = quad(ellipseArcFunction, 0, angle, [a, b])
	return length

# Calculate arc length and area for ellipse for a given slice defined by its central angle and rotation
def calcEllipse(a, b, angle, rotation):
	area = ellipseArea(a, b, angle+rotation) - ellipseArea(a, b, rotation)

	arc = ellipseArc(a, b, angle+rotation) - ellipseArc(a, b, rotation)

	return [arc, area]

# Calculate the projected angles for a circle tilted at viewAngle from the viewer
# Returns the projected centralAngle and projected rotationAngle
def projectAngle(viewAngle, centralAngle, rotationAngle):

	xA = math.cos(rotationAngle)
	yA = math.sin(rotationAngle)

	xB = math.cos(rotationAngle+centralAngle)
	yB = math.sin(rotationAngle+centralAngle)

	yAProj = yA*math.sin(viewAngle)
	yBProj = yB*math.sin(viewAngle)

	rotationProj = math.atan2(yAProj, xA)
	centralProj = math.atan2(yBProj, xB) - rotationProj

	# Avoid the π to -π discontinuity when we cross the negative x axis (also keep angles in [0..2π])
	if rotationProj < 0:
		rotationProj += math.pi*2

	if centralProj < 0:
		centralProj += math.pi*2

	return  [centralProj, rotationProj]

def main():
	with open('3dpiepredictions.csv', 'wb') as outFile:
		csvOut = csv.writer(outFile)

		csvOut.writerow(['viewAngle', 'aspect', 'rotation', 'rotationProjected', 'angle', 'angleProjected', 'arc', 'area'])

		for viewAngle in range(90, 10, -15):

			viewRadians = math.radians(viewAngle)

			aspect = math.sin(viewRadians)

			a = 1.
			b = aspect

			ellipseTotal = calcEllipse(a, b, math.pi*2, 0)

			for centralAngle in [5, 10, 20, 30, 45, 60, 75, 90, 135, 180]:

				centralRadians = math.radians(centralAngle)

				for rotation in range(360):

					angleProjected, rotationProjected = projectAngle(viewRadians, centralRadians, math.radians(rotation))

					ellipse = calcEllipse(a, b, angleProjected, rotationProjected)

					csvOut.writerow([viewAngle, aspect, rotation, math.degrees(rotationProjected), centralAngle, math.degrees(angleProjected), ellipse[0]/ellipseTotal[0], ellipse[1]/ellipseTotal[1]])

if __name__ == "__main__":
    # This will be called only when the Python file is invoked as a script.
    main()
