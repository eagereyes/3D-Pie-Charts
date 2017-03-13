library('ggplot2')
library('dplyr')

data <- read.csv('weirdpiesresults.csv')

# Filter out the one participant with much higher error
dataFiltered <- filter(data, resultID != '1481037346102x826999')

#Only look at MTurk data for now
dataFiltered <- filter(dataFiltered, source == 'mturk')

dataFiltered <- mutate(dataFiltered,
			   error = answer-percentage,
			   absError = abs(error),
			   relError = absError/percentage,
			   variation = factor(variation, c('baseline', 'circular', 'floating-circle', 'circular-center', 'off-center', 'centered-square', 'centered-circle'))
			)


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
	labs(x = "Percentage, View Angle", y = "Error")

# ANOVA for absolute error
summary(aov(meanAbsError ~ variation, dataAggregated))

# ANOVA for signed error
summary(aov(meanError ~ variation, dataAggregated))

# Bring in the arc data
arcs <- read.csv('weirdpie-arcs.csv')

# Filter down to just the variations that have arc percentages
# then join in the arc data
dataWithArcs <- data %>%
	filter(variation == 'baseline' | variation == 'circular' | variation == 'circular-center' | variation == 'off-center') %>%
	left_join(arcs, by = c('percentage', 'variation')) %>%
	mutate(arcError = answer-arcPercentage*100, absArcError = abs(arcError))

dataWithArcsAggregated <- dataWithArcs %>%
	group_by(resultID, variation) %>%
	summarize(meanError = mean(error), meanAbsError = mean(absError),
			  meanArcError = mean(arcError), meanAbsArcError = mean(absArcError))

