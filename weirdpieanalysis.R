library('ggplot2')
library('dplyr')

data <- read.csv('weirdpiesresults.csv')

data <- mutate(data,
			   error = answer-percentage,
			   absError = abs(error),
			   relError = absError/percentage,
			   variation = factor(variation, c('baseline', 'circular', 'floating-circle', 'circular-center', 'off-center', 'centered-square', 'centered-circle'))
			)

dataFiltered <- filter(data, resultID != '1481037346102x826999')

baseline <- dataFiltered %>%
	filter(variation == 'baseline') %>%
	group_by(resultID) %>%
	summarize(AbsErrorBaseline = mean(absError),
			  errorBaseline = mean(error),
			  relErrorBaseline = mean(relError))

dataFiltered <- dataFiltered %>%
	left_join(baseline, by = 'resultID') %>%
	mutate(normalizedAbsError = absError/AbsErrorBaseline,
		   normalizedError = error/errorBaseline,
		   normalizedRelError = relError/relErrorBaseline)

dataAggregated <- dataFiltered %>%
	group_by(resultID, variation) %>%
	summarize(meanError = mean(error), meanAbsError = mean(absError), meanRelError = mean(relError),
			  meanNormalizedError = mean(normalizedError), meanNormalizedAbsError = mean(normalizedAbsError), meanNormalizedRelError = mean(normalizedRelError))

lowerCI <- function(v) {
	mean(v) - sd(v)*1.96/sqrt(length(v))
}

upperCI <- function(v) {
	mean(v) + sd(v)*1.96/sqrt(length(v))
}

# Absolute error CIs
ggplot(dataAggregated, aes(x=variation, y=meanAbsError)) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
	labs(x = "Variation", y = "Absolute Error")

# Signed error CIs
ggplot(dataAggregated, aes(x=variation, y=meanError)) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
	labs(x = "Variation", y = "Signed Error")

# Normalized absolute error CIs
# Is there a point in doing this, though?
ggplot(dataAggregated, aes(x=variation, y=meanNormalizedAbsError)) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
	geom_hline(yintercept=1, linetype="dotted") +
	labs(x = "Variation", y = "Absolute Error")

ggplot(dataFiltered, aes(percentage, answer-percentage)) +
	geom_hline(yintercept=0, linetype="dotted") +
	geom_smooth() +
	facet_grid(. ~ variation) +
	labs(x = "Percentage, View Angle", y = "Error, Slice Orientation")
